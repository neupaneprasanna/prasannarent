'use client';

import { motion } from 'framer-motion';

const testimonials = [
    { name: 'Sarah Mitchell', role: 'photographer', quote: 'rented a Sony A7IV for a weekend shoot. seamless experience, gear arrived in perfect condition. this platform is a game-changer.', avatar: 'S', rating: 5, color: '#00F0FF' },
    { name: 'David Park', role: 'filmmaker', quote: 'I needed a drone for a short film project. found one within minutes, and the owner was incredibly helpful. will definitely use again.', avatar: 'D', rating: 5, color: '#7A5CFF' },
    { name: 'Emily Rodriguez', role: 'event planner', quote: 'rented lighting and sound equipment for a corporate event. saved us thousands compared to buying. customer support was exceptional.', avatar: 'E', rating: 5, color: '#00FFB3' },
];

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function Testimonials() {
    return (
        <section className="section-padding relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <span className="text-label mb-4 block" style={{ color: '#A18CFF', textShadow: '0 0 20px rgba(161,140,255,0.3)' }}>testimonials</span>
                    <h2 className="text-section mb-4">
                        what <span className="gradient-text">renters</span> say
                    </h2>
                    <p className="text-body text-white/35 max-w-md mx-auto">
                        hear from our community of satisfied renters and hosts.
                    </p>
                </motion.div>

                {/* Testimonial cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.name}
                            className="group relative p-6 sm:p-8 rounded-2xl overflow-hidden"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ ...spring, delay: i * 0.1 }}
                            whileHover={{ y: -6 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(16,17,26,0.9) 0%, rgba(10,11,16,0.8) 100%)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                            }}
                        >
                            {/* Stars — colored */}
                            <div className="flex gap-1 mb-6">
                                {[...Array(t.rating)].map((_, j) => (
                                    <svg key={j} width="16" height="16" viewBox="0 0 24 24" fill={t.color} className="opacity-80">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                ))}
                            </div>

                            <p className="text-white/50 text-sm leading-relaxed mb-8 italic">
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                                    style={{
                                        background: `linear-gradient(135deg, ${t.color}40, ${t.color}15)`,
                                        color: t.color,
                                        border: `1px solid ${t.color}30`,
                                        boxShadow: `0 0 15px ${t.color}15`,
                                    }}
                                >
                                    {t.avatar}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white/80">{t.name}</p>
                                    <p className="text-xs text-white/30">{t.role}</p>
                                </div>
                            </div>

                            {/* Hover glow */}
                            <div
                                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background: `radial-gradient(circle at 50% 80%, ${t.color}12 0%, transparent 60%)`,
                                    boxShadow: `inset 0 0 40px ${t.color}05`,
                                }}
                            />

                            {/* Bottom accent */}
                            <div
                                className="absolute bottom-0 left-[10%] right-[10%] h-[2px] opacity-30 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `linear-gradient(90deg, transparent, ${t.color}60, transparent)` }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
