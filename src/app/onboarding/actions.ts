"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateUsername } from "@/lib/validation";

export type OnboardingState = { error: string } | null;

export async function createProfile(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();

  const usernameError = validateUsername(username);
  if (usernameError) {
    return { error: usernameError };
  }
  if (displayName.length < 1 || displayName.length > 60) {
    return { error: "Display name must be 1-60 characters." };
  }

  // Carry over what the OAuth provider already told us so the profile isn't
  // blank after sign-up. GitHub exposes the login as user_name; Google/GitHub
  // both expose a photo as avatar_url or picture.
  const meta = user.user_metadata ?? {};
  const avatarUrl =
    (meta.avatar_url as string | undefined) ??
    (meta.picture as string | undefined) ??
    null;
  const githubUsername =
    user.app_metadata?.provider === "github"
      ? ((meta.user_name as string | undefined) ??
        (meta.preferred_username as string | undefined) ??
        null)
      : null;

  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    username,
    display_name: displayName,
    avatar_url: avatarUrl,
    github_username: githubUsername,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is taken." };
    }
    return { error: "Could not create profile. Please try again." };
  }

  redirect(`/${username}`);
}
