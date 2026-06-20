import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Thin typed wrapper over the Livepeer Studio REST API.
 * Docs: https://docs.livepeer.org/api-reference/stream/overview
 *
 * All calls authenticate with the master server token (LIVEPEER_API_KEY).
 * Keep this server-side only.
 */

export interface LivepeerStream {
  id: string;
  name: string;
  streamKey: string;
  playbackId: string;
  isActive?: boolean;
  multistream?: { targets?: LivepeerMultistreamTarget[] };
}

export interface LivepeerMultistreamTarget {
  profile: string;
  spec: { name: string; url: string };
}

async function livepeerFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${serverEnv.livepeerApiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serverEnv.livepeerApiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Livepeer API ${res.status} on ${path}: ${body || res.statusText}`
    );
  }
  // Some endpoints (e.g. PATCH) return 204 No Content.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Provision a brand-new stream + RTMP key + HLS playbackId. */
export function createLivepeerStream(name: string): Promise<LivepeerStream> {
  return livepeerFetch<LivepeerStream>("/stream", {
    method: "POST",
    body: JSON.stringify({
      name,
      // Adaptive bitrate ladder for institutional-grade HLS.
      profiles: [
        { name: "720p", bitrate: 2_000_000, fps: 30, width: 1280, height: 720 },
        { name: "480p", bitrate: 1_000_000, fps: 30, width: 854, height: 480 },
        { name: "360p", bitrate: 500_000, fps: 30, width: 640, height: 360 },
      ],
      record: false,
    }),
  });
}

/**
 * Replace the multistream targets on an existing stream.
 * Passing an empty array clears all simulcast destinations.
 */
export function setMultistreamTargets(
  livepeerStreamId: string,
  targets: { name: string; url: string }[]
): Promise<void> {
  return livepeerFetch<void>(`/stream/${livepeerStreamId}`, {
    method: "PATCH",
    body: JSON.stringify({
      multistream: {
        targets: targets.map((t) => ({
          profile: "source", // forward the source rendition to platforms
          spec: { name: t.name, url: t.url },
        })),
      },
    }),
  });
}
