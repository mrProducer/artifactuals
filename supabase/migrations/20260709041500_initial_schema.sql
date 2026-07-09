-- Artifactuals initial schema
-- Entities per docs/TECHNICAL_HANDOFF.md §2: Profile, Artifact, Comment,
-- Follow, Like, Report. Supabase Auth owns the users (auth.users), so the
-- handoff's "User" table is not recreated here.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users; created during onboarding when the user
-- picks a username)
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio text check (char_length(bio) <= 280),
  avatar_url text,
  github_username text,
  linkedin_url text,
  instagram_url text,
  custom_links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Artifacts
-- ---------------------------------------------------------------------------

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 500),
  tags text[] not null default '{}',
  -- Path of the HTML source object in the artifact-source storage bucket
  source_path text not null,
  source_size_bytes integer,
  preview_image_url text,
  is_pinned boolean not null default false,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  view_count integer not null default 0,
  trending_score double precision not null default 0,
  status text not null default 'published'
    check (status in ('published', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index artifacts_owner_idx on public.artifacts (owner_id, created_at desc);
create index artifacts_feed_idx on public.artifacts (created_at desc)
  where status = 'published';
create index artifacts_trending_idx on public.artifacts (trending_score desc)
  where status = 'published';

create trigger artifacts_set_updated_at
  before update on public.artifacts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Comments (flat, per PRD §6.4)
-- ---------------------------------------------------------------------------

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.artifacts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'visible'
    check (status in ('visible', 'removed')),
  created_at timestamptz not null default now()
);

create index comments_artifact_idx on public.comments (artifact_id, created_at);

-- ---------------------------------------------------------------------------
-- Follows and Likes
-- ---------------------------------------------------------------------------

create table public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followee_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_idx on public.follows (followee_id);

create table public.likes (
  user_id uuid not null references auth.users (id) on delete cascade,
  artifact_id uuid not null references public.artifacts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artifact_id)
);

create index likes_artifact_idx on public.likes (artifact_id);

-- ---------------------------------------------------------------------------
-- Reports (write-only for users; read via service role until Phase 2 admin UI)
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('artifact', 'comment')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'actioned')),
  created_at timestamptz not null default now()
);

create index reports_open_idx on public.reports (created_at) where status = 'open';

-- ---------------------------------------------------------------------------
-- Denormalized counters (handoff §2): maintained by triggers so they can't
-- drift from the write path. SECURITY DEFINER because the acting user has no
-- UPDATE right on artifacts they don't own.
-- ---------------------------------------------------------------------------

create or replace function public.bump_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.artifacts set like_count = like_count + 1 where id = new.artifact_id;
    return new;
  else
    update public.artifacts set like_count = greatest(like_count - 1, 0) where id = old.artifact_id;
    return old;
  end if;
end;
$$;

create trigger likes_bump_count
  after insert or delete on public.likes
  for each row execute function public.bump_like_count();

create or replace function public.bump_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.artifacts set comment_count = comment_count + 1 where id = new.artifact_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.artifacts set comment_count = greatest(comment_count - 1, 0) where id = old.artifact_id;
    return old;
  else
    -- status flips between visible/removed adjust the visible count
    if old.status = 'visible' and new.status = 'removed' then
      update public.artifacts set comment_count = greatest(comment_count - 1, 0) where id = new.artifact_id;
    elsif old.status = 'removed' and new.status = 'visible' then
      update public.artifacts set comment_count = comment_count + 1 where id = new.artifact_id;
    end if;
    return new;
  end if;
end;
$$;

create trigger comments_bump_count
  after insert or delete or update of status on public.comments
  for each row execute function public.bump_comment_count();

-- View counts: incremented via RPC so anonymous visitors can count views
-- without having any write access to artifacts.
create or replace function public.increment_view_count(p_artifact_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.artifacts
  set view_count = view_count + 1
  where id = p_artifact_id and status = 'published';
$$;

-- ---------------------------------------------------------------------------
-- Trending score (handoff §5): engagement weighted by recency, recomputed
-- periodically — not live on every request.
-- score = (likes*3 + comments*4 + views*0.1) / (hours_old + 2)^1.5
-- ---------------------------------------------------------------------------

create or replace function public.recompute_trending_scores()
returns void
language sql
security definer
set search_path = public
as $$
  update public.artifacts
  set trending_score =
    (like_count * 3.0 + comment_count * 4.0 + view_count * 0.1)
    / power((extract(epoch from (now() - created_at)) / 3600.0) + 2.0, 1.5)
  where status = 'published';
$$;

-- Schedule with pg_cron when available (hosted Supabase); skip silently on
-- environments without it.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'recompute-trending',
    '*/15 * * * *',
    'select public.recompute_trending_scores()'
  );
