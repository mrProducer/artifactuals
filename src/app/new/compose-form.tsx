"use client";

import { useActionState, useRef, useState } from "react";
import { ArtifactFrame } from "@/components/artifact-frame";
import { publishArtifact, uploadDraft } from "./actions";
import { ARTIFACT_TAGS, type PublishState } from "./constants";
import { inputClass } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

    const result = await uploadDraft(draftIdRef.current, html);

    setPreviewLoading(false);
    if (result?.error) {
      setPreviewError(result.error);
      return;
    }

    // Cache-bust so the iframe reloads the updated draft
    setPreviewSrc(
      `/sandbox/d/${userId}/${draftIdRef.current}?v=${Date.now()}`
    );
  }

  const previewPane = (
    <div className="flex h-full min-h-[320px] flex-col overflow-hidden border border-border shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-muted px-3 py-2">
        <span className="font-mono text-label uppercase text-fg-subtle">
          Preview
        </span>
        <Button
          type="button"
          size="sm"
          onClick={() => updatePreview()}
          disabled={previewLoading || !html.trim()}
        >
          {previewLoading ? "Loading..." : "Update preview"}
        </Button>
      </div>
      {previewError ? (
        <p className="p-4 text-small text-danger">{previewError}</p>
      ) : previewSrc ? (
        <ArtifactFrame
          src={previewSrc}
          title="Artifact preview"
          className="min-h-[320px] w-full flex-1 border-0 bg-surface"
        />
      ) : (
        <p className="flex flex-1 items-center justify-center p-4 text-center font-mono text-meta text-fg-subtle">
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
        className={`${inputClass} min-h-[320px] flex-1 resize-y font-mono text-small leading-5`}
      />
      <label className="text-small text-fg-muted">
        or upload a file:{" "}
        <input
          type="file"
          accept=".html,text/html"
          onChange={handleFileUpload}
          className="text-small file:mr-2 file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-meta file:font-medium file:text-fg-muted"
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
            className={`h-9 px-4 text-small font-medium capitalize transition-colors ${
              mobileTab === tab
                ? "bg-accent text-accent-fg"
                : "border border-border text-fg-muted hover:border-border-strong"
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
        <label className="flex flex-col gap-1.5 text-small font-medium text-fg">
          Title
          <input name="title" required maxLength={120} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-small font-medium text-fg sm:col-span-2 sm:col-start-1">
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
        <legend className="mb-2 text-small font-medium text-fg">Tags</legend>
        <div className="flex flex-wrap gap-2">
          {ARTIFACT_TAGS.map((tag) => (
            <label
              key={tag}
              className="flex cursor-pointer items-center gap-1.5 border border-border px-3 py-1.5 text-small text-fg-muted transition-colors has-checked:border-accent has-checked:bg-accent has-checked:text-accent-fg"
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

      {state?.error && <p className="text-small text-danger">{state.error}</p>}

      <Button
        type="submit"
        disabled={pending || !html.trim()}
        className="self-start"
      >
        {pending ? "Publishing..." : "Publish"}
      </Button>
    </form>
  );
}
