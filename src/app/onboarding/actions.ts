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

  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    username,
    display_name: displayName,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is taken." };
    }
    return { error: "Could not create profile. Please try again." };
  }

  redirect(`/${username}`);
}
