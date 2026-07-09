import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Phase 1 rate limiting (handoff §9): count the user's recent rows before a
 * write. Postgres-backed — no extra infra; swap for Redis counters if volume
 * ever makes these count queries hot. Thresholds start conservative.
 */

type LimitRule = {
  table: "artifacts" | "comments" | "follows" | "reports";
  userColumn: string;
  windowMinutes: number;
  max: number;
  message: string;
};

export const RATE_LIMITS = {
  publish: {
    table: "artifacts",
    userColumn: "owner_id",
    windowMinutes: 60,
    max: 10,
    message: "You've published a lot in the last hour. Take a breather and try again soon.",
  },
  comment: {
    table: "comments",
    userColumn: "author_id",
    windowMinutes: 10,
    max: 20,
    message: "You're commenting too quickly. Try again in a few minutes.",
  },
  follow: {
    table: "follows",
    userColumn: "follower_id",
    windowMinutes: 60,
    max: 60,
    message: "Too many follow actions. Try again later.",
  },
  report: {
    table: "reports",
    userColumn: "reporter_id",
    windowMinutes: 60,
    max: 20,
    message: "Too many reports submitted. Try again later.",
  },
} satisfies Record<string, LimitRule>;

export async function checkRateLimit(
  action: keyof typeof RATE_LIMITS,
  userId: string
): Promise<string | null> {
  const rule = RATE_LIMITS[action];
  const since = new Date(
    Date.now() - rule.windowMinutes * 60 * 1000
  ).toISOString();

  const admin = createAdminClient();
  const { count, error } = await admin
    .from(rule.table)
    .select("*", { count: "exact", head: true })
    .eq(rule.userColumn, userId)
    .gte("created_at", since);

  // Fail open on counting errors: a broken limiter shouldn't take the
  // product down, and abuse volume in Phase 1 is expected to be tiny.
  if (error || count === null) return null;
  return count >= rule.max ? rule.message : null;
}
