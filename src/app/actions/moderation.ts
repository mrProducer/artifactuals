"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer, isModerator, type Role } from "@/lib/moderation";

type Result = { error?: string; success?: boolean };

type Actor = { userId: string; role: Role };

/**
 * Gate a moderation action. Returns the acting moderator, or an error result
 * the caller should return verbatim. Admin-only actions pass adminOnly=true.
 */
async function requireModerator(
  adminOnly = false
): Promise<{ actor: Actor } | { error: string }> {
  const { user, role } = await getViewer();
  if (!user) return { error: "Sign in required." };
  if (adminOnly ? role !== "admin" : !isModerator(role)) {
    return { error: "You don't have permission to do that." };
  }
  return { actor: { userId: user.id, role } };
}

async function logAction(
  admin: ReturnType<typeof createAdminClient>,
  moderatorId: string,
  entry: {
    action: string;
    targetType?: "artifact" | "comment" | "user" | "report";
    targetId?: string;
    reportId?: string;
    note?: string;
  }
): Promise<void> {
  await admin.from("moderation_actions").insert({
    moderator_id: moderatorId,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    report_id: entry.reportId ?? null,
    note: entry.note ?? null,
  });
}

export async function setArtifactStatus(
  artifactId: string,
  status: "published" | "removed",
  reportId?: string
): Promise<Result> {
  const gate = await requireModerator();
  if ("error" in gate) return gate;

  const admin = createAdminClient();
  const { error } = await admin
    .from("artifacts")
    .update({ status })
    .eq("id", artifactId);
  if (error) return { error: "Could not update the artifact. Try again." };

  await logAction(admin, gate.actor.userId, {
    action: status === "removed" ? "remove_artifact" : "restore_artifact",
    targetType: "artifact",
    targetId: artifactId,
    reportId,
  });

  revalidatePath(`/a/${artifactId}`);
  revalidatePath("/feed");
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function setCommentStatus(
  commentId: string,
  status: "visible" | "removed",
  reportId?: string
): Promise<Result> {
  const gate = await requireModerator();
  if ("error" in gate) return gate;

  const admin = createAdminClient();
  const { data: comment, error } = await admin
    .from("comments")
    .update({ status })
    .eq("id", commentId)
    .select("artifact_id")
    .maybeSingle();
  if (error) return { error: "Could not update the comment. Try again." };

  await logAction(admin, gate.actor.userId, {
    action: status === "removed" ? "remove_comment" : "restore_comment",
    targetType: "comment",
    targetId: commentId,
    reportId,
  });

  if (comment?.artifact_id) revalidatePath(`/a/${comment.artifact_id}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function resolveReport(
  reportId: string,
  status: "open" | "reviewed" | "actioned"
): Promise<Result> {
  const gate = await requireModerator();
  if ("error" in gate) return gate;

  const admin = createAdminClient();
  const { error } = await admin
    .from("reports")
    .update({ status })
    .eq("id", reportId);
  if (error) return { error: "Could not update the report. Try again." };

  await logAction(admin, gate.actor.userId, {
    action: status === "actioned" ? "action_report" : "dismiss_report",
    targetType: "report",
    targetId: reportId,
    reportId,
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function setUserBan(
  userId: string,
  banned: boolean,
  reason?: string
): Promise<Result> {
  const gate = await requireModerator();
  if ("error" in gate) return gate;
  if (userId === gate.actor.userId) {
    return { error: "You can't ban yourself." };
  }

  const admin = createAdminClient();

  // Don't allow banning another moderator/admin (only an admin can, and only
  // after demoting them first).
  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (
    banned &&
    (target?.role === "moderator" || target?.role === "admin") &&
    gate.actor.role !== "admin"
  ) {
    return { error: "Only an admin can ban a moderator." };
  }

  const trimmed = (reason ?? "").trim().slice(0, 500);
  const { error } = await admin
    .from("profiles")
    .update({
      banned_at: banned ? new Date().toISOString() : null,
      ban_reason: banned ? trimmed || null : null,
    })
    .eq("user_id", userId);
  if (error) return { error: "Could not update the user. Try again." };

  await logAction(admin, gate.actor.userId, {
    action: banned ? "ban_user" : "unban_user",
    targetType: "user",
    targetId: userId,
    note: banned ? trimmed || undefined : undefined,
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function setUserRole(
  userId: string,
  role: Role
): Promise<Result> {
  const gate = await requireModerator(true);
  if ("error" in gate) return gate;
  if (userId === gate.actor.userId) {
    return { error: "You can't change your own role." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("user_id", userId);
  if (error) return { error: "Could not update the role. Try again." };

  await logAction(admin, gate.actor.userId, {
    action: "set_role",
    targetType: "user",
    targetId: userId,
    note: role,
  });

  revalidatePath("/admin");
  return { success: true };
}
