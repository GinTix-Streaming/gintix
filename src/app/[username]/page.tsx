import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import VideoPlayer from "@/components/VideoPlayer";
import LiveChat from "@/components/LiveChat";
import ShopSection from "@/components/ShopSection";
import FollowButton from "@/components/FollowButton";
import AuctionPanel from "@/components/AuctionPanel";
import PrerollAd from "@/components/PrerollAd";
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

  // Channel is keyed on the PROFILE, so it never 404s for a real user.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, banner_url, bio, follower_count")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const { data: stream } = await supabase
    .from("public_streams")
    .select(
      "creator_id, username, display_name, avatar_url, playback_id, is_live, title, category, thumbnail_url, viewer_count, tags, slow_mode_seconds, followers_only, subscribers_only, emotes_only"
    )
    .eq("username", username)
    .maybeSingle<PublicStream & { slow_mode_seconds: number; followers_only: boolean; subscribers_only: boolean; emotes_only: boolean }>();

  const { data: listings } = await supabase
    .from("commerce_listings")
    .select("id, title, description, image_url, price_cents, currency")
    .eq("creator_id", profile.id)
    .eq("is_active", true);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  let isPremiumViewer = false;
  let isFollowing = false;
  let viewerUsername: string | null = null;
  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("is_premium_viewer, username")
      .eq("id", user.id)
      .maybeSingle();
    isPremiumViewer = p?.is_premium_viewer ?? false;
    viewerUsername = p?.username ?? null;

    if (!isOwner) {
      const { data: f } = await supabase
        .from("follows")
        .select("creator_id")
        .eq("follower_id", user.id)
        .eq("creator_id", profile.id)
        .maybeSingle();
      isFollowing = !!f;
    }
  }

  const isLiveWithVideo = !!(stream && stream.is_live && stream.playback_id);
  const shopListings = (listings as CommerceListing[]) ?? [];

  return (
    <div className="lg:flex lg:h-[calc(100vh-3.5rem)]">
      <div className="min-w-0 lg:flex-1 lg:overflow-y-auto">
        {/* Channel banner */}
        {profile.banner_url && (
          <div className="relative h-28 w-full sm:h-36">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.banner_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        {/* Player or offline state */}
        <div className="bg-black">
          <div className="relative mx-auto max-w-[1400px]">
            {isLiveWithVideo && !isOwner && (
              <PrerollAd
                category={stream?.category ?? ""}
                channel={profile.username}
                isPremium={isPremiumViewer}
              />
            )}
            {isLiveWithVideo ? (
              <VideoPlayer
                playbackId={stream!.playback_id!}
                channel={profile.username}
                isLive={stream!.is_live}
                isPremiumViewer={isPremiumViewer}
                listings={shopListings}
              />
            ) : (
              <div className="relative flex aspect-video w-full items-center justify-center bg-gradient-to-b from-obsidian to-canvas">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-amethyst-glow">
                        {profile.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-ink">
                    {profile.display_name || profile.username} is offline
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {isOwner
                      ? "Set up your channel and go live in one click."
                      : "Follow to get notified when they go live."}
                  </p>
                  {isOwner && (
                    <Link href="/go-live" className="btn-amethyst mt-4 inline-flex">
                      Open creator dashboard
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Creator header */}
        <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start gap-4">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.username} className="h-16 w-16 rounded-full border-2 border-amethyst object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amethyst-grad text-xl font-bold text-white">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-ink">
                  {profile.display_name || profile.username}
                </h1>
                <span className="text-sm text-ink-muted">@{profile.username}</span>
                {isLiveWithVideo && (
                  <span className="flex items-center gap-1.5 rounded-md bg-red-600/90 px-2 py-0.5 text-xs font-bold uppercase text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-ink-muted">
                {formatViewers(profile.follower_count ?? 0)} followers
              </p>
              {stream?.title && <p className="mt-1 font-medium text-ink">{stream.title}</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                {stream?.category && (
                  <span className="font-semibold text-amethyst-glow">{stream.category}</span>
                )}
                {(stream?.tags ?? []).map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLiveWithVideo && (
                <span className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-2 text-sm font-semibold text-ink">
                  <span className="live-dot" />
                  {formatViewers(stream!.viewer_count)}
                </span>
              )}
              {isOwner ? (
                <Link href="/go-live" className="btn-amethyst">Creator dashboard</Link>
              ) : (
                <>
                  <FollowButton
                    creatorId={profile.id}
                    viewerId={user?.id ?? null}
                    initialFollowing={isFollowing}
                  />
                  <Link href="/login" className="btn-amethyst">Subscribe</Link>
                </>
              )}
            </div>
          </div>

          {/* Live auction — appears the moment a lot goes on the block */}
          <div className="mt-5 max-w-md">
            <AuctionPanel
              creatorId={profile.id}
              viewer={user && viewerUsername ? { id: user.id, username: viewerUsername } : null}
              isOwner={isOwner}
            />
          </div>

          <div className="panel mt-5 p-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-muted">
              About {profile.display_name || profile.username}
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted">
              {profile.bio
                ? profile.bio
                : `${stream?.category ? `Streaming ${stream.category} on GinTix` : "On GinTix"} — where creators keep 100% of their fan funding. Subscribe for the ad-free experience, tip, or grab merch from the in-player shop. Multi-stream everywhere, powered by GinTix.`}
            </p>
          </div>

          <ShopSection listings={shopListings} />

          {!isOwner && !isPremiumViewer && (
            <div className="mt-5 max-w-md">
              <PrerollAd
                mode="companion"
                category={stream?.category ?? ""}
                channel={profile.username}
                isPremium={isPremiumViewer}
              />
            </div>
          )}

        </div>
      </div>

      {isLiveWithVideo && (
        <div className="h-[80vh] shrink-0 lg:h-auto lg:w-[340px]">
          <LiveChat
            channelId={profile.id}
            channelName={profile.username}
            viewer={user && viewerUsername ? { id: user.id, username: viewerUsername } : null}
            moderation={{
              slowModeSeconds: stream?.slow_mode_seconds ?? 0,
              followersOnly: stream?.followers_only ?? false,
              subscribersOnly: stream?.subscribers_only ?? false,
              emotesOnly: stream?.emotes_only ?? false,
            }}
            isFollower={isFollowing}
            isOwner={isOwner}
          />
        </div>
      )}
    </div>
  );
}
