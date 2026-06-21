import { getAdvertiserContext, getCampaignMetrics } from "@/lib/advertiser";
import BillingPanel from "@/components/advertiser/BillingPanel";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function BillingPage() {
  const ctx = await getAdvertiserContext();
  if (ctx.status !== "ok") return null;
  const metrics = await getCampaignMetrics(ctx.advertiser.id);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold text-ink">Billing</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Balance</p>
          <p className="mt-1 text-3xl font-extrabold text-ink">{money(ctx.advertiser.balance_cents)}</p>
          <div className="mt-4">
            <BillingPanel advertiserId={ctx.advertiser.id} balanceCents={ctx.advertiser.balance_cents} />
          </div>
        </section>

        <section className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Lifetime spend</p>
          <p className="mt-1 text-3xl font-extrabold text-ink">{money(metrics.total.spendCents)}</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-white/5 py-1.5">
              <span className="text-ink-muted">Impressions</span>
              <span className="text-ink">{metrics.total.impressions.toLocaleString("en-US")}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-1.5">
              <span className="text-ink-muted">Clicks</span>
              <span className="text-ink">{metrics.total.clicks.toLocaleString("en-US")}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-ink-muted">Average CTR</span>
              <span className="text-ink">{metrics.total.ctr.toFixed(2)}%</span>
            </div>
          </div>
        </section>
      </div>

      <section className="panel p-6 text-sm text-ink-muted">
        Spend is calculated as impressions × your campaign CPM bid ÷ 1,000. Invoices and
        automatic card billing activate once Stripe is connected.
      </section>
    </div>
  );
}
