'use client';

import { motion } from 'framer-motion';
import { Shield, CheckCircle, Lock, Eye } from 'lucide-react';

const trustFeatures = [
    {
        icon: <Shield size={44} strokeWidth={1.5} />,
        title: 'identity verification',
        description: 'every user goes through multi-step ID verification. we check government IDs, selfie matching, and address history.',
        stat: '99.8%',
        statLabel: 'verified users',
        color: '#00F0FF',
    },
    {
        icon: <Lock size={44} strokeWidth={1.5} />,
        title: 'secure payments',
        description: 'payments are held in escrow until you confirm the rental. bank-level encryption protects every transaction.',
        stat: '$0',
        statLabel: 'fraud losses',
        color: '#7A5CFF',
    },
    {
        icon: <CheckCircle size={44} strokeWidth={1.5} />,
        title: 'damage protection',
        description: 'every rental includes up to $10,000 in damage protection. file a claim and get reimbursed within 72 hours.',
        stat: '$10K',
        statLabel: 'coverage per item',
        color: '#00FFB3',
    },
    {
        icon: <Eye size={44} strokeWidth={1.5} />,
        title: '24/7 monitoring',
        description: 'our trust & safety team monitors rentals around the clock. instant support for any issues that arise.',
        stat: '<2min',
        statLabel: 'response time',
        color: '#FF4D9D',
    },
];

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function TrustSafety() {
    return (
        <section className="section-padding relative overflow-hidden">
            {/* Diagonal gradient background */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(135deg, rgba(0,240,255,0.02) 0%, transparent 40%, rgba(122,92,255,0.03) 100%)',
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
                    {/* Left Column - Large Hero Header */}
                    <motion.div
                        className="w-full lg:w-5/12"
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={spring}
                    >
                        <span className="text-label mb-6 block" style={{ color: '#00FFB3', textShadow: '0 0 20px rgba(0,255,179,0.3)' }}>
                            trust & safety
                        </span>
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-8 leading-[1.1] text-white tracking-tighter">
                            your safety is our <br className="hidden lg:block"/><span className="gradient-text">priority</span>
                        </h2>
                        <p className="text-lg text-white/40 mb-10 leading-relaxed max-w-md">
                            industry-leading protection for every rental, every time. we use advanced AI and real human checks to keep our community safe.
                        </p>

                        {/* Large trusted badge */}
                        <div className="inline-flex items-center gap-6 py-6 px-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
                            <Shield className="w-14 h-14 text-[#00FFB3]" />
                            <div>
                                <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter" style={{ textShadow: '0 0 30px rgba(0,255,179,0.4)' }}>$10M+</div>
                                <div className="text-sm text-white/50 uppercase tracking-widest font-bold mt-1">Protected Value</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column - Clean Feature List */}
                    <div className="w-full lg:w-7/12 flex flex-col gap-10 sm:gap-14">
                        {trustFeatures.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                className="group relative flex flex-col sm:flex-row gap-6 items-start"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ ...spring, delay: i * 0.1 }}
                            >
                                    {/* Left Icon & Decorative Line */}
                                <div className="flex flex-col items-center gap-6 shrink-0">
                                    <div
                                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-2xl"
                                        style={{
                                            background: `linear-gradient(135deg, ${feature.color}15, transparent)`,
                                            border: `1px solid ${feature.color}40`,
                                            color: feature.color,
                                            boxShadow: `0 0 40px ${feature.color}20`,
                                        }}
                                    >
                                        {feature.icon}
                                    </div>
                                    <div className="w-[2px] h-full min-h-[40px] hidden sm:block opacity-20 group-hover:opacity-60 transition-opacity"
                                        style={{ background: `linear-gradient(to bottom, ${feature.color}, transparent)` }}
                                    />
                                </div>

                                {/* Right Content Area */}
                                <div className="flex-1 pb-4 sm:pb-0">
                                    <h3 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight text-transparent bg-clip-text transition-all duration-300"
                                        style={{ backgroundImage: `linear-gradient(to right, #fff, ${feature.color})` }}
                                    >
                                        {feature.title}
                                    </h3>
                                    <p className="text-lg sm:text-xl text-white/50 leading-relaxed mb-8 max-w-xl">
                                        {feature.description}
                                    </p>

                                    {/* Embedded Stat */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-[2px] opacity-40" style={{ background: feature.color }} />
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-4xl sm:text-5xl font-bold tabular-nums" style={{ color: feature.color, textShadow: `0 0 30px ${feature.color}40` }}>
                                                {feature.stat}
                                            </span>
                                            <span className="text-sm font-bold text-white/40 uppercase tracking-widest">
                                                {feature.statLabel}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Trust bar — bottom */}
                <motion.div
                    className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ ...spring, delay: 0.4 }}
                >
                    {[
                        { label: 'SSL secured', icon: '🔒' },
                        { label: 'SOC2 compliant', icon: '✓' },
                        { label: 'GDPR ready', icon: '🛡️' },
                        { label: 'PCI DSS certified', icon: '💳' },
                    ].map((badge) => (
                        <div key={badge.label} className="flex items-center gap-2 text-white/20 text-xs tracking-wider uppercase">
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
