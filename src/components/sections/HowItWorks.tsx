'use client';

import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';

const steps = [
    {
        number: '01',
        title: 'Search & Discover',
        description: 'Find anything you need with our AI-powered search. Browse categories or describe what you need in natural language.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
            </svg>
        ),
        gradient: 'from-[#6c5ce7] to-[#a29bfe]',
    },
    {
        number: '02',
        title: 'Book Instantly',
        description: 'Select your dates, review pricing, and book in seconds. Secure payments protected by our guarantee.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
        gradient: 'from-[#a29bfe] to-[#fd79a8]',
    },
    {
        number: '03',
        title: 'Enjoy & Return',
        description: 'Pick up or get it delivered. Use it for your project, then return it. Rate your experience and earn rewards.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        ),
        gradient: 'from-[#fd79a8] to-[#00cec9]',
    },
];

export default function HowItWorks() {
    return (
        <section className="section-padding relative" id="how-it-works">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <span className="inline-block text-xs tracking-[0.3em] uppercase text-[#fd79a8] mb-4">
                        Simple Process
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        How <span className="gradient-text">RentVerse</span> Works
                    </h2>
                    <p className="text-white/40 max-w-md mx-auto">
                        Three simple steps to rent anything you need, anywhere in the world.
                    </p>
                </motion.div>

                {/* Steps */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                >
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.number}
                            className="relative group"
                            variants={fadeInUp}
                            custom={i}
                        >
                            <div className="glass-card rounded-2xl p-8 h-full relative overflow-hidden">
                                {/* Step number */}
                                <div className="absolute top-6 right-6 text-6xl font-bold text-white/[0.03]">
                                    {step.number}
                                </div>

                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 text-white`}>
                                    {step.icon}
                                </div>

                                <h3 className="text-lg font-semibold text-white/90 mb-3">{step.title}</h3>
                                <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>

                                {/* Connector line for desktop */}
                                {i < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-white/10 to-transparent" />
                                )}

                                {/* Hover glow */}
                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{
                                        background: `radial-gradient(circle at 50% 50%, rgba(108,92,231,0.05) 0%, transparent 70%)`,
                                    }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
