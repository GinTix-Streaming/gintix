import Link from "next/link";

/**
 * Empty states are a product surface, not an error.
 *
 * A new marketplace IS empty. The honest move is to make emptiness feel
 * like the beginning of something rather than evidence of failure — no
 * fake activity, no phantom viewer counts, just a clear next action.
 */
export function EmptyState({
  icon,
  title,
  body,
  cta,
  secondary,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="panel-lit mx-auto flex max-w-xl flex-col items-center px-6 py-14 text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-amethyst/25 bg-amethyst/10 text-amethyst-glow">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{body}</p>

      {(cta || secondary) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {cta && (
            <Link href={cta.href} className="btn-amethyst !px-5 !py-2.5">
              {cta.label}
            </Link>
          )}
          {secondary && (
            <Link href={secondary.href} className="btn-ghost !px-5 !py-2.5">
              {secondary.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export const Icons = {
  broadcast: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 5.6a4.6 4.6 0 0 0-7-.6L12 6.6 10.2 5a4.6 4.6 0 1 0-6.5 6.5l8.3 8.3 8.3-8.3a4.6 4.6 0 0 0 .5-5.9Z" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  gavel: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10" />
      <path d="m16 16 6-6M8 8l6-6M9 7l8 8M21 11l-8-8" />
    </svg>
  ),
};