exception when others then
  raise notice 'pg_cron unavailable, trending job not scheduled: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: new tables are no longer auto-exposed to Data API roles, so grant
-- explicitly. RLS below still constrains what rows each role can touch.
-- ---------------------------------------------------------------------------

grant select on public.profiles, public.artifacts, public.comments,
  public.follows, public.likes to anon, authenticated;

grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.artifacts to authenticated;
grant insert, delete on public.comments to authenticated;
grant insert, delete on public.follows to authenticated;
grant insert, delete on public.likes to authenticated;
grant insert on public.reports to authenticated;

grant all on public.profiles, public.artifacts, public.comments,
  public.follows, public.likes, public.reports to service_role;

grant execute on function public.increment_view_count(uuid) to anon, authenticated;
grant execute on function public.recompute_trending_scores() to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.artifacts enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.reports enable row level security;

-- Profiles: public read; owner insert/update
create policy "profiles are publicly readable"
  on public.profiles for select using (true);
create policy "users create their own profile"
  on public.profiles for insert with check (auth.uid() = user_id);
create policy "users update their own profile"
  on public.profiles for update using (auth.uid() = user_id);

-- Artifacts: published ones publicly readable (owners also see their removed
-- ones); owner full write
create policy "published artifacts are publicly readable"
  on public.artifacts for select
  using (status = 'published' or auth.uid() = owner_id);
create policy "users create their own artifacts"
  on public.artifacts for insert with check (auth.uid() = owner_id);
create policy "users update their own artifacts"
  on public.artifacts for update using (auth.uid() = owner_id);
create policy "users delete their own artifacts"
  on public.artifacts for delete using (auth.uid() = owner_id);

-- Comments: visible ones publicly readable (authors also see their removed
-- ones); authenticated users comment as themselves; authors delete their own
create policy "visible comments are publicly readable"
  on public.comments for select
  using (status = 'visible' or auth.uid() = author_id);
create policy "users comment as themselves"
  on public.comments for insert with check (auth.uid() = author_id);
create policy "users delete their own comments"
  on public.comments for delete using (auth.uid() = author_id);

-- Follows: public read (follower/following counts); act as yourself
create policy "follows are publicly readable"
  on public.follows for select using (true);
create policy "users follow as themselves"
  on public.follows for insert with check (auth.uid() = follower_id);
create policy "users unfollow as themselves"
  on public.follows for delete using (auth.uid() = follower_id);

-- Likes: public read; act as yourself
create policy "likes are publicly readable"
  on public.likes for select using (true);
create policy "users like as themselves"
  on public.likes for insert with check (auth.uid() = user_id);
create policy "users unlike as themselves"
  on public.likes for delete using (auth.uid() = user_id);

-- Reports: insert-only for authenticated users; no select policy (service
-- role reads them until the Phase 2 moderation UI exists)
create policy "users report as themselves"
  on public.reports for insert with check (auth.uid() = reporter_id);

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------

-- Artifact HTML source: 1 MB cap (single-file artifact premise, handoff §3).
-- Public read so the sandbox origin can fetch by URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artifact-source', 'artifact-source', true, 1048576, array['text/html'])
on conflict (id) do nothing;

-- Generated preview screenshots: written by the screenshot worker (service
-- role), publicly readable for feed cards and OG tags.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artifact-previews', 'artifact-previews', true, 5242880, array['image/png', 'image/webp', 'image/jpeg'])
on conflict (id) do nothing;

-- Avatars: user-uploaded headshots, publicly readable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/webp', 'image/jpeg'])
on conflict (id) do nothing;

-- Users write only inside their own {user_id}/... folder.
create policy "users upload artifact source to their folder"
  on storage.objects for insert
  with check (
    bucket_id = 'artifact-source'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "users update artifact source in their folder"
  on storage.objects for update
  using (
    bucket_id = 'artifact-source'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "users delete artifact source in their folder"
  on storage.objects for delete
  using (
    bucket_id = 'artifact-source'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users upload avatars to their folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "users update avatars in their folder"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "users delete avatars in their folder"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
