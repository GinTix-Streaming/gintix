import Link from "next/link";
import { getLiveStreams, summarizeCategories } from "@/lib/streams";
import { formatViewers } from "@/lib/format";
import StreamCard from "@/components/StreamCard";
import { EmptyState, Icons } from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata = { title: "Browse — GinTix" };

export default async function BrowsePage() {
  const streams = await getLiveStreams(100);
  const categories = summarizeCategories(streams);
  const totalViewers = streams.reduce((a, s) => a + (s.viewer_count ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Browse</h1>
          <p className="text-sm text-ink-muted">
            {streams.length} live {streams.length === 1 ? "channel" : "channels"} ·{" "}
            {formatViewers(totalViewers)} watching now
          </p>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-muted">Categories</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/search?q=${encodeURIComponent(c.name)}`}
                className="group block"
              >
                <div className="card-rise relative aspect-[3/4] overflow-hidden rounded-xl bg-obsidian shadow-card">
                  {c.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
                <p className="mt-2.5 truncate text-sm font-semibold text-ink group-hover:text-amethyst-glow">{c.name}</p>
                <p className="text-xs text-ink-muted">{formatViewers(c.viewers)} viewers</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All live channels */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-muted">Live channels</h2>
        {streams.length === 0 ? (
          <EmptyState
            icon={Icons.broadcast}
            title="No live channels right now"
            body="We don't pad this page with fake streams. When creators go live they show up here instantly — or you can be the one everyone's watching."
            cta={{ label: "Start streaming", href: "/go-live" }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {streams.map((s) => (
              <StreamCard key={s.username} stream={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
