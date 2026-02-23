'use client';

import { motion } from 'framer-motion';

const steps = [
    {
        number: '01',
        title: 'search & discover',
        description: 'find anything you need with our AI-powered search. browse categories or describe what you need in natural language.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
            </svg>
        ),
        color: '#00F0FF',
    },
    {
        number: '02',
        title: 'book instantly',
        description: 'select your dates, review pricing, and book in seconds. secure payments protected by our guarantee.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
        color: '#7A5CFF',
    },
    {
        number: '03',
        title: 'enjoy & return',
        description: 'pick up or get it delivered. use it for your project, then return it. rate your experience and earn rewards.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        ),
        color: '#00FFB3',
    },
];

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function HowItWorks() {
    return (
        <section className="section-padding relative" id="how-it-works">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <span className="text-label mb-4 block" style={{ color: '#FF4D9D', textShadow: '0 0 20px rgba(255,77,157,0.3)' }}>simple process</span>
                    <h2 className="text-section mb-4">
                        how <span className="gradient-text">rentverse</span> works
                    </h2>
                    <p className="text-body text-white/35 max-w-md mx-auto">
                        three simple steps to rent anything you need, anywhere in the world.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative">
                    {/* Desktop connector line — visible luminous path */}
                    <div
                        className="hidden md:block absolute top-24 left-[calc(33.33%-1rem)] right-[calc(33.33%-1rem)] h-[2px]"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.25), rgba(122,92,255,0.3), rgba(0,255,179,0.25), transparent)',
                            boxShadow: '0 0 12px rgba(122,92,255,0.15)',
                        }}
                    />

                    {steps.map((step, i) => (
                        <motion.div
                            key={step.number}
                            className="group relative p-6 sm:p-8 rounded-2xl overflow-hidden"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ ...spring, delay: i * 0.12 }}
                            whileHover={{ y: -6 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(16,17,26,0.9) 0%, rgba(10,11,16,0.8) 100%)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                            }}
                        >
                            {/* Step number — visible watermark */}
                            <div
                                className="absolute top-4 right-5 text-6xl font-light tracking-tight"
                                style={{ color: `${step.color}10` }}
                            >
                                {step.number}
                            </div>

                            {/* Icon with colored glow background */}
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300"
                                style={{
                                    background: `linear-gradient(135deg, ${step.color}20, ${step.color}08)`,
                                    border: `1px solid ${step.color}25`,
                                    color: step.color,
                                    boxShadow: `0 0 25px ${step.color}15, inset 0 1px 0 ${step.color}10`,
                                }}
                            >
                                {step.icon}
                            </div>

                            <h3 className="text-base font-medium text-white/85 mb-3 tracking-tight group-hover:text-white transition-colors">
                                {step.title}
                            </h3>
                            <p className="text-sm text-white/35 leading-relaxed">{step.description}</p>

                            {/* Hover glow — stronger */}
                            <div
                                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background: `radial-gradient(circle at 50% 30%, ${step.color}15 0%, transparent 70%)`,
                                    boxShadow: `inset 0 0 40px ${step.color}05`,
                                }}
                            />

                            {/* Bottom colored accent */}
                            <div
                                className="absolute bottom-0 left-[10%] right-[10%] h-[2px] opacity-40 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `linear-gradient(90deg, transparent, ${step.color}60, transparent)` }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
