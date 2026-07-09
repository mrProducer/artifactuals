import type { createAdminClient } from "@/lib/supabase/admin";

export type AuthMeta = {
  email: string | null;
  lastSignInAt: string | null;
};

/**
 * Build a map of auth user id -> email + last sign-in by paging the Supabase
 * Auth admin API. Server-only (needs the service-role client). Email and last
 * login live on `auth.users`, never on the public `profiles` row, so this is
 * the only place those sensitive fields are read — and only for the admin UI.
 */
export async function authUserMap(
  admin: ReturnType<typeof createAdminClient>
): Promise<Map<string, AuthMeta>> {
  const map = new Map<string, AuthMeta>();
  const perPage = 1000;

  // Cap the loop so a misbehaving API can't spin forever; 20 pages @ 1000 is
  // ample headroom for an early-stage app.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data) break;

    for (const u of data.users) {
      map.set(u.id, {
        email: u.email ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
      });
    }

    if (data.users.length < perPage) break;
  }

  return map;
}
