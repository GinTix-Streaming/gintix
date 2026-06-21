import Link from "next/link";

export const metadata = { title: "Advertise on GinTix" };

const STATS = [
  ["100%", "of subs go to creators — viewers love the platform"],
  ["0", "minimum spend to start"],
  ["<2 min", "to launch your first campaign"],
];

const STEPS = [
  ["Create an ad account", "Tell us your business name. That's it — no sales calls, no contracts."],
  ["Build your campaign", "Set an objective, budget, schedule and targeting. Add your creative."],
  ["Go live & measure", "Your ads serve to engaged viewers. Track impressions, clicks & spend in real time."],
];

const FEATURES = [
  ["Audience targeting", "Reach viewers by category, geography and device. Premium (ad-free) viewers are automatically excluded."],
  ["Flexible budgets", "Daily or lifetime caps, CPM bidding, pause anytime. You're never locked in."],
  ["Transparent reporting", "Impressions, clicks, CTR, eCPM and spend — per campaign, updated live."],
  ["Premium inventory", "In-stream pre-roll and companion placements across thousands of live channels."],
];

export default function AdvertiseLanding() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      {/* Hero */}
      <section className="panel relative overflow-hidden p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amethyst/25 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-amethyst/30 bg-amethyst/10 px-3 py-1 text-xs font-semibold text-amethyst-soft">
            GinTix Ads Manager
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            Put your brand{" "}
            <span className="bg-amethyst-grad bg-clip-text text-transparent">in the moment.</span>
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            Reach live audiences the second they&apos;re most engaged. Self-serve campaigns,
            real-time analytics, and the same one-click simplicity creators love — now for advertisers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/advertise/dashboard" className="btn-amethyst !px-6 !py-3 text-base">
              Get started — it&apos;s free
            </Link>
            <Link href="/advertise/dashboard" className="btn-ghost !py-3">
              Go to Ads Manager
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {STATS.map(([n, d]) => (
          <div key={n} className="panel p-6">
            <p className="text-3xl font-extrabold text-amethyst-glow">{n}</p>
            <p className="mt-1 text-sm text-ink-muted">{d}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-ink">How it works</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <div key={t} className="panel p-6">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-amethyst-grad text-sm font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mt-3 font-bold text-ink">{t}</h3>
              <p className="mt-1 text-sm text-ink-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-ink">Everything you need to run ads</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {FEATURES.map(([t, d]) => (
            <div key={t} className="panel p-6">
              <h3 className="font-bold text-ink">{t}</h3>
              <p className="mt-1 text-sm text-ink-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12 panel bg-amethyst-fluid p-8 text-center sm:p-12">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Launch your first campaign today
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          No minimums. No contracts. Pause or change anything, anytime.
        </p>
        <Link href="/advertise/dashboard" className="btn-amethyst mt-5 inline-flex !px-7 !py-3 text-base">
          Open Ads Manager
        </Link>
      </section>
    </div>
  );
}
