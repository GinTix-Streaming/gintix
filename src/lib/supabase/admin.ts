import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Service-role Supabase client. BYPASSES RLS.
 *
 * Use ONLY in trusted server contexts (route handlers, webhooks) for
 * privileged writes the user cannot perform themselves:
 *   • inserting a creator's stream_config on provision
 *   • syncing billing_ledger from Stripe webhooks
 *
 * Never import this into a Client Component. The `server-only` guard
 * will throw at build time if you do.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
