'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * DimensionalReveal v4 — Lightweight Scroll Reveal
 * 
 * Simplified from the heavy v3 (8 springs per instance) to a single
 * CSS-based whileInView animation. Keeps the visual polish without
 * the performance cost.
 */
interface DimensionalRevealProps {
    children: ReactNode;
    className?: string;
    glowColor?: string;
    delay?: number;
    parallaxIntensity?: number;
    showGlow?: boolean;
    id?: string;
    variant?: 'rise' | 'slide' | 'portal' | 'cinematic';
}

export default function DimensionalReveal({
    children,
    className = '',
    delay = 0,
    id,
    variant = 'cinematic',
}: DimensionalRevealProps) {
    const getRevealAnimation = () => {
        switch (variant) {
            case 'rise':
                return {
                    initial: { opacity: 0, y: 50 },
                    whileInView: { opacity: 1, y: 0 },
                };
            case 'slide':
                return {
                    initial: { opacity: 0, x: -30 },
                    whileInView: { opacity: 1, x: 0 },
                };
            case 'portal':
                return {
                    initial: { opacity: 0, scale: 0.95 },
                    whileInView: { opacity: 1, scale: 1 },
                };
            case 'cinematic':
            default:
                return {
                    initial: { opacity: 0, y: 40 },
                    whileInView: { opacity: 1, y: 0 },
                };
        }
    };

    const revealAnim = getRevealAnimation();

    return (
        <div id={id} className={`relative ${className}`}>
            <motion.div
                {...revealAnim}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                    duration: 0.6,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay,
                }}
                className="py-2 sm:py-4"
            >
                {children}
            </motion.div>
        </div>
    );
}
