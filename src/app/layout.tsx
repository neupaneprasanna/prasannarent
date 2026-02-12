import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/providers/ClientProviders";
import PremiumBackground from "@/components/ui/PremiumBackground";
import SearchOverlay from "@/components/ui/SearchOverlay";

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
  title: "RentVerse — Rent Anything, Anywhere, Anytime",
  description:
    "The world's most advanced rental marketplace. Rent tech, vehicles, equipment, spaces, fashion, and more from verified owners worldwide.",
  keywords: [
    "rent",
    "rental marketplace",
    "equipment rental",
    "vehicle rental",
    "peer-to-peer",
    "sharing economy",
  ],
  openGraph: {
    title: "RentVerse — Rent Anything, Anywhere, Anytime",
    description:
      "The world's most advanced rental marketplace. Discover, book, and rent anything you need.",
    type: "website",
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
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
