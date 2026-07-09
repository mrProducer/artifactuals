import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type Role = "user" | "moderator" | "admin";

export type Viewer = {
  user: User | null;
  role: Role;
  banned: boolean;
};

/**
 * Resolve the current request's user together with their moderation role and
 * ban state. Reads through the authenticated (RLS-constrained) client — profiles
 * are publicly readable, so this is a single cheap lookup.
 */
export async function getViewer(): Promise<Viewer> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: "user", banned: false };

  const { data } = await supabase
    .from("profiles")
    .select("role, banned_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user,
    role: (data?.role as Role) ?? "user",
    banned: Boolean(data?.banned_at),
  };
}

export function isModerator(role: Role): boolean {
  return role === "moderator" || role === "admin";
}
