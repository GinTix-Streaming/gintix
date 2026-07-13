import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * One source of truth for "who is this and what are they doing right now".
 *
 * Every navigation surface (top bar, sidebar, mobile nav, user menu) reads
 * this, so the site can never contradict itself — e.g. offering "Go live"
 * to someone who is already live.
 */
export interface NavState {
  signedIn: boolean;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isCreator: boolean;
  isLive: boolean;
}

export const EMPTY_NAV: NavState = {
  signedIn: false,
  username: null,
  displayName: null,
  avatarUrl: null,
  isCreator: false,
  isLive: false,
};

export async function getNavState(): Promise<NavState> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return EMPTY_NAV;

  const [{ data: profile }, { data: stream }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url, is_creator")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("stream_configs").select("is_live").eq("creator_id", user.id).maybeSingle(),
  ]);

  return {
    signedIn: true,
    username: profile?.username ?? null,
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    isCreator: !!profile?.is_creator,
    isLive: !!stream?.is_live,
  };
}
