'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import LiquidButton from '@/components/motion/LiquidButton';

const showcaseItems = [
    {
        title: 'sony a7iv camera kit',
        category: 'photography',
        price: '$89',
        period: '/day',
        rating: 4.9,
        reviews: 142,
        image: '📷',
        gradient: 'from-[#22D3EE]/10 to-[#8B5CF6]/10',
        accentColor: '#22D3EE',
        description: 'full-frame mirrorless with 3 lenses, gimbal, and lighting kit',
    },
    {
        title: 'tesla model 3',
        category: 'vehicles',
        price: '$149',
        period: '/day',
        rating: 4.8,
        reviews: 89,
        image: '🚗',
        gradient: 'from-[#8B5CF6]/10 to-[#A5B4FC]/10',
        accentColor: '#8B5CF6',
        description: 'long range AWD, autopilot enabled, 310 mile range',
    },
    {
        title: 'downtown loft studio',
        category: 'spaces',
        price: '$199',
        period: '/day',
        rating: 5.0,
        reviews: 67,
        image: '🏢',
        gradient: 'from-[#F472B6]/10 to-[#FDE68A]/10',
        accentColor: '#F472B6',
        description: '1200 sqft creative studio with natural lighting, perfect for shoots',
    },
    {
        title: 'dji mavic 3 pro',
        category: 'drones',
        price: '$75',
        period: '/day',
        rating: 4.7,
        reviews: 203,
        image: '🚁',
        gradient: 'from-[#34D399]/10 to-[#22D3EE]/10',
        accentColor: '#34D399',
        description: 'hasselblad camera, 46min flight, 4K/120fps, all accessories',
    },
];

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function FeaturedShowcase() {
    return (
        <section className="section-padding relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header with CTA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-14 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={spring}
                    >
                        <span className="text-label mb-4 block" style={{ color: '#F472B6', textShadow: '0 0 20px rgba(244,114,182,0.3)' }}>
                            featured
                        </span>

                        <p className="text-body text-white/35 max-w-md">
                            hand-picked items loved by our community this week.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ ...spring, delay: 0.2 }}
                    >
                        <Link href="/explore">
                            <LiquidButton variant="ghost" size="sm">
                                view all <ArrowRight size={14} />
                            </LiquidButton>
                        </Link>
                    </motion.div>
                </div>

                {/* Showcase cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {showcaseItems.map((item, i) => (
                        <motion.div
                            key={item.title}
                            className="group relative rounded-2xl overflow-hidden cursor-pointer"
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ ...spring, delay: i * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(7,8,13,0.98) 0%, rgba(2,3,5,0.9) 100%)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                backdropFilter: 'blur(24px)',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
                            }}
                        >
                            {/* Image placeholder with gradient */}
                            <div
                                className={`relative h-44 flex items-center justify-center bg-gradient-to-br ${item.gradient}`}
                                style={{
                                    borderBottom: `1px solid rgba(255,255,255,0.04)`,
                                }}
                            >
                                <span className="text-6xl opacity-60 group-hover:scale-110 transition-transform duration-500">
                                    {item.image}
                                </span>

                                {/* Category badge */}
                                <div
                                    className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-medium"
                                    style={{
                                        background: `${item.accentColor}15`,
                                        color: item.accentColor,
                                        border: `1px solid ${item.accentColor}20`,
                                        backdropFilter: 'blur(8px)',
                                    }}
                                >
                                    {item.category}
                                </div>

                                {/* Rating badge */}
                                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                                    style={{
                                        background: 'rgba(0,0,0,0.4)',
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <Star size={10} fill="#FFD700" stroke="#FFD700" />
                                    <span className="text-white/80 font-medium">{item.rating}</span>
                                    <span className="text-white/25 ml-0.5">({item.reviews})</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="text-sm font-medium text-white/85 mb-1.5 tracking-tight group-hover:text-white transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-white/25 leading-relaxed mb-4 line-clamp-2">
                                    {item.description}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-lg font-light" style={{ color: item.accentColor }}>
                                            {item.price}
                                        </span>
                                        <span className="text-xs text-white/25 ml-1">{item.period}</span>
                                    </div>

                                    <LiquidButton variant="secondary" size="sm" className="!px-4 !py-1.5 !rounded-lg text-[10px]">
                                        rent now
                                    </LiquidButton>
                                </div>
                            </div>

                            {/* Hover glow */}
                            <div
                                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background: `radial-gradient(circle at 50% 0%, ${item.accentColor}08 0%, transparent 50%)`,
                                }}
                            />

                            {/* Bottom accent */}
                            <div
                                className="absolute bottom-0 left-[10%] right-[10%] h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `linear-gradient(90deg, transparent, ${item.accentColor}50, transparent)` }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
