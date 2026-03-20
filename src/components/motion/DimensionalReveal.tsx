'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

/**
 * DimensionalReveal v5 — Scroll-Linked World Transitions
 *
 * Each variant drives continuous 3D transforms tied to scroll position,
 * so the animation plays while you're physically scrolling — not just
 * a one-shot trigger. Every section feels like arriving in a new world.
 */

type Variant =
    | 'portal'    // zoom-in through a depth gate
    | 'tunnel'    // narrow horizontal slit that opens up
    | 'warp'      // 3-D page-turn from the left
    | 'orbit'     // sweeps in from the right like a planet rotating
    | 'surge'     // erupts upward with perspective tilt
    | 'drift'     // diagonal lateral drift + slight z-rotation
    | 'rise'      // gentle rising + perspective lift
    | 'fracture'  // shattered-glass compound rotation + scale
    | 'slide'     // hard horizontal slide from the right + rotateY
    | 'cinematic'; // pull-in from left with subtle compound tilt

interface VariantConfig {
    fromY: number;
    fromX: number;
    fromScale: number;
    fromRotateX: number;
    fromRotateY: number;
    fromRotateZ: number;
    perspective: number;
    opaqueTo: number; // progress point at which opacity reaches 1
}

const CONFIGS: Record<Variant, VariantConfig> = {
    portal:    { fromY: 100,  fromX: 0,   fromScale: 0.68, fromRotateX: -28, fromRotateY: 0,   fromRotateZ: 0,   perspective: 1000, opaqueTo: 0.5 },
    tunnel:    { fromY: 60,   fromX: 0,   fromScale: 0.52, fromRotateX:   0, fromRotateY: 0,   fromRotateZ: 0,   perspective:  800, opaqueTo: 0.6 },
    warp:      { fromY: 40,   fromX:-60,  fromScale: 0.82, fromRotateX:   0, fromRotateY: -40, fromRotateZ: 0,   perspective: 1200, opaqueTo: 0.55 },
    orbit:     { fromY: 30,   fromX: 80,  fromScale: 0.86, fromRotateX:  -8, fromRotateY:  32, fromRotateZ: 0,   perspective: 1400, opaqueTo: 0.5 },
    surge:     { fromY: 160,  fromX: 0,   fromScale: 0.85, fromRotateX: -18, fromRotateY: 0,   fromRotateZ: 0,   perspective: 1000, opaqueTo: 0.45 },
    drift:     { fromY: 50,   fromX:-110, fromScale: 0.90, fromRotateX:   0, fromRotateY:  10, fromRotateZ: -2,  perspective: 1000, opaqueTo: 0.5 },
    rise:      { fromY: 90,   fromX: 0,   fromScale: 0.92, fromRotateX:  -8, fromRotateY: 0,   fromRotateZ: 0,   perspective:  900, opaqueTo: 0.55 },
    fracture:  { fromY: 70,   fromX: 30,  fromScale: 0.72, fromRotateX: -22, fromRotateY:  18, fromRotateZ: 3,   perspective: 1200, opaqueTo: 0.5 },
    slide:     { fromY: 20,   fromX: 130, fromScale: 0.88, fromRotateX:   0, fromRotateY: -18, fromRotateZ: 0,   perspective: 1100, opaqueTo: 0.45 },
    cinematic: { fromY: 60,   fromX:-80,  fromScale: 0.88, fromRotateX:  -8, fromRotateY:  12, fromRotateZ: -1,  perspective: 1100, opaqueTo: 0.5 },
};

interface DimensionalRevealProps {
    children: ReactNode;
    className?: string;
    glowColor?: string;
    delay?: number;
    parallaxIntensity?: number;
    showGlow?: boolean;
    id?: string;
    variant?: Variant;
}

export default function DimensionalReveal({
    children,
    className = '',
    id,
    variant = 'cinematic',
}: DimensionalRevealProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Track scroll progress from "bottom of section touches bottom of viewport"
    // to "top of section reaches 25% from top of viewport"
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'start 25%'],
    });

    // Spring-damped scroll value so the motion feels physical, not mechanical
    const smooth = useSpring(scrollYProgress, { stiffness: 55, damping: 22, restDelta: 0.001 });

    const cfg = CONFIGS[variant];

    // — Derive all transforms from the single scroll value —
    const opacity   = useTransform(smooth, [0, cfg.opaqueTo], [0, 1]);
    const y         = useTransform(smooth, [0, 1], [cfg.fromY, 0]);
    const x         = useTransform(smooth, [0, 1], [cfg.fromX, 0]);
    const scale     = useTransform(smooth, [0, 1], [cfg.fromScale, 1]);
    const rotateX   = useTransform(smooth, [0, 1], [cfg.fromRotateX, 0]);
    const rotateY   = useTransform(smooth, [0, 1], [cfg.fromRotateY, 0]);
    const rotateZ   = useTransform(smooth, [0, 1], [cfg.fromRotateZ, 0]);

    const perspectiveStyle = cfg.perspective > 0
        ? { perspective: `${cfg.perspective}px`, perspectiveOrigin: '50% 50%' }
        : {};

    return (
        <div ref={ref} id={id} className={`relative ${className}`} style={perspectiveStyle}>
            {/* Removed dynamic blur filter and active willChange binding for massive GPU memory and scroll performance boost */}
            <motion.div style={{ opacity, y, x, scale, rotateX, rotateY, rotateZ }}>
                {children}
            </motion.div>
        </div>
    );
}

