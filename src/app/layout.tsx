import type { Metadata } from "next";
import "./globals.css";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "GinTix — Go live in one click",
  description:
    "Premium live-streaming for creators. 100% of your fan funding. Instant channels, multi-stream everywhere, live commerce.",
  metadataBase: new URL("https://gintix.vercel.app"),
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
