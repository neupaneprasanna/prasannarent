'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
    const isSm = size === 'sm';
    const isLg = size === 'lg';

    const iconSize = isSm ? 24 : isLg ? 48 : 32;
    const textSize = isSm ? 'text-lg' : isLg ? 'text-4xl' : 'text-2xl';

    const pathVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: { 
            pathLength: 1, 
            opacity: 1,
            transition: { duration: 2, ease: "easeInOut" as const }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.5 }
        },
        hover: {
            transition: { staggerChildren: 0.05 }
        }
    };

    const letterVariants = {
        hidden: { opacity: 0, y: 10, rotateX: -90 },
        visible: { 
            opacity: 1, 
            y: 0, 
            rotateX: 0,
            transition: { type: "spring" as const, damping: 12, stiffness: 200 }
        },
        hover: {
            y: [0, -4, 0],
            color: ['#ffffff', '#00cec9', '#ffffff'],
            transition: { duration: 0.4, ease: "easeInOut" as const }
        }
    };

    const nexisText = "NEXIS".split("");

    return (
        <Link href="/" className={`inline-flex items-center gap-3 group relative outline-none ${className}`}>
            
            {/* Ambient Background Glow on Hover */}
            <motion.div 
                className="absolute inset-0 bg-[#6c5ce7]/20 blur-xl rounded-full z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ scale: 1.5 }}
            />

            {/* The Nexus Geometric Mark */}
            <motion.div 
                className="relative z-10 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 ease-out"
                style={{ width: iconSize, height: iconSize }}
            >
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,206,201,0.5)]">
                    <defs>
                        <linearGradient id="nexisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00cec9" />
                            <stop offset="50%" stopColor="#6c5ce7" />
                            <stop offset="100%" stopColor="#a29bfe" />
                        </linearGradient>
                        <linearGradient id="nexisGradAlt" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#6c5ce7" />
                            <stop offset="100%" stopColor="#00cec9" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Left Loop */}
                    <motion.path 
                        d="M25 75C11.1929 75 0 63.8071 0 50C0 36.1929 11.1929 25 25 25C40 25 45 50 50 50C55 50 60 75 75 75C88.8071 75 100 63.8071 100 50" 
                        stroke="url(#nexisGrad)" 
                        strokeWidth="8" 
                        strokeLinecap="round" 
                        variants={pathVariants} 
                        initial="hidden" 
                        animate="visible"
                        filter="url(#glow)"
                        className="opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    
                    {/* Right Loop (Intersecting) */}
                    <motion.path 
                        d="M75 25C88.8071 25 100 36.1929 100 50C100 63.8071 88.8071 75 75 75C60 75 55 50 50 50C45 50 40 25 25 25C11.1929 25 0 36.1929 0 50" 
                        stroke="url(#nexisGradAlt)" 
                        strokeWidth="8" 
                        strokeLinecap="round" 
                        variants={pathVariants} 
                        initial="hidden" 
                        animate="visible"
                        filter="url(#glow)"
                        className="opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    
                    {/* Center Core Node */}
                    <motion.circle 
                        cx="50" cy="50" r="6" 
                        fill="#ffffff" 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ delay: 1.5, type: "spring", bounce: 0.5 }}
                        className="shadow-[0_0_15px_#ffffff]"
                    />
                </svg>
            </motion.div>

            {/* Typography */}
            {showText && (
                <motion.div 
                    className={`relative z-10 flex space-x-[2px] font-outfit font-black tracking-tight ${textSize}`}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                >
                    {nexisText.map((char, index) => (
                        <motion.span 
                            key={index} 
                            variants={letterVariants}
                            className="inline-block text-white uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
                        >
                            {char}
                        </motion.span>
                    ))}
                    {/* Tiny .io or dot */}
                    <motion.span 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 2.2 }}
                        className="text-[#00cec9] text-sm md:text-base font-bold ml-1 self-end mb-1"
                    >
                        .io
                    </motion.span>
                </motion.div>
            )}
        </Link>
    );
}
