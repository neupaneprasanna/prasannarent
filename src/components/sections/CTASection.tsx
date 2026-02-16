'use client';

import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations/motion-config';
import MagneticButton from '@/components/cursor/MagneticButton';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CTASection() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <section className="section-padding relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    className="relative rounded-3xl overflow-hidden"
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {/* Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6c5ce7] via-[#a29bfe] to-[#fd79a8]" />
                    <div className="absolute inset-0 bg-black/40" />

                    {/* Floating particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {isMounted && [...Array(15)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 rounded-full bg-white/20"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    y: [0, -100, 0],
                                    opacity: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 3,
                                    repeat: Infinity,
                                    delay: Math.random() * 3,
                                }}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="relative z-10 py-16 md:py-24 px-8 md:px-16 text-center">
                        <motion.h2
                            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            Ready to Start Renting?
                        </motion.h2>
                        <motion.p
                            className="text-base md:text-lg text-white/60 max-w-lg mx-auto mb-10"
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            custom={1}
                        >
                            Join thousands of users who rent smarter, not harder. List your items or find what you need today.
                        </motion.p>

                        <motion.div
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            custom={2}
                        >
                            <MagneticButton strength={0.2}>
                                <Link href="/explore">
                                    <button className="px-8 py-4 bg-white text-black font-semibold rounded-2xl hover:bg-white/90 transition-colors text-sm" suppressHydrationWarning>
                                        Start Renting Now
                                    </button>
                                </Link>
                            </MagneticButton>
                            <MagneticButton strength={0.15}>
                                <Link href="/listings/new">
                                    <button className="px-8 py-4 border border-white/30 text-white font-medium rounded-2xl hover:bg-white/10 transition-colors text-sm" suppressHydrationWarning>
                                        List Your Items
                                    </button>
                                </Link>
                            </MagneticButton>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
