"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ARTIFACT_TAGS } from "@/app/new/constants";

type Result = { error?: string; success?: boolean };

async function requireOwnedArtifact(artifactId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." as string };

  const { data: artifact } = await supabase
    .from("artifacts")
    .select("id, owner_id, source_path, preview_image_url")
    .eq("id", artifactId)
    .maybeSingle();

  if (!artifact) return { error: "Artifact not found." as string };
  if (artifact.owner_id !== user.id) {
    return { error: "You can only manage your own artifacts." as string };
  }
  return { supabase, user, artifact };
}

/** Best-effort extraction of the object path inside a public storage URL. */
function storagePathFromPublicUrl(
  url: string | null,
  bucket: string
): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
}

export async function togglePin(
  artifactId: string,
  pinned: boolean
): Promise<Result> {
  const owned = await requireOwnedArtifact(artifactId);
  if ("error" in owned) return owned;

  const { error } = await owned.supabase
    .from("artifacts")
    .update({ is_pinned: !pinned })
    .eq("id", artifactId);
  if (error) return { error: "Could not update. Try again." };

  const { data: profile } = await owned.supabase
    .from("profiles")
    .select("username")
    .eq("user_id", owned.user.id)
    .maybeSingle();
  if (profile?.username) revalidatePath(`/${profile.username}`);
  revalidatePath(`/a/${artifactId}`);
  return { success: true };
}

export async function updateArtifactMeta(
  artifactId: string,
  fields: { title: string; description: string; tags: string[] }
): Promise<Result> {
  const owned = await requireOwnedArtifact(artifactId);
  if ("error" in owned) return owned;

  const title = fields.title.trim();
  if (title.length < 1 || title.length > 120) {
    return { error: "Title must be 1-120 characters." };
  }
  const description = fields.description.trim();
  if (description.length > 500) {
    return { error: "Description must be 500 characters or fewer." };
  }
  const tags = fields.tags.filter((t) =>
    (ARTIFACT_TAGS as readonly string[]).includes(t)
  );

  const { error } = await owned.supabase
    .from("artifacts")
    .update({ title, description: description || null, tags })
    .eq("id", artifactId);
  if (error) return { error: "Could not save changes. Try again." };

  const { data: profile } = await owned.supabase
    .from("profiles")
    .select("username")
    .eq("user_id", owned.user.id)
    .maybeSingle();
  if (profile?.username) revalidatePath(`/${profile.username}`);
  revalidatePath(`/a/${artifactId}`);
  redirect(`/a/${artifactId}`);
}

export async function deleteArtifact(artifactId: string): Promise<Result> {
  const owned = await requireOwnedArtifact(artifactId);
  if ("error" in owned) return owned;

  const { data: profile } = await owned.supabase
    .from("profiles")
    .select("username")
    .eq("user_id", owned.user.id)
    .maybeSingle();

  // Remove the row first (RLS enforces ownership); cascades to comments/likes.
  const { error } = await owned.supabase
    .from("artifacts")
    .delete()
    .eq("id", artifactId);
  if (error) return { error: "Could not delete. Try again." };

  // Best-effort storage cleanup so we don't orphan the source/preview blobs.
  const admin = createAdminClient();
  if (owned.artifact.source_path) {
    await admin.storage
      .from("artifact-source")
      .remove([owned.artifact.source_path]);
  }
  const previewPath = storagePathFromPublicUrl(
    owned.artifact.preview_image_url,
    "artifact-previews"
  );
  if (previewPath) {
    await admin.storage.from("artifact-previews").remove([previewPath]);
  }

  revalidatePath("/feed");
  revalidatePath("/");
  if (profile?.username) {
    revalidatePath(`/${profile.username}`);
    redirect(`/${profile.username}`);
  }
  redirect("/feed");
}
