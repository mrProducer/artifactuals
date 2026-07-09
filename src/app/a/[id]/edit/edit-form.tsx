"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateArtifactMeta } from "@/app/actions/artifact-owner";
import { ARTIFACT_TAGS } from "@/app/new/constants";
import { inputClass } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EditArtifactForm({
  artifactId,
  initialTitle,
  initialDescription,
  initialTags,
}: {
  artifactId: string;
  initialTitle: string;
  initialDescription: string;
  initialTags: string[];
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleTag = (tag: string) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateArtifactMeta(artifactId, {
        title,
        description,
        tags,
      });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className={inputClass}
        />
        <span className="text-right font-mono text-meta text-fg-subtle">
          {description.length}/500
        </span>
      </label>

      <fieldset>
        <legend className="mb-2 text-small font-medium text-fg">Tags</legend>
        <div className="flex flex-wrap gap-2">
          {ARTIFACT_TAGS.map((tag) => {
            const selected = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={selected}
                className={`border px-3 py-1.5 text-small transition-colors ${
                  selected
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border text-fg-muted hover:border-border-strong"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error && <p className="text-small text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Saving..." : "Save changes"}
        </Button>
        <Link
          href={`/a/${artifactId}`}
          className="text-small text-fg-muted transition-colors hover:text-fg"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
