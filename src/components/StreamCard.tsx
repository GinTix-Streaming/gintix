import Link from "next/link";
import type { PublicStream } from "@/lib/streams";
import { formatViewers } from "@/lib/format";

/** Rich live-channel card: thumbnail, live badge, viewers, avatar, meta. */
export default function StreamCard({ stream }: { stream: PublicStream }) {
  return (
    <Link href={`/${stream.username}`} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-obsidian">
        {stream.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stream.thumbnail_url}
            alt={stream.title ?? stream.username}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-canvas" />
        )}
        <span className="absolute left-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
          Live
        </span>
        <span className="absolute bottom-2 left-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {formatViewers(stream.viewer_count)} viewers
        </span>
        {/* amethyst hover ring */}
        <span className="pointer-events-none absolute inset-0 rounded-lg ring-0 ring-amethyst/0 transition group-hover:ring-2 group-hover:ring-amethyst/70" />
      </div>

      <div className="mt-2.5 flex gap-2.5">
        {stream.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stream.avatar_url}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-obsidian text-sm font-bold text-amethyst-glow">
            {stream.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink group-hover:text-amethyst-glow">
            {stream.title || "Untitled stream"}
          </p>
          <p className="truncate text-sm text-ink-muted">
            {stream.display_name || stream.username}
          </p>
          <p className="truncate text-sm text-ink-muted">{stream.category}</p>
          {stream.tags && stream.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
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
