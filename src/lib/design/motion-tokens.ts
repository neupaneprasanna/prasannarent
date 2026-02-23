/**
 * MOTION TOKENS — RentVerse Design System
 * 
 * All motion must be spring-based.
 * No linear transitions.
 * Physics > timing curves.
 */

// ─── Spring Presets ──────────────────────────────────────────────────────────
export const SPRINGS = {
    /** Default UI interactions */
    gentle: { type: 'spring' as const, stiffness: 100, damping: 20 },
    /** Buttons, toggles — responsive and snappy */
    snappy: { type: 'spring' as const, stiffness: 400, damping: 15, mass: 0.8 },
    /** Heavy elements — cards, panels */
    heavy: { type: 'spring' as const, stiffness: 200, damping: 25 },
    /** Extremely smooth — background elements */
    molasses: { type: 'spring' as const, stiffness: 60, damping: 18, mass: 1.5 },
    /** Bouncy — attention-grabbing elements */
    bouncy: { type: 'spring' as const, stiffness: 300, damping: 12, mass: 0.5 },
    /** Stiff — no overshoot */
    stiff: { type: 'spring' as const, stiffness: 400, damping: 30 },
    /** Soft — large transitions */
    soft: { type: 'spring' as const, stiffness: 80, damping: 20 },
    /** Dimensional — section reveals */
    dimensional: { type: 'spring' as const, stiffness: 60, damping: 18, mass: 1.2 },
} as const;

// Legacy aliases
export const TRANSITIONS = {
    spring: SPRINGS.gentle,
    springStiff: SPRINGS.stiff,
    springDamp: { type: 'spring' as const, stiffness: 200, damping: 40 },
    easeOut: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as number[] },
    easeInOut: { duration: 0.8, ease: [0.42, 0, 0.58, 1] as number[] },
};

// ─── Animation Variants ─────────────────────────────────────────────────────
export const VARIANTS = {
    /** Fade up from below — standard entry */
    fadeInUp: {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: SPRINGS.gentle },
    },
    /** Simple fade */
    fadeIn: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: SPRINGS.gentle },
    },
    /** Scale up from smaller — emphasis entry */
    scaleUp: {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1, transition: SPRINGS.heavy },
    },
    /** Holographic materialization — Z-push + blur */
    holographic: {
        hidden: { opacity: 0.08, y: 50, z: 30, filter: 'blur(4px)' },
        visible: {
            opacity: 1, y: 0, z: 0, filter: 'blur(0px)',
            transition: SPRINGS.dimensional,
        },
    },
    /** Dimensional fade — from depth */
    dimensional: {
        hidden: { opacity: 0, scale: 0.96, filter: 'blur(6px)' },
        visible: {
            opacity: 1, scale: 1, filter: 'blur(0px)',
            transition: SPRINGS.soft,
        },
    },
    /** Stagger container */
    staggerContainer: {
        hidden: {},
        visible: {
            transition: { staggerChildren: 0.08 },
        },
    },
    /** Stagger container — slower for sections */
    staggerSlow: {
        hidden: {},
        visible: {
            transition: { staggerChildren: 0.15 },
        },
    },
};

// ─── Hover Presets ───────────────────────────────────────────────────────────
export const HOVER = {
    /** Subtle scale — default interactive elements */
    scale: { scale: 1.03, transition: SPRINGS.snappy },
    /** Lift up — cards and capsules */
    lift: { y: -6, transition: SPRINGS.heavy },
    /** Float up — hero elements */
    float: { y: -10, transition: SPRINGS.gentle },
    /** Glow aura — violet */
    glow: {
        boxShadow: '0 0 30px rgba(122, 92, 255, 0.3), 0 0 60px rgba(122, 92, 255, 0.1)',
        transition: SPRINGS.gentle,
    },
    /** Liquid button hover */
    liquidButton: {
        y: -4,
        transition: SPRINGS.snappy,
    },
};

// ─── Tap / Press Presets ─────────────────────────────────────────────────────
export const TAP = {
    /** Standard press — button compression */
    press: { scale: 0.97, transition: SPRINGS.snappy },
    /** Gentle press — larger elements */
    gentle: { scale: 0.99, transition: SPRINGS.heavy },
};

// ─── Stagger Delays ─────────────────────────────────────────────────────────
export const STAGGER = {
    fast: 0.04,
    normal: 0.08,
    slow: 0.12,
    section: 0.15,
};
