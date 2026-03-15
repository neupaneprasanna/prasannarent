'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Heart, Clock, TrendingUp } from 'lucide-react';

const features = [
    {
        icon: <Zap size={40} strokeWidth={1.5} />,
        title: 'instant booking',
        description: 'book any item in seconds with our streamlined checkout. no waiting for approval — confirmed instantly.',
        color: '#00F0FF',
    },
    {
        icon: <Shield size={40} strokeWidth={1.5} />,
        title: 'full protection',
        description: 'every rental is covered by our $10,000 protection guarantee. rent with complete peace of mind.',
        color: '#7A5CFF',
    },
    {
        icon: <Globe size={40} strokeWidth={1.5} />,
        title: 'global access',
        description: 'access millions of items across 120+ cities worldwide. rent locally or ship anywhere.',
        color: '#00FFB3',
    },
    {
        icon: <Heart size={40} strokeWidth={1.5} />,
        title: 'verified community',
        description: 'every owner and renter is ID-verified. real reviews from real people you can trust.',
        color: '#FF4D9D',
    },
    {
        icon: <Clock size={40} strokeWidth={1.5} />,
        title: 'flexible duration',
        description: 'rent for an hour, a day, a week, or a month. extend anytime with one tap.',
        color: '#A18CFF',
    },
    {
        icon: <TrendingUp size={40} strokeWidth={1.5} />,
        title: 'earn as owner',
        description: 'list your items and earn passive income. average owners make $1,200/month on RentVerse.',
        color: '#00FFE1',
    },
];

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function WhyRentVerse() {
    return (
        <section className="section-padding relative overflow-hidden" id="why-rentverse">
            {/* Background gradient */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(122,92,255,0.04) 0%, transparent 70%)',
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
                    
                    {/* Sticky Left Column - Header */}
                    <div className="w-full lg:w-1/3 lg:sticky lg:top-32">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={spring}
                        >
                            <span className="text-label mb-4 block" style={{ color: '#7A5CFF', textShadow: '0 0 20px rgba(122,92,255,0.3)' }}>
                                why rentverse
                            </span>
                            <h2 className="text-section mb-6">
                                built for<br/><span className="gradient-text">modern</span> life
                            </h2>
                            <p className="text-body text-white/40 max-w-sm mb-8">
                                everything you need to rent smarter, safer, and faster — all centralized in one trusted platform.
                            </p>
                            
                            {/* Decorative element */}
                            <div className="w-12 h-1 bg-gradient-to-r from-[#7A5CFF] to-[#00F0FF] rounded-full opacity-50"/>
                        </motion.div>
                    </div>

                    {/* Scrolling Right Column - Feature List */}
                    <div className="w-full lg:w-2/3 flex flex-col">
                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                className="group relative py-8 sm:py-10 border-b border-white/5 last:border-b-0"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{ ...spring, delay: i * 0.1 }}
                            >
                                <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start sm:items-center">
                                    {/* Icon Container - Floating */}
                                    <div
                                        className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-[2rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl"
                                        style={{
                                            background: `linear-gradient(135deg, ${feature.color}15, ${feature.color}05)`,
                                            border: `1px solid ${feature.color}40`,
                                            color: feature.color,
                                            boxShadow: `0 0 40px ${feature.color}20, inset 0 0 20px ${feature.color}10`,
                                        }}
                                    >
                                        {feature.icon}
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1">
                                        <h3 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight text-transparent bg-clip-text transition-all duration-300"
                                            style={{ backgroundImage: `linear-gradient(to right, #fff, ${feature.color})` }}
                                        >
                                            {feature.title}
                                        </h3>
                                        <p className="text-lg sm:text-xl text-white/50 leading-relaxed max-w-xl">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Minimal Hover Glow Behind Item */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -z-10"
                                    style={{
                                        background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${feature.color}08 0%, transparent 60%)`,
                                    }}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
