'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'rect' | 'circle' | 'text';
}

export default function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden bg-white/5",
                variant === 'circle' ? "rounded-full" : "rounded-xl",
                className
            )}
        >
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent shadow-2xl"
            />
        </div>
    );
}
