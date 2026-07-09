import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { resolveAvatarUrl } from "@/lib/profile";
import { SignOutButton } from "@/components/sign-out-button";
import { Logo } from "@/components/ui/logo";
import { NavLink } from "@/components/ui/nav-link";
import { buttonClass } from "@/components/ui/button";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    github_username: string | null;
  } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, github_username")
      .eq("user_id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/85 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2" aria-label="Artifactuals home">
            <Logo className="size-6" />
            <span className="text-title font-semibold tracking-tight text-fg">
              artifactuals
            </span>
          </Link>
          <NavLink href="/feed">Feed</NavLink>
        </div>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/new" className={buttonClass({ size: "sm" })}>
                New
              </Link>
              {profile ? (
                <Link
                  href={`/${profile.username}`}
                  className="flex items-center gap-2 px-1.5 py-1 text-small transition-colors hover:bg-surface-muted"
                >
                  <Avatar
                    name={profile.display_name}
                    imageUrl={resolveAvatarUrl(profile)}
                    size="sm"
                  />
                  <span className="hidden font-medium sm:inline">
                    {profile.display_name}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/onboarding"
                  className="text-small font-medium text-fg-muted hover:text-fg"
                >
                  Finish setup
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className={buttonClass({ size: "sm" })}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
