'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Heart, Clock, TrendingUp } from 'lucide-react';

const features = [
    {
        icon: <Zap size={24} />,
        title: 'instant booking',
        description: 'book any item in seconds with our streamlined checkout. no waiting for approval — confirmed instantly.',
        color: '#00F0FF',
    },
    {
        icon: <Shield size={24} />,
        title: 'full protection',
        description: 'every rental is covered by our $10,000 protection guarantee. rent with complete peace of mind.',
        color: '#7A5CFF',
    },
    {
        icon: <Globe size={24} />,
        title: 'global access',
        description: 'access millions of items across 120+ cities worldwide. rent locally or ship anywhere.',
        color: '#00FFB3',
    },
    {
        icon: <Heart size={24} />,
        title: 'verified community',
        description: 'every owner and renter is ID-verified. real reviews from real people you can trust.',
        color: '#FF4D9D',
    },
    {
        icon: <Clock size={24} />,
        title: 'flexible duration',
        description: 'rent for an hour, a day, a week, or a month. extend anytime with one tap.',
        color: '#A18CFF',
    },
    {
        icon: <TrendingUp size={24} />,
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
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <span className="text-label mb-4 block" style={{ color: '#7A5CFF', textShadow: '0 0 20px rgba(122,92,255,0.3)' }}>
                        why rentverse
                    </span>
                    <h2 className="text-section mb-4">
                        built for <span className="gradient-text">modern</span> life
                    </h2>
                    <p className="text-body text-white/35 max-w-lg mx-auto">
                        everything you need to rent smarter, safer, and faster — all in one platform.
                    </p>
                </motion.div>

                {/* Feature grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            className="group relative p-6 sm:p-8 rounded-2xl overflow-hidden cursor-default"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ ...spring, delay: i * 0.08 }}
                            whileHover={{ y: -6, scale: 1.02 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(16,17,26,0.9) 0%, rgba(10,11,16,0.8) 100%)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
                            }}
                        >
                            {/* Icon */}
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                                style={{
                                    background: `linear-gradient(135deg, ${feature.color}18, ${feature.color}08)`,
                                    border: `1px solid ${feature.color}20`,
                                    color: feature.color,
                                    boxShadow: `0 0 20px ${feature.color}10`,
                                }}
                            >
                                {feature.icon}
                            </div>

                            <h3 className="text-base font-medium text-white/85 mb-2 tracking-tight group-hover:text-white transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-white/35 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Hover glow */}
                            <div
                                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background: `radial-gradient(circle at 30% 20%, ${feature.color}12 0%, transparent 60%)`,
                                }}
                            />

                            {/* Bottom accent line */}
                            <div
                                className="absolute bottom-0 left-[10%] right-[10%] h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `linear-gradient(90deg, transparent, ${feature.color}60, transparent)` }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
