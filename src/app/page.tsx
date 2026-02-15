'use client';

import Navbar from '@/components/nav/Navbar';
import HeroContent from '@/components/hero/HeroContent';
import Categories from '@/components/sections/Categories';
import TrendingCarousel from '@/components/sections/TrendingCarousel';
import LiveStats from '@/components/sections/LiveStats';
import HowItWorks from '@/components/sections/HowItWorks';
import Testimonials from '@/components/sections/Testimonials';
import WorldMap from '@/components/sections/WorldMap';
import CTASection from '@/components/sections/CTASection';
import Footer from '@/components/sections/Footer';

export default function HomePage() {
  return (
    <main className="relative">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        <HeroContent />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050508] to-transparent pointer-events-none z-10" />
      </section>

      {/* Categories */}
      <Categories />

      {/* Trending */}
      <TrendingCarousel />

      {/* Stats */}
      <LiveStats />

      {/* How it Works */}
      <HowItWorks />

      {/* World Map */}
      <WorldMap />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
