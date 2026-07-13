import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export const metadata = { title: "Auction Rules — GinTix" };

export default function AuctionRulesPage() {
  return (
    <PageShell
      title="Auction rules"
      subtitle="How bidding works, what you may sell, and what you're on the hook for. Read this before your first lot."
    >
      <Section heading="1. A bid is a contract">
        <p>
          When you place a bid you are making a binding offer to buy at that price. If you are the
          high bidder when the clock stops, the item is yours and you are obliged to pay. Retracting
          bids, refusing to pay, or bidding with no intention of paying will get your account
          suspended. This is not decoration — it is the only reason sellers can trust the format.
        </p>
      </Section>

      <Section heading="2. How the clock works">
        <p>
          Each lot runs for a timer the seller sets. Any bid placed in the final 15 seconds pushes
          the clock back out to 15 seconds. This repeats for as long as people keep bidding, so a
          lot cannot be won by sniping it at the buzzer — it ends when the bidding genuinely stops.
        </p>
      </Section>

      <Section heading="3. Proxy bidding and your maximum">
        <p>
          You may set a hidden maximum. GinTix will bid on your behalf only the minimum needed to
          keep you in front, up to that maximum. Your maximum is never shown to the seller, to other
          bidders, or in any public data we expose. If two bidders set the same maximum, the one who
          set it first wins.
        </p>
      </Section>

      <Section heading="4. Reserves and Buy It Now">
        <p>
          A seller may set a hidden reserve. If bidding ends below it, the lot does not sell and
          nobody is charged — including no seller fee. A seller may also set a Buy It Now price,
          which ends the auction immediately at that price.
        </p>
      </Section>

      <Section heading="5. Shill bidding is banned">
        <p>
          Sellers may not bid on their own lots (the platform blocks this outright), nor may they
          direct anyone else to inflate their prices. Accounts found bidding in coordination with a
          seller are permanently removed and the seller forfeits proceeds. We can see bid histories
          across accounts; do not test this.
        </p>
      </Section>

      <Section heading="6. Seller obligations">
        <p>
          You must own what you sell and describe it accurately, including flaws. You must ship
          within <strong className="text-ink">5 days</strong> of the sale with tracking, and pack it
          well enough to survive transit. Your on-time shipping rate and buyer rating are public.
          Failing to ship is the fastest way off this platform.
        </p>
      </Section>

      <Section heading="7. Prohibited items">
        <p>
          You may not list: weapons, ammunition or their components; drugs, controlled substances,
          tobacco, vapes or alcohol; counterfeit or replica goods; stolen property; human remains or
          body parts; live animals; hazardous materials; prescription medicines or medical devices;
          government IDs, documents or licences; hacked accounts, keys, or digital access; adult or
          sexual content; items that infringe someone else&apos;s intellectual property; or anything
          illegal to sell where you or the buyer are located.
        </p>
        <p>
          Sealed &ldquo;mystery&rdquo; boxes and blind repacks are permitted only where the odds and
          contents are disclosed, and never where they function as gambling. Purchase-based prize
          draws and giveaways contingent on spending are prohibited.
        </p>
      </Section>

      <Section heading="8. Payments, taxes and identity">
        <p>
          Sellers are paid the hammer price less the 5% GinTix seller fee; payment processing is
          charged separately. Sellers are responsible for their own income taxes and for any sales
          tax, VAT, customs or import duty obligations that apply to their sales. Sellers above
          thresholds set by law may be required to complete identity verification (KYC) before
          receiving payouts.
        </p>
      </Section>

      <Section heading="9. Intellectual property">
        <p>
          Do not stream content you have no right to broadcast, and do not sell goods that infringe
          another party&apos;s trademark or copyright. Rights holders may submit takedown notices to{" "}
          <span className="text-ink">legal@gintix.com</span>; repeat infringers are terminated.
        </p>
      </Section>

      <Section heading="10. Enforcement">
        <p>
          We may cancel a lot, void a sale, withhold a payout, or suspend an account where we
          reasonably believe these rules have been broken. Where we get it wrong, tell us and we
          will look again.
        </p>
      </Section>

      <p className="text-center text-xs text-ink-muted">
        These rules form part of our{" "}
        <Link href="/terms" className="text-amethyst-soft hover:underline">
          Terms of Service
        </Link>
        . See also{" "}
        <Link href="/buyer-protection" className="text-amethyst-soft hover:underline">
          Buyer Protection
        </Link>
        .
      </p>
    </PageShell>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-surface p-6">
      <h2 className="text-base font-bold text-ink">{heading}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}
