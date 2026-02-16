'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { VARIANTS } from '@/lib/design/motion-tokens';

interface ScrollRevealProps {
    children: React.ReactNode;
    width?: 'fit-content' | '100%';
    delay?: number;
    className?: string;
}

export default function ScrollReveal({ children, width = 'fit-content', delay = 0, className = '' }: ScrollRevealProps) {
    const isMobile = useIsMobile();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: isMobile ? '-20px' : '-50px' });

    return (
        <div ref={ref} style={{ width, position: 'relative', overflow: 'hidden' }} className={className}>
            <motion.div
                variants={{
                    hidden: { opacity: 0, y: isMobile ? 30 : 75 },
                    visible: { opacity: 1, y: 0 }
                }}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                transition={{
                    duration: isMobile ? 0.4 : 0.8,
                    delay: delay,
                    ease: isMobile ? "easeOut" : [0.22, 1, 0.36, 1]
                }}
            >
                {children}
            </motion.div>
        </div>
    );
}
