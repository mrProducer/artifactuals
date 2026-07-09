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
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Artifactuals
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link
                href="/new"
                className="rounded-full bg-zinc-900 px-4 py-1.5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                + New
              </Link>
              {profile ? (
                <Link
                  href={`/${profile.username}`}
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-zinc-100 dark:hover:bg-zinc-900"
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
                  className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Finish setup
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-zinc-900 px-4 py-1.5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
