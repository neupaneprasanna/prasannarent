import { Variants, Transition } from 'framer-motion';

// ─── Spring Configs ───
export const adminSpring: Transition = {
    type: 'spring',
    damping: 25,
    stiffness: 300,
    mass: 0.5
};

export const adminSpringSlow: Transition = {
    type: 'spring',
    damping: 30,
    stiffness: 200,
    mass: 0.8
};

// ─── Animation Variants ───

// Page/Panel Entrance
export const adminFadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2, ease: 'easeIn' }
    }
};

export const adminSlideUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: adminSpring
    },
    exit: {
        opacity: 0,
        y: 10,
        transition: { duration: 0.2 }
    }
};

export const adminScaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: adminSpring
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.15 }
    }
};

// Stagger Children
export const adminStagger = (staggerDelay = 0.05): Variants => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: staggerDelay
        }
    }
});

// Item for Stagger
export const adminStaggerItem: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: 'easeOut' }
    }
};

// Hover Effects
export const adminHoverLift: Variants = {
    rest: { y: 0, scale: 1 },
    hover: {
        y: -4,
        scale: 1.01,
        transition: { duration: 0.2, ease: 'easeOut' }
    }
};
