import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export const metadata = { title: "Buyer Protection — GinTix" };

export default function BuyerProtectionPage() {
  return (
    <PageShell
      title="GinTix Buyer Protection"
      subtitle="If what arrives isn't what you won, you get your money back. In writing, with a clock on it."
    >
      <section className="rounded-2xl border border-amethyst/25 bg-amethyst/[0.06] p-6">
        <h2 className="text-lg font-bold text-ink">The promise</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Every item you win on GinTix is covered for <strong className="text-ink">30 days</strong>{" "}
          from the moment the hammer falls. If the item never arrives, arrives damaged, is
          materially not as described, or turns out to be counterfeit, you are entitled to a full
          refund of the price you paid.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink">What&apos;s covered</h2>
        <div className="space-y-3">
          <Item
            title="It never arrived"
            body="The seller has 5 days to ship. If tracking never moves, or the package doesn't reach you, you're covered."
          />
          <Item
            title="Not as described"
            body="Wrong item, wrong grade, undisclosed flaws, missing parts — if it materially differs from what was shown or said on stream, you're covered. Auction lots are recorded, so what the seller claimed is not a matter of opinion."
          />
          <Item
            title="Damaged in transit"
            body="Poor packing is the seller's responsibility, not yours."
          />
          <Item
            title="Counterfeit or inauthentic"
            body="Anything represented as authentic that isn't. We take these seriously and repeat offenders are removed from the platform."
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink">What&apos;s not covered</h2>
        <p className="text-sm leading-relaxed text-ink-muted">
          Buyer&apos;s remorse. Winning an auction is a binding commitment to buy — that&apos;s what
          makes the format work for sellers. Cover also doesn&apos;t extend to flaws that were
          clearly disclosed before you bid, damage you cause after delivery, or claims filed after
          the 30-day window closes. Arranging payment or delivery outside GinTix voids protection
          entirely: if it didn&apos;t happen on the platform, we can&apos;t verify it or refund it.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink">How a claim actually works</h2>
        <ol className="space-y-3 text-sm leading-relaxed text-ink-muted">
          <li>
            <strong className="text-ink">1. You file.</strong> Open{" "}
            <Link href="/orders" className="text-amethyst-soft hover:underline">
              Your orders
            </Link>
            , hit &ldquo;Report a problem&rdquo;, pick a reason and tell us what happened. Photos help.
          </li>
          <li>
            <strong className="text-ink">2. The seller responds.</strong> They get 3 days. Most
            problems are honest mistakes and get sorted here.
          </li>
          <li>
            <strong className="text-ink">3. We decide.</strong> If it isn&apos;t resolved, GinTix
            reviews the order, the tracking, the stream recording and both accounts, and makes a
            call within 5 business days. We tell you why.
          </li>
          <li>
            <strong className="text-ink">4. You get paid back.</strong> Approved refunds return to
            your original payment method.
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-white/8 bg-surface p-6">
        <h2 className="text-lg font-bold text-ink">Why we can promise this</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Because we hold the record. The bid, the price, the seller&apos;s shipping deadline and
          the tracking number all live in one system, and the auction happened on a stream we host.
          There is very little to argue about. Sellers know their on-time shipping rate and rating
          are public, which does most of the work before a dispute ever exists.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Sellers: this protects you too. A public track record is the thing that lets an unknown
          seller be trusted with a $2,000 lot.
        </p>
      </section>

      <p className="text-center text-xs text-ink-muted">
        Buyer Protection is a GinTix policy, not an insurance product, and is subject to our{" "}
        <Link href="/terms" className="text-amethyst-soft hover:underline">
          Terms
        </Link>
        . Refund handling activates when payments go live.
      </p>
    </PageShell>
  );
}

function Item({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-surface p-4">
      <p className="flex items-center gap-2 font-semibold text-ink">
        <span className="text-green-400">✓</span> {title}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}
