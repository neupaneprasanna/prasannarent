'use client';

import { motion } from 'framer-motion';

/**
 * Template — Route-level transition wrapper
 * 
 * Re-mounts on every route change in Next.js App Router,
 * providing consistent entry animations for every page.
 */
export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
                type: 'spring',
                stiffness: 100,
                damping: 20,
                mass: 0.8,
            }}
            style={{ willChange: 'transform, opacity, filter' }}
            className="min-h-screen"
        >
            {children}
        </motion.div>
    );
}
