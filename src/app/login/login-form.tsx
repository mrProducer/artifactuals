"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogo, GithubLogo } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { inputClass } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Mode = "sign-in" | "sign-up";
type OAuthProvider = "google" | "github";

// Providers enabled in Supabase. Add "github" here once its credentials are
// configured in Authentication -> Sign In / Providers.
const ENABLED_PROVIDERS: OAuthProvider[] = ["google"];

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

  const oauthClass =
    "flex w-full items-center justify-center gap-2.5 border border-border bg-surface px-4 py-2.5 text-small font-medium text-fg transition-colors hover:border-border-strong disabled:opacity-50";

  return (
    <div className="mt-8 flex flex-col gap-4">
      {ENABLED_PROVIDERS.length > 0 && (
        <>
          <div className="flex flex-col gap-2.5">
            {ENABLED_PROVIDERS.includes("google") && (
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={oauthPending !== null}
                className={oauthClass}
              >
                <GoogleLogo size={18} weight="bold" />
                {oauthPending === "google"
                  ? "Redirecting..."
                  : "Continue with Google"}
              </button>
            )}
            {ENABLED_PROVIDERS.includes("github") && (
              <button
                type="button"
                onClick={() => handleOAuth("github")}
                disabled={oauthPending !== null}
                className={oauthClass}
              >
                <GithubLogo size={18} weight="fill" />
                {oauthPending === "github"
                  ? "Redirecting..."
                  : "Continue with GitHub"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-meta uppercase text-fg-subtle">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
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

      <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
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

      {error && <p className="text-small text-danger">{error}</p>}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending
          ? "Working..."
          : mode === "sign-in"
            ? "Sign in"
            : "Create account"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
        }}
        className="text-small text-fg-muted transition-colors hover:text-fg"
      >
        {mode === "sign-in"
          ? "New here? Create an account"
          : "Already have an account? Sign in"}
      </button>
      </form>
    </div>
  );
}
