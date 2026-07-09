-- Phase 2 — Moderation & admin (PRD §7, handoff §11)
-- Adds a role/ban model to profiles, helper predicates used by RLS, an audit
-- trail for moderator actions, and ban-gating on every user write path.
--
-- Design notes:
-- * The admin UI performs privileged reads/writes with the service-role client
--   AFTER a server-side role check, so we deliberately do NOT open broad
--   moderator SELECT/UPDATE policies on every table here — authorization for
--   the admin surface lives in the app layer. What RLS enforces below is the
--   inverse: banned users lose their write access at the database level, so a
--   ban can't be bypassed even if an action path is missed.
-- * Content is soft-removed (status = 'removed'), never hard-deleted, so it can
--   be restored on appeal and retained for audit (open question, PRD §10).

-- ---------------------------------------------------------------------------
-- Role + ban state on profiles
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column role text not null default 'user'
    check (role in ('user', 'moderator', 'admin')),
  add column banned_at timestamptz,
  add column ban_reason text check (char_length(ban_reason) <= 500);

-- ---------------------------------------------------------------------------
-- Predicate helpers. SECURITY DEFINER so they read profiles.role regardless of
-- the caller's RLS view, and so referencing them inside a profiles policy
-- can't recurse.
-- ---------------------------------------------------------------------------

create or replace function public.is_moderator(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = uid and role in ('moderator', 'admin')
  );
$$;

create or replace function public.is_banned(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = uid and banned_at is not null
  );
$$;

grant execute on function public.is_moderator(uuid) to anon, authenticated;
grant execute on function public.is_banned(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Moderation audit trail. Written by the service role only (the admin actions
-- run privileged after an app-layer role check); never exposed to the Data API.
-- ---------------------------------------------------------------------------

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references auth.users (id) on delete set null,
  action text not null check (action in (
    'remove_artifact', 'restore_artifact',
    'remove_comment', 'restore_comment',
    'dismiss_report', 'action_report',
    'ban_user', 'unban_user',
    'set_role'
  )),
  target_type text check (target_type in ('artifact', 'comment', 'user', 'report')),
  target_id uuid,
  report_id uuid references public.reports (id) on delete set null,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);

create index moderation_actions_recent_idx
  on public.moderation_actions (created_at desc);

alter table public.moderation_actions enable row level security;
grant all on public.moderation_actions to service_role;

-- ---------------------------------------------------------------------------
-- Ban gating: recreate every user insert policy with an added is_banned guard.
-- Definitions are otherwise identical to the initial schema.
-- ---------------------------------------------------------------------------

drop policy "users create their own artifacts" on public.artifacts;
create policy "users create their own artifacts"
  on public.artifacts for insert
  with check (auth.uid() = owner_id and not public.is_banned(auth.uid()));

drop policy "users comment as themselves" on public.comments;
create policy "users comment as themselves"
  on public.comments for insert
  with check (auth.uid() = author_id and not public.is_banned(auth.uid()));

drop policy "users follow as themselves" on public.follows;
create policy "users follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id and not public.is_banned(auth.uid()));

drop policy "users like as themselves" on public.likes;
create policy "users like as themselves"
  on public.likes for insert
  with check (auth.uid() = user_id and not public.is_banned(auth.uid()));

drop policy "users report as themselves" on public.reports;
create policy "users report as themselves"
  on public.reports for insert
  with check (auth.uid() = reporter_id and not public.is_banned(auth.uid()));

-- ---------------------------------------------------------------------------
-- Bootstrapping the first admin
-- ---------------------------------------------------------------------------
-- There is no self-serve path to admin (by design). Grant yourself the role
-- once, manually, from the Supabase SQL editor:
--
--   update public.profiles set role = 'admin' where username = 'your-username';
