'use client';

import React from 'react';
import Navbar from '@/components/nav/Navbar';
import SideNav from '@/components/nav/SideNav';
import ScrollZigzagLine from '@/components/motion/ScrollZigzagLine';
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
import WorldDivider from '@/components/motion/WorldDivider';
import RecentlyViewedSection from '@/components/sections/RecentlyViewedSection';

export default function HomePage() {
    return (
        <main className="relative">
            <ScrollZigzagLine />
            <Navbar />
            <SideNav />

            {/* ─── World 0: Hero ─── */}
            <section className="relative min-h-screen overflow-hidden">
                <HeroContent />
            </section>

            {/* ─── Categories (own cinematic BG engine) ─── */}
            <Categories />

            {/* ∿ seam: Categories → Trending */}
            <WorldDivider color="#00FFB3" label="trending" />

            {/* ─── World 1: Trending — dive through a portal gate ─── */}
            <DimensionalReveal variant="portal">
                <TrendingCarousel />
            </DimensionalReveal>

            {/* ∿ seam: Trending → Recently Viewed */}
            <WorldDivider color="#A78BFA" />

            {/* ─── World 2: Recently Viewed — rises from below ─── */}
            <DimensionalReveal variant="rise">
                <RecentlyViewedSection />
            </DimensionalReveal>

            {/* ∿ seam: Recently Viewed → Why RentVerse */}
            <WorldDivider color="#7A5CFF" label="why rentverse" />

            {/* ─── World 3: Why RentVerse — 3-D page-turn from the left ─── */}
            <DimensionalReveal variant="warp">
                <WhyRentVerse />
            </DimensionalReveal>

            {/* ∿ seam: Why RentVerse → Live Stats */}
            <WorldDivider color="#00F0FF" label="live stats" />

            {/* ─── World 4: Live Stats — erupts upward with perspective tilt ─── */}
            <DimensionalReveal variant="surge">
                <LiveStats />
            </DimensionalReveal>

            {/* ∿ seam: Stats → How It Works */}
            <WorldDivider color="#6366F1" label="how it works" />

            {/* ─── World 5: How It Works — narrow slit opens like a tunnel ─── */}
            <DimensionalReveal variant="tunnel">
                <HowItWorks />
            </DimensionalReveal>

            {/* ∿ seam: How It Works → Trust & Safety */}
            <WorldDivider color="#10B981" label="trust & safety" />

            {/* ─── World 6: Trust & Safety — sweeps in from the right like a planet ─── */}
            <DimensionalReveal variant="orbit">
                <TrustSafety />
            </DimensionalReveal>

            {/* ∿ seam: Trust & Safety → World Map */}
            <WorldDivider color="#0EA5E9" label="worldwide" />

            {/* ─── World 7: World Map — shattered-glass compound rotation ─── */}
            <DimensionalReveal variant="fracture">
                <WorldMap />
            </DimensionalReveal>

            {/* ∿ seam: World Map → Testimonials */}
            <WorldDivider color="#A855F7" label="testimonials" />

            {/* ─── World 8: Testimonials — cinematic pull from the left ─── */}
            <DimensionalReveal variant="cinematic">
                <Testimonials />
            </DimensionalReveal>

            {/* ∿ seam: Testimonials → Host Benefits */}
            <WorldDivider color="#F59E0B" label="host benefits" />

            {/* ─── World 9: Host Benefits — hard slide from the right ─── */}
            <DimensionalReveal variant="slide">
                <HostBenefits />
            </DimensionalReveal>

            {/* ∿ seam: Host Benefits → FAQ */}
            <WorldDivider color="#F43F5E" label="faq" />

            {/* ─── World 10: FAQ — diagonal lateral drift ─── */}
            <DimensionalReveal variant="drift">
                <FAQ />
            </DimensionalReveal>

            {/* ∿ seam: FAQ → CTA */}
            <WorldDivider color="#8B5CF6" label="get started" />

            {/* ─── World 11: CTA — grand portal zoom ─── */}
            <DimensionalReveal variant="portal">
                <CTASection />
            </DimensionalReveal>

            {/* ∿ seam: CTA → Footer */}
            <WorldDivider color="#00FFB3" />

            {/* ─── World 12: Footer — gentle rise ─── */}
            <DimensionalReveal variant="rise">
                <Footer />
            </DimensionalReveal>
        </main>
    );
}
