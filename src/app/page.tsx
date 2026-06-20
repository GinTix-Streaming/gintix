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
  const totalViewers = streams.reduce((a, s) => a + (s.viewer_count ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
      {featured ? (
        <section className="relative mb-10 overflow-hidden rounded-3xl border border-white/8 shadow-lift">
          <div className="relative aspect-[21/9] w-full sm:aspect-[24/8]">
            {featured.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.thumbnail_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-canvas/90 via-transparent to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end gap-3 p-6 sm:max-w-2xl sm:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
                </span>
                <span className="text-sm font-medium text-ink">
                  {formatViewers(featured.viewer_count)} watching
                </span>
                <span className="chip">{featured.category}</span>
              </div>
              <h1 className="text-3xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl">
                {featured.title}
              </h1>
              <div className="flex items-center gap-3">
                {featured.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.avatar_url}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-amethyst"
                  />
                )}
                <div>
                  <p className="font-semibold text-ink">
                    {featured.display_name || featured.username}
                  </p>
                  <p className="text-sm text-ink-muted">
                    @{featured.username}
                  </p>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <Link href={`/${featured.username}`} className="btn-amethyst !px-6 !py-3">
                  ▶ Watch now
                </Link>
                <Link href="/login?mode=signup" className="btn-ghost !py-3">
                  Start your channel
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-10 rounded-3xl bg-amethyst-fluid p-12 text-center">
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
            Go live in one click.{" "}
            <span className="bg-amethyst-grad bg-clip-text text-transparent">
              Keep 100% of your funding.
            </span>
          </h1>
          <Link href="/login?mode=signup" className="btn-amethyst mt-6 !px-6 !py-3">
            Start your channel
          </Link>
        </section>
      )}

      <section className="mb-12">
        <div className="mb-5 flex items-end justify-between">
          <div className="flex items-center gap-2.5">
            <span className="live-dot" />
            <h2 className="text-xl font-bold tracking-tight text-ink">Live channels</h2>
            <span className="hidden text-sm text-ink-muted sm:inline">
              · {formatViewers(totalViewers)} watching now
            </span>
          </div>
        </div>
        {rest.length === 0 ? (
          <p className="text-ink-muted">No other channels are live right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rest.map((s) => (
              <StreamCard key={s.username} stream={s} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-14">
        <h2 className="mb-5 text-xl font-bold tracking-tight text-ink">
          Browse categories
        </h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.name}
              href={`/${streams.find((s) => s.category === c.name)?.username ?? ""}`}
              className="group block"
            >
              <div className="card-rise relative aspect-[3/4] overflow-hidden rounded-xl bg-obsidian shadow-card">
                {c.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.thumbnail}
                    alt={c.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-amethyst/0 transition group-hover:ring-2 group-hover:ring-amethyst/70" />
              </div>
              <p className="mt-2.5 truncate text-sm font-semibold text-ink transition group-hover:text-amethyst-glow">
                {c.name}
              </p>
              <p className="text-xs text-ink-muted">
                {formatViewers(c.viewers)} viewers
              </p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-sm text-ink-muted">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-extrabold tracking-tight text-ink">
            Gin<span className="text-amethyst-glow">Tix</span>
          </span>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <span className="cursor-pointer transition hover:text-ink">About</span>
            <span className="cursor-pointer transition hover:text-ink">Creators</span>
            <span className="cursor-pointer transition hover:text-ink">Pricing</span>
            <span className="cursor-pointer transition hover:text-ink">Safety</span>
            <span className="cursor-pointer transition hover:text-ink">Terms</span>
            <span className="cursor-pointer transition hover:text-ink">Privacy</span>
          </nav>
          <span className="text-xs">© {new Date().getFullYear()} GinTix</span>
        </div>
      </footer>
    </div>
  );
}
