'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import SearchBar from './SearchBar';
import { useRef, useState, useEffect } from 'react';
import LiquidButton from '@/components/motion/LiquidButton';

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function HeroContent() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start'],
    });

    useEffect(() => setIsMounted(true), []);

    // Parallax depth planes
    const bgTextY = useTransform(scrollYProgress, [0, 1], [0, 150]);
    const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);
    const bgTextOpacity = useTransform(scrollYProgress, [0, 0.3], [0.15, 0]);

    return (
        <div ref={containerRef} className="relative flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 pt-28 sm:pt-32 text-center overflow-hidden">

            {/* === AMBIENT GLOW ORBS === */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)', filter: 'blur(90px)' }}
                />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)', filter: 'blur(80px)' }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(ellipse, rgba(244,114,182,0.2) 0%, transparent 70%)', filter: 'blur(100px)' }}
                />
            </div>

            {/* === DEPTH TEXT — "access without ownership" === */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{ y: bgTextY, opacity: bgTextOpacity }}
            >
                <span
                    className="text-[10vw] sm:text-[7vw] font-extralight tracking-[0.15em] whitespace-nowrap"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: 'rgba(255,255,255,0.06)',
                        textShadow: '0 0 60px rgba(139,92,246,0.12)',
                    }}
                >
                    access without ownership
                </span>
            </motion.div>

            {/* === MAIN CONTENT PLANE === */}
            <motion.div
                className="relative z-10 flex flex-col items-center"
                style={{ y: contentY }}
            >
                {/* Status badge — glassmorphism pill */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...springTransition, delay: 0.3 }}
                    className="mb-8"
                >
                    <span
                        className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full text-label"
                        style={{
                            background: 'rgba(139,92,246,0.1)',
                            border: '1px solid rgba(139,92,246,0.2)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 0 30px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
                        }}
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399]" style={{ boxShadow: '0 0 12px rgba(52,211,153,0.6)' }} />
                        </span>
                        <span className="text-[#A5B4FC]">the future of renting</span>
                    </span>
                </motion.div>

                {/* Hero heading */}
                <motion.h1
                    className="text-hero mb-6 max-w-5xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                >
                    {['rent', 'anything.'].map((word, i) => (
                        <motion.span
                            key={word}
                            className={`inline-block mr-3 sm:mr-5 ${i === 0 ? 'gradient-text-chrome' : 'text-white/80'}`}
                            initial={{ opacity: 0, y: 40, rotateX: -15 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ ...springTransition, delay: 0.6 + i * 0.15 }}
                            style={i === 0 ? { textShadow: '0 0 80px rgba(255,255,255,0.15)' } : undefined}
                        >
                            {word}
                        </motion.span>
                    ))}
                    <br className="sm:hidden" />
                    {['anywhere.', 'anytime.'].map((word, i) => (
                        <motion.span
                            key={word}
                            className="inline-block mr-3 sm:mr-5 text-white/40"
                            initial={{ opacity: 0, y: 40, rotateX: -15 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ ...springTransition, delay: 0.9 + i * 0.15 }}
                        >
                            {word}
                        </motion.span>
                    ))}
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    className="max-w-lg text-body text-white/35 leading-relaxed mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springTransition, delay: 1.2 }}
                >
                    from cameras to cars, studios to tools — discover, book, and rent
                    anything you need from verified owners worldwide.
                </motion.p>

                {/* Search — frosted command interface */}
                <motion.div
                    className="w-full max-w-2xl mb-10 relative z-[501]"
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...springTransition, delay: 1.4 }}
                >
                    <SearchBar />
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row items-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springTransition, delay: 1.6 }}
                >
                    <Link href="/explore">
                        <LiquidButton variant="cta" size="lg">
                            explore rentals
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </LiquidButton>
                    </Link>

                    <Link href="/listings/new">
                        <LiquidButton variant="secondary" size="lg">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            list your item
                        </LiquidButton>
                    </Link>
                </motion.div>

                {/* Social proof */}
                <motion.div
                    className="mt-16 flex flex-col sm:flex-row items-center gap-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                >
                    <div className="flex -space-x-2.5">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white/60 font-medium"
                                style={{
                                    background: `linear-gradient(135deg, rgba(139,92,246,0.4) 0%, rgba(165,180,252,0.2) 100%)`,
                                    border: '2px solid rgba(2,3,5,0.8)',
                                    boxShadow: '0 0 10px rgba(139,92,246,0.15)',
                                }}
                            >
                                {String.fromCharCode(65 + i)}
                            </div>
                        ))}
                    </div>
                    <div className="text-xs text-white/30 tracking-wide">
                        <span className="text-[#A5B4FC] font-medium">2,847+</span> people renting right now
                    </div>
                </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 1 }}
            >
                <motion.div
                    className="flex flex-col items-center gap-2"
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <span className="text-label text-white/20 text-[9px]">scroll</span>
                    <div className="w-5 h-8 rounded-full flex items-start justify-center p-1.5"
                        style={{
                            border: '1px solid rgba(139,92,246,0.25)',
                            boxShadow: '0 0 15px rgba(139,92,246,0.08)',
                        }}
                    >
                        <motion.div
                            className="w-1 h-2 rounded-full bg-[#8B5CF6]"
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ boxShadow: '0 0 6px rgba(139,92,246,0.6)' }}
                        />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
