"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_ARTIFACT_BYTES } from "@/lib/sandbox";
import { checkRateLimit } from "@/lib/rate-limit";
import { triggerScreenshotWorker } from "@/lib/trigger-screenshots";
import { ARTIFACT_TAGS, type PublishState } from "./constants";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Compose-time preview upload. Runs server-side (unlike a direct browser
 * Storage call) so it uses the request's authenticated session — the browser
 * client doesn't reliably attach the user token to Storage requests.
 */
export async function uploadDraft(
  draftId: string,
  html: string
): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Refresh and sign in again." };
  }
  if (!UUID_RE.test(draftId)) {
    return { error: "Preview failed. Please try again." };
  }
  if (!html.trim()) {
    return { error: "Nothing to preview yet." };
  }

  const bytes = new TextEncoder().encode(html);
  if (bytes.byteLength > MAX_ARTIFACT_BYTES) {
    return {
      error: `Artifact is over the 1 MB limit (${(bytes.byteLength / 1024).toFixed(0)} KB).`,
    };
  }

  // Write with the service-role client: the user is already verified above and
  // the path is locked to their own folder, so this can't be used to write
  // elsewhere. Avoids depending on Storage RLS, which rejects the token.
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from("artifact-source")
    .upload(`${user.id}/drafts/${draftId}.html`, bytes, {
      upsert: true,
      contentType: "text/html",
    });

  if (error) {
    return { error: "Preview failed. Please try again." };
  }
  return null;
}

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

  const limitError = await checkRateLimit("publish", user.id);
  if (limitError) {
    return { error: limitError };
  }

  const htmlBytes = new TextEncoder().encode(html);
  if (htmlBytes.byteLength > MAX_ARTIFACT_BYTES) {
    return {
      error: `Artifact is too large (${(htmlBytes.byteLength / 1024).toFixed(0)} KB). The limit is 1 MB — Artifactuals hosts single-file artifacts.`,
    };
  }

  const admin = createAdminClient();
  const sourcePath = `${user.id}/${crypto.randomUUID()}.html`;
  const { error: uploadError } = await admin.storage
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
    await admin.storage.from("artifact-source").remove([sourcePath]);
    return { error: "Could not publish. Please try again." };
  }

  // Generate the preview screenshot now rather than waiting for the cron.
  // Runs after the response is sent, so it never slows down publishing.
  after(triggerScreenshotWorker);

  redirect(`/a/${artifact.id}`);
}
