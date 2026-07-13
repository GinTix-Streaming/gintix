import Link from "next/link";
import { getLiveStreams, summarizeCategories } from "@/lib/streams";
import { formatViewers } from "@/lib/format";
import StreamCard from "@/components/StreamCard";
import AuctionRail from "@/components/AuctionRail";
import { EmptyState, Icons } from "@/components/EmptyState";

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
            <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/35 to-transparent" />
            <span className="absolute left-5 top-5 flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white shadow">
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
            </span>
            <span className="absolute right-5 top-5 rounded-md bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {formatViewers(featured.viewer_count)} watching
            </span>

            {/* floating glass info card */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-xl">
              <div className="rounded-2xl border border-white/10 bg-black/55 p-5 backdrop-blur-md sm:p-6">
                <h1 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-4xl">
                  {featured.title}
                </h1>
                <div className="mt-3 flex items-center gap-3">
                  {featured.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.avatar_url}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-amethyst"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {featured.display_name || featured.username}
                    </p>
                    <p className="truncate text-sm text-amethyst-soft">
                      {featured.category}
                    </p>
                  </div>
                  <div className="ml-auto hidden gap-2 sm:flex">
                    {(featured.tags ?? []).slice(0, 2).map((t) => (
                      <span key={t} className="chip">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Link href={`/${featured.username}`} className="btn-amethyst !px-6 !py-2.5">
                    ▶ Watch now
                  </Link>
                  <Link href="/login?mode=signup" className="btn-ghost !py-2.5">
                    Start your channel
                  </Link>
                </div>
              </div>
            </div>

            {/* carousel dots (decorative) */}
            <div className="absolute bottom-6 right-6 hidden items-center gap-1.5 sm:flex">
              <span className="h-1.5 w-6 rounded-full bg-white/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-10 overflow-hidden rounded-3xl bg-amethyst-fluid px-6 py-14 text-center sm:px-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-amethyst-soft">
            Live auctions · Live shopping
          </p>
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight text-ink sm:text-5xl">
            Sell live.{" "}
            <span className="bg-amethyst-grad bg-clip-text text-transparent">Keep 95%.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            Run real auctions on stream — proxy bidding, anti-snipe timers and hidden reserves,
            built in. GinTix takes <strong className="text-ink">5%</strong>. Whatnot takes 8%. Your
            subs and tips stay <strong className="text-ink">100%</strong> yours.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login?mode=signup" className="btn-amethyst !px-6 !py-3 text-base">
              Start selling live
            </Link>
            <Link href="/auction-rules" className="btn-ghost !px-6 !py-3 text-base">
              How auctions work
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-xs text-ink-muted">
            <span>🛡 30-day buyer protection</span>
            <span>⏱ Anti-snipe — no buzzer steals</span>
            <span>🔒 Your max bid stays hidden</span>
            <span>✅ Open to every seller, day one</span>
          </div>
        </section>
      )}

      {/* Auctions lead — impulse buyers never make it past the fold otherwise. */}
      <AuctionRail />

      <section className="mb-12">
        {streams.length > 0 && (
          <div className="mb-5 flex items-end justify-between">
            <div className="flex items-center gap-2.5">
              <span className="live-dot" />
              <h2 className="text-xl font-bold tracking-tight text-ink">Live channels</h2>
              <span className="hidden text-sm text-ink-muted sm:inline">
                · {formatViewers(totalViewers)} watching now
              </span>
            </div>
          </div>
        )}

        {streams.length === 0 ? (
          <EmptyState
            icon={Icons.gavel}
            title="No sellers live yet"
            body="GinTix is brand new — no invented viewer counts, no filler channels. Be the first to run an auction here: you'd keep 95% of every hammer price, and 100% of your subs and tips."
            cta={{ label: "Run your first auction", href: "/go-live/auctions" }}
            secondary={{ label: "How auctions work", href: "/auction-rules" }}
          />
        ) : rest.length === 0 ? (
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
            <Link href="/about" className="transition hover:text-ink">About</Link>
            <Link href="/creators" className="transition hover:text-ink">Creators</Link>
            <Link href="/advertise" className="transition hover:text-ink">Advertise</Link>
            <Link href="/pricing" className="transition hover:text-ink">Pricing</Link>
            <Link href="/buyer-protection" className="transition hover:text-ink">Buyer protection</Link>
            <Link href="/auction-rules" className="transition hover:text-ink">Auction rules</Link>
            <Link href="/safety" className="transition hover:text-ink">Safety</Link>
            <Link href="/terms" className="transition hover:text-ink">Terms</Link>
            <Link href="/privacy" className="transition hover:text-ink">Privacy</Link>
          </nav>
          <span className="text-xs">© {new Date().getFullYear()} GinTix</span>
        </div>
      </footer>
    </div>
  );
}
