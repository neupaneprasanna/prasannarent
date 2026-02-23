'use client';

import { motion } from 'framer-motion';
import { Shield, CheckCircle, Lock, Eye } from 'lucide-react';

const trustFeatures = [
    {
        icon: <Shield size={28} />,
        title: 'identity verification',
        description: 'every user goes through multi-step ID verification. we check government IDs, selfie matching, and address history.',
        stat: '99.8%',
        statLabel: 'verified users',
        color: '#00F0FF',
    },
    {
        icon: <Lock size={28} />,
        title: 'secure payments',
        description: 'payments are held in escrow until you confirm the rental. bank-level encryption protects every transaction.',
        stat: '$0',
        statLabel: 'fraud losses',
        color: '#7A5CFF',
    },
    {
        icon: <CheckCircle size={28} />,
        title: 'damage protection',
        description: 'every rental includes up to $10,000 in damage protection. file a claim and get reimbursed within 72 hours.',
        stat: '$10K',
        statLabel: 'coverage per item',
        color: '#00FFB3',
    },
    {
        icon: <Eye size={28} />,
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
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <span className="text-label mb-4 block" style={{ color: '#00FFB3', textShadow: '0 0 20px rgba(0,255,179,0.3)' }}>
                        trust & safety
                    </span>
                    <h2 className="text-section mb-4">
                        your safety is our <span className="gradient-text">priority</span>
                    </h2>
                    <p className="text-body text-white/35 max-w-lg mx-auto">
                        industry-leading protection for every rental, every time.
                    </p>
                </motion.div>

                {/* Trust cards - 2x2 grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {trustFeatures.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            className="group relative p-7 sm:p-9 rounded-2xl overflow-hidden"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ ...spring, delay: i * 0.1 }}
                            whileHover={{ y: -4, scale: 1.01 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(16,17,26,0.9) 0%, rgba(10,11,16,0.8) 100%)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
                            }}
                        >
                            <div className="flex items-start gap-5">
                                {/* Icon */}
                                <div
                                    className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                                    style={{
                                        background: `linear-gradient(135deg, ${feature.color}18, ${feature.color}08)`,
                                        border: `1px solid ${feature.color}20`,
                                        color: feature.color,
                                        boxShadow: `0 0 20px ${feature.color}10`,
                                    }}
                                >
                                    {feature.icon}
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-base font-medium text-white/85 mb-2 tracking-tight group-hover:text-white transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-white/35 leading-relaxed mb-4">
                                        {feature.description}
                                    </p>

                                    {/* Stat badge */}
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="text-2xl font-light tabular-nums"
                                            style={{ color: feature.color, textShadow: `0 0 20px ${feature.color}30` }}
                                        >
                                            {feature.stat}
                                        </span>
                                        <span className="text-xs text-white/25 uppercase tracking-wider">
                                            {feature.statLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Hover glow */}
                            <div
                                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background: `radial-gradient(circle at 20% 50%, ${feature.color}10 0%, transparent 60%)`,
                                }}
                            />

                            {/* Left accent line */}
                            <div
                                className="absolute left-0 top-[15%] bottom-[15%] w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `linear-gradient(to bottom, transparent, ${feature.color}60, transparent)` }}
                            />
                        </motion.div>
                    ))}
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
