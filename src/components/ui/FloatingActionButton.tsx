'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef } from 'react';

export default function FloatingActionButton() {
    const router = useRouter();
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);

    // Magnetic physics for playable interactivity
    const ref = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        // Limit the pull distance so it doesn't fly off too far
        x.set(distanceX * 0.4);
        y.set(distanceY * 0.4);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    // Hidden on specific pages that don't need the global CTA
    const hiddenPaths = ['/loading', '/login', '/register', '/admin'];
    const shouldHide = hiddenPaths.some(p => pathname?.startsWith(p));

    if (shouldHide) return null;

    return (
        <motion.button
            ref={ref}
            id="fab-create-listing"
            onClick={() => router.push('/listings/new')}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            className="fixed bottom-6 left-6 sm:bottom-10 sm:left-10 z-[100] outline-none touch-none group"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.5 }}
            style={{ x: springX, y: springY }}
            whileTap={{ scale: 0.85 }}
            aria-label="Create new listing"
            title="List something for rent"
        >
            {/* Outer Orbital Rings - Animated on Hover */}
            <motion.div
                className="absolute inset-[-25%] rounded-full border-2 border-[#6c5ce7]/30 pointer-events-none"
                animate={{ rotate: 360, scale: isHovered ? 1.1 : 0.9, opacity: isHovered ? 1 : 0.2 }}
                transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 0.4 } }}
                style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }}
            />
            
            <motion.div
                className="absolute inset-[-45%] rounded-full border border-[#00ffb3]/20 pointer-events-none"
                animate={{ rotate: -360, scale: isHovered ? 1.15 : 0.8, opacity: isHovered ? 1 : 0.1 }}
                transition={{ rotate: { duration: 12, repeat: Infinity, ease: "linear" }, scale: { duration: 0.4 } }}
                style={{ borderBottomColor: 'transparent', borderRightColor: 'transparent' }}
            />

            {/* Central Glowing Aura */}
            <motion.div
                className="absolute inset-0 rounded-full blur-[20px] pointer-events-none z-[-1]"
                animate={{
                    background: isHovered 
                        ? 'radial-gradient(circle, rgba(108,92,231,0.8) 0%, rgba(0,255,179,0.3) 100%)'
                        : 'radial-gradient(circle, rgba(108,92,231,0.4) 0%, rgba(0,0,0,0) 80%)',
                    scale: isHovered ? 1.6 : 1
                }}
                transition={{ duration: 0.4 }}
            />

            {/* Main Premium Orb Body */}
            <motion.div 
                className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center overflow-hidden transition-colors duration-500 ease-out border backdrop-blur-xl ${
                    isHovered 
                        ? 'bg-[#0a0a0f]/80 border-[#6c5ce7]/80 shadow-[inset_0_0_30px_rgba(108,92,231,0.5)]' 
                        : 'bg-[#151520]/60 border-white/10 shadow-[inner_0_0_15px_rgba(255,255,255,0.05)]'
                }`}
            >
                {/* Dynamic Liquid Core */}
                <motion.div 
                    className="absolute w-[250%] h-[250%] opacity-40 mix-blend-screen pointer-events-none z-0"
                    animate={{
                        background: isHovered 
                            ? 'conic-gradient(from 0deg, #6c5ce7, #00ffb3, #6c5ce7)'
                            : 'conic-gradient(from 0deg, #5f4dd0, transparent, #2d2466)',
                        rotate: 360
                    }}
                    transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" } }}
                />

                {/* Glass Highlight */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-60 z-[1] pointer-events-none" style={{ height: '45%' }} />

                {/* Iconography */}
                <div className="relative z-10 flex items-center justify-center w-full h-full pointer-events-none">
                    <motion.div
                        className="absolute"
                        animate={{ 
                            rotate: isHovered ? 180 : 0, 
                            scale: isHovered ? 1.1 : 1,
                            opacity: isHovered ? 0 : 1 
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        <Plus className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2.5} />
                    </motion.div>
                    <motion.div
                        className="absolute"
                        animate={{ 
                            rotate: isHovered ? 0 : -180, 
                            scale: isHovered ? 1.2 : 0.5,
                            opacity: isHovered ? 1 : 0 
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        <Sparkles className="text-[#00ffb3] drop-shadow-[0_0_10px_rgba(0,255,179,0.8)] w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
                    </motion.div>
                </div>
            </motion.div>

            {/* Sliding Tooltip Context */}
            <motion.div
                className="absolute left-full ml-4 sm:ml-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none"
                initial={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
                animate={{ 
                    opacity: isHovered ? 1 : 0, 
                    x: isHovered ? 0 : -20,
                    filter: isHovered ? 'blur(0px)' : 'blur(8px)'
                }}
                transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
            >
                {/* Connecting Laser Line */}
                <div className="w-3 sm:w-5 h-[1px] bg-gradient-to-r from-[#00ffb3]/50 to-transparent origin-left shadow-[0_0_8px_rgba(0,255,179,0.5)]" />
                <div className="whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#0a0a0f]/95 backdrop-blur-2xl border border-[#6c5ce7]/30 shadow-[0_0_20px_rgba(108,92,231,0.2)] flex items-center gap-2 sm:gap-3 overflow-hidden ml-[-1px]">
                    <div className="absolute inset-0 bg-gradient-to-l from-[#6c5ce7]/20 to-transparent pointer-events-none" />
                    <span className="relative z-10 text-xs sm:text-sm font-bold tracking-widest text-[#e2e8f0] uppercase">List an Item</span>
                    <motion.div 
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10 text-[#00ffb3]"
                    >
                        →
                    </motion.div>
                </div>
            </motion.div>

        </motion.button>
    );
}
