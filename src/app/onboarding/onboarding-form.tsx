"use client";

import { useActionState } from "react";
import { createProfile, type OnboardingState } from "./actions";
import { inputClass } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function OnboardingForm({
  defaultDisplayName = "",
  defaultUsername = "",
}: {
  defaultDisplayName?: string;
  defaultUsername?: string;
}) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createProfile,
    null
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
        Username
        <div className="flex items-center gap-0">
          <span className="border border-r-0 border-border bg-surface-muted px-3 py-2.5 font-mono text-meta text-fg-muted">
            artifactuals.com/
          </span>
          <input
            name="username"
            required
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9][a-z0-9_\-]{2,29}"
            placeholder="yourname"
            defaultValue={defaultUsername}
            autoCapitalize="none"
            autoCorrect="off"
            className={inputClass}
          />
        </div>
      </label>

      <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
        Display name
        <input
          name="display_name"
          required
          maxLength={60}
          placeholder="Your Name"
          defaultValue={defaultDisplayName}
          className={inputClass}
        />
      </label>

      {state?.error && <p className="text-small text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? "Creating..." : "Create profile"}
      </Button>
    </form>
  );
}
