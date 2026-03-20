'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';

interface WorldDividerProps {
    color?: string;
    label?: string;
}

export default function WorldDivider({ color = '#00FFB3', label }: WorldDividerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 24 });

    const lineWidth = useTransform(smooth, [0.1, 0.6], ['0%', '100%']);
    const orbScale  = useTransform(smooth, [0.1, 0.5, 0.9], [0, 1.25, 0.9]);
    const orbGlow   = useTransform(smooth, [0.1, 0.5, 0.9], [0, 1, 0.6]);
    const labelOp   = useTransform(smooth, [0.2, 0.5], [0, 1]);

    return (
        <div ref={ref} className="relative flex items-center justify-center h-[2px] my-0 overflow-visible z-20">

            {/* Left arm */}
            <div className="absolute left-0 right-1/2 flex justify-end overflow-hidden" style={{ height: 1 }}>
                <motion.div style={{ width: lineWidth, height: '1px', background: `linear-gradient(to left, ${color}90, transparent)` }} />
            </div>

            {/* Right arm */}
            <div className="absolute left-1/2 right-0 overflow-hidden" style={{ height: 1 }}>
                <motion.div style={{ width: lineWidth, height: '1px', background: `linear-gradient(to right, ${color}90, transparent)` }} />
            </div>

            {/* Centre orb */}
            <motion.div
                style={{ scale: orbScale, opacity: orbGlow }}
                className="relative z-30 flex items-center justify-center w-8 h-8 rounded-full"
            >
                {/* Bloom ring */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{ scale: [1, 1.8, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ background: `radial-gradient(circle, ${color}28 0%, transparent 70%)`, boxShadow: `0 0 40px ${color}45, 0 0 90px ${color}18` }}
                />
                {/* Inner ring */}
                <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ border: `1px solid ${color}55`, backgroundColor: `${color}12` }}
                >
                    {/* Core */}
                    <motion.div
                        className="w-2 h-2 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}, 0 0 24px ${color}80` }}
                    />
                </div>
            </motion.div>

            {label && (
                <motion.span
                    style={{ opacity: labelOp, color: `${color}90` }}
                    className="absolute top-5 text-[8px] font-black uppercase tracking-[0.35em] pointer-events-none"
                >
                    {label}
                </motion.span>
            )}
        </div>
    );
}
