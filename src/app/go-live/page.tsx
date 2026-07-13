import Link from "next/link";
import { getCreatorContext } from "@/lib/creator";
import { formatViewers } from "@/lib/format";
import ViewerCount from "@/components/ViewerCount";
import LiveChat from "@/components/LiveChat";
import ChannelDetailsForm from "@/components/creator/ChannelDetailsForm";
import LiveTimer from "@/components/creator/LiveTimer";
import BrowserBroadcast from "@/components/creator/BrowserBroadcast";

export const dynamic = "force-dynamic";

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="panel px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1 text-xl font-extrabold tabular-nums ${accent ? "text-amethyst-glow" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

const ACTIVITY = [
  { who: "luna_w", what: "followed you", when: "just now" },
  { who: "drop_god", what: "subscribed (Tier 1)", when: "2m" },
  { who: "byteme", what: "bought Studio Headset — $129", when: "6m" },
  { who: "sasha", what: "followed you", when: "11m" },
  { who: "kappa_king", what: "gifted 5 subs", when: "18m" },
];

export default async function LiveDashboardPage() {
  const ctx = await getCreatorContext();
  if (ctx.status !== "ok" || !ctx.stream) return null; // layout handles gating
  const { profile, stream } = ctx;

  return (
    <div className="space-y-5">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          label="Session"
          value={stream.is_live ? <span className="text-red-500">● Live</span> : "Offline"}
        />
        <Stat
          label="Viewers"
          value={
            stream.is_live ? (
              <ViewerCount channelId={profile.id} streamConfigId={stream.id} persist />
            ) : (
              "0"
            )
          }
          accent
        />
        <Stat label="Followers" value={formatViewers(profile.follower_count)} />
        <Stat label="Subscribers" value={formatViewers(stream.sub_count)} />
        <Stat
          label="Time live"
          value={stream.is_live ? <LiveTimer startedAt={stream.started_live_at} /> : "—"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Broadcast studio — go live from the browser camera */}
          <BrowserBroadcast
            streamId={stream.id}
            streamKey={stream.stream_key}
            username={profile.username}
            initialLive={stream.is_live}
          />

          {/* Channel details */}
          <section className="panel p-6">
            <h2 className="mb-1 text-base font-bold text-ink">Stream information</h2>
            <p className="mb-4 text-sm text-ink-muted">What viewers see on your stream and in discovery.</p>
            <ChannelDetailsForm
              streamId={stream.id}
              initialTitle={stream.title ?? ""}
              initialCategory={stream.category ?? ""}
              initialLanguage={stream.language}
            />
          </section>

          {/* Quick actions */}
          <section className="panel p-6">
            <h2 className="mb-4 text-base font-bold text-ink">Quick actions</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionLink href="/go-live/stream" title="Stream URL & key" desc="Copy your RTMP key for OBS" />
              <ActionLink href="/go-live/moderation" title="Moderation" desc="Chat filters, slow mode, bans" />
              <ActionLink href="/go-live/shop" title="In-stream shop" desc="Sell products in your player" />
              <ActionLink href="/go-live/revenue" title="Revenue" desc="Subs, funding & payouts" />
            </div>
          </section>
        </div>

        {/* Right column: chat + activity */}
        <div className="space-y-5">
          <section className="panel h-[460px] overflow-hidden">
            <LiveChat
              channelId={profile.id}
              channelName={profile.username}
              viewer={{ id: profile.id, username: profile.username }}
              moderation={{
                slowModeSeconds: stream.slow_mode_seconds,
                followersOnly: stream.followers_only,
                subscribersOnly: stream.subscribers_only,
                emotesOnly: stream.emotes_only,
              }}
              isFollower
              isOwner
            />
          </section>

          <section className="panel p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">Activity feed</h2>
            <ul className="space-y-2.5">
              {ACTIVITY.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amethyst" />
                  <span className="text-ink">
                    <span className="font-semibold text-amethyst-soft">{a.who}</span> {a.what}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-ink-muted">{a.when}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function ActionLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="card-rise rounded-xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-amethyst/40"
    >
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>
    </Link>
  );
}
