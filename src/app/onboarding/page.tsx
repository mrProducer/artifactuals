import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile) {
    redirect(`/${profile.username}`);
  }

  const meta = user.user_metadata ?? {};
  const defaultDisplayName =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    "";
  const suggestedUsername = (
    (meta.user_name as string | undefined) ??
    (meta.preferred_username as string | undefined) ??
    ""
  )
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Set up your profile
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Pick a username — it becomes your public URL.
      </p>
      <OnboardingForm
        defaultDisplayName={defaultDisplayName}
        defaultUsername={suggestedUsername}
      />
    </main>
  );
}
