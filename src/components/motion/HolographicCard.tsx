'use client';

import { useRef, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

/**
 * HolographicCard — 3D interactive card with working transforms
 */
interface HolographicCardProps {
    children: ReactNode;
    className?: string;
    tiltIntensity?: number;
    glowColor?: string;
    enableFloat?: boolean;
    index?: number;
    onClick?: () => void;
}

export default function HolographicCard({
    children,
    className = '',
    tiltIntensity = 10,
    glowColor = 'rgba(122,92,255,0.15)',
    enableFloat = true,
    index = 0,
    onClick,
}: HolographicCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // 3D tilt — spring smoothed
    const rotateX = useSpring(
        useTransform(mouseY, [-200, 200], [tiltIntensity, -tiltIntensity]),
        { stiffness: 200, damping: 25 }
    );
    const rotateY = useSpring(
        useTransform(mouseX, [-200, 200], [-tiltIntensity, tiltIntensity]),
        { stiffness: 200, damping: 25 }
    );

    // Light reflection position
    const reflectX = useTransform(mouseX, [-200, 200], [0, 100]);
    const reflectY = useTransform(mouseY, [-200, 200], [0, 100]);

    const edgeGlow = useSpring(isHovered ? 1 : 0, { stiffness: 200, damping: 25 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
        setIsHovered(false);
    };

    return (
        <motion.div
            ref={ref}
            className={`relative group ${className}`}
            style={{ perspective: 800 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => setIsHovered(true)}
            onClick={onClick}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
                type: 'spring',
                stiffness: 80,
                damping: 18,
                delay: index * 0.08,
            }}
        >
            <motion.div
                className="relative h-full"
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform',
                }}
                animate={enableFloat && !isHovered ? {
                    y: [0, -3, 0, 2, 0],
                } : { y: isHovered ? -8 : 0 }}
                transition={enableFloat && !isHovered ? {
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                } : {
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                }}
            >
                {/* Cursor-following light reflection */}
                <motion.div
                    className="absolute inset-0 rounded-[inherit] pointer-events-none z-20"
                    style={{
                        opacity: edgeGlow,
                        background: useTransform(
                            [reflectX, reflectY],
                            ([rx, ry]: number[]) =>
                                `radial-gradient(circle at ${rx}% ${ry}%, ${glowColor} 0%, transparent 55%)`
                        ),
                    }}
                    aria-hidden
                />

                {/* Edge shimmer */}
                <motion.div
                    className="absolute -inset-[1px] rounded-[inherit] pointer-events-none z-10"
                    style={{
                        opacity: useTransform(edgeGlow, [0, 1], [0.2, 0.8]),
                        background: `linear-gradient(135deg, rgba(122,92,255,0.25), transparent 40%, transparent 60%, rgba(0,240,255,0.15))`,
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                        padding: '1px',
                    }}
                    aria-hidden
                />

                {children}

                {/* Light bloom behind */}
                <motion.div
                    className="absolute inset-0 -z-10 rounded-[inherit] pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse at 50% 40%, ${glowColor}, transparent 70%)`,
                        filter: 'blur(40px)',
                        opacity: isHovered ? 0.5 : 0.15,
                    }}
                    aria-hidden
                />
            </motion.div>
        </motion.div>
    );
}
