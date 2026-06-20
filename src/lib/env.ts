/**
 * Centralized, fail-fast environment access.
 * Server-only secrets are read lazily so the client bundle never trips on them.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `[gintix] Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill it in.`
    );
  }
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

// Client-safe (NEXT_PUBLIC_*).
// IMPORTANT: reference each var STATICALLY as process.env.NEXT_PUBLIC_X so
// Next.js inlines the value into the client bundle. A dynamic lookup like
// process.env[name] is NOT inlined and would be undefined in the browser.
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  livepeerPlaybackHost:
    process.env.NEXT_PUBLIC_LIVEPEER_PLAYBACK_HOST || "https://lp-playback.studio",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  gamNetworkCode: process.env.NEXT_PUBLIC_GAM_NETWORK_CODE ?? "",
  gamAdUnit: process.env.NEXT_PUBLIC_GAM_AD_UNIT ?? "",
  vmapAdTagUrl: process.env.NEXT_PUBLIC_VMAP_AD_TAG_URL ?? "",
};

// Server-only — accessed via getters so they throw only when actually used.
export const serverEnv = {
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get livepeerApiKey() {
    return required("LIVEPEER_API_KEY");
  },
  get livepeerApiUrl() {
    return optional("LIVEPEER_API_URL", "https://livepeer.studio/api");
  },
  get stripeSecretKey() {
    return required("STRIPE_SECRET_KEY");
  },
  get stripeWebhookSecret() {
    return required("STRIPE_WEBHOOK_SECRET");
  },
  get stripePricePremium() {
    return required("STRIPE_PRICE_PREMIUM_AD_FREE");
  },
  get stripePriceMultistream() {
    return required("STRIPE_PRICE_MULTISTREAM_SAAS");
  },
};
