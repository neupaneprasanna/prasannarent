'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import LiquidButton from '@/components/motion/LiquidButton';

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function CTASection() {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    return (
        <section className="section-padding relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <motion.div
                    className="relative rounded-3xl overflow-hidden"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                    style={{
                        border: '1px solid rgba(122,92,255,0.15)',
                        boxShadow: '0 0 80px rgba(122,92,255,0.08), 0 20px 60px rgba(0,0,0,0.4)',
                    }}
                >
                    {/* Background — deep void with strong radial glows */}
                    <div className="absolute inset-0" style={{
                        background: 'linear-gradient(135deg, #08091A 0%, #0D0F1A 50%, #08091A 100%)',
                    }} />

                    {/* Primary radial glow — very visible */}
                    <div className="absolute inset-0" style={{
                        background: 'radial-gradient(ellipse at 50% 20%, rgba(122,92,255,0.2) 0%, transparent 60%)',
                    }} />

                    {/* Secondary cyan glow */}
                    <div className="absolute inset-0" style={{
                        background: 'radial-gradient(ellipse at 20% 80%, rgba(0,240,255,0.08) 0%, transparent 50%)',
                    }} />

                    {/* Floating particles — brighter */}
                    <div className="absolute inset-0 overflow-hidden">
                        {isMounted && [...Array(25)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    width: `${1 + Math.random() * 2}px`,
                                    height: `${1 + Math.random() * 2}px`,
                                    background: i % 3 === 0 ? 'rgba(122,92,255,0.6)' : i % 3 === 1 ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.3)',
                                    boxShadow: i % 3 === 0 ? '0 0 6px rgba(122,92,255,0.4)' : i % 3 === 1 ? '0 0 6px rgba(0,240,255,0.3)' : 'none',
                                }}
                                animate={{
                                    y: [0, -100, 0],
                                    opacity: [0, 0.8, 0],
                                }}
                                transition={{
                                    duration: 4 + Math.random() * 4,
                                    repeat: Infinity,
                                    delay: Math.random() * 4,
                                }}
                            />
                        ))}
                    </div>

                    {/* Geometric mesh — slightly more visible */}
                    <div className="absolute inset-0 opacity-[0.04]" style={{
                        backgroundImage: 'linear-gradient(rgba(122,92,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(122,92,255,0.2) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }} />

                    {/* Content */}
                    <div className="relative z-10 py-16 sm:py-20 md:py-28 px-6 sm:px-8 md:px-16 text-center">
                        <motion.h2
                            className="text-section sm:text-4xl md:text-5xl text-white/90 mb-6 font-light"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ ...spring, delay: 0.1 }}
                            style={{ textShadow: '0 0 40px rgba(122,92,255,0.15)' }}
                        >
                            ready to start <span className="gradient-text">renting</span>?
                        </motion.h2>

                        <motion.p
                            className="text-body text-white/35 max-w-lg mx-auto mb-10"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ ...spring, delay: 0.2 }}
                        >
                            join thousands of users who rent smarter, not harder. list your items or find what you need today.
                        </motion.p>

                        <motion.div
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ ...spring, delay: 0.3 }}
                        >
                            <Link href="/explore">
                                <LiquidButton variant="primary" size="lg">
                                    start renting now
                                </LiquidButton>
                            </Link>

                            <Link href="/listings/new">
                                <LiquidButton variant="secondary" size="lg">
                                    list your items
                                </LiquidButton>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Top border glow */}
                    <div className="absolute top-0 left-[5%] right-[5%] h-[2px]"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(122,92,255,0.4), rgba(0,240,255,0.3), transparent)',
                            boxShadow: '0 0 15px rgba(122,92,255,0.15)',
                        }}
                    />

                    {/* Bottom border glow */}
                    <div className="absolute bottom-0 left-[5%] right-[5%] h-[2px]"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.3), rgba(122,92,255,0.4), transparent)',
                            boxShadow: '0 0 15px rgba(0,240,255,0.1)',
                        }}
                    />
                </motion.div>
            </div>
        </section>
    );
}
