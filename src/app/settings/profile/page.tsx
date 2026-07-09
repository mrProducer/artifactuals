import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "./profile-settings-form";

export const metadata = { title: "Edit profile" };

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-h1 text-fg">Edit profile</h1>
      <p className="mt-1 font-mono text-meta text-fg-muted">
        Public info shown at artifactuals.com/{profile.username}
      </p>
      <ProfileSettingsForm
        profile={{
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          github_username: profile.github_username,
          linkedin_url: profile.linkedin_url,
          instagram_url: profile.instagram_url,
          custom_links:
            (profile.custom_links as { label: string; url: string }[]) ?? [],
        }}
      />
    </main>
  );
}
