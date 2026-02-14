'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { VARIANTS } from '@/lib/design/motion-tokens';

interface ScrollRevealProps {
    children: React.ReactNode;
    width?: 'fit-content' | '100%';
    delay?: number;
    className?: string;
}

export default function ScrollReveal({ children, width = 'fit-content', delay = 0, className = '' }: ScrollRevealProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    return (
        <div ref={ref} style={{ width, position: 'relative', overflow: 'hidden' }} className={className}>
            <motion.div
                variants={{
                    hidden: { opacity: 0, y: 75 },
                    visible: { opacity: 1, y: 0 }
                }}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                transition={{ duration: 0.8, delay: delay, ease: [0.22, 1, 0.36, 1] }} // smooth ease
            >
                {children}
            </motion.div>
        </div>
    );
}
