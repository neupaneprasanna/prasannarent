'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

export default function CinematicLoader() {
    const isLoading = useAppStore((s) => s.isLoading);
    const setLoading = useAppStore((s) => s.setLoading);
    const setIntroComplete = useAppStore((s) => s.setIntroComplete);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Check if this is the first time the user has visited the website in this session
        const hasVisited = sessionStorage.getItem('rentverse_visited');
        
        if (hasVisited) {
            setLoading(false);
            setIntroComplete(true);
            return;
        }

        if (!isLoading) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setLoading(false);
                        setIntroComplete(true);
                        sessionStorage.setItem('rentverse_visited', 'true');
                    }, 1000); 
                    return 100;
                }
                const increment = Math.max(0.6, (100 - prev) * 0.15);
                return prev + increment + (Math.random() * 2);
            });
        }, 40);

        return () => clearInterval(interval);
    }, [isLoading, setLoading, setIntroComplete]);

    const titleStr = "RentVerse";
    const letters = Array.from(titleStr);

    const letterVariants: Variants = {
        hidden: { y: 100, opacity: 0, rotateX: -90 },
        visible: (i: number) => ({
            y: 0,
            opacity: 1,
            rotateX: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 200,
                delay: i * 0.08,
            },
        }),
    };

    return (
        <AnimatePresence mode="wait">
            {isLoading && (
                <motion.div
                    key="loader"
                    className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden font-sans"
                    style={{ background: '#020305' }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 1.5, ease: [0.76, 0, 0.24, 1] },
                    }}
                >
                    {/* Layer 1: Parallax Floating Glass Cards (Heavy but clean animation) */}
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden perspective-1000">
                        <motion.div 
                            className="absolute top-[10%] left-[15%] w-64 h-80 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl"
                            initial={{ y: 200, opacity: 0, rotateY: 30, rotateZ: -10 }}
                            animate={{ y: [-20, 20], opacity: 0.8, rotateY: [30, 20], rotateZ: [-10, -5] }}
                            transition={{ duration: 6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", opacity: { duration: 1, delay: 0.2 } }}
                        />
                        <motion.div 
                            className="absolute bottom-[10%] right-[15%] w-80 h-48 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl"
                            initial={{ y: -200, opacity: 0, rotateY: -30, rotateZ: 10 }}
                            animate={{ y: [20, -20], opacity: 0.8, rotateY: [-30, -20], rotateZ: [10, 5] }}
                            transition={{ duration: 7, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", opacity: { duration: 1, delay: 0.4 } }}
                        />
                        {/* Huge Slow Rotating Glow */}
                        <motion.div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] opacity-20 pointer-events-none mix-blend-screen"
                            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            style={{ 
                                background: 'conic-gradient(from 90deg, transparent, rgba(139,92,246,0.2), rgba(34,211,238,0.2), rgba(205,248,118,0.2), transparent)' 
                            }}
                        />
                    </div>
                    
                    {/* Layer 2: Main Content */}
                    <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-8">
                        
                        {/* Playful Kinetic Typography */}
                        <div className="flex mb-2 perspective-1000 z-20">
                            {letters.map((char, i) => (
                                <motion.span
                                    key={i}
                                    custom={i}
                                    variants={letterVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className={`text-6xl md:text-8xl font-black tracking-tighter ${
                                        i >= 4 
                                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#cdf876] to-[#22D3EE]' 
                                        : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                    }`}
                                    style={{ display: 'inline-block', transformOrigin: "bottom" }}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </div>

                        {/* Snapping Subtitle */}
                        <motion.div 
                            className="mb-16 bg-white/[0.05] border border-white/10 px-6 py-2 rounded-full backdrop-blur-md z-20"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 1 }}
                        >
                            <span className="text-xs md:text-sm tracking-[0.4em] uppercase text-white/70 font-mono">
                                The Premium Marketplace
                            </span>
                        </motion.div>

                        {/* Playful & Heavy Progress Bar */}
                        <div className="w-full max-w-md relative mt-4 z-20">
                            {/* The Track */}
                            <motion.div 
                                className="w-full h-3 bg-white/10 rounded-full overflow-hidden shadow-inner"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "100%" }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 1.2 }}
                            >
                                {/* The Fill */}
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#22D3EE] to-[#cdf876] rounded-full relative"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </motion.div>

                            {/* Bouncing Block riding the progress */}
                            <motion.div
                                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-[#cdf876] rounded-md shadow-[0_0_20px_rgba(205,248,118,0.8)] flex items-center justify-center pointer-events-none"
                                style={{ left: `calc(${Math.min(progress, 100)}% - 12px)` }}
                                initial={{ opacity: 0 }}
                                animate={{ 
                                    y: ["-50%", "-150%", "-50%"],
                                    rotate: [0, 90, 180],
                                    opacity: progress > 5 ? 1 : 0
                                }}
                                transition={{ 
                                    y: { duration: 0.5, repeat: Infinity, ease: "easeOut" }, 
                                    rotate: { duration: 0.5, repeat: Infinity, ease: "linear" },
                                    opacity: { duration: 0.2 }
                                }}
                            >
                                <div className="w-2 h-2 bg-white/80 rounded-full" />
                            </motion.div>

                            {/* Percentage with Digital Slot layout */}
                            <motion.div 
                                className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-3xl font-light tabular-nums font-mono text-white flex items-center gap-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5 }}
                            >
                                <motion.div 
                                    className="bg-white/5 px-3 py-2 rounded-xl border border-white/10 shadow-lg"
                                    key={`digit-1-${Math.floor(Math.min(progress, 100) / 100) % 10}`}
                                    initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                >
                                    {Math.floor(Math.min(progress, 100) / 100) % 10}
                                </motion.div>
                                <motion.div 
                                    className="bg-white/5 px-3 py-2 rounded-xl border border-white/10 shadow-lg"
                                    key={`digit-2-${Math.floor(Math.min(progress, 100) / 10) % 10}`}
                                    initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                >
                                    {Math.floor(Math.min(progress, 100) / 10) % 10}
                                </motion.div>
                                <motion.div 
                                    className="bg-white/5 px-3 py-2 rounded-xl border border-white/10 shadow-lg bg-[#8B5CF6]/20 border-[#8B5CF6]/50"
                                    key={`digit-3-${Math.floor(Math.min(progress, 100)) % 10}`}
                                    initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    {Math.floor(Math.min(progress, 100)) % 10}
                                </motion.div>
                                <span className="text-[#cdf876] text-xl font-bold ml-1">%</span>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
