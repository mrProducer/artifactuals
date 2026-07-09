"use client";

import { useActionState, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArtifactFrame } from "@/components/artifact-frame";
import { publishArtifact, ARTIFACT_TAGS, type PublishState } from "./actions";

const inputClass =
  "w-full border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400";

export function ComposeForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState<PublishState, FormData>(
    publishArtifact,
    null
  );

  const [html, setHtml] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"code" | "preview">("code");
  // One draft object per compose session, overwritten on each preview
  const draftIdRef = useRef<string>(crypto.randomUUID());

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHtml(await file.text());
    setMobileTab("preview");
  }

  async function updatePreview(nextTab?: "code" | "preview") {
    if (nextTab) setMobileTab(nextTab);
    if (!html.trim()) return;

    setPreviewLoading(true);
    setPreviewError(null);

    const supabase = createClient();
    const path = `${userId}/drafts/${draftIdRef.current}.html`;
    const { error } = await supabase.storage
      .from("artifact-source")
      .upload(path, new Blob([html], { type: "text/html" }), {
        upsert: true,
        contentType: "text/html",
      });

    setPreviewLoading(false);
    if (error) {
      setPreviewError(
        error.message.includes("maximum allowed size")
          ? "Artifact is over the 1 MB limit."
          : "Preview failed. Please try again."
      );
      return;
    }

    // Cache-bust so the iframe reloads the updated draft
    setPreviewSrc(
      `/sandbox/d/${userId}/${draftIdRef.current}?v=${Date.now()}`
    );
  }

  const previewPane = (
    <div className="flex h-full min-h-[320px] flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Preview — exactly how your published artifact will run
        </span>
        <button
          type="button"
          onClick={() => updatePreview()}
          disabled={previewLoading || !html.trim()}
          className="bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {previewLoading ? "Loading..." : "Update preview"}
        </button>
      </div>
      {previewError ? (
        <p className="p-4 text-sm text-red-600 dark:text-red-400">
          {previewError}
        </p>
      ) : previewSrc ? (
        <ArtifactFrame
          src={previewSrc}
          title="Artifact preview"
          className="min-h-[320px] w-full flex-1 border-0 bg-white"
        />
      ) : (
        <p className="flex flex-1 items-center justify-center p-4 text-sm text-zinc-400 dark:text-zinc-500">
          Paste or upload HTML, then hit “Update preview”.
        </p>
      )}
    </div>
  );

  const codePane = (
    <div className="flex h-full flex-col gap-2">
      <textarea
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        placeholder="<!DOCTYPE html>..."
        spellCheck={false}
        className={`${inputClass} min-h-[320px] flex-1 resize-y font-mono text-xs leading-5`}
      />
      <label className="text-sm text-zinc-500 dark:text-zinc-400">
        or upload a file:{" "}
        <input
          type="file"
          accept=".html,text/html"
          onChange={handleFileUpload}
          className="text-sm file:mr-2 file:file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium dark:file:bg-zinc-800 dark:file:text-zinc-200"
        />
      </label>
    </div>
  );

  return (
    <form action={formAction} className="mt-6 flex flex-1 flex-col gap-6">
      <input type="hidden" name="html" value={html} />

      {/* Mobile: tabs. Desktop: side-by-side. */}
      <div className="flex gap-2 lg:hidden">
        {(["code", "preview"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() =>
              tab === "preview" ? updatePreview("preview") : setMobileTab(tab)
            }
            className={`px-4 py-1.5 text-sm font-medium capitalize ${
              mobileTab === tab
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="hidden gap-4 lg:grid lg:min-h-[420px] lg:grid-cols-2">
        {codePane}
        {previewPane}
      </div>
      <div className="lg:hidden">
        {mobileTab === "code" ? codePane : previewPane}
      </div>

      {/* Metadata */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Title
          <input name="title" required maxLength={120} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2 sm:col-start-1">
          Description
          <textarea
            name="description"
            maxLength={500}
            rows={2}
            placeholder="What does it do? What did you build it with?"
            className={inputClass}
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Tags</legend>
        <div className="flex flex-wrap gap-2">
          {ARTIFACT_TAGS.map((tag) => (
            <label
              key={tag}
              className="flex cursor-pointer items-center gap-1.5 border border-zinc-300 px-3 py-1.5 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white dark:border-zinc-700 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-100 dark:has-checked:text-zinc-900"
            >
              <input
                type="checkbox"
                name="tags"
                value={tag}
                className="sr-only"
              />
              {tag}
            </label>
          ))}
        </div>
      </fieldset>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !html.trim()}
        className="self-start bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Publishing..." : "Publish"}
      </button>
    </form>
  );
}
