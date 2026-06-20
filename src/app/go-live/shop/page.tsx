import { getCreatorContext } from "@/lib/creator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductManager from "@/components/creator/ProductManager";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const ctx = await getCreatorContext();
  if (ctx.status !== "ok") return null;

  const supabase = createSupabaseServerClient();
  const { data: listings } = await supabase
    .from("commerce_listings")
    .select("id, title, image_url, price_cents, currency")
    .eq("creator_id", ctx.profile.id)
    .order("created_at", { ascending: true });

  return <ProductManager creatorId={ctx.profile.id} initial={listings ?? []} />;
}
