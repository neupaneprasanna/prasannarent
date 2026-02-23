'use client';

import Navbar from '@/components/nav/Navbar';
import HeroContent from '@/components/hero/HeroContent';
import Categories from '@/components/sections/Categories';
import TrendingCarousel from '@/components/sections/TrendingCarousel';
import LiveStats from '@/components/sections/LiveStats';
import HowItWorks from '@/components/sections/HowItWorks';
import WhyRentVerse from '@/components/sections/WhyRentVerse';

import TrustSafety from '@/components/sections/TrustSafety';
import Testimonials from '@/components/sections/Testimonials';
import WorldMap from '@/components/sections/WorldMap';
import HostBenefits from '@/components/sections/HostBenefits';
import FAQ from '@/components/sections/FAQ';
import CTASection from '@/components/sections/CTASection';
import Footer from '@/components/sections/Footer';
import DimensionalReveal from '@/components/motion/DimensionalReveal';

export default function HomePage() {
    return (
        <main className="relative">
            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-screen overflow-hidden">
                <HeroContent />
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050508] to-transparent pointer-events-none z-10" />
            </section>

            {/* Categories */}
            <DimensionalReveal glowColor="rgba(122,92,255,0.10)" parallaxIntensity={0.25}>
                <Categories />
            </DimensionalReveal>



            {/* Trending */}
            <DimensionalReveal glowColor="rgba(0,255,179,0.08)" parallaxIntensity={0.3}>
                <TrendingCarousel />
            </DimensionalReveal>

            {/* Why RentVerse */}
            <DimensionalReveal glowColor="rgba(122,92,255,0.08)" parallaxIntensity={0.2}>
                <WhyRentVerse />
            </DimensionalReveal>

            {/* Stats */}
            <DimensionalReveal glowColor="rgba(0,240,255,0.10)" parallaxIntensity={0.2}>
                <LiveStats />
            </DimensionalReveal>

            {/* How it Works */}
            <DimensionalReveal glowColor="rgba(122,92,255,0.08)" parallaxIntensity={0.35}>
                <HowItWorks />
            </DimensionalReveal>

            {/* Trust & Safety */}
            <DimensionalReveal glowColor="rgba(0,255,179,0.08)" parallaxIntensity={0.2}>
                <TrustSafety />
            </DimensionalReveal>

            {/* World Map */}
            <DimensionalReveal glowColor="rgba(0,240,255,0.06)" parallaxIntensity={0.15}>
                <WorldMap />
            </DimensionalReveal>

            {/* Testimonials */}
            <DimensionalReveal glowColor="rgba(161,140,255,0.08)" parallaxIntensity={0.2}>
                <Testimonials />
            </DimensionalReveal>

            {/* Host Benefits */}
            <DimensionalReveal glowColor="rgba(0,255,179,0.06)" parallaxIntensity={0.2}>
                <HostBenefits />
            </DimensionalReveal>

            {/* FAQ */}
            <DimensionalReveal glowColor="rgba(0,240,255,0.06)" parallaxIntensity={0.15}>
                <FAQ />
            </DimensionalReveal>

            {/* CTA */}
            <DimensionalReveal glowColor="rgba(122,92,255,0.12)" parallaxIntensity={0.3}>
                <CTASection />
            </DimensionalReveal>

            {/* Footer */}
            <DimensionalReveal showGlow={false} parallaxIntensity={0.1}>
                <Footer />
            </DimensionalReveal>
        </main>
    );
}
