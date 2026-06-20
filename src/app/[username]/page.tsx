import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import VideoPlayer from "@/components/VideoPlayer";
import ChatPanel from "@/components/ChatPanel";
import { formatViewers } from "@/lib/format";
import type { CommerceListing } from "@/components/CommerceDrawer";
import type { PublicStream } from "@/lib/streams";

export const dynamic = "force-dynamic";

interface Params {
  params: { username: string };
}

export default async function ChannelPage({ params }: Params) {
  const supabase = createSupabaseServerClient();
  const username = params.username.toLowerCase();

  const { data: stream } = await supabase
    .from("public_streams")
    .select(
      "creator_id, username, display_name, avatar_url, playback_id, is_live, title, category, thumbnail_url, viewer_count, tags"
    )
    .eq("username", username)
    .maybeSingle<PublicStream>();

  if (!stream || !stream.playback_id) notFound();

  const { data: listings } = await supabase
    .from("commerce_listings")
    .select("id, title, description, image_url, price_cents, currency")
    .eq("creator_id", stream.creator_id)
    .eq("is_active", true);

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
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="bg-black">
          <div className="mx-auto max-w-[1400px]">
            <VideoPlayer
              playbackId={stream.playback_id}
              channel={stream.username}
              isLive={stream.is_live}
              isPremiumViewer={isPremiumViewer}
              listings={(listings as CommerceListing[]) ?? []}
            />
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start gap-4">
            {stream.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stream.avatar_url}
                alt={stream.username}
                className="h-16 w-16 rounded-full border-2 border-amethyst object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-obsidian text-xl font-bold text-amethyst-glow">
                {stream.username.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-ink">
                  {stream.display_name || stream.username}
                </h1>
                <span className="text-sm text-ink-muted">@{stream.username}</span>
              </div>
              <p className="mt-1 font-medium text-ink">{stream.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-amethyst-glow">
                  {stream.category}
                </span>
                {(stream.tags ?? []).map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-2 text-sm font-semibold text-ink">
                <span className="live-dot" />
                {formatViewers(stream.viewer_count)}
              </span>
              <button className="btn-ghost gap-1.5">♥ Follow</button>
              <a href="/login" className="btn-amethyst">
                Subscribe
              </a>
            </div>
          </div>

          <div className="panel mt-5 p-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-muted">
              About {stream.display_name || stream.username}
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted">
              Streaming {stream.category} on GinTix — where creators keep 100% of
              their fan funding. Subscribe for the ad-free experience, drop a tip,
              or grab merch from the in-player shop. Multi-stream everywhere,
              powered by GinTix.
            </p>
          </div>

          {!isPremiumViewer && (
            <a
              href="/login"
              className="mt-4 inline-block text-sm text-amethyst-glow hover:underline"
            >
              Go ad-free with a Premium pass →
            </a>
          )}
        </div>
      </div>

      <div className="hidden w-[340px] shrink-0 lg:block">
        <ChatPanel channel={stream.username} />
      </div>
    </div>
  );
}
