"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MAX_ARTIFACT_BYTES } from "@/lib/sandbox";

export type PublishState = { error: string } | null;

export const ARTIFACT_TAGS = [
  "game",
  "tool",
  "data-viz",
  "education",
  "art",
  "other",
] as const;

export async function publishArtifact(
  _prev: PublishState,
  formData: FormData
): Promise<PublishState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const html = String(formData.get("html") ?? "");
  const tags = formData
    .getAll("tags")
    .map(String)
    .filter((t): t is (typeof ARTIFACT_TAGS)[number] =>
      (ARTIFACT_TAGS as readonly string[]).includes(t)
    );

  if (title.length < 1 || title.length > 120) {
    return { error: "Title must be 1-120 characters." };
  }
  if (description.length > 500) {
    return { error: "Description must be 500 characters or fewer." };
  }
  if (!html.trim()) {
    return { error: "Artifact HTML is empty." };
  }

  const htmlBytes = new TextEncoder().encode(html);
  if (htmlBytes.byteLength > MAX_ARTIFACT_BYTES) {
    return {
      error: `Artifact is too large (${(htmlBytes.byteLength / 1024).toFixed(0)} KB). The limit is 1 MB — Artifactuals hosts single-file artifacts.`,
    };
  }

  const sourcePath = `${user.id}/${crypto.randomUUID()}.html`;
  const { error: uploadError } = await supabase.storage
    .from("artifact-source")
    .upload(sourcePath, htmlBytes, { contentType: "text/html" });

  if (uploadError) {
    return { error: "Upload failed. Please try again." };
  }

  const { data: artifact, error: insertError } = await supabase
    .from("artifacts")
    .insert({
      owner_id: user.id,
      title,
      description: description || null,
      tags,
      source_path: sourcePath,
      source_size_bytes: htmlBytes.byteLength,
    })
    .select("id")
    .single();

  if (insertError || !artifact) {
    await supabase.storage.from("artifact-source").remove([sourcePath]);
    return { error: "Could not publish. Please try again." };
  }

  redirect(`/a/${artifact.id}`);
}
