'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

/**
 * DimensionalReveal — Cinematic section entry with working scroll parallax
 * 
 * Separates reveal (mount) animation from parallax (scroll) animation
 * to avoid transform property conflicts.
 */
interface DimensionalRevealProps {
    children: ReactNode;
    className?: string;
    glowColor?: string;
    delay?: number;
    parallaxIntensity?: number;
    showGlow?: boolean;
    id?: string;
}

export default function DimensionalReveal({
    children,
    className = '',
    glowColor = 'rgba(122,92,255,0.12)',
    delay = 0,
    parallaxIntensity = 0.3,
    showGlow = true,
    id,
}: DimensionalRevealProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Scroll-driven parallax
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    // Parallax Y movement — applied to outer wrapper
    const rawParallaxY = useTransform(
        scrollYProgress,
        [0, 0.5, 1],
        [60 * parallaxIntensity, 0, -60 * parallaxIntensity]
    );
    const parallaxY = useSpring(rawParallaxY, { stiffness: 80, damping: 30 });

    // Scale effect — applied to outer wrapper
    const rawScale = useTransform(
        scrollYProgress,
        [0, 0.3, 0.5, 0.7, 1],
        [0.96, 0.98, 1, 1.01, 1.02]
    );
    const scale = useSpring(rawScale, { stiffness: 80, damping: 30 });

    // Glow intensity peaks as section is in viewport center
    const rawGlowOpacity = useTransform(scrollYProgress, [0.1, 0.35, 0.65, 0.9], [0, 0.8, 0.8, 0]);
    const glowOpacity = useSpring(rawGlowOpacity, { stiffness: 60, damping: 25 });

    return (
        <div ref={ref} id={id} className={`relative ${className} py-10 sm:py-20`}>
            {/* Volumetric glow behind section */}
            {showGlow && (
                <motion.div
                    className="absolute inset-0 pointer-events-none -z-10"
                    style={{
                        opacity: glowOpacity,
                        background: `radial-gradient(ellipse 80% 40% at 50% 30%, ${glowColor}, transparent)`,
                        filter: 'blur(80px)',
                    }}
                    aria-hidden
                />
            )}

            {/* Parallax Wrapper */}
            <motion.div
                style={{
                    y: parallaxY,
                    scale,
                    willChange: 'transform',
                }}
            >
                {/* Reveal Inner — Mount animation */}
                <motion.div
                    initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{
                        type: 'spring',
                        stiffness: 50,
                        damping: 20,
                        mass: 1,
                        delay,
                    }}
                >
                    {children}
                </motion.div>
            </motion.div>
        </div>
    );
}
