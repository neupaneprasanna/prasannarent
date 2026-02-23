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
        <span ref={ref} className="tabular-nums" style={{ color, textShadow: `0 0 30px ${color}40` }}>
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

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <motion.div
                    className="relative rounded-2xl p-8 sm:p-10 md:p-14 overflow-hidden"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={springTransition}
                    style={{
                        background: 'linear-gradient(135deg, rgba(16,17,26,0.9) 0%, rgba(10,11,16,0.8) 100%)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(24px)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 0 60px rgba(122,92,255,0.05), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                >
                    {/* Gradient border effect on top */}
                    <div
                        className="absolute top-0 left-[10%] right-[10%] h-[2px]"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.3), rgba(122,92,255,0.4), rgba(255,77,157,0.3), transparent)',
                        }}
                    />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                className="text-center relative"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ ...springTransition, delay: i * 0.1 }}
                            >
                                <div className="text-3xl md:text-5xl font-light mb-3 tracking-tight">
                                    <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} color={stat.color} />
                                </div>
                                <div className="text-label">{stat.label}</div>

                                {/* Glow line under stat — visible */}
                                <div
                                    className="w-12 h-[2px] mx-auto mt-4 rounded-full"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${stat.color}80, transparent)`,
                                        boxShadow: `0 0 10px ${stat.color}30`,
                                    }}
                                />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
