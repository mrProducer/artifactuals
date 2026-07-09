"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateProfile, type SettingsState } from "./actions";
import { inputClass } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

export function ProfileSettingsForm({ profile }: { profile: ProfileData }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    updateProfile,
    null
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
        Display name
        <input
          name="display_name"
          required
          maxLength={60}
          defaultValue={profile.display_name}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
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

      <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
        Photo
        <input
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp"
          className="text-small text-fg-muted file:mr-3 file:border-0 file:bg-surface-muted file:px-3 file:py-2 file:text-small file:font-medium file:text-fg-muted"
        />
        <span className="text-meta font-normal text-fg-subtle">
          PNG, JPEG, or WebP up to 2 MB. Leave empty to keep your current
          photo.
        </span>
      </label>

      <hr className="border-border" />

      <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
        GitHub username
        <input
          name="github_username"
          defaultValue={profile.github_username ?? ""}
          placeholder="octocat"
          autoCapitalize="none"
          className={inputClass}
        />
        <span className="text-meta font-normal text-fg-subtle">
          We&apos;ll show your public GitHub activity on your profile.
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
        LinkedIn URL
        <input
          name="linkedin_url"
          defaultValue={profile.linkedin_url ?? ""}
          placeholder="linkedin.com/in/you"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
        Instagram URL
        <input
          name="instagram_url"
          defaultValue={profile.instagram_url ?? ""}
          placeholder="instagram.com/you"
          className={inputClass}
        />
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-small font-medium text-fg">
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
        <p className="text-small text-danger">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="text-small text-fg">
          Saved.{" "}
          <Link href={`/${profile.username}`} className="text-accent underline">
            View your profile
          </Link>
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
