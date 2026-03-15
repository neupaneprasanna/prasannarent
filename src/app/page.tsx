'use client';

import Navbar from '@/components/nav/Navbar';
import SideNav from '@/components/nav/SideNav';
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
import RecentlyViewedSection from '@/components/sections/RecentlyViewedSection';


export default function HomePage() {
    return (
        <main className="relative">

            <Navbar />
            <SideNav />

            {/* Hero Section */}
            <section className="relative min-h-screen overflow-hidden">
                <HeroContent />
            </section>

            {/* Categories — Raw, no wrapper needed (has its own video BG engine) */}
            <Categories />

            {/* Trending — Editorial Split (portal entrance) */}
            <DimensionalReveal glowColor="rgba(0,255,179,0.10)" parallaxIntensity={0.25} variant="portal">
                <TrendingCarousel />
            </DimensionalReveal>

            {/* Recently Viewed — Rises from below */}
            <DimensionalReveal glowColor="rgba(161,140,255,0.12)" parallaxIntensity={0.2} variant="rise">
                <RecentlyViewedSection />
            </DimensionalReveal>

            {/* Why RentVerse — Grand cinematic reveal */}
            <DimensionalReveal glowColor="rgba(122,92,255,0.10)" parallaxIntensity={0.25} variant="cinematic">
                <WhyRentVerse />
            </DimensionalReveal>

            {/* Stats — Slides in from the side */}
            <DimensionalReveal glowColor="rgba(0,240,255,0.12)" parallaxIntensity={0.2} variant="slide">
                <LiveStats />
            </DimensionalReveal>

            {/* How it Works — Portal emergence */}
            <DimensionalReveal glowColor="rgba(122,92,255,0.10)" parallaxIntensity={0.35} variant="portal">
                <HowItWorks />
            </DimensionalReveal>

            {/* Trust & Safety — Cinematic */}
            <DimensionalReveal glowColor="rgba(0,255,179,0.10)" parallaxIntensity={0.2} variant="cinematic">
                <TrustSafety />
            </DimensionalReveal>

            {/* World Map — Rise */}
            <DimensionalReveal glowColor="rgba(0,240,255,0.08)" parallaxIntensity={0.15} variant="rise">
                <WorldMap />
            </DimensionalReveal>

            {/* Testimonials — Portal */}
            <DimensionalReveal glowColor="rgba(161,140,255,0.10)" parallaxIntensity={0.2} variant="portal">
                <Testimonials />
            </DimensionalReveal>

            {/* Host Benefits — Slide */}
            <DimensionalReveal glowColor="rgba(0,255,179,0.08)" parallaxIntensity={0.2} variant="slide">
                <HostBenefits />
            </DimensionalReveal>

            {/* FAQ — Cinematic */}
            <DimensionalReveal glowColor="rgba(0,240,255,0.08)" parallaxIntensity={0.15} variant="cinematic">
                <FAQ />
            </DimensionalReveal>

            {/* CTA — Grand portal */}
            <DimensionalReveal glowColor="rgba(122,92,255,0.15)" parallaxIntensity={0.3} variant="portal">
                <CTASection />
            </DimensionalReveal>

            {/* Footer — Gentle rise */}
            <DimensionalReveal showGlow={false} parallaxIntensity={0.1} variant="rise">
                <Footer />
            </DimensionalReveal>
        </main>
    );
}
