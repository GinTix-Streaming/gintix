import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { publicEnv, serverEnv } from "@/lib/env";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanRequest = { plan: "premium_ad_free" | "creator_multistream_saas" };

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session for the premium ad-free pass or the
 * $29/mo multistream SaaS. Stamps user_id into subscription metadata so the
 * webhook can resolve the account without a prior customer mapping.
 */
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Not authenticated", 401);

  let body: PlanRequest;
  try {
    body = (await req.json()) as PlanRequest;
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const priceId =
    body.plan === "premium_ad_free"
      ? serverEnv.stripePricePremium
      : body.plan === "creator_multistream_saas"
        ? serverEnv.stripePriceMultistream
        : null;

  if (!priceId) return fail("Unknown plan", 400);

  // Reuse an existing Stripe customer id if we have one.
  const admin = createSupabaseAdminClient();
  const { data: ledger } = await admin
    .from("billing_ledger")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .maybeSingle();

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: ledger?.stripe_customer_id ?? undefined,
      customer_email: ledger?.stripe_customer_id ? undefined : user.email,
      client_reference_id: user.id,
      subscription_data: { metadata: { user_id: user.id, plan: body.plan } },
      success_url: `${publicEnv.siteUrl}/account?checkout=success`,
      cancel_url: `${publicEnv.siteUrl}/account?checkout=cancelled`,
    });

    return ok({ checkoutUrl: session.url });
  } catch (e) {
    return fail("Failed to create checkout session", 502, e);
  }
}
