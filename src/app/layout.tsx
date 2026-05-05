import type { Metadata } from "next";
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="h-full bg-[#F8F5F2] text-gray-900 selection:bg-sage-100 selection:text-sage-900">
        <main className="max-w-md mx-auto min-h-full bg-[#F8F5F2] shadow-2xl shadow-sage-900/5 relative">
          <div className="px-4 pt-6 pb-20">
            {children}
          </div>
        </main>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
