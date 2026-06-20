/**
 * Minimal ambient typing for the Google IMA HTML5 SDK, which is loaded at
 * runtime from imasdk.googleapis.com (no npm package). Covers only the
 * surface the AdController uses. Full reference:
 * https://developers.google.com/interactive-media-ads/docs/sdks/html5
 */
declare global {
  interface Window {
    google?: { ima?: typeof globalThis.google.ima };
  }

  namespace google.ima {
    class AdDisplayContainer {
      constructor(container: HTMLElement, video: HTMLVideoElement);
      initialize(): void;
      destroy(): void;
    }
    class AdsLoader {
      constructor(container: AdDisplayContainer);
      requestAds(req: AdsRequest): void;
      addEventListener(type: string, fn: (e: unknown) => void, capture?: boolean): void;
      getSettings(): { setVpaidMode(mode: number): void };
      destroy(): void;
    }
    class AdsRequest {
      adTagUrl: string;
      linearAdSlotWidth: number;
      linearAdSlotHeight: number;
      nonLinearAdSlotWidth: number;
      nonLinearAdSlotHeight: number;
    }
    class AdsRenderingSettings {}
    // Classes carry a static `Type` map, mirroring the real SDK where these
    // identifiers are both event values (with `.Type`) and instance types.
    class AdsManagerLoadedEvent {
      static Type: { ADS_MANAGER_LOADED: string };
      getAdsManager(video: HTMLVideoElement, settings?: AdsRenderingSettings): AdsManager;
    }
    class AdErrorEvent {
      static Type: { AD_ERROR: string };
      getError(): { toString(): string };
    }
    interface AdsManager {
      init(width: number, height: number, viewMode: string): void;
      start(): void;
      destroy(): void;
      addEventListener(type: string, fn: (e: unknown) => void): void;
    }
    const AdEvent: {
      Type: {
        CONTENT_PAUSE_REQUESTED: string;
        CONTENT_RESUME_REQUESTED: string;
        ALL_ADS_COMPLETED: string;
      };
    };
    const ViewMode: { NORMAL: string; FULLSCREEN: string };
    const ImaSdkSettings: { VpaidMode: { ENABLED: number; INSECURE: number; DISABLED: number } };
  }
}

export {};
