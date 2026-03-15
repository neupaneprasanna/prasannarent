'use client';

import { motion } from 'framer-motion';

/**
 * Template — Route-level transition wrapper
 * 
 * Simplified: removed filter blur animation which forced full-page rasterization.
 */
export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.35,
                ease: [0.25, 0.1, 0.25, 1],
            }}
            className="min-h-screen"
        >
            {children}
        </motion.div>
    );
}
