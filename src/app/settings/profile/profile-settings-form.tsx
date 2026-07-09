"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateProfile, type SettingsState } from "./actions";

type ProfileData = {
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  github_username: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  custom_links: { label: string; url: string }[];
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400";

export function ProfileSettingsForm({ profile }: { profile: ProfileData }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    updateProfile,
    null
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Display name
        <input
          name="display_name"
          required
          maxLength={60}
          defaultValue={profile.display_name}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Bio
        <textarea
          name="bio"
          maxLength={280}
          rows={3}
          defaultValue={profile.bio ?? ""}
          placeholder="What do you build?"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Photo
        <input
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp"
          className="text-sm text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:file:bg-zinc-800 dark:file:text-zinc-200"
        />
        <span className="text-xs font-normal text-zinc-400">
          PNG, JPEG, or WebP up to 2 MB. Leave empty to keep your current
          photo.
        </span>
      </label>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        GitHub username
        <input
          name="github_username"
          defaultValue={profile.github_username ?? ""}
          placeholder="octocat"
          autoCapitalize="none"
          className={inputClass}
        />
        <span className="text-xs font-normal text-zinc-400">
          We&apos;ll show your public GitHub activity on your profile.
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        LinkedIn URL
        <input
          name="linkedin_url"
          defaultValue={profile.linkedin_url ?? ""}
          placeholder="linkedin.com/in/you"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Instagram URL
        <input
          name="instagram_url"
          defaultValue={profile.instagram_url ?? ""}
          placeholder="instagram.com/you"
          className={inputClass}
        />
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">
          Custom links (up to 2)
        </legend>
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-2">
            <input
              name={`custom_label_${i}`}
              defaultValue={profile.custom_links[i]?.label ?? ""}
              placeholder="Label"
              maxLength={30}
              className={`${inputClass} w-1/3`}
            />
            <input
              name={`custom_url_${i}`}
              defaultValue={profile.custom_links[i]?.url ?? ""}
              placeholder="https://..."
              className={`${inputClass} flex-1`}
            />
          </div>
        ))}
      </fieldset>

      {state && "error" in state && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Saved.{" "}
          <Link href={`/${profile.username}`} className="underline">
            View your profile
          </Link>
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
