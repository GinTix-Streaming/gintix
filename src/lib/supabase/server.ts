import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { publicEnv } from "@/lib/env";

/**
 * Request-scoped Supabase client bound to the user's session cookies.
 * Respects RLS — use this for anything acting *as the signed-in user*.
 * Call inside Server Components, Route Handlers, and Server Actions.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll throws in pure Server Components (read-only).
            // Safe to ignore: middleware/route handlers refresh the session.
          }
        },
      },
    }
  );
}
