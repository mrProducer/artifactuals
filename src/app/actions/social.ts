"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function toggleLike(
  artifactId: string,
  liked: boolean
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sign in to like artifacts." };

  if (liked) {
    await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("artifact_id", artifactId);
  } else {
    const { error } = await supabase
      .from("likes")
      .insert({ user_id: user.id, artifact_id: artifactId });
    if (error && error.code !== "23505") {
      return { error: "Could not like. Try again." };
    }
  }

  revalidatePath(`/a/${artifactId}`);
  return {};
}

export async function toggleFollow(
  followeeId: string,
  following: boolean,
  username: string
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sign in to follow creators." };
  if (user.id === followeeId) return { error: "You can't follow yourself." };

  if (following) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followee_id", followeeId);
  } else {
    const limitError = await checkRateLimit("follow", user.id);
    if (limitError) return { error: limitError };

    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, followee_id: followeeId });
    if (error && error.code !== "23505") {
      return { error: "Could not follow. Try again." };
    }
  }

  revalidatePath(`/${username}`);
  return {};
}

export async function addComment(
  artifactId: string,
  body: string
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sign in to comment." };

  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > 1000) {
    return { error: "Comments must be 1-1000 characters." };
  }

  const limitError = await checkRateLimit("comment", user.id);
  if (limitError) return { error: limitError };

  const { error } = await supabase.from("comments").insert({
    artifact_id: artifactId,
    author_id: user.id,
    body: trimmed,
  });
  if (error) return { error: "Could not post comment. Try again." };

  revalidatePath(`/a/${artifactId}`);
  return {};
}

export async function deleteComment(
  commentId: string,
  artifactId: string
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  // RLS restricts deletion to the author's own comments
  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath(`/a/${artifactId}`);
  return {};
}

export async function reportContent(
  targetType: "artifact" | "comment",
  targetId: string,
  reason: string
): Promise<{ error?: string; success?: boolean }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sign in to report content." };

  const trimmed = reason.trim();
  if (trimmed.length < 1 || trimmed.length > 500) {
    return { error: "Please give a short reason (up to 500 characters)." };
  }

  const limitError = await checkRateLimit("report", user.id);
  if (limitError) return { error: limitError };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason: trimmed,
  });
  if (error) return { error: "Could not submit report. Try again." };

  return { success: true };
}
