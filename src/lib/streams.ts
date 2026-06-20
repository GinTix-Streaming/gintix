import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PublicStream {
  creator_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  playback_id: string | null;
  is_live: boolean;
  title: string | null;
  category: string | null;
  thumbnail_url: string | null;
  viewer_count: number | null;
  tags: string[] | null;
}

/** All live channels, most-watched first. */
export async function getLiveStreams(limit = 50): Promise<PublicStream[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("public_streams")
    .select(
      "creator_id, username, display_name, avatar_url, playback_id, is_live, title, category, thumbnail_url, viewer_count, tags"
    )
    .eq("is_live", true)
    .order("viewer_count", { ascending: false })
    .limit(limit);
  return (data as PublicStream[]) ?? [];
}

export interface CategorySummary {
  name: string;
  viewers: number;
  channels: number;
  thumbnail: string | null;
}

/** Roll streams up into browseable categories (most-watched first). */
export function summarizeCategories(streams: PublicStream[]): CategorySummary[] {
  const map = new Map<string, CategorySummary>();
  for (const s of streams) {
    const name = s.category ?? "Other";
    const cur =
      map.get(name) ?? { name, viewers: 0, channels: 0, thumbnail: s.thumbnail_url };
    cur.viewers += s.viewer_count ?? 0;
    cur.channels += 1;
    map.set(name, cur);
  }
  return [...map.values()].sort((a, b) => b.viewers - a.viewers);
}
