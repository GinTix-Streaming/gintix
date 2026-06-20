/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep the client bundle lean — server-render by default, ship minimal JS.
  poweredByHeader: false,
  experimental: {
    // Stream RSC payloads for fast first paint on channel pages.
    optimizePackageImports: ["hls.js"],
  },
  images: {
    // Avatars + product imagery are served from Supabase Storage / Livepeer CDN.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.livepeercdn.studio" },
      { protocol: "https", hostname: "lp-playback.studio" },
    ],
  },
};

export default nextConfig;
