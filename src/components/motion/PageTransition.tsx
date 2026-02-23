'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * PageTransition — Entry animation for page content
 * 
 * In Next.js App Router, we use a simple mount animation
 * since AnimatePresence with pathname doesn't work reliably
 * (layout/template handle route-level transitions).
 */
interface PageTransitionProps {
    children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
                type: 'spring',
                stiffness: 100,
                damping: 20,
                mass: 0.8,
            }}
            style={{ willChange: 'transform, opacity, filter' }}
        >
            {children}
        </motion.div>
    );
}
