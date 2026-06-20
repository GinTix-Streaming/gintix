import { getCreatorContext } from "@/lib/creator";
import StreamSettings from "@/components/creator/StreamSettings";

export const dynamic = "force-dynamic";

export default async function StreamKeyPage() {
  const ctx = await getCreatorContext();
  if (ctx.status !== "ok" || !ctx.stream) return null;
  const { stream } = ctx;

  return (
    <StreamSettings
      streamId={stream.id}
      streamKey={stream.stream_key}
      multistream={{
        twitch: stream.twitch_target_url ?? "",
        youtube: stream.youtube_target_url ?? "",
        tiktok: stream.tiktok_target_url ?? "",
        kick: stream.kick_target_url ?? "",
        enabled: stream.multistream_enabled,
      }}
    />
  );
}
