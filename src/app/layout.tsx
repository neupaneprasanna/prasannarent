import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/providers/ClientProviders";
import PremiumBackground from "@/components/ui/PremiumBackground";
import SearchOverlay from "@/components/ui/SearchOverlay";
import SmoothScroll from "@/components/providers/SmoothScroll";
import MaintenanceGuard from "@/components/guards/MaintenanceGuard";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
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
  metadataBase: new URL('https://rentverse.app'),
  title: {
    default: 'RentVerse — Rent Anything, Anywhere',
    template: '%s | RentVerse'
  },
  description: "The world's most advanced peer-to-peer rental marketplace. Rent cameras, drones, studios, luxury cars, and more from verified owners.",
  keywords: ["rent", "marketplace", "camera rental", "drone rental", "studio rental", "peer-to-peer", "sharing economy"],
  authors: [{ name: 'RentVerse Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rentverse.app',
    title: 'RentVerse — Rent Anything, Anywhere',
    description: "The world's most advanced peer-to-peer rental marketplace. Rent cameras, drones, studios, luxury cars, and more from verified owners.",
    siteName: 'RentVerse',
    images: [
      {
        url: 'https://rentverse.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'RentVerse Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentVerse — Rent Anything, Anywhere',
    description: "The world's most advanced peer-to-peer rental marketplace.",
    images: ['https://rentverse.app/og-image.jpg'],
    creator: '@rentverse',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased text-white grain-overlay`}
      >
        <PremiumBackground />
        <SearchOverlay />
        <ClientProviders>
          <MaintenanceGuard>
            <SmoothScroll>
              {children}
            </SmoothScroll>
          </MaintenanceGuard>
        </ClientProviders>
      </body>
    </html>
  );
}
