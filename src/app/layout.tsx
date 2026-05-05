// Trigger Vercel Build - Force Sync
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ČoUvarím.sk",
  description: "Inteligentný asistent pre vaše varenie a nákupy",
  manifest: "/manifest.json",
  applicationName: "ČoUvarím",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ČoUvarím",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: [
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    icon: [
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512x512.png", type: "image/png", sizes: "512x512" },
    ],
  },
};

export const viewport = {
  themeColor: "#9CAF88",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import PWARegistration from "@/components/PWARegistration";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sk"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#9CAF88" />
      </head>
      <body className="h-full bg-[#F8F5F2] text-gray-900 selection:bg-sage-100 selection:text-sage-900">
        <PWARegistration />
        <main className="max-w-5xl mx-auto min-h-full bg-white sm:bg-[#F8F5F2]/50 relative">
          <div className="pb-24">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
