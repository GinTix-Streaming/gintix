import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { publicEnv } from "@/lib/env";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/commerce/checkout
 * Live-commerce instant checkout. Open to viewers (auth optional).
 * Body: { listingId: string }
 * Returns a Stripe Checkout URL for the single product.
 */
export async function POST(req: NextRequest) {
  let listingId: string;
  try {
    ({ listingId } = (await req.json()) as { listingId: string });
  } catch {
    return fail("Invalid JSON body", 400);
  }
  if (!listingId) return fail("listingId required", 400);

  const admin = createSupabaseAdminClient();
  const { data: listing, error } = await admin
    .from("commerce_listings")
    .select("*")
    .eq("id", listingId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !listing) return fail("Listing not found or inactive", 404);

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        listing.stripe_price_id
          ? { price: listing.stripe_price_id, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: listing.currency,
                unit_amount: listing.price_cents,
                product_data: {
                  name: listing.title,
                  description: listing.description ?? undefined,
                  images: listing.image_url ? [listing.image_url] : undefined,
                },
              },
            },
      ],
      // Live-commerce rail fee — platform's cut on each transaction.
      // NOTE: `application_fee_amount` + `transfer_data.destination` require
      // Stripe Connect with creators onboarded as connected accounts. Until
      // Connect is wired up, we only tag metadata; enable the fee block once
      // each creator has a connected account id stored on their profile.
      payment_intent_data: {
        metadata: { listing_id: listing.id, creator_id: listing.creator_id },
        // application_fee_amount: Math.round(listing.price_cents * 0.05),
        // transfer_data: { destination: creatorConnectedAccountId },
      },
      success_url: `${publicEnv.siteUrl}/checkout/success`,
      cancel_url: `${publicEnv.siteUrl}/checkout/cancelled`,
    });

    return ok({ checkoutUrl: session.url });
  } catch (e) {
    return fail("Failed to create commerce checkout", 502, e);
  }
}
