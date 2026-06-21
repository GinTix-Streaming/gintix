"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AD_CATEGORIES, AD_GEOS, AD_DEVICES, AD_OBJECTIVES } from "@/lib/ad-constants";

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              on
                ? "border-amethyst bg-amethyst/20 text-amethyst-soft"
                : "border-white/10 bg-white/[0.03] text-ink-muted hover:text-ink"
            }`}
          >
            {on ? "✓ " : ""}
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function CampaignBuilder({ advertiserId }: { advertiserId: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // Details
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("awareness");
  // Budget & schedule
  const [dailyBudget, setDailyBudget] = useState("25");
  const [totalBudget, setTotalBudget] = useState("500");
  const [bidCpm, setBidCpm] = useState("5.00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Targeting
  const [categories, setCategories] = useState<string[]>([]);
  const [geos, setGeos] = useState<string[]>([]);
  const [devices, setDevices] = useState<string[]>([]);
  // Creative
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Learn more");
  const [clickUrl, setClickUrl] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggle(list: string[], set: (v: string[]) => void, v: string) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function submit(status: "draft" | "active") {
    setErr(null);
    if (!name.trim()) return setErr("Give your campaign a name.");
    if (status === "active") {
      if (!headline.trim()) return setErr("Add a headline for your ad.");
      if (!clickUrl.trim()) return setErr("Add a click-through URL.");
    }
    setBusy(true);

    const { data: campaign, error: cErr } = await supabase
      .from("ad_campaigns")
      .insert({
        advertiser_id: advertiserId,
        name: name.trim(),
        objective,
        status,
        daily_budget_cents: Math.round((parseFloat(dailyBudget) || 0) * 100),
        total_budget_cents: Math.round((parseFloat(totalBudget) || 0) * 100),
        bid_cpm_cents: Math.round((parseFloat(bidCpm) || 0) * 100),
        start_date: startDate || null,
        end_date: endDate || null,
        target_categories: categories,
        target_geos: geos,
        target_devices: devices,
        exclude_premium: true,
      })
      .select("id")
      .single();

    if (cErr || !campaign) {
      setBusy(false);
      return setErr(cErr?.message ?? "Could not create campaign.");
    }

    // Creative (only required when launching; saved if provided on draft).
    if (headline.trim() && clickUrl.trim()) {
      await supabase.from("ad_creatives").insert({
        campaign_id: campaign.id,
        advertiser_id: advertiserId,
        headline: headline.trim(),
        body: body.trim() || null,
        media_url: mediaUrl.trim() || null,
        cta_label: ctaLabel.trim() || "Learn more",
        click_url: clickUrl.trim(),
        format: "preroll",
      });
    }

    setBusy(false);
    router.push(`/advertise/dashboard/campaigns/${campaign.id}`);
    router.refresh();
  }

  const est = Math.round(((parseFloat(totalBudget) || 0) / (parseFloat(bidCpm) || 1)) * 1000);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        {/* Details */}
        <section className="panel p-6">
          <h2 className="text-base font-bold text-ink">Campaign details</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Campaign name</label>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer launch — Q3" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Objective</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {AD_OBJECTIVES.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setObjective(o.key)}
                    className={`rounded-xl border p-3 text-left transition ${
                      objective === o.key ? "border-amethyst bg-amethyst/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    <p className="text-sm font-semibold text-ink">{o.label}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Budget & schedule */}
        <section className="panel p-6">
          <h2 className="text-base font-bold text-ink">Budget &amp; schedule</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Daily budget (USD)" value={dailyBudget} set={setDailyBudget} prefix="$" />
            <Field label="Total budget (USD)" value={totalBudget} set={setTotalBudget} prefix="$" />
            <Field label="Bid (CPM, USD)" value={bidCpm} set={setBidCpm} prefix="$" />
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Start date</label>
              <input type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">End date</label>
              <input type="date" className="field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </section>

        {/* Targeting */}
        <section className="panel p-6">
          <h2 className="text-base font-bold text-ink">Targeting</h2>
          <p className="mt-0.5 text-sm text-ink-muted">Leave a group empty to target everyone. Premium (ad-free) viewers are always excluded.</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Categories</p>
              <Chips options={AD_CATEGORIES} selected={categories} onToggle={(v) => toggle(categories, setCategories, v)} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Geography</p>
              <Chips options={AD_GEOS} selected={geos} onToggle={(v) => toggle(geos, setGeos, v)} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Devices</p>
              <Chips options={AD_DEVICES} selected={devices} onToggle={(v) => toggle(devices, setDevices, v)} />
            </div>
          </div>
        </section>

        {/* Creative */}
        <section className="panel p-6">
          <h2 className="text-base font-bold text-ink">Ad creative</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Headline</label>
              <input className="field" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Try Acme free for 30 days" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Body (optional)</label>
              <input className="field" value={body} onChange={(e) => setBody(e.target.value)} placeholder="The fastest way to ship your product." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">CTA label</label>
                <input className="field" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Learn more" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Click-through URL</label>
                <input className="field font-mono text-xs" value={clickUrl} onChange={(e) => setClickUrl(e.target.value)} placeholder="https://acme.com/offer" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Media URL (image/video, optional)</label>
              <input className="field font-mono text-xs" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…/creative.jpg" />
            </div>
          </div>
        </section>

        {err && <p className="text-sm text-red-400">{err}</p>}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => submit("active")} disabled={busy} className="btn-amethyst !px-6 disabled:opacity-60">
            {busy ? "Working…" : "Launch campaign"}
          </button>
          <button onClick={() => submit("draft")} disabled={busy} className="btn-ghost disabled:opacity-60">
            Save as draft
          </button>
        </div>
      </div>

      {/* Live preview + summary */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="panel overflow-hidden">
          <div className="border-b border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Ad preview
          </div>
          <div className="relative aspect-video bg-obsidian">
            {mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
            ) : (
              <div className="absolute inset-0 bg-amethyst-fluid" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <span className="absolute left-3 top-3 rounded bg-yellow-400/90 px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">Ad</span>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-sm font-extrabold leading-tight text-white">{headline || "Your headline here"}</p>
              {body && <p className="mt-0.5 text-xs text-white/75">{body}</p>}
              <span className="btn-amethyst mt-2 inline-flex !px-3 !py-1 text-xs">{ctaLabel || "Learn more"} →</span>
            </div>
          </div>
        </div>

        <div className="panel p-4 text-sm">
          <p className="font-semibold text-ink">Estimated reach</p>
          <p className="mt-1 text-2xl font-extrabold text-amethyst-glow">{est.toLocaleString("en-US")}</p>
          <p className="text-xs text-ink-muted">impressions at your total budget &amp; bid</p>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  set,
  prefix,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  prefix?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</label>
      <div className="flex items-center gap-1.5 rounded-[10px] border border-white/10 bg-white/[0.04] px-3">
        {prefix && <span className="text-ink-muted">{prefix}</span>}
        <input
          className="w-full bg-transparent py-[11px] text-sm text-ink focus:outline-none"
          value={value}
          onChange={(e) => set(e.target.value)}
          inputMode="decimal"
        />
      </div>
    </div>
  );
}
