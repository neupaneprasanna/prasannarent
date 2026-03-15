'use client';

import { motion } from 'framer-motion';

const steps = [
    {
        number: '01',
        title: 'search & discover',
        description: 'find anything you need with our AI-powered search. browse categories or describe what you need in natural language.',
        icon: (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                    {/* Desktop continuous timeline line */}
                    <div
                        className="hidden md:block absolute top-16 left-[10%] right-[10%] h-[2px] z-0"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.4), rgba(122,92,255,0.6), rgba(0,255,179,0.4), transparent)',
                            boxShadow: '0 0 20px rgba(122,92,255,0.3)',
                        }}
                    />

                    {steps.map((step, i) => (
                        <motion.div
                            key={step.number}
                            className="group relative flex flex-col items-center text-center px-4 sm:px-8 py-6 z-10"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ ...spring, delay: i * 0.15 }}
                        >
                            {/* Number floating behind icon */}
                            <div
                                className="absolute -top-4 text-[10rem] sm:text-[14rem] font-black leading-none tracking-tighter mix-blend-screen pointer-events-none select-none transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-6"
                                style={{
                                    color: `${step.color}06`,
                                    WebkitTextStroke: `2px ${step.color}15`,
                                }}
                            >
                                {step.number}
                            </div>

                            {/* Node Icon on Timeline */}
                            <motion.div
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-10 relative bg-[#0a0b10] z-20"
                                whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                                transition={{
                                    ...spring,
                                    rotate: { duration: 0.4, ease: "easeInOut" }
                                }}
                                style={{
                                    border: `2px solid ${step.color}40`,
                                    color: step.color,
                                    boxShadow: `0 0 40px ${step.color}20, inset 0 0 30px ${step.color}20`,
                                }}
                            >
                                {/* Inner glow pulse */}
                                <div 
                                    className="absolute inset-0 rounded-full animate-pulse opacity-50"
                                    style={{ background: `radial-gradient(circle, ${step.color}50 0%, transparent 70%)` }}
                                />
                                <div className="relative z-10">
                                    {step.icon}
                                </div>
                            </motion.div>

                            <h3 className="text-2xl sm:text-3xl font-bold mb-6 tracking-tight text-transparent bg-clip-text transition-all duration-300 relative z-30"
                                style={{ backgroundImage: `linear-gradient(to right, #fff, ${step.color})` }}
                            >
                                {step.title}
                            </h3>
                            <p className="text-lg sm:text-xl text-white/50 leading-relaxed max-w-md relative z-30">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
