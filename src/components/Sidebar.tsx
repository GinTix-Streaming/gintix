import Link from "next/link";
import { getLiveStreams } from "@/lib/streams";
import { formatViewers } from "@/lib/format";
import { getNavState } from "@/lib/nav";

const NAV = [
  {
    href: "/",
    label: "Home",
    icon: <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />,
  },
  {
    href: "/browse",
    label: "Browse",
    icon: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 9h18M9 18v2m6-2v2" /></>,
  },
  {
    href: "/following",
    label: "Following",
    icon: <path d="M20.8 5.6a4.6 4.6 0 0 0-7-.6L12 6.6 10.2 5a4.6 4.6 0 1 0-6.5 6.5l8.3 8.3 8.3-8.3a4.6 4.6 0 0 0 .5-5.9Z" />,
  },
];

/** Persistent left rail — nav + live channels (own-lane take on Twitch/Kick). */
export default async function Sidebar() {
  const [streams, nav] = await Promise.all([getLiveStreams(15), getNavState()]);

  return (
    <aside className="hidden w-60 shrink-0 border-r border-white/5 bg-surface/50 md:block">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-3">
        <nav className="px-2 pb-2">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted transition hover:bg-white/[0.06] hover:text-ink"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {n.icon}
              </svg>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="mx-3 my-2 border-t border-white/5" />

        <p className="px-4 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
          Live channels
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
                <img src={s.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-amethyst/50" />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amethyst-grad text-xs font-bold text-white">
                  {s.username.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{s.display_name || s.username}</p>
                <p className="truncate text-xs text-ink-muted">{s.category}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="live-dot" />
                <span className="text-xs font-semibold text-ink">{formatViewers(s.viewer_count)}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Contextual footer CTA — reflects exactly where the viewer stands. */}
        <div className="mt-4 px-4">
          {nav.isLive ? (
            <Link
              href="/go-live"
              className="block rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-3 text-center transition hover:bg-red-500/15"
            >
              <span className="flex items-center justify-center gap-2 text-xs font-bold text-red-300">
                <span className="live-dot" /> You&apos;re live
              </span>
              <span className="mt-0.5 block text-[11px] text-ink-muted">Manage your stream →</span>
            </Link>
          ) : nav.isCreator ? (
            <Link
              href="/go-live"
              className="block rounded-xl border border-amethyst/30 bg-amethyst/10 px-3 py-3 text-center text-xs font-semibold text-amethyst-soft transition hover:bg-amethyst/15"
            >
              Go live →
            </Link>
          ) : (
            <Link
              href={nav.signedIn ? "/go-live" : "/login?mode=signup"}
              className="block rounded-xl border border-amethyst/30 bg-amethyst/10 px-3 py-3 text-center text-xs font-semibold text-amethyst-soft transition hover:bg-amethyst/15"
            >
              Become a creator →
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
