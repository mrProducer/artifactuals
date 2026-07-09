"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogo, GithubLogo } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";
type OAuthProvider = "google" | "github";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [oauthPending, setOauthPending] = useState<OAuthProvider | null>(null);

  async function handleOAuth(provider: OAuthProvider) {
    setError(null);
    setOauthPending(provider);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    // On success the browser is redirected to the provider, so we only reach
    // here on failure.
    if (error) {
      setError(error.message);
      setOauthPending(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const supabase = createClient();
    const { error } =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }

    router.push(mode === "sign-up" ? "/onboarding" : "/");
    router.refresh();
  }

  const inputClass =
    "w-full border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400";

  const oauthClass =
    "flex w-full items-center justify-center gap-2.5 border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:border-zinc-950 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-zinc-50";

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={oauthPending !== null}
          className={oauthClass}
        >
          <GoogleLogo size={18} weight="bold" />
          {oauthPending === "google" ? "Redirecting..." : "Continue with Google"}
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("github")}
          disabled={oauthPending !== null}
          className={oauthClass}
        >
          <GithubLogo size={18} weight="fill" />
          {oauthPending === "github" ? "Redirecting..." : "Continue with GitHub"}
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-600">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        or
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending
          ? "Working..."
          : mode === "sign-in"
            ? "Sign in"
            : "Create account"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
        }}
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        {mode === "sign-in"
          ? "New here? Create an account"
          : "Already have an account? Sign in"}
      </button>
      </form>
    </div>
  );
}
