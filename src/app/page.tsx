import Link from "next/link";
import { getLiveStreams, summarizeCategories } from "@/lib/streams";
import { formatViewers } from "@/lib/format";
import StreamCard from "@/components/StreamCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const streams = await getLiveStreams(50);
  const featured = streams[0];
  const rest = streams.slice(1);
  const categories = summarizeCategories(streams).slice(0, 8);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
      {featured ? (
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-white/5">
          <div className="relative aspect-[21/9] w-full sm:aspect-[21/7]">
            {featured.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.thumbnail_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/80 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end gap-3 p-6 sm:max-w-xl sm:p-10">
              <div className="flex items-center gap-2">
                <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                  ● Live
                </span>
                <span className="text-sm font-medium text-ink-muted">
                  {formatViewers(featured.viewer_count)} watching
                </span>
              </div>
              <h1 className="text-2xl font-extrabold leading-tight text-ink sm:text-4xl">
                {featured.title}
              </h1>
              <div className="flex items-center gap-3">
                {featured.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full border border-amethyst/40 object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-ink">
                    {featured.display_name || featured.username}
                  </p>
                  <p className="text-sm text-ink-muted">{featured.category}</p>
                </div>
              </div>
              <div>
                <Link href={`/${featured.username}`} className="btn-amethyst mt-1">
                  Watch now
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-8 rounded-2xl bg-amethyst-fluid p-10 text-center">
          <h1 className="text-3xl font-extrabold text-ink">
            Go live in one click.{" "}
            <span className="text-amethyst-glow">Keep 100% of your funding.</span>
          </h1>
          <Link href="/go-live" className="btn-amethyst mt-5">
            Start your channel
          </Link>
        </section>
      )}

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <span className="live-dot" />
          <h2 className="text-lg font-bold text-ink">Live channels</h2>
        </div>
        {rest.length === 0 ? (
          <p className="text-ink-muted">No other channels are live right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rest.map((s) => (
              <StreamCard key={s.username} stream={s} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-bold text-ink">Browse categories</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.name}
              href={`/${streams.find((s) => s.category === c.name)?.username ?? ""}`}
              className="group block"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-obsidian">
                {c.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.thumbnail}
                    alt={c.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                  />
                )}
                <span className="pointer-events-none absolute inset-0 rounded-lg ring-0 ring-amethyst/0 transition group-hover:ring-2 group-hover:ring-amethyst/70" />
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-ink group-hover:text-amethyst-glow">
                {c.name}
              </p>
              <p className="text-xs text-ink-muted">
                {formatViewers(c.viewers)} viewers
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
