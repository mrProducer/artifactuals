"use client";

import { useActionState } from "react";
import { createProfile, type OnboardingState } from "./actions";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createProfile,
    null
  );

  const inputClass =
    "w-full border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400";

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Username
        <div className="flex items-center gap-0">
          <span className="border border-r-0 border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            artifactuals.com/
          </span>
          <input
            name="username"
            required
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9][a-z0-9_\-]{2,29}"
            placeholder="yourname"
            autoCapitalize="none"
            autoCorrect="off"
            className={inputClass}
          />
        </div>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Display name
        <input
          name="display_name"
          required
          maxLength={60}
          placeholder="Your Name"
          className={inputClass}
        />
      </label>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Creating..." : "Create profile"}
      </button>
    </form>
  );
}
