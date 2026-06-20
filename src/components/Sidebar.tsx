import Link from "next/link";
import { getLiveStreams } from "@/lib/streams";
import { formatViewers } from "@/lib/format";

/** Persistent left rail of live channels (Twitch/Kick style). */
export default async function Sidebar() {
  const streams = await getLiveStreams(15);

  return (
    <aside className="hidden w-60 shrink-0 border-r border-white/5 bg-surface/60 md:block">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-4">
        <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
          Recommended channels
        </p>
        <nav className="px-2">
          {streams.map((s) => (
            <Link
              key={s.username}
              href={`/${s.username}`}
              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-white/[0.06]"
            >
              {s.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.avatar_url}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-amethyst/50"
                />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amethyst-grad text-xs font-bold text-white">
                  {s.username.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {s.display_name || s.username}
                </p>
                <p className="truncate text-xs text-ink-muted">{s.category}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="live-dot" />
                <span className="text-xs font-semibold text-ink">
                  {formatViewers(s.viewer_count)}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="mt-4 px-4">
          <Link
            href="/login?mode=signup"
            className="block rounded-xl border border-amethyst/30 bg-amethyst/10 px-3 py-3 text-center text-xs font-semibold text-amethyst-soft transition hover:bg-amethyst/15"
          >
            Become a creator →
          </Link>
        </div>
      </div>
    </aside>
  );
}
