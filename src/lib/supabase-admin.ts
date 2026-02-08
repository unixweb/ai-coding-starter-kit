import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client with service role key (bypasses RLS).
 * Returns null if SUPABASE_SERVICE_ROLE_KEY is not set.
 */
export function createAdminClient() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRole);
}
