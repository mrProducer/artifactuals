import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <p className="font-mono text-label uppercase text-fg-subtle">
        Welcome
      </p>
      <h1 className="mt-2 text-h1 text-fg">Welcome to Artifactuals</h1>
      <p className="mt-1 text-body text-fg-muted">
        Sign in or create an account to publish your artifacts.
      </p>
      <LoginForm />
    </main>
  );
}
