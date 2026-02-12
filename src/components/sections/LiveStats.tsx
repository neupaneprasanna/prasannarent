'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';

const stats = [
    { label: 'Items Listed', value: 52000, suffix: '+', prefix: '' },
    { label: 'Active Renters', value: 18500, suffix: '+', prefix: '' },
    { label: 'Cities', value: 120, suffix: '+', prefix: '' },
    { label: 'Total Revenue', value: 4.2, suffix: 'M', prefix: '$' },
];

function AnimatedCounter({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) {
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
        <span ref={ref} className="tabular-nums">
            {prefix}
            {count % 1 !== 0 ? count.toFixed(1) : count.toLocaleString()}
            {suffix}
        </span>
    );
}

export default function LiveStats() {
    return (
        <section className="section-padding relative">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#6c5ce7]/5 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    className="glass-card rounded-3xl p-8 md:p-12"
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                className="text-center"
                                variants={fadeInUp}
                                custom={i}
                            >
                                <div className="text-3xl md:text-5xl font-bold gradient-text mb-2">
                                    <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                                </div>
                                <div className="text-xs md:text-sm text-white/40 tracking-wide">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
