import { getCreatorContext } from "@/lib/creator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ModerationPanel from "@/components/creator/ModerationPanel";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const ctx = await getCreatorContext();
  if (ctx.status !== "ok" || !ctx.stream) return null;
  const { profile, stream } = ctx;

  const supabase = createSupabaseServerClient();
  const { data: words } = await supabase
    .from("banned_words")
    .select("id, word")
    .eq("creator_id", profile.id)
    .order("created_at", { ascending: true });

  return (
    <ModerationPanel
      streamId={stream.id}
      creatorId={profile.id}
      init={{
        level: stream.ai_moderation_level,
        custom: stream.ai_moderation_custom ?? {},
        followersOnly: stream.followers_only,
        subscribersOnly: stream.subscribers_only,
        emotesOnly: stream.emotes_only,
        slowSeconds: stream.slow_mode_seconds,
        accountAgeMinutes: stream.account_age_minutes,
      }}
      initialWords={words ?? []}
    />
  );
}
