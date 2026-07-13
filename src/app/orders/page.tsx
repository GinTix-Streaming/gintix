import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OrderList, { type Order } from "@/components/OrderList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your orders — GinTix" };

export default async function OrdersPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/orders");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Your orders</h1>
        <p className="text-sm text-ink-muted">
          Every win is protected for 30 days.{" "}
          <Link href="/buyer-protection" className="text-amethyst-soft hover:underline">
            How buyer protection works →
          </Link>
        </p>
      </div>

      <OrderList orders={(orders ?? []) as Order[]} viewerId={user.id} role="buyer" />
    </div>
  );
}
