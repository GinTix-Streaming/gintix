import { publicEnv } from "@/lib/env";

/** Build the HLS master playlist URL for a Livepeer playbackId. */
// Public test stream used only by seeded "demo:" channels, so the platform
// is viewable end-to-end before a real Livepeer key is configured.
const DEMO_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

export function hlsUrlFor(playbackId: string): string {
  if (playbackId.startsWith("demo:")) return DEMO_HLS;
  return `${publicEnv.livepeerPlaybackHost}/hls/${playbackId}/index.m3u8`;
}

/**
 * Build a VMAP ad-tag URL for Google Ad Manager 360.
 * The player requests this when the viewer is NOT premium; GAM returns
 * VMAP XML describing pre/mid-roll VAST creatives to schedule.
 *
 * `correlator` busts caches per playback; `description_url` improves fill.
 */
export function buildVmapAdTagUrl(opts: {
  channel: string;
  descriptionUrl: string;
}): string | null {
  // Explicit override wins (e.g. SpotX or a custom ad server).
  if (publicEnv.vmapAdTagUrl) return publicEnv.vmapAdTagUrl;

  if (!publicEnv.gamNetworkCode || !publicEnv.gamAdUnit) return null;

  const params = new URLSearchParams({
    iu: publicEnv.gamAdUnit, // /network/gintix/preroll ad unit
    env: "vp",
    gdfp_req: "1",
    output: "vmap",
    unviewed_position_start: "1",
    sz: "640x480|1280x720",
    cust_params: `channel=${encodeURIComponent(opts.channel)}`,
    description_url: opts.descriptionUrl,
    correlator: String(Date.now()),
  });

  return `https://pubads.g.doubleclick.net/gampad/ads?${params.toString()}`;
}
