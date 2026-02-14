export const TRANSITIONS = {
    spring: { type: "spring", stiffness: 200, damping: 20 },
    springStiff: { type: "spring", stiffness: 400, damping: 30 },
    springDamp: { type: "spring", stiffness: 200, damping: 40 },
    easeOut: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    easeInOut: { duration: 0.8, ease: [0.42, 0, 0.58, 1] },
};

export const VARIANTS = {
    fadeInUp: {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: TRANSITIONS.easeOut },
    },
    fadeIn: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: TRANSITIONS.easeOut },
    },
    scaleUp: {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1, transition: TRANSITIONS.spring },
    },
    staggerContainer: {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    },
};

export const HOVER = {
    scale: { scale: 1.05, transition: TRANSITIONS.spring },
    lift: { y: -5, transition: TRANSITIONS.spring },
    glow: {
        boxShadow: "0 0 20px rgba(108, 92, 231, 0.4)",
        transition: TRANSITIONS.easeOut
    },
};
