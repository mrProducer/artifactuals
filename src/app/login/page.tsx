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
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome to Artifactuals
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Sign in or create an account to publish your artifacts.
      </p>
      <LoginForm />
    </main>
  );
}
