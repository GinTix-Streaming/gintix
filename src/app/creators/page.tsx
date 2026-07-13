import Link from "next/link";
import { PageShell, Section } from "@/components/PageShell";

export const metadata = { title: "For Sellers — GinTix" };

const PERKS = [
  ["Keep 95% of every sale", "GinTix takes 5%. Whatnot takes 8%. On a $1,000 lot that's $30 back in your pocket, every time."],
  ["Keep 100% of subs & tips", "No platform cut on fan funding. Ever."],
  ["Proxy bidding, built in", "Bidders set a hidden max and the engine bids for them — prices climb without anyone hammering a button."],
  ["Anti-snipe timers", "Any bid in the last 15 seconds extends the clock. Your lots end when bidding stops, not when the timer runs out."],
  ["Hidden reserves & Buy It Now", "Set a floor nobody can see. Miss it and the lot doesn't sell — and you pay no fee."],
  ["Open to everyone, day one", "No waitlist, no 'sponsored sellers only'. Create an account and run an auction tonight."],
];

export default function CreatorsPage() {
  return (
    <PageShell
      title="Sell live. Keep 95%."
      subtitle="Real auctions, a real bid engine, and a fee that doesn't punish you for succeeding."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PERKS.map(([t, d]) => (
          <div key={t} className="panel p-5">
            <h3 className="font-bold text-ink">{t}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{d}</p>
          </div>
        ))}
      </div>

      {/* The number that moves sellers. */}
      <section className="rounded-2xl border border-green-500/20 bg-green-500/[0.06] p-6">
        <h2 className="text-lg font-bold text-ink">What the 3% actually means</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/8 text-xs uppercase tracking-wide text-ink-muted">
                <th className="pb-2 font-semibold">You sell</th>
                <th className="pb-2 font-semibold">Whatnot (8%)</th>
                <th className="pb-2 font-semibold">GinTix (5%)</th>
                <th className="pb-2 font-semibold">You keep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ["$1,000", "$920", "$950", "+$30"],
                ["$10,000", "$9,200", "$9,500", "+$300"],
                ["$100,000", "$92,000", "$95,000", "+$3,000"],
              ].map(([gmv, wn, gt, diff]) => (
                <tr key={gmv}>
                  <td className="py-3 font-medium text-ink">{gmv}</td>
                  <td className="py-3 text-ink-muted">{wn}</td>
                  <td className="py-3 text-ink">{gt}</td>
                  <td className="py-3 font-bold text-green-400">{diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Payment processing is billed separately at cost, on both platforms.
        </p>
      </section>

      <Section heading="Your buyers are protected — which is why they bid higher">
        <p>
          Every sale carries a 5-day shipping clock and 30 days of buyer protection. Your on-time
          shipping rate and rating are public. That track record is what lets an unknown seller be
          trusted with a $2,000 lot — it works for you, not against you.
        </p>
        <Link href="/buyer-protection" className="text-amethyst-soft hover:underline">
          Read the buyer protection policy →
        </Link>
      </Section>

      <Section heading="Ready to start?">
        <p>Create a free account and you can have a lot on the block tonight.</p>
        <Link href="/login?mode=signup" className="btn-amethyst mt-1 inline-flex">
          Start selling live
        </Link>
      </Section>
    </PageShell>
  );
}
