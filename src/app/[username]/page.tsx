import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import VideoPlayer from "@/components/VideoPlayer";
import type { CommerceListing } from "@/components/CommerceDrawer";

export const dynamic = "force-dynamic";

interface Params {
  params: { username: string };
}

/**
 * Public channel page: gintix.com/<username>.
 * Fully server-rendered. Resolves the viewer's premium status server-side so
 * the player knows whether to wire up the ad stack before any JS ships.
 */
export default async function ChannelPage({ params }: Params) {
  const supabase = createSupabaseServerClient();
  const username = params.username.toLowerCase();

  // Playback-safe stream data (no stream_key) from the public view.
  const { data: stream } = await supabase
    .from("public_streams")
    .select("creator_id, username, display_name, avatar_url, playback_id, is_live")
    .eq("username", username)
    .maybeSingle();

  if (!stream || !stream.playback_id) notFound();

  // Active products for the in-player commerce drawer.
  const { data: listings } = await supabase
    .from("commerce_listings")
    .select("id, title, description, image_url, price_cents, currency")
    .eq("creator_id", stream.creator_id)
    .eq("is_active", true);

  // Viewer premium status (defaults to false for anonymous viewers → ads on).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isPremiumViewer = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium_viewer")
      .eq("id", user.id)
      .maybeSingle();
    isPremiumViewer = profile?.is_premium_viewer ?? false;
  }

  return (
    <div className="space-y-6">
      <VideoPlayer
        playbackId={stream.playback_id}
        channel={stream.username}
        isLive={stream.is_live}
        isPremiumViewer={isPremiumViewer}
        listings={(listings as CommerceListing[]) ?? []}
      />

      <div className="flex items-center gap-4">
        {stream.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stream.avatar_url}
            alt={stream.username}
            className="h-14 w-14 rounded-full border border-amethyst/40 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-obsidian text-lg font-bold text-amethyst-glow">
            {stream.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-ink">
            {stream.display_name || stream.username}
          </h1>
          <p className="text-sm text-ink-muted">@{stream.username}</p>
        </div>
        {!isPremiumViewer && (
          <a
            href="/account?upgrade=premium"
            className="ml-auto text-sm text-amethyst-glow hover:underline"
          >
            Go ad-free →
          </a>
        )}
      </div>
    </div>
  );
}
