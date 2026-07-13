import Link from "next/link";
import { getCreatorContext, isCreatorVerified } from "@/lib/creator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AUCTION_CREATOR_PCT,
  AUCTION_FEE_PCT,
  WHATNOT_FEE_PCT,
  auctionNetCents,
} from "@/lib/fees";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function RevenuePage() {
  const ctx = await getCreatorContext();
  if (ctx.status !== "ok" || !ctx.stream) return null;
  const { stream } = ctx;
  const verified = isCreatorVerified(stream);

  if (!verified) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-extrabold text-ink">Revenue dashboard</h1>
        <div className="panel flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-300">Payments not activated</p>
              <p className="text-sm text-ink-muted">
                Complete the creator achievements to unlock subscriptions and payouts.
              </p>
            </div>
          </div>
          <Link href="/go-live/achievements" className="btn-amethyst shrink-0">
            Go to Achievements
          </Link>
        </div>

        <section className="panel p-6">
          <h2 className="text-base font-bold text-ink">How creators earn on GinTix</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Unlike every competitor, you keep <span className="font-semibold text-amethyst-soft">100%</span> of
            subscriptions and fan funding. GinTix never takes a cut of your direct supporter revenue.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            <li>• <span className="text-ink">Subscriptions</span> — 100% to you</li>
            <li>• <span className="text-ink">Fan funding / tips</span> — 100% to you</li>
            <li>
              • <span className="text-ink">Live auctions</span> — you keep {AUCTION_CREATOR_PCT}%.
              GinTix takes {AUCTION_FEE_PCT}%; Whatnot takes {WHATNOT_FEE_PCT}%.
            </li>
            <li>• <span className="text-ink">In-stream commerce</span> — you keep the sale; GinTix charges only a small checkout fee</li>
          </ul>
        </section>
      </div>
    );
  }

  // Verified: demo earnings derived from sub_count.
  const subCents = stream.sub_count * 499; // $4.99/sub, 100% to creator
  const fundingCents = Math.round(subCents * 0.4);
  const commerceCents = stream.sub_count * 220;

  // Real auction earnings — net of the 5% fee, straight from settled lots.
  const supabase = createSupabaseServerClient();
  const { data: soldLots } = await supabase
    .from("auction_lots")
    .select("sold_price_cents, creator_net_cents")
    .eq("creator_id", ctx.profile.id)
    .eq("status", "sold");

  const auctionGross = (soldLots ?? []).reduce((s, l) => s + (l.sold_price_cents ?? 0), 0);
  const auctionNet = (soldLots ?? []).reduce(
    (s, l) => s + (l.creator_net_cents ?? auctionNetCents(l.sold_price_cents ?? 0)),
    0
  );
  const auctionCount = (soldLots ?? []).length;

  const total = subCents + fundingCents + commerceCents + auctionNet;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Revenue dashboard</h1>
        <p className="text-sm text-ink-muted">Estimated this month · you keep 100% of subs &amp; funding.</p>
      </div>

      <div className="panel bg-amethyst-fluid p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Estimated payout</p>
        <p className="mt-1 text-4xl font-extrabold text-ink">{money(total)}</p>
        <p className="mt-1 text-sm text-amethyst-soft">Next payout on the 1st · Stripe Connect</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Subscriptions", subCents, `${stream.sub_count} active`],
          ["Fan funding", fundingCents, "Tips & cheers"],
          ["Commerce", commerceCents, "In-stream sales"],
          ["Live auctions", auctionNet, `${auctionCount} lot${auctionCount === 1 ? "" : "s"} sold · net of ${AUCTION_FEE_PCT}%`],
        ].map(([label, cents, sub]) => (
          <div key={label as string} className="panel p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-ink">{money(cents as number)}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>
          </div>
        ))}
      </div>

      {auctionCount > 0 && (
        <section className="panel p-6">
          <h2 className="text-base font-bold text-ink">Auction payout breakdown</h2>
          <div className="mt-4 space-y-2 text-sm">
            <Row label={`Hammer total (${auctionCount} lots)`} value={money(auctionGross)} />
            <Row
              label={`GinTix fee (${AUCTION_FEE_PCT}%)`}
              value={"−" + money(auctionGross - auctionNet)}
              muted
            />
            <div className="flex items-center justify-between border-t border-white/8 pt-2">
              <span className="font-semibold text-ink">Your payout ({AUCTION_CREATOR_PCT}%)</span>
              <span className="text-lg font-extrabold text-green-400">{money(auctionNet)}</span>
            </div>
            <p className="pt-1 text-xs text-ink-muted">
              The same lots on Whatnot ({WHATNOT_FEE_PCT}%) would have paid you{" "}
              {money(auctionGross - Math.round((auctionGross * WHATNOT_FEE_PCT) / 100))} — you kept{" "}
              <span className="font-semibold text-green-400">
                {money(auctionNet - (auctionGross - Math.round((auctionGross * WHATNOT_FEE_PCT) / 100)))}
              </span>{" "}
              more on GinTix.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={muted ? "text-ink-muted" : "font-semibold text-ink"}>{value}</span>
    </div>
  );
}
