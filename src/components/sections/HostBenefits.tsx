'use client';

import { motion } from 'framer-motion';
import { DollarSign, Shield, Users, Rocket } from 'lucide-react';
import LiquidButton from '@/components/motion/LiquidButton';
import Link from 'next/link';

const benefits = [
    {
        icon: <DollarSign className="w-6 h-6" />,
        title: 'passive income',
        description: 'turn your idle gear into a revenue stream. average hosts earn $1,200/month by listing just 5 items.',
        color: '#00FFB3'
    },
    {
        icon: <Shield className="w-6 h-6" />,
        title: 'host protection',
        description: 'every rental is covered by our comprehensive $10,000 guarantee. we handle the security, you keep the profit.',
        color: '#7A5CFF'
    },
    {
        icon: <Users className="w-6 h-6" />,
        title: 'community trust',
        description: 'connect with verified renters. our rating system ensures you only host responsible people.',
        color: '#00FFE1'
    },
    {
        icon: <Rocket className="w-6 h-6" />,
        title: 'easy listing',
        description: 'our AI-powered listing tool helps you write descriptions and set competitive prices in seconds.',
        color: '#FF4D9D'
    }
];

export default function HostBenefits() {
    return (
        <section className="section-padding relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="capsule bg-white/[0.02] border-white/[0.04] p-8 md:p-16 relative overflow-hidden">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#7A5CFF] opacity-[0.03] blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#00FFB3] opacity-[0.02] blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

                    <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                        <div>
                            <motion.span
                                className="text-label text-[#00FFB3] mb-4 block"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                for owners
                            </motion.span>
                            <motion.h2
                                className="text-section mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                list your items and <br />
                                <span className="gradient-text-energy">start earning</span> today
                            </motion.h2>
                            <motion.p
                                className="text-body text-white/40 mb-10 max-w-md"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                            >
                                join thousands of verified hosts and turn your assets into a thriving rental business.
                            </motion.p>

                            <div className="flex flex-wrap gap-4">
                                <Link href="/host">
                                    <LiquidButton variant="primary" size="lg">
                                        become a host
                                    </LiquidButton>
                                </Link>
                                <Link href="/explore">
                                    <LiquidButton variant="ghost" size="lg">
                                        learn more
                                    </LiquidButton>
                                </Link>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {benefits.map((benefit, i) => (
                                <motion.div
                                    key={benefit.title}
                                    className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                        style={{
                                            background: `${benefit.color}15`,
                                            color: benefit.color,
                                            boxShadow: `0 0 20px ${benefit.color}10`
                                        }}
                                    >
                                        {benefit.icon}
                                    </div>
                                    <h3 className="text-white/90 font-medium mb-2">{benefit.title}</h3>
                                    <p className="text-[12px] text-white/30 leading-relaxed">
                                        {benefit.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
