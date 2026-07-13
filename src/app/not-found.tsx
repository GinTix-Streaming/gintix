import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <p className="text-gradient text-6xl font-extrabold leading-none">404</p>
      <h1 className="mt-4 text-xl font-bold text-ink">This channel doesn&apos;t exist</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        The page you&apos;re after was moved, deleted, or never existed. It happens.
      </p>
      <div className="mt-6 flex gap-2.5">
        <Link href="/browse" className="btn-amethyst !px-5 !py-2.5">
          Browse live channels
        </Link>
        <Link href="/" className="btn-ghost !px-5 !py-2.5">
          Home
        </Link>
      </div>
    </div>
  );
}
