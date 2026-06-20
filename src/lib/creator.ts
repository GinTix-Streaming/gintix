import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CreatorProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  offline_banner_url: string | null;
  bio: string | null;
  follower_count: number;
  is_creator: boolean;
  is_premium_viewer: boolean;
}

export interface CreatorStream {
  id: string;
  stream_key: string;
  playback_id: string | null;
  is_live: boolean;
  title: string | null;
  category: string | null;
  language: string;
  thumbnail_url: string | null;
  viewer_count: number;
  sub_count: number;
  follower_count?: number;
  started_live_at: string | null;
  total_stream_minutes: number;
  multistream_enabled: boolean;
  twitch_target_url: string | null;
  youtube_target_url: string | null;
  tiktok_target_url: string | null;
  kick_target_url: string | null;
  slow_mode_seconds: number;
  followers_only: boolean;
  subscribers_only: boolean;
  emotes_only: boolean;
  account_age_minutes: number;
  ai_moderation_level: string;
  ai_moderation_custom: Record<string, string>;
}

const PROFILE_COLS =
  "id, username, display_name, avatar_url, banner_url, offline_banner_url, bio, follower_count, is_creator, is_premium_viewer";

const STREAM_COLS =
  "id, stream_key, playback_id, is_live, title, category, language, thumbnail_url, viewer_count, sub_count, started_live_at, total_stream_minutes, multistream_enabled, twitch_target_url, youtube_target_url, tiktok_target_url, kick_target_url, slow_mode_seconds, followers_only, subscribers_only, emotes_only, account_age_minutes, ai_moderation_level, ai_moderation_custom";

export type CreatorContext =
  | { status: "anon" }
  | { status: "no-profile" }
  | { status: "ok"; profile: CreatorProfile; stream: CreatorStream | null };

export async function getCreatorContext(): Promise<CreatorContext> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anon" };

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_COLS)
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return { status: "no-profile" };

  const { data: stream } = await supabase
    .from("stream_configs")
    .select(STREAM_COLS)
    .eq("creator_id", user.id)
    .maybeSingle();

  return {
    status: "ok",
    profile: profile as CreatorProfile,
    stream: (stream as CreatorStream) ?? null,
  };
}

// ── Achievement model (drives /go-live/achievements + revenue gating) ──
export interface Achievement {
  key: string;
  title: string;
  desc: string;
  current: number;
  target: number;
  unit?: string;
}

export function pathToCreator(stream: CreatorStream | null): Achievement[] {
  const hours = (stream?.total_stream_minutes ?? 0) / 60;
  return [
    {
      key: "stream-5h",
      title: "Hang with your community",
      desc: "Stream for a total of 5 hours",
      current: Math.min(hours, 5),
      target: 5,
      unit: "h",
    },
  ];
}

export function pathToVerification(stream: CreatorStream | null): Achievement[] {
  const hours = (stream?.total_stream_minutes ?? 0) / 60;
  return [
    {
      key: "subs-10",
      title: "Monetize your channel",
      desc: "Reach 10 subscribers in the last 30 days",
      current: stream?.sub_count ?? 0,
      target: 10,
    },
    {
      key: "viewers-50",
      title: "Show stopper",
      desc: "Average 50 viewers in the last 30 days",
      current: stream?.viewer_count ?? 0,
      target: 50,
    },
    {
      key: "stream-15h",
      title: "Dedicated streamer",
      desc: "Stream for a total of 15 hours in the last 30 days",
      current: Math.min(hours, 15),
      target: 15,
      unit: "h",
    },
  ];
}

export function isCreatorVerified(stream: CreatorStream | null): boolean {
  return pathToCreator(stream).every((a) => a.current >= a.target);
}
