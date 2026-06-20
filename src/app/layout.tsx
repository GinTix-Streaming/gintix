import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GinTix — Go live in one click",
  description:
    "Premium live-streaming for creators. Keep 100% of your fan funding. Instant channels, multi-stream everywhere, live commerce.",
  metadataBase: new URL("https://gintix.vercel.app"),
  openGraph: { title: "GinTix", type: "website" },
  themeColor: "#08090d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        {/* @ts-expect-error async server component */}
        <TopBar />
        <div className="flex">
          {/* @ts-expect-error async server component */}
          <Sidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
