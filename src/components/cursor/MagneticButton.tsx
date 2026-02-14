'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

interface MagneticButtonProps {
    children: React.ReactNode;
    strength?: number; // 0.1 to 1.0
    cursorText?: string;
    className?: string;
}

export default function MagneticButton({ children, strength = 0.5, cursorText, className = "" }: MagneticButtonProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const setCursorVariant = useAppStore((state) => state.setCursorVariant);
    const setCursorText = useAppStore((state) => state.setCursorText);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current!.getBoundingClientRect();

        const x = clientX - (left + width / 2);
        const y = clientY - (top + height / 2);

        setPosition({ x: x * strength, y: y * strength });
    };

    const handleMouseEnter = () => {
        if (cursorText) {
            setCursorVariant('text');
            setCursorText(cursorText);
        } else {
            setCursorVariant('hover');
        }
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
        setCursorVariant('default');
        setCursorText('');
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }} // Snappier spring
            className={`inline-block ${className}`}
        >
            {children}
        </motion.div>
    );
}
