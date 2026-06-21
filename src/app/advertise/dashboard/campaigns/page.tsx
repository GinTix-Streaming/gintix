import Link from "next/link";
import { getAdvertiserContext, getCampaignMetrics, type Campaign } from "@/lib/advertiser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-500/15 text-green-300",
  paused: "bg-yellow-500/15 text-yellow-300",
  draft: "bg-white/10 text-ink-muted",
  ended: "bg-white/10 text-ink-muted",
};

export default async function CampaignsPage() {
  const ctx = await getAdvertiserContext();
  if (ctx.status !== "ok") return null;

  const supabase = createSupabaseServerClient();
  const [{ data: campaigns }, metrics] = await Promise.all([
    supabase.from("ad_campaigns").select("*").eq("advertiser_id", ctx.advertiser.id).order("created_at", { ascending: false }),
    getCampaignMetrics(ctx.advertiser.id),
  ]);
  const list = (campaigns ?? []) as Campaign[];

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <h1 className="font-bold text-ink">Campaigns</h1>
        <Link href="/advertise/dashboard/campaigns/new" className="btn-amethyst !py-2 text-sm">+ New campaign</Link>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-2xl">📣</div>
          <p className="mt-3 font-semibold text-ink">No campaigns yet</p>
          <Link href="/advertise/dashboard/campaigns/new" className="btn-amethyst mt-4">Create campaign</Link>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr className="border-b border-white/5">
              <th className="px-5 py-3 font-semibold">Campaign</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Budget</th>
              <th className="px-5 py-3 font-semibold">Impr.</th>
              <th className="px-5 py-3 font-semibold">Clicks</th>
              <th className="px-5 py-3 font-semibold">Spend</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => {
              const m = metrics.byCampaign[c.id] ?? { impressions: 0, clicks: 0, spendCents: 0, ctr: 0 };
              return (
                <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <Link href={`/advertise/dashboard/campaigns/${c.id}`} className="font-semibold text-ink hover:text-amethyst-glow">
                      {c.name}
                    </Link>
                    <p className="text-xs capitalize text-ink-muted">{c.objective}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[c.status] ?? STATUS_STYLE.draft}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{c.total_budget_cents ? money(c.total_budget_cents) : "—"}</td>
                  <td className="px-5 py-3 text-ink-muted">{m.impressions.toLocaleString("en-US")}</td>
                  <td className="px-5 py-3 text-ink-muted">{m.clicks.toLocaleString("en-US")}</td>
                  <td className="px-5 py-3 text-ink-muted">{money(m.spendCents)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
