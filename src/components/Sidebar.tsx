import Link from "next/link";
import { getLiveStreams } from "@/lib/streams";
import { formatViewers } from "@/lib/format";

/** Persistent left rail of live channels (Twitch/Kick style). */
export default async function Sidebar() {
  const streams = await getLiveStreams(15);

  return (
    <aside className="hidden w-60 shrink-0 border-r border-white/5 bg-[#0e0f13] md:block">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-3">
        <p className="px-4 pb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
          Live channels
        </p>
        <nav className="px-1">
          {streams.map((s) => (
            <Link
              key={s.username}
              href={`/${s.username}`}
              className="group flex items-center gap-2.5 rounded-md px-3 py-2 transition hover:bg-white/5"
            >
              {s.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.avatar_url}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-obsidian text-xs font-bold text-amethyst-glow">
                  {s.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {s.display_name || s.username}
                </p>
                <p className="truncate text-xs text-ink-muted">{s.category}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="live-dot" />
                <span className="text-xs font-medium text-ink-muted">
                  {formatViewers(s.viewer_count)}
                </span>
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
