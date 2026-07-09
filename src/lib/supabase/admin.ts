import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { SUPABASE_SECRET_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Service-role client — bypasses RLS. Server-only; never import from client
 * components. Used for rate-limit counts and background jobs.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    SUPABASE_URL!,
    SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}
