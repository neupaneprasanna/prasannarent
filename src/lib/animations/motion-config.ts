import { type Variants } from 'framer-motion';

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            delay: i * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    }),
};

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: (i: number = 0) => ({
        opacity: 1,
        transition: {
            duration: 0.6,
            delay: i * 0.1,
            ease: 'easeOut',
        },
    }),
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number = 0) => ({
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.6,
            delay: i * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    }),
};

export const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -60 },
    visible: (i: number = 0) => ({
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.7,
            delay: i * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    }),
};

export const slideInRight: Variants = {
    hidden: { opacity: 0, x: 60 },
    visible: (i: number = 0) => ({
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.7,
            delay: i * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    }),
};

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

export const staggerFast: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05,
        },
    },
};

export const letterReveal: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            delay: i * 0.03,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    }),
};

export const cardHover = {
    rest: {
        scale: 1,
        y: 0,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    hover: {
        scale: 1.02,
        y: -8,
        boxShadow: '0 20px 60px rgba(108,92,231,0.2), 0 8px 32px rgba(0,0,0,0.4)',
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

export const springTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
};

export const smoothTransition = {
    duration: 0.6,
    ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
};
