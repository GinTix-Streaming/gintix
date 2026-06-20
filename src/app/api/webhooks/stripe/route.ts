import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, planTierForPrice } from "@/lib/stripe";
import { serverEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BillingStatus, PlanTier } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Stripe signature verification needs the raw, unparsed body.
export const preferredRegion = "auto";

/**
 * POST /api/webhooks/stripe
 *
 * Source of truth sync from Stripe → billing_ledger + profile flags.
 * Handles:
 *   • customer.subscription.created / updated → grant access
 *   • customer.subscription.deleted          → revoke access
 *
 * Flag mapping:
 *   premium_ad_free            → profiles.is_premium_viewer = true
 *   creator_multistream_saas   → stream_configs.multistream_enabled stays
 *                                gated by the live entitlement check; we also
 *                                mark the ledger so /api/stream/multistream
 *                                passes its 402 gate.
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing stripe-signature", { status: 400 });

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      serverEnv.stripeWebhookSecret
    );
  } catch (err) {
    console.error("[gintix] Stripe signature verification failed", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(admin, event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await revokeSubscription(admin, event.data.object as Stripe.Subscription);
        break;
      default:
        // Acknowledge unhandled events so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error(`[gintix] Webhook handler error for ${event.type}`, err);
    // 500 → Stripe will retry with backoff.
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

type Admin = ReturnType<typeof createSupabaseAdminClient>;

/** Resolve our user_id from Stripe metadata (set at Checkout) or customer id. */
async function resolveUserId(
  admin: Admin,
  sub: Stripe.Subscription
): Promise<string | null> {
  const metaUserId = sub.metadata?.user_id;
  if (metaUserId) return metaUserId;

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const { data } = await admin
    .from("billing_ledger")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data?.user_id ?? null;
}

function mapStatus(s: Stripe.Subscription.Status): BillingStatus {
  switch (s) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "incomplete";
  }
}

async function syncSubscription(admin: Admin, sub: Stripe.Subscription) {
  const userId = await resolveUserId(admin, sub);
  if (!userId) {
    console.warn("[gintix] Could not resolve user for subscription", sub.id);
    return;
  }

  const priceId = sub.items.data[0]?.price?.id;
  const tier: PlanTier = planTierForPrice(priceId) ?? "free_tier";
  const status = mapStatus(sub.status);
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const active = status === "active" || status === "trialing";

  // Upsert the ledger keyed by the unique stripe_subscription_id.
  await admin.from("billing_ledger").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan_tier: tier,
      status,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );

  // Flip access flags based on the tier.
  if (tier === "premium_ad_free") {
    await admin
      .from("profiles")
      .update({ is_premium_viewer: active })
      .eq("id", userId);
  }

  if (tier === "creator_multistream_saas") {
    // If the SaaS lapses, also clear live multistream targets defensively.
    if (!active) {
      await admin
        .from("stream_configs")
        .update({ multistream_enabled: false })
        .eq("creator_id", userId);
    }
  }
}

async function revokeSubscription(admin: Admin, sub: Stripe.Subscription) {
  const userId = await resolveUserId(admin, sub);

  await admin
    .from("billing_ledger")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", sub.id);

  if (!userId) return;

  const priceId = sub.items.data[0]?.price?.id;
  const tier = planTierForPrice(priceId);

  if (tier === "premium_ad_free") {
    await admin
      .from("profiles")
      .update({ is_premium_viewer: false })
      .eq("id", userId);
  }
  if (tier === "creator_multistream_saas") {
    await admin
      .from("stream_configs")
      .update({ multistream_enabled: false })
      .eq("creator_id", userId);
  }
}
