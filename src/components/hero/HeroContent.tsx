'use client';

import { motion } from 'framer-motion';
import { letterReveal, staggerContainer, fadeInUp } from '@/lib/animations/motion-config';
import MagneticButton from '@/components/cursor/MagneticButton';
import Link from 'next/link';
import SearchBar from './SearchBar';

const words = ['Rent', 'Anything.', 'Anywhere.', 'Anytime.'];

export default function HeroContent() {
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center">
            {/* Tiny label */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mb-6"
            >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-white/50 tracking-widest uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00cec9] animate-pulse" />
                    The Future of Renting
                </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight leading-[0.9] mb-8"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {words.map((word, i) => (
                    <motion.span
                        key={word}
                        className={`inline-block mr-4 md:mr-6 ${i === 0 ? 'gradient-text' : 'text-white/90'
                            }`}
                        variants={letterReveal}
                        custom={i}
                        style={{
                            display: 'inline-block',
                            ...(i === 2 ? { marginTop: '0.1em' } : {}),
                        }}
                    >
                        {word}
                    </motion.span>
                ))}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                className="max-w-xl text-base md:text-lg text-white/40 leading-relaxed mb-10"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                custom={5}
            >
                From cameras to cars, studios to tools — discover, book, and rent
                anything you need from verified owners worldwide.
            </motion.p>

            {/* Search */}
            <motion.div
                className="w-full max-w-2xl mb-8 relative z-[501]"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                custom={6}
            >
                <SearchBar />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
                className="flex flex-col sm:flex-row items-center gap-4"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                custom={7}
            >
                <MagneticButton strength={0.2} cursorText="Go">
                    <Link href="/explore">
                        <button className="relative px-8 py-4 rounded-2xl font-medium text-white overflow-hidden group w-full sm:w-auto" suppressHydrationWarning>
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Explore Rentals
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]" />
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-[#a29bfe] to-[#fd79a8] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            />
                        </button>
                    </Link>
                </MagneticButton>

                <MagneticButton strength={0.15}>
                    <button className="px-8 py-4 rounded-2xl font-medium text-white/60 hover:text-white glass hover:bg-white/5 transition-all duration-300 flex items-center gap-2" suppressHydrationWarning>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                        </svg>
                        Watch Demo
                    </button>
                </MagneticButton>
            </motion.div>

            {/* Social proof */}
            <motion.div
                className="mt-16 flex flex-col sm:flex-row items-center gap-6"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                custom={9}
            >
                <div className="flex -space-x-3">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-9 h-9 rounded-full border-2 border-[#050508] bg-gradient-to-br from-[#6c5ce7]/40 to-[#a29bfe]/40 flex items-center justify-center text-[10px] text-white/60 font-medium"
                        >
                            {String.fromCharCode(65 + i)}
                        </div>
                    ))}
                </div>
                <div className="text-sm text-white/40">
                    <span className="text-white/70 font-semibold">2,847+</span> people renting right now
                </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
            >
                <motion.div
                    className="flex flex-col items-center gap-2"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <span className="text-[10px] text-white/20 tracking-widest uppercase">Scroll</span>
                    <div className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center p-1">
                        <motion.div
                            className="w-1 h-2 rounded-full bg-white/30"
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
