import Link from "next/link";

/** Shared layout for static content pages (About, Terms, etc.). */
export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-amethyst-soft hover:underline">
        ← Back to GinTix
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>
      {subtitle && <p className="mt-3 text-lg text-ink-muted">{subtitle}</p>}
      <div className="mt-8 space-y-6 leading-relaxed text-ink-muted">{children}</div>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-bold text-ink">{heading}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
