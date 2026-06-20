import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export const metadata = { title: "Pricing — GinTix" };

const TIERS = [
  {
    name: "Viewer",
    price: "Free",
    cadence: "",
    desc: "Watch any creator, chat, and follow.",
    cta: "Create account",
    href: "/login?mode=signup",
    featured: false,
    features: ["Unlimited watching", "Live chat & follows", "Supported by ads"],
  },
  {
    name: "Premium Pass",
    price: "$8",
    cadence: "/mo",
    desc: "The best way to watch — zero ads.",
    cta: "Go ad-free",
    href: "/login?mode=signup",
    featured: true,
    features: ["Everything in Viewer", "Ad-free across all channels", "Priority chat badge", "Support creators directly"],
  },
  {
    name: "Creator Multi-stream",
    price: "$29",
    cadence: "/mo",
    desc: "Broadcast everywhere at once.",
    cta: "Become a creator",
    href: "/go-live",
    featured: false,
    features: ["Keep 100% of subs & funding", "Multi-stream: Twitch, YouTube, TikTok, Kick", "In-player live commerce", "One-click go-live"],
  },
];

export default function PricingPage() {
  return (
    <PageShell
      title="Simple, creator-first pricing"
      subtitle="Creators keep 100% of subs and fan funding. We monetize the platform — never your community."
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-2xl border p-6 ${
              t.featured
                ? "border-amethyst/60 bg-amethyst/5 shadow-glow-sm"
                : "border-white/8 bg-surface"
            }`}
          >
            {t.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amethyst-grad px-3 py-1 text-xs font-bold text-white">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-bold text-ink">{t.name}</h3>
            <p className="mt-1 text-sm text-ink-muted">{t.desc}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-ink">{t.price}</span>
              <span className="text-sm text-ink-muted">{t.cadence}</span>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-ink">
                  <span className="mt-0.5 text-amethyst-glow">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={t.href}
              className={`mt-6 inline-flex w-full justify-center ${t.featured ? "btn-amethyst" : "btn-ghost"}`}
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-ink-muted">
        Live-commerce sales include a small platform rail fee. No setup fees, cancel anytime.
      </p>
    </PageShell>
  );
}
