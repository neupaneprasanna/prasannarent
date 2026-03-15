'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const stats = [
    { label: 'items listed', value: 52000, suffix: '+', prefix: '', color: '#00F0FF' },
    { label: 'active renters', value: 18500, suffix: '+', prefix: '', color: '#7A5CFF' },
    { label: 'cities', value: 120, suffix: '+', prefix: '', color: '#00FFB3' },
    { label: 'total revenue', value: 4.2, suffix: 'M', prefix: '$', color: '#FF4D9D' },
];

function AnimatedCounter({ value, prefix, suffix, color }: { value: number; prefix: string; suffix: string; color: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;

        let start = 0;
        const duration = 2000;
        const increment = value / (duration / 16);
        const isDecimal = value % 1 !== 0;

        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(isDecimal ? parseFloat(start.toFixed(1)) : Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [inView, value]);

    return (
        <span ref={ref} className="tabular-nums font-bold" style={{ color }}>
            {prefix}
            {count % 1 !== 0 ? count.toFixed(1) : count.toLocaleString()}
            {suffix}
        </span>
    );
}

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function LiveStats() {
    return (
        <section className="section-padding relative">
            {/* Background accent — visible violet gradient band */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(to bottom, transparent 0%, rgba(122,92,255,0.04) 40%, rgba(122,92,255,0.04) 60%, transparent 100%)',
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="py-12 sm:py-20 border-y border-white/5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-16">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                className="text-center relative flex flex-col items-center group"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ ...springTransition, delay: i * 0.1 }}
                            >
                                <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tighter transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-3">
                                    <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} color={stat.color} />
                                </div>
                                <div className="text-sm sm:text-base md:text-lg font-medium text-white/60 tracking-[0.2em] uppercase group-hover:text-white transition-colors">
                                    {stat.label}
                                </div>

                                {/* Minimal Glow dot under stat */}
                                <div
                                    className="w-2 h-2 mx-auto mt-6 rounded-full opacity-30 group-hover:opacity-100 transition-all duration-500 blur-[1px]"
                                    style={{
                                        backgroundColor: stat.color,
                                        boxShadow: `0 0 15px ${stat.color}`,
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
