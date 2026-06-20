"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { publicEnv } from "@/lib/env";

/**
 * Browser Supabase client (anon key, RLS-enforced).
 * Use in Client Components for auth flows and realtime subscriptions.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey
  );
}
