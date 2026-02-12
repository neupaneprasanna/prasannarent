'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

export default function CinematicLoader() {
    const isLoading = useAppStore((s) => s.isLoading);
    const setLoading = useAppStore((s) => s.setLoading);
    const setIntroComplete = useAppStore((s) => s.setIntroComplete);
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<'logo' | 'loading' | 'reveal'>('logo');

    useEffect(() => {
        const logoTimer = setTimeout(() => setPhase('loading'), 1200);
        return () => clearTimeout(logoTimer);
    }, []);

    useEffect(() => {
        if (phase !== 'loading') return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setPhase('reveal');
                    setTimeout(() => {
                        setLoading(false);
                        setIntroComplete(true);
                    }, 800);
                    return 100;
                }
                return prev + Math.random() * 3 + 1;
            });
        }, 40);

        return () => clearInterval(interval);
    }, [phase, setLoading, setIntroComplete]);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden"
                    style={{ background: '#050508' }}
                    exit={{
                        clipPath: 'circle(0% at 50% 50%)',
                        transition: { duration: 1, ease: [0.76, 0, 0.24, 1] },
                    }}
                >
                    {/* Ambient gradient orbs */}
                    <div className="absolute inset-0 overflow-hidden">
                        <motion.div
                            className="absolute w-[600px] h-[600px] rounded-full"
                            style={{
                                background: 'radial-gradient(circle, rgba(108,92,231,0.15) 0%, transparent 70%)',
                                top: '20%',
                                left: '10%',
                            }}
                            animate={{
                                x: [0, 50, -30, 0],
                                y: [0, -30, 50, 0],
                                scale: [1, 1.2, 0.9, 1],
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.div
                            className="absolute w-[500px] h-[500px] rounded-full"
                            style={{
                                background: 'radial-gradient(circle, rgba(253,121,168,0.1) 0%, transparent 70%)',
                                bottom: '10%',
                                right: '10%',
                            }}
                            animate={{
                                x: [0, -40, 30, 0],
                                y: [0, 40, -40, 0],
                                scale: [1, 0.9, 1.2, 1],
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center gap-8">
                        {/* Logo */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                filter: 'blur(0px)',
                            }}
                            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="relative"
                        >
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-[family-name:var(--font-display)]">
                                <span className="gradient-text">Rent</span>
                                <span className="text-white/90">Verse</span>
                            </h1>
                            <motion.div
                                className="absolute -inset-4 rounded-2xl"
                                style={{
                                    background: 'radial-gradient(circle, rgba(108,92,231,0.2) 0%, transparent 70%)',
                                }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </motion.div>

                        {/* Tagline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 0.5, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="text-sm tracking-[0.3em] uppercase text-white/40"
                        >
                            Rent Anything, Anywhere
                        </motion.p>

                        {/* Progress bar */}
                        <AnimatePresence>
                            {phase === 'loading' && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 200 }}
                                    exit={{ opacity: 0 }}
                                    className="relative"
                                >
                                    <div className="w-[200px] h-[2px] bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{
                                                background: 'linear-gradient(90deg, #6c5ce7, #a29bfe, #fd79a8)',
                                                width: `${Math.min(progress, 100)}%`,
                                            }}
                                            transition={{ duration: 0.1 }}
                                        />
                                    </div>
                                    <motion.span
                                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/30 font-mono tabular-nums"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        {Math.min(Math.round(progress), 100)}%
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Corner accents */}
                    <motion.div
                        className="absolute top-8 left-8 w-8 h-8 border-l border-t border-white/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    />
                    <motion.div
                        className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-white/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
