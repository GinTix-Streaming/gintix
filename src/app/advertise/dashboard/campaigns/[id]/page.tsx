import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdvertiserContext, getCampaignMetrics, type Campaign, type Creative } from "@/lib/advertiser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CampaignControls from "@/components/advertiser/CampaignControls";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const ctx = await getAdvertiserContext();
  if (ctx.status !== "ok") return null;

  const supabase = createSupabaseServerClient();
  const { data: campaign } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("id", params.id)
    .eq("advertiser_id", ctx.advertiser.id)
    .maybeSingle();

  if (!campaign) notFound();
  const c = campaign as Campaign;

  const [{ data: creatives }, metrics] = await Promise.all([
    supabase.from("ad_creatives").select("*").eq("campaign_id", c.id),
    getCampaignMetrics(ctx.advertiser.id),
  ]);
  const m = metrics.byCampaign[c.id] ?? { impressions: 0, clicks: 0, spendCents: 0, ctr: 0 };
  const creativeList = (creatives ?? []) as Creative[];

  const targeting = [
    ["Categories", c.target_categories],
    ["Geography", c.target_geos],
    ["Devices", c.target_devices],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/advertise/dashboard/campaigns" className="text-sm text-amethyst-soft hover:underline">
            ← Campaigns
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-extrabold text-ink">
            {c.name}
            <span className="rounded-md bg-white/8 px-2 py-0.5 text-xs font-semibold capitalize text-ink-muted">{c.status}</span>
            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${(c.review_status ?? "approved") === "approved" ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"}`}>
              {(c.review_status ?? "approved") === "approved" ? "✓ Approved" : "In review"}
            </span>
          </h1>
          <p className="text-sm capitalize text-ink-muted">{c.objective} objective</p>
        </div>
        <CampaignControls campaignId={c.id} status={c.status} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Spend", money(m.spendCents)],
          ["Impressions", m.impressions.toLocaleString("en-US")],
          ["Clicks", m.clicks.toLocaleString("en-US")],
          ["CTR", `${m.ctr.toFixed(2)}%`],
        ].map(([label, value]) => (
          <div key={label} className="panel px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Budget & schedule */}
        <section className="panel p-6">
          <h2 className="text-base font-bold text-ink">Budget &amp; schedule</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Daily budget", c.daily_budget_cents ? money(c.daily_budget_cents) : "—"],
              ["Total budget", c.total_budget_cents ? money(c.total_budget_cents) : "—"],
              ["Bid (CPM)", money(c.bid_cpm_cents)],
              ["Start", c.start_date ?? "Immediately"],
              ["End", c.end_date ?? "No end date"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/5 py-1.5 last:border-0">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Targeting */}
        <section className="panel p-6">
          <h2 className="text-base font-bold text-ink">Targeting</h2>
          <div className="mt-3 space-y-3 text-sm">
            {targeting.map(([label, vals]) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
                {vals.length ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {vals.map((v) => (
                      <span key={v} className="chip">{v}</span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-0.5 text-ink">All</p>
                )}
              </div>
            ))}
            <p className="text-xs text-ink-muted">Premium (ad-free) viewers excluded.</p>
          </div>
        </section>
      </div>

      {/* Creatives */}
      <section className="panel p-6">
        <h2 className="text-base font-bold text-ink">Ad creative</h2>
        {creativeList.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No creative attached. Add one to start serving.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {creativeList.map((cr) => (
              <div key={cr.id} className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]">
                <div className="relative aspect-video bg-obsidian">
                  {cr.media_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cr.media_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                  ) : (
                    <div className="absolute inset-0 bg-amethyst-fluid" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <span className="absolute left-3 top-3 rounded bg-yellow-400/90 px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">Ad</span>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-sm font-extrabold text-white">{cr.headline}</p>
                    {cr.body && <p className="mt-0.5 text-xs text-white/75">{cr.body}</p>}
                    <span className="btn-amethyst mt-2 inline-flex !px-3 !py-1 text-xs">{cr.cta_label} →</span>
                  </div>
                </div>
                <div className="p-3 text-xs text-ink-muted">
                  → <span className="font-mono">{cr.click_url}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
