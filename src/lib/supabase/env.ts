/**
 * Supabase connection values, tolerant of both naming conventions:
 *  - New (2025+): NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY
 *  - Legacy:      NEXT_PUBLIC_SUPABASE_ANON_KEY       / SUPABASE_SERVICE_ROLE_KEY
 *
 * The Vercel–Supabase integration sets the new names; the Supabase dashboard
 * and older setups use the legacy names. Reading both means any wiring works.
 * NEXT_PUBLIC_* are referenced as full literals so Next.js can inline them.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Server-only. Never import into client components. */
export const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
