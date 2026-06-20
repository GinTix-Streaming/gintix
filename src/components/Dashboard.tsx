"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface StreamConfig {
  id: string;
  stream_key: string;
  playback_id: string | null;
  is_live: boolean;
  title: string | null;
  category: string | null;
  thumbnail_url: string | null;
  multistream_enabled: boolean;
  twitch_target_url: string | null;
  youtube_target_url: string | null;
  tiktok_target_url: string | null;
  kick_target_url: string | null;
}

interface Listing {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  currency: string;
}

interface Props {
  profile: { id: string; username: string; display_name: string | null };
  stream: StreamConfig | null;
  listings: Listing[];
}

const RTMP_INGEST = "rtmp://rtmp.livepeer.com/live";

function Card({ title, desc, children, badge }: { title: string; desc?: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">{title}</h2>
          {desc && <p className="mt-0.5 text-sm text-ink-muted">{desc}</p>}
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard({ profile, stream: initialStream, listings: initialListings }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [stream, setStream] = useState<StreamConfig | null>(initialStream);
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [busy, setBusy] = useState<string | null>(null);
  const [revealKey, setRevealKey] = useState(false);

  // channel details
  const [title, setTitle] = useState(initialStream?.title ?? "");
  const [category, setCategory] = useState(initialStream?.category ?? "");

  // multistream
  const [twitch, setTwitch] = useState(initialStream?.twitch_target_url ?? "");
  const [youtube, setYoutube] = useState(initialStream?.youtube_target_url ?? "");
  const [tiktok, setTiktok] = useState(initialStream?.tiktok_target_url ?? "");
  const [kick, setKick] = useState(initialStream?.kick_target_url ?? "");

  // new product
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pImg, setPImg] = useState("");

  async function createChannel() {
    setBusy("create");
    const key = "gtx_" + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);
    const { data, error } = await supabase
      .from("stream_configs")
      .insert({
        creator_id: profile.id,
        stream_key: key,
        playback_id: "demo:" + profile.username,
        title: "My first GinTix stream",
        category: "Just Chatting",
        thumbnail_url: `https://picsum.photos/seed/${profile.username}/640/360`,
        is_live: false,
      })
      .select()
      .single();
    setBusy(null);
    if (!error && data) {
      setStream(data as StreamConfig);
      setTitle(data.title ?? "");
      setCategory(data.category ?? "");
      router.refresh();
    }
  }

  async function toggleLive() {
    if (!stream) return;
    setBusy("live");
    const next = !stream.is_live;
    const { data } = await supabase
      .from("stream_configs")
      .update({ is_live: next, viewer_count: next ? Math.floor(Math.random() * 180) + 12 : 0 })
      .eq("id", stream.id)
      .select()
      .single();
    setBusy(null);
    if (data) { setStream(data as StreamConfig); router.refresh(); }
  }

  async function saveDetails() {
    if (!stream) return;
    setBusy("details");
    const { data } = await supabase
      .from("stream_configs")
      .update({ title, category })
      .eq("id", stream.id)
      .select()
      .single();
    setBusy(null);
    if (data) setStream(data as StreamConfig);
  }

  async function saveMultistream() {
    if (!stream) return;
    setBusy("multi");
    const enabled = !!(twitch || youtube || tiktok || kick);
    const { data } = await supabase
      .from("stream_configs")
      .update({
        twitch_target_url: twitch || null,
        youtube_target_url: youtube || null,
        tiktok_target_url: tiktok || null,
        kick_target_url: kick || null,
        multistream_enabled: enabled,
      })
      .eq("id", stream.id)
      .select()
      .single();
    setBusy(null);
    if (data) setStream(data as StreamConfig);
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(pPrice) * 100);
    if (!pName || isNaN(cents) || cents < 0) return;
    setBusy("product");
    const { data } = await supabase
      .from("commerce_listings")
      .insert({
        creator_id: profile.id,
        title: pName,
        price_cents: cents,
        currency: "usd",
        image_url: pImg || `https://picsum.photos/seed/${encodeURIComponent(pName)}/600/400`,
        is_active: true,
      })
      .select()
      .single();
    setBusy(null);
    if (data) {
      setListings((l) => [...l, data as Listing]);
      setPName(""); setPPrice(""); setPImg("");
    }
  }

  async function removeProduct(id: string) {
    setBusy("rm-" + id);
    await supabase.from("commerce_listings").delete().eq("id", id);
    setBusy(null);
    setListings((l) => l.filter((x) => x.id !== id));
  }

  // ── No channel yet ──
  if (!stream) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-extrabold text-ink">Creator dashboard</h1>
        <div className="panel mt-6 p-8 text-center">
          <h2 className="text-lg font-bold text-ink">Set up your channel</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            One click creates your channel page at{" "}
            <span className="text-amethyst-soft">gintix.vercel.app/{profile.username}</span>,
            generates your secure stream key, and unlocks multi-stream + in-stream selling.
          </p>
          <button onClick={createChannel} disabled={busy === "create"} className="btn-amethyst mx-auto mt-5 disabled:opacity-60">
            {busy === "create" ? "Creating…" : "Create my channel"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Creator dashboard</h1>
          <Link href={`/${profile.username}`} className="text-sm text-amethyst-soft hover:underline">
            View your channel →
          </Link>
        </div>
        <button
          onClick={toggleLive}
          disabled={busy === "live"}
          className={stream.is_live ? "btn-ghost" : "btn-amethyst"}
        >
          {busy === "live" ? "…" : stream.is_live ? "■ End stream" : "● Go live"}
        </button>
      </div>

      <div className="space-y-5">
        <Card
          title="Channel"
          desc="What viewers see on your stream."
          badge={
            <span className={`rounded-md px-2 py-1 text-xs font-bold uppercase ${stream.is_live ? "bg-red-600 text-white" : "bg-white/8 text-ink-muted"}`}>
              {stream.is_live ? "● Live" : "Offline"}
            </span>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Stream title</label>
              <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Late night ranked grind" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Category</label>
              <input className="field" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Just Chatting" />
            </div>
            <button onClick={saveDetails} disabled={busy === "details"} className="btn-ghost disabled:opacity-60">
              {busy === "details" ? "Saving…" : "Save details"}
            </button>
          </div>
        </Card>

        <Card title="Stream setup" desc="Paste these into OBS → Settings → Stream (Custom).">
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">RTMP ingest URL</label>
              <input className="field font-mono text-xs" readOnly value={RTMP_INGEST} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Stream key</label>
              <div className="flex items-center gap-2">
                <input className="field font-mono text-xs" readOnly value={revealKey ? stream.stream_key : "•".repeat(28)} />
                <button onClick={() => setRevealKey((r) => !r)} className="btn-ghost shrink-0 !px-3 !py-2 text-xs">
                  {revealKey ? "Hide" : "Show"}
                </button>
                <button onClick={() => navigator.clipboard?.writeText(stream.stream_key)} className="btn-ghost shrink-0 !px-3 !py-2 text-xs">
                  Copy
                </button>
              </div>
              <p className="mt-1.5 text-xs text-ink-muted">Keep this secret. Anyone with your key can stream to your channel.</p>
            </div>
          </div>
        </Card>

        <Card
          title="Multi-stream"
          desc="Go live on Twitch, YouTube & TikTok at the same time."
          badge={<span className="rounded-md bg-amethyst/15 px-2 py-1 text-xs font-bold text-amethyst-soft">$29/mo add-on</span>}
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Twitch RTMP URL</label>
              <input className="field font-mono text-xs" value={twitch} onChange={(e) => setTwitch(e.target.value)} placeholder="rtmp://live.twitch.tv/app/live_xxx" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">YouTube RTMP URL</label>
              <input className="field font-mono text-xs" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="rtmp://a.rtmp.youtube.com/live2/xxx" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">TikTok RTMP URL</label>
              <input className="field font-mono text-xs" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="rtmp://push.tiktok.com/live/xxx" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Kick RTMP URL</label>
              <input className="field font-mono text-xs" value={kick} onChange={(e) => setKick(e.target.value)} placeholder="rtmps://fa723fc1b171.global-contribute.live-video.net/app/xxx" />
            </div>
            <button onClick={saveMultistream} disabled={busy === "multi"} className="btn-amethyst disabled:opacity-60">
              {busy === "multi" ? "Saving…" : "Save targets"}
            </button>
            {stream.multistream_enabled && (
              <p className="text-xs text-amethyst-soft">
                ✓ Targets saved. Activation pushes to all platforms once your Multi-stream add-on is active.
              </p>
            )}
          </div>
        </Card>

        <Card title="In-stream shop" desc="Products appear in your player's shop drawer and on your channel.">
          <div className="space-y-3">
            {listings.length > 0 ? (
              <div className="space-y-2">
                {listings.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
                    {l.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{l.title}</p>
                      <p className="text-xs text-amethyst-soft">${(l.price_cents / 100).toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeProduct(l.id)} disabled={busy === "rm-" + l.id} className="text-xs text-ink-muted hover:text-red-400">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">No products yet. Add your first item below.</p>
            )}

            <form onSubmit={addProduct} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_auto]">
              <input className="field" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Product name" />
              <input className="field" value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="Price (USD)" inputMode="decimal" />
              <button type="submit" disabled={busy === "product"} className="btn-amethyst disabled:opacity-60">
                {busy === "product" ? "Adding…" : "Add product"}
              </button>
              <input className="field sm:col-span-3" value={pImg} onChange={(e) => setPImg(e.target.value)} placeholder="Image URL (optional)" />
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
