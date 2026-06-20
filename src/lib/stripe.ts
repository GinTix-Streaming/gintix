import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

/**
 * Singleton Stripe client. Pinned API version for predictable webhook shapes.
 */
export const stripe = new Stripe(serverEnv.stripeSecretKey, {
  apiVersion: "2024-06-20",
  appInfo: { name: "GinTix", url: "https://gintix.com" },
});

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
