'use client';

import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';

const testimonials = [
    {
        name: 'Sarah Mitchell',
        role: 'Professional Photographer',
        quote: 'RentVerse saved my career. I rented a $5,000 lens for a weekend shoot at a fraction of the cost. The experience was seamless.',
        avatar: 'S',
        rating: 5,
    },
    {
        name: 'James Chen',
        role: 'Startup Founder',
        quote: 'We furnished our entire pop-up office through RentVerse. Standing desks, monitors, even an espresso machine. Incredible platform.',
        avatar: 'J',
        rating: 5,
    },
    {
        name: 'Maria Rodriguez',
        role: 'Film Director',
        quote: 'Finding professional film equipment has never been easier. The AI search understood exactly what I needed for my indie project.',
        avatar: 'M',
        rating: 5,
    },
];

export default function Testimonials() {
    return (
        <section className="section-padding relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fd79a8]/5 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <span className="inline-block text-xs tracking-[0.3em] uppercase text-[#fdcb6e] mb-4">
                        Testimonials
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold">
                        Loved by <span className="gradient-text">Thousands</span>
                    </h2>
                </motion.div>

                {/* Cards */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                >
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.name}
                            className="glass-card rounded-2xl p-8 relative group"
                            variants={fadeInUp}
                            custom={i}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Quote mark */}
                            <div className="text-5xl text-[#6c5ce7]/20 font-serif leading-none mb-4">&ldquo;</div>

                            <p className="text-sm text-white/60 leading-relaxed mb-6">{t.quote}</p>

                            {/* Stars */}
                            <div className="flex gap-1 mb-6">
                                {[...Array(t.rating)].map((_, j) => (
                                    <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill="#fdcb6e" stroke="none">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                ))}
                            </div>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-sm font-semibold text-white">
                                    {t.avatar}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white/80">{t.name}</div>
                                    <div className="text-xs text-white/30">{t.role}</div>
                                </div>
                            </div>

                            {/* Glow */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background: 'radial-gradient(circle at 50% 0%, rgba(108,92,231,0.06) 0%, transparent 60%)',
                                }}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
