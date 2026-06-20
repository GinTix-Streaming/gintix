# GinTix

Premium, automated live-streaming & creator SaaS platform. One-click channels,
100% creator revenue on subs/funding, monetized via programmatic video ads, a
premium ad-free pass, in-player live commerce, and a $29/mo multi-stream tier.

Built with **Next.js (App Router) + TypeScript + Tailwind**, **Supabase**
(Postgres + Auth + RLS), **Livepeer Studio** (ingest/transcode/multistream),
**Stripe** (subscriptions + commerce), and **Google Ad Manager 360** (VAST/VMAP
via the Google IMA SDK).

> Status: foundational architecture / scaffold. All third-party integrations are
> real code reading from environment variables — drop in your own keys to run.

## Quick start

```bash
cp .env.example .env.local      # fill in your keys
npm install
npm run dev                     # http://localhost:3000
```

## Brand system

Defined in `tailwind.config.ts`:

| Token | Hex | Use |
|------|------|-----|
| `canvas` | `#0B0C10` | deep slate-black interface |
| `obsidian` | `#1F2833` | electric obsidian slate panels |
| `amethyst` | `#8A2BE2` | cyber-amethyst liquid purple accent |

## Project layout

```
supabase/migrations/
  0001_init_schema.sql      profiles, stream_configs, billing_ledger,
                            commerce_listings + indices + signup trigger
  0002_rls_policies.sql     Row-Level Security + public_streams view
src/
  app/
    page.tsx                home / live discovery (SSR)
    [username]/page.tsx     public channel page (SSR, resolves premium server-side)
    go-live/page.tsx        one-click provisioning screen
    auth/callback/route.ts  OAuth/magic-link code exchange
    api/
      stream/provision      mint Livepeer RTMP key + HLS playbackId
      stream/multistream    gated simulcast to Twitch/YouTube/TikTok
      billing/checkout      Stripe Checkout for premium pass / multistream SaaS
      commerce/checkout     instant single-product checkout
      webhooks/stripe       sync subscription state → DB flags
  components/
    VideoPlayer.tsx         hls.js player + IMA ad stack + commerce trigger
    CommerceDrawer.tsx      in-player slide-out checkout
    GoLivePanel.tsx         one-click "generate my stream" UI
  lib/                      env, supabase (server/client/admin), livepeer, stripe, playback
  types/database.ts         typed schema (regenerate with `npm run types:gen`)
  middleware.ts             Supabase session refresh (skips /api/webhooks)
```

## Phase 1 — Database

Apply migrations in order against your Supabase project, e.g. with the CLI:

```bash
supabase link --project-ref <ref>
supabase db push          # applies supabase/migrations/*
```

Security model:
- `profiles` — public read, self-write.
- `stream_configs` — **owner-only** read/update (holds the secret `stream_key`).
  Anonymous viewers read playback data through the `public_streams` view, which
  never exposes the key.
- `billing_ledger` — owner read only; all writes happen via the service role in
  the Stripe webhook.
- `commerce_listings` — public read (active), owner full control.

A signup trigger (`handle_new_user`) auto-creates a profile + free-tier billing
row, so first-time users land fully set up.

## Phase 2 — Backend

All route handlers run on the Node.js runtime. Privileged writes use the
service-role client (`src/lib/supabase/admin.ts`), which bypasses RLS and must
never be imported into client code (guarded by `server-only`).

- **`POST /api/stream/provision`** — idempotent; mints a Livepeer stream and
  returns the RTMP ingest URL + stream key to the owner once.
- **`POST /api/stream/multistream`** — returns `402` unless the caller has an
  active `creator_multistream_saas` subscription; validates RTMP targets, then
  pushes them to Livepeer.
- **`POST /api/webhooks/stripe`** — verifies the signature against
  `STRIPE_WEBHOOK_SECRET` and syncs `customer.subscription.*` events into
  `billing_ledger`, flipping `is_premium_viewer` / multistream access.

Point a Stripe webhook at `/api/webhooks/stripe` for
`customer.subscription.created|updated|deleted`. The webhook path is excluded
from middleware so Stripe receives the raw body intact.

## Phase 3 — Player & ads

`VideoPlayer` plays HLS via hls.js (native HLS on Safari). For non-premium
viewers it lazy-loads the Google IMA SDK and requests VMAP from Google Ad
Manager 360 (`src/lib/playback.ts` builds the ad-tag URL). Premium viewers
(`is_premium_viewer = true`) never load the ad scripts. The ad stack **fails
open** — any ad error resumes content rather than blocking playback.

## Environment variables

See `.env.example`. Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`,
`LIVEPEER_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs) are
never prefixed with `NEXT_PUBLIC_` and are accessed lazily in `src/lib/env.ts`.

## Notes & next steps

- **Auth UI**: `/login`, `/account`, and `/auth/error` pages are referenced but
  not yet built — wire up Supabase Auth (OTP/OAuth) to match your flow.
- **Live commerce payouts**: enabling the platform rail fee
  (`application_fee_amount`) requires Stripe Connect with creators onboarded as
  connected accounts; the fee block is commented in `api/commerce/checkout`.
- **`is_live` updates**: set this from a Livepeer webhook
  (`stream.started` / `stream.idle`) for accurate live status — add a handler
  alongside the Stripe one.
- **Type generation**: `npm run types:gen` regenerates `src/types/database.ts`
  from your linked project once the schema is applied.
```
