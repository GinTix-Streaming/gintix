/**
 * GinTix brand mark — a faceted amethyst "gem" with a live play-pulse cut into
 * it. Distinct silhouette (hexagon, not a blob or plain wordmark) so it owns its
 * own lane next to Twitch/Kick.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gx-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A64DFF" />
          <stop offset="1" stopColor="#6E1FB8" />
        </linearGradient>
        <linearGradient id="gx-shine" x1="8" y1="2" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* faceted gem hexagon */}
      <path
        d="M9 2.6h14a3 3 0 0 1 2.6 1.5l5 8.4a3 3 0 0 1 0 3l-5 8.4a3 3 0 0 1-2.6 1.5H9a3 3 0 0 1-2.6-1.5l-5-8.4a3 3 0 0 1 0-3l5-8.4A3 3 0 0 1 9 2.6Z"
        fill="url(#gx-grad)"
      />
      <path
        d="M9 2.6h14a3 3 0 0 1 2.6 1.5l5 8.4a3 3 0 0 1 0 3l-5 8.4a3 3 0 0 1-2.6 1.5H9a3 3 0 0 1-2.6-1.5l-5-8.4a3 3 0 0 1 0-3l5-8.4A3 3 0 0 1 9 2.6Z"
        fill="url(#gx-shine)"
      />
      {/* play / live pulse */}
      <path d="M13 11.2 21 16l-8 4.8V11.2Z" fill="#fff" />
      <circle cx="23.2" cy="9" r="1.6" fill="#fff" fillOpacity="0.9" />
    </svg>
  );
}

export function Logo({
  size = 30,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-extrabold tracking-tight"
        style={{ fontSize: size * 0.62 }}
      >
        <span className="text-ink">Gin</span>
        <span className="bg-amethyst-grad bg-clip-text text-transparent">Tix</span>
      </span>
    </span>
  );
}
