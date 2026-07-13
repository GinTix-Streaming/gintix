import { getCreatorContext } from "@/lib/creator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AuctionManager, { type Lot } from "@/components/creator/AuctionManager";
import { AUCTION_CREATOR_PCT, AUCTION_FEE_PCT, WHATNOT_FEE_PCT } from "@/lib/fees";

export const dynamic = "force-dynamic";

export default async function AuctionsPage() {
  const ctx = await getCreatorContext();
  if (ctx.status !== "ok") return null;

  const supabase = createSupabaseServerClient();
  const { data: lots } = await supabase
    .from("auction_lots")
    .select("*")
    .eq("creator_id", ctx.profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Live auctions</h1>
        <p className="text-sm text-ink-muted">
          Run auctions live on stream — proxy bidding, hidden reserves and anti-snipe are built in.
          You keep{" "}
          <span className="font-semibold text-amethyst-soft">{AUCTION_CREATOR_PCT}%</span> of the
          hammer price. GinTix takes {AUCTION_FEE_PCT}% — Whatnot takes {WHATNOT_FEE_PCT}%.
        </p>
      </div>
      <AuctionManager creatorId={ctx.profile.id} initial={(lots ?? []) as Lot[]} />
    </div>
  );
}
