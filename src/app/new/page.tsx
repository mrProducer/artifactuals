import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ComposeForm } from "./compose-form";

export const metadata = { title: "New artifact" };

export default async function NewArtifactPage() {
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

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6">
      <h1 className="text-h1 text-fg">New artifact</h1>
      <p className="mt-1 text-body text-fg-muted">
        Paste the HTML from your AI chat, or upload the .html file it gave
        you.
      </p>
      <ComposeForm userId={user.id} />
    </main>
  );
}
