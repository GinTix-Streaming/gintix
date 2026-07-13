import { getCreatorContext } from "@/lib/creator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AuctionManager, { type Lot } from "@/components/creator/AuctionManager";

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
          You keep 100% of the hammer price.
        </p>
      </div>
      <AuctionManager creatorId={ctx.profile.id} initial={(lots ?? []) as Lot[]} />
    </div>
  );
}
