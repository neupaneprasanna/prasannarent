'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useVelocity, useTransform } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useCursorLight } from '@/lib/motion/cursor-light';

/**
 * CustomCursor — Enhanced with:
 * - Radial light glow that follows cursor
 * - Glow intensifies over interactive elements
 * - Velocity-based stretching (liquid metal feel)
 * - Proximity-based surface distortion
 * - Reduced motion support
 */
export default function CustomCursor() {
    const isMobile = useIsMobile();
    const cursorVariant = useAppStore((s) => s.cursorVariant);
    const cursorText = useAppStore((s) => s.cursorText);
    const cursorRef = useRef<HTMLDivElement>(null);
    const { isOverInteractive } = useCursorLight();

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Outer ring — silky spring
    const springX = useSpring(mouseX, { stiffness: 400, damping: 28, mass: 0.5 });
    const springY = useSpring(mouseY, { stiffness: 400, damping: 28, mass: 0.5 });

    // Inner dot — snappier spring
    const dotX = useSpring(mouseX, { stiffness: 1500, damping: 50 });
    const dotY = useSpring(mouseY, { stiffness: 1500, damping: 50 });

    // Glow — softest spring (trails behind slightly)
    const glowX = useSpring(mouseX, { stiffness: 100, damping: 30, mass: 1.5 });
    const glowY = useSpring(mouseY, { stiffness: 100, damping: 30, mass: 1.5 });

    // Velocity-based stretching
    const xVelocity = useVelocity(mouseX);
    const yVelocity = useVelocity(mouseY);

    const skewX = useTransform(xVelocity, [-1000, 1000], [-12, 12]);
    const skewY = useTransform(yVelocity, [-1000, 1000], [-12, 12]);
    const scaleX = useTransform(xVelocity, [-1000, 1000], [0.85, 1.15]);
    const scaleY = useTransform(yVelocity, [-1000, 1000], [1.15, 0.85]);

    // Glow size reacts to velocity
    const speed = useTransform(
        [xVelocity, yVelocity],
        ([vx, vy]: number[]) => Math.sqrt(vx * vx + vy * vy)
    );
    const glowSize = useSpring(
        useTransform(speed, [0, 500, 1500], [120, 160, 220]),
        { stiffness: 100, damping: 20 }
    );
    const glowOpacity = useSpring(
        useTransform(speed, [0, 200, 800], [0.04, 0.08, 0.12]),
        { stiffness: 100, damping: 20 }
    );

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    if (isMobile) return null;

    const variants = {
        default: { width: 50, height: 50, opacity: 0.5, borderStyle: 'solid' as const, borderRadius: '50%' },
        hover: { width: 100, height: 100, opacity: 0.8, borderStyle: 'dashed' as const, borderRadius: '50%' },
        click: { width: 40, height: 40, opacity: 1, scale: 0.8, borderRadius: '50%' },
        text: { width: 140, height: 140, opacity: 0.9, borderStyle: 'dashed' as const, borderRadius: '50%' },
        drag: { width: 80, height: 80, opacity: 0.8, scale: 1, borderRadius: '20%' },
        loading: { width: 60, height: 60, opacity: 1, borderRadius: '50%', borderStyle: 'dotted' as const },
        video: { width: 100, height: 100, opacity: 0.9, borderRadius: '50%', scale: 1 },
        hidden: { width: 0, height: 0, opacity: 0 },
    };

    // Interactive state — glow intensifies
    const isInteractive = cursorVariant === 'hover' || cursorVariant === 'text' || isOverInteractive;

    return (
        <>
            {/* Ambient radial light glow — follows cursor softly */}
            <motion.div
                className="fixed top-0 left-0 z-[99999] pointer-events-none hidden md:block"
                style={{
                    x: glowX,
                    y: glowY,
                    width: glowSize,
                    height: glowSize,
                    translateX: '-50%',
                    translateY: '-50%',
                    background: isInteractive
                        ? 'radial-gradient(circle, rgba(122,92,255,0.15) 0%, rgba(122,92,255,0.04) 40%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(180,170,255,0.06) 0%, rgba(122,92,255,0.02) 40%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(2px)',
                    willChange: 'transform',
                    transition: 'background 0.5s ease',
                }}
                aria-hidden
            />

            {/* Outer tech-ring with rotation and stretching */}
            <motion.div
                ref={cursorRef}
                className="fixed top-0 left-0 z-[100001] pointer-events-none rounded-full border border-white/30 mix-blend-difference hidden md:flex items-center justify-center p-2"
                style={{
                    x: springX,
                    y: springY,
                    translateX: '-50%',
                    translateY: '-50%',
                    skewX,
                    skewY,
                    scaleX,
                    scaleY,
                }}
                animate={isOverInteractive && cursorVariant === 'default' ? 'hover' : cursorVariant}
                variants={variants}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
                {/* Secondary rotating ring */}
                <motion.div
                    className="absolute inset-x-[-10%] inset-y-[-10%] border-t border-b border-white/20 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: cursorVariant === 'loading' ? 1 : 4,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />

                {cursorVariant === 'loading' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </motion.div>
                )}

                {cursorText && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[10px] font-bold text-white tracking-[0.2em] uppercase"
                    >
                        {cursorText}
                    </motion.span>
                )}
            </motion.div>

            {/* Inner dot with subtle pulse */}
            <motion.div
                className="fixed top-0 left-0 z-[100001] pointer-events-none w-3 h-3 rounded-full bg-white mix-blend-difference hidden md:block"
                style={{
                    x: dotX,
                    y: dotY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
                animate={{
                    scale: isInteractive ? 4.5 : 1,
                    opacity: cursorVariant === 'hidden' ? 0 : 1,
                    backgroundColor: isInteractive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 1)',
                }}
                transition={{
                    scale: { type: 'spring', stiffness: 300, damping: 25 },
                    opacity: { duration: 0.2 }
                }}
            />
        </>
    );
}
