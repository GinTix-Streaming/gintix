/**
 * GinTix fee schedule.
 *
 * Subscriptions and fan funding: 0% — creators keep everything, always.
 * Live auctions: 5% of the hammer price. Whatnot charges 8%.
 *
 * The rate is stored per-lot in the DB (`platform_fee_bps`) at settlement
 * time, so historical payouts stay correct even if this number ever changes.
 */
export const AUCTION_FEE_BPS = 500; // 5.00%
export const AUCTION_FEE_PCT = 5;
export const AUCTION_CREATOR_PCT = 95;

/** What competitors charge, for the comparison copy. */
export const WHATNOT_FEE_PCT = 8;

export function auctionFeeCents(hammerCents: number, bps: number = AUCTION_FEE_BPS): number {
  return Math.round((hammerCents * bps) / 10000);
}

export function auctionNetCents(hammerCents: number, bps: number = AUCTION_FEE_BPS): number {
  return hammerCents - auctionFeeCents(hammerCents, bps);
}
