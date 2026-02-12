'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

interface MagneticButtonProps {
    children: ReactNode;
    className?: string;
    strength?: number;
    cursorText?: string;
    onClick?: () => void;
}

export default function MagneticButton({
    children,
    className = '',
    strength = 0.3,
    cursorText = '',
    onClick,
}: MagneticButtonProps) {
    const ref = useRef<HTMLDivElement>(null);
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);
    const setCursorText = useAppStore((s) => s.setCursorText);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springX = useSpring(x, { stiffness: 150, damping: 15 });
    const springY = useSpring(y, { stiffness: 150, damping: 15 });

    const rotateX = useTransform(springY, [-20, 20], [5, -5]);
    const rotateY = useTransform(springX, [-20, 20], [-5, 5]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * strength);
        y.set((e.clientY - centerY) * strength);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        setCursorVariant('default');
        setCursorText('');
    };

    const handleMouseEnter = () => {
        setCursorVariant('hover');
        if (cursorText) setCursorText(cursorText);
    };

    return (
        <motion.div
            ref={ref}
            className={className}
            style={{ x: springX, y: springY, rotateX, rotateY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}
