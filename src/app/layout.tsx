import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GinTix — Go live in one click",
  description:
    "Premium live-streaming for creators. 100% of your fan funding. Instant channels, multi-stream everywhere, live commerce.",
  metadataBase: new URL("https://gintix.com"),
  openGraph: { title: "GinTix", type: "website" },
  themeColor: "#0B0C10",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <header className="sticky top-0 z-50 border-b border-white/5 bg-canvas/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-ink">
                Gin<span className="text-amethyst-glow">Tix</span>
              </span>
            </a>
            <div className="flex items-center gap-3 text-sm">
              <a href="/account" className="text-ink-muted transition hover:text-ink">
                Account
              </a>
              <a href="/go-live" className="btn-amethyst text-sm">
                Go live
              </a>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
