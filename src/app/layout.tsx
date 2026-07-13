import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import CookieConsent from "@/components/CookieConsent";
import MobileNav from "@/components/MobileNav";
import RouteProgress from "@/components/RouteProgress";
import { getNavState } from "@/lib/nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GinTix — Sell live. Keep 95%.",
  description:
    "Live auctions and live shopping for creators. Real-time proxy bidding, anti-snipe timers and hidden reserves — and you keep 95% of every sale, plus 100% of your subs and tips.",
  metadataBase: new URL("https://gintix.vercel.app"),
  openGraph: {
    title: "GinTix — Sell live. Keep 95%.",
    description:
      "The live auction platform that takes 5%, not 8%. Proxy bidding, anti-snipe, 30-day buyer protection.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08090d",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolved once per request and shared by every nav surface, so the shell
  // can never contradict itself (e.g. "Go live" while you're already live).
  const nav = await getNavState();

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <div className="aurora-bg" aria-hidden="true" />
        <RouteProgress />
        {/* @ts-expect-error async server component */}
        <TopBar />
        <div className="flex">
          {/* @ts-expect-error async server component */}
          <Sidebar />
          <main className="min-w-0 flex-1 pb-16 md:pb-0">{children}</main>
        </div>
        <MobileNav isLive={nav.isLive} isCreator={nav.isCreator} />
        <CookieConsent />
      </body>
    </html>
  );
}
