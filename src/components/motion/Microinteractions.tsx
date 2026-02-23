'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * TextReveal — Letter-by-letter or word-by-word tracking animation
 */
interface TextRevealProps {
    children: string;
    className?: string;
    mode?: 'word' | 'char';
    stagger?: number;
    delay?: number;
    as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
}

export function TextReveal({
    children,
    className = '',
    mode = 'word',
    stagger = 0.04,
    delay = 0,
    as: Tag = 'div',
}: TextRevealProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-40px' });

    const units = mode === 'word' ? children.split(' ') : children.split('');

    return (
        <Tag ref={ref} className={className} style={{ display: 'inline' }}>
            {units.map((unit, i) => (
                <motion.span
                    key={`${unit}-${i}`}
                    style={{ display: 'inline-block', whiteSpace: mode === 'word' ? 'pre' : undefined }}
                    initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                    animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
                    transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 20,
                        delay: delay + i * stagger,
                    }}
                >
                    {unit}{mode === 'word' ? ' ' : ''}
                </motion.span>
            ))}
        </Tag>
    );
}

/**
 * CountUp — Smooth number animation
 */
interface CountUpProps {
    value: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    duration?: number;
    color?: string;
}

export function CountUp({
    value,
    prefix = '',
    suffix = '',
    className = '',
    duration = 2000,
    color,
}: CountUpProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isInView) return;

        let start = 0;
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
    }, [isInView, value, duration]);

    const display = count % 1 !== 0 ? count.toFixed(1) : count.toLocaleString();

    return (
        <span
            ref={ref}
            className={`tabular-nums ${className}`}
            style={color ? { color, textShadow: `0 0 30px ${color}40` } : undefined}
        >
            {prefix}{display}{suffix}
        </span>
    );
}

/**
 * BreathingBadge — Softly pulsing indicator
 */
interface BreathingBadgeProps {
    color?: string;
    size?: number;
    className?: string;
}

export function BreathingBadge({
    color = '#00FFB3',
    size = 8,
    className = '',
}: BreathingBadgeProps) {
    return (
        <span className={`relative inline-flex ${className}`}>
            <span
                className="rounded-full"
                style={{
                    width: size,
                    height: size,
                    backgroundColor: color,
                    boxShadow: `0 0 ${size}px ${color}80`,
                }}
            />
            <motion.span
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: color }}
                animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.5, 0, 0.5],
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
        </span>
    );
}
