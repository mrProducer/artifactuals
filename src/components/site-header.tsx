import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; display_name: string; avatar_url: string | null } | null =
    null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
          >
            Artifactuals
          </Link>
          <Link
            href="/feed"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Feed
          </Link>
        </div>

        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link
                href="/new"
                className="border border-zinc-950 bg-zinc-950 px-3.5 py-1 font-medium text-white transition-colors hover:bg-zinc-700 active:translate-y-px dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-300"
              >
                New
              </Link>
              {profile ? (
                <Link
                  href={`/${profile.username}`}
                  className="flex items-center gap-2 px-1.5 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <Avatar
                    name={profile.display_name}
                    imageUrl={profile.avatar_url}
                    size="sm"
                  />
                  <span className="hidden font-medium sm:inline">
                    {profile.display_name}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/onboarding"
                  className="font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Finish setup
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="border border-zinc-950 bg-zinc-950 px-3.5 py-1 font-medium text-white transition-colors hover:bg-zinc-700 active:translate-y-px dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-300"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
