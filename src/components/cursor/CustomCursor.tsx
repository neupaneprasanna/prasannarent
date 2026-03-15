'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useCursorLight } from '@/lib/motion/cursor-light';

/**
 * CustomCursor — Simplified for performance
 * Removed: ambient glow, velocity stretching, secondary rotating ring
 * Kept: inner dot + outer ring with basic springs
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

    const isInteractive = cursorVariant === 'hover' || cursorVariant === 'text' || isOverInteractive;

    return (
        <>
            {/* Outer tech-ring */}
            <motion.div
                ref={cursorRef}
                className="fixed top-0 left-0 z-[100001] pointer-events-none rounded-full border border-white/30 mix-blend-difference hidden md:flex items-center justify-center p-2"
                style={{
                    x: springX,
                    y: springY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
                animate={isOverInteractive && cursorVariant === 'default' ? 'hover' : cursorVariant}
                variants={variants}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
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

            {/* Inner dot */}
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
