import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/providers/ClientProviders";
import PremiumBackground from "@/components/ui/PremiumBackground";
import SearchOverlay from "@/components/ui/SearchOverlay";
import MaintenanceGuard from "@/components/guards/MaintenanceGuard";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://nexis.app'),
  title: {
    default: 'Nexis — Rent Anything, Anywhere',
    template: '%s | Nexis'
  },
  description: "The world's most advanced peer-to-peer rental marketplace. Rent cameras, drones, studios, luxury cars, and more from verified owners.",
  keywords: ["rent", "marketplace", "camera rental", "drone rental", "studio rental", "peer-to-peer", "sharing economy"],
  authors: [{ name: 'Nexis Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nexis.app',
    title: 'Nexis — Rent Anything, Anywhere',
    description: "The world's most advanced peer-to-peer rental marketplace. Rent cameras, drones, studios, luxury cars, and more from verified owners.",
    siteName: 'Nexis',
    images: [
      {
        url: 'https://nexis.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nexis Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexis — Rent Anything, Anywhere',
    description: "The world's most advanced peer-to-peer rental marketplace.",
    images: ['https://nexis.app/og-image.jpg'],
    creator: '@nexis',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import FloatingCompareBar from "@/components/listing/FloatingCompareBar";
import FloatingActionButton from "@/components/ui/FloatingActionButton";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${outfit.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} antialiased text-white grain-overlay`}
      >
        <PremiumBackground />
        <div className="relative z-10">
          <SearchOverlay />
          <ClientProviders>
            <MaintenanceGuard>
              {children}
            </MaintenanceGuard>
          </ClientProviders>
          <FloatingCompareBar />
          <FloatingActionButton />
        </div>
      </body>
    </html>
  );
}
