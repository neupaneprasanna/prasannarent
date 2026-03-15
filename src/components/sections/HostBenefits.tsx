'use client';

import { motion } from 'framer-motion';
import { DollarSign, Shield, Users, Rocket } from 'lucide-react';
import LiquidButton from '@/components/motion/LiquidButton';
import Link from 'next/link';

const benefits = [
    {
        icon: <DollarSign className="w-10 h-10" strokeWidth={1.5} />,
        title: 'passive income',
        description: 'turn your idle gear into a revenue stream. average hosts earn $1,200/month by listing just 5 items.',
        color: '#00FFB3'
    },
    {
        icon: <Shield className="w-10 h-10" strokeWidth={1.5} />,
        title: 'host protection',
        description: 'every rental is covered by our comprehensive $10,000 guarantee. we handle the security, you keep the profit.',
        color: '#7A5CFF'
    },
    {
        icon: <Users className="w-10 h-10" strokeWidth={1.5} />,
        title: 'community trust',
        description: 'connect with verified renters. our rating system ensures you only host responsible people.',
        color: '#00FFE1'
    },
    {
        icon: <Rocket className="w-10 h-10" strokeWidth={1.5} />,
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
                                <Link href="/listings/new">
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

                        <div className="grid sm:grid-cols-2 gap-8 lg:gap-12 mt-12 lg:mt-0">
                            {benefits.map((benefit, i) => (
                                <motion.div
                                    key={benefit.title}
                                    className="flex flex-col gap-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div
                                        className="w-20 h-20 rounded-3xl flex items-center justify-center relative bg-[#0a0b10] z-10 shadow-xl"
                                        style={{
                                            border: `1px solid ${benefit.color}40`,
                                            color: benefit.color,
                                            boxShadow: `0 0 40px ${benefit.color}20, inset 0 0 20px ${benefit.color}10`
                                        }}
                                    >
                                        <div 
                                            className="absolute inset-0 rounded-3xl opacity-40 blur-[3px]"
                                            style={{ background: `radial-gradient(circle, ${benefit.color}40 0%, transparent 80%)` }}
                                        />
                                        <div className="relative z-10">{benefit.icon}</div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
                                            {benefit.title}
                                        </h3>
                                        <p className="text-base sm:text-lg text-white/50 leading-relaxed">
                                            {benefit.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
