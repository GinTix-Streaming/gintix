import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

/**
 * Lazily instantiate the Stripe client at request time, never at import time.
 * Instantiating at module load would throw during `next build` (page-data
 * collection imports these modules) when STRIPE_SECRET_KEY is absent.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(serverEnv.stripeSecretKey, {
      apiVersion: "2024-06-20",
      appInfo: { name: "GinTix", url: "https://gintix.com" },
    });
  }
  return _stripe;
}

/** Map a Stripe price id back to our internal plan tier. */
export function planTierForPrice(
  priceId: string | null | undefined
): "premium_ad_free" | "creator_multistream_saas" | null {
  if (!priceId) return null;
  if (priceId === serverEnv.stripePricePremium) return "premium_ad_free";
  if (priceId === serverEnv.stripePriceMultistream)
    return "creator_multistream_saas";
  return null;
}
