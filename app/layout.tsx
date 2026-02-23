/* --- IMPORTS --- */
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SwipeShell from "@/components/SwipeShell";

/* --- FONTS --- */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* --- METADATA (PWA) --- */
export const metadata: Metadata = {
  title: "Outflō",
  description: "Returns what leaves you",
  applicationName: "Outflō",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Outflo",
    statusBarStyle: "black-translucent",
  },
};

/* --- VIEWPORT --- */
export const viewport: Viewport = {
  themeColor: "#0B0B0C",
};

/* --- LAYOUT --- */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full min-h-[100dvh] w-full overflow-x-hidden`}
      >
        <SwipeShell>
  {/* GLOBAL FRAME CONTRACT */}
  <div className="min-h-[100dvh] w-full">
    <main className="
        w-full max-w-[520px] mx-auto py-4 box-border
        px-[calc(16px+env(safe-area-inset-left))]
        pr-[calc(16px+env(safe-area-inset-right))]
      "
    >
      {children}
    </main>
  </div>
</SwipeShell>
      </body>
    </html>
  );
}


