import Link from "next/link";
import type { PublicStream } from "@/lib/streams";
import { formatViewers } from "@/lib/format";

/** Rich live-channel card: thumbnail, live badge, viewers, avatar, meta. */
export default function StreamCard({ stream }: { stream: PublicStream }) {
  return (
    <Link href={`/${stream.username}`} className="group block">
      <div className="card-rise relative aspect-video overflow-hidden rounded-xl bg-obsidian shadow-card">
        {stream.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stream.thumbnail_url}
            alt={stream.title ?? stream.username}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-canvas" />
        )}
        {/* bottom scrim for legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

        <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          Live
        </span>
        <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          {formatViewers(stream.viewer_count)} viewers
        </span>
        <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-amethyst/0 transition group-hover:ring-2 group-hover:ring-amethyst/70" />
      </div>

      <div className="mt-3 flex gap-3">
        <div className="relative shrink-0">
          {stream.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={stream.avatar_url}
              alt=""
              className="h-10 w-10 rounded-full object-cover ring-2 ring-amethyst/60"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amethyst-grad text-sm font-bold text-white">
              {stream.username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight text-ink transition group-hover:text-amethyst-glow">
            {stream.title || "Untitled stream"}
          </p>
          <p className="mt-0.5 truncate text-sm text-ink-muted">
            {stream.display_name || stream.username}
          </p>
          <p className="truncate text-sm text-amethyst-soft/80">{stream.category}</p>
          {stream.tags && stream.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stream.tags.slice(0, 3).map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
