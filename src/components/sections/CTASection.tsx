'use client';

import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import LiquidButton from '@/components/motion/LiquidButton';
import { Sparkles, Zap } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function CTASection() {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <section 
            ref={sectionRef} 
            className="relative overflow-hidden w-full py-32 sm:py-48"
            onMouseMove={handleMouseMove}
        >
            <motion.div style={{ scale }} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Main Premium Card */}
                <div className="relative rounded-[2.5rem] md:rounded-[4rem] border border-white/10 bg-white/[0.05] backdrop-blur-3xl overflow-hidden group py-16 px-8 sm:py-24 sm:px-16 md:py-32 md:px-24 shadow-2xl">
                    
                    {/* Spotlight follow mouse */}
                    <motion.div
                        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100 z-0"
                        style={{
                            background: useMotionTemplate`
                                radial-gradient(
                                    800px circle at ${mouseX}px ${mouseY}px,
                                    rgba(122, 92, 255, 0.15),
                                    transparent 80%
                                )
                            `,
                        }}
                    />

                    {/* Animated grid background inside card */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }} />

                    <div className="relative z-20 flex flex-col items-center text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ ...spring, delay: 0.1 }}
                            className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#7A5CFF] to-[#00F0FF] p-[2px] mb-8 shadow-[0_0_50px_rgba(122,92,255,0.4)]"
                        >
                            <div className="w-full h-full rounded-full bg-[#0a0f1c] flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#00F0FF]" />
                            </div>
                        </motion.div>

                        <motion.h2
                            className="text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-black tracking-tighter mb-8 leading-[1.05]"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ ...spring, delay: 0.2 }}
                        >
                            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                ready to start
                            </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7A5CFF] via-[#00F0FF] to-[#00FFB3] drop-shadow-[0_0_50px_rgba(0,240,255,0.6)]">
                                renting?
                            </span>
                        </motion.h2>

                        <motion.p
                            className="text-xl sm:text-2xl text-white/70 max-w-3xl mx-auto mb-16 leading-relaxed font-medium"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ ...spring, delay: 0.3 }}
                        >
                            join the next generation of the sharing economy. list your idle items or access millions of products instantly, anywhere in the world.
                        </motion.p>

                        <motion.div
                            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 w-full"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ ...spring, delay: 0.4 }}
                        >
                            <Link href="/explore" className="w-full sm:w-auto transform transition-transform hover:scale-105 active:scale-95">
                                <LiquidButton variant="primary" size="lg" className="w-full sm:w-auto shadow-[0_0_40px_rgba(0,240,255,0.3)]">
                                    <span className="flex items-center gap-2">
                                        <Zap className="w-5 h-5" />
                                        start renting now
                                    </span>
                                </LiquidButton>
                            </Link>

                            <Link href="/listings/new" className="w-full sm:w-auto transform transition-transform hover:scale-105 active:scale-95">
                                <LiquidButton variant="secondary" size="lg" className="w-full sm:w-auto border border-white/20 bg-white/5 backdrop-blur-md">
                                    <span className="flex items-center gap-2">
                                        list your items
                                        <Sparkles className="w-5 h-5" />
                                    </span>
                                </LiquidButton>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Decorative blurred backgrounds inside card */}
                    <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-[#7A5CFF] rounded-full mix-blend-screen opacity-15 blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3 z-0" />
                    <div className="absolute bottom-0 left-0 w-[50rem] h-[50rem] bg-[#00F0FF] rounded-full mix-blend-screen opacity-15 blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/3 z-0" />
                    
                    {/* Additional colorful nebulas */}
                    <div className="absolute top-1/2 left-0 w-[40rem] h-[40rem] bg-[#00FFB3] rounded-full mix-blend-screen opacity-[0.08] blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0" />
                    <div className="absolute top-0 left-1/4 w-[35rem] h-[35rem] bg-[#FF4D9D] rounded-full mix-blend-screen opacity-[0.06] blur-[110px] pointer-events-none -translate-y-1/2 z-0" />
                    <div className="absolute bottom-1/4 right-0 w-[45rem] h-[45rem] bg-[#FFB800] rounded-full mix-blend-screen opacity-[0.05] blur-[130px] pointer-events-none translate-x-1/4 z-0" />
                    <div className="absolute top-1/3 right-1/4 w-[30rem] h-[30rem] bg-[#7A5CFF] rounded-full mix-blend-screen opacity-[0.07] blur-[90px] pointer-events-none z-0" />
                </div>
            </motion.div>

            {/* Background parallax shapes overlaying section */}
            <motion.div style={{ y }} className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                {isMounted && [...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full mix-blend-screen blur-[2px]"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 8 + 3}px`,
                            height: `${Math.random() * 8 + 3}px`,
                            background: i % 3 === 0 ? '#7A5CFF' : i % 3 === 1 ? '#00F0FF' : '#00FFB3',
                            opacity: Math.random() * 0.5 + 0.2,
                            boxShadow: `0 0 ${Math.random() * 10 + 5}px ${i % 3 === 0 ? '#7A5CFF' : i % 3 === 1 ? '#00F0FF' : '#00FFB3'}`,
                        }}
                        animate={{
                            y: [0, -60, 0],
                            x: [0, Math.random() * 30 - 15, 0],
                            opacity: [0.2, 0.9, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 6,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </motion.div>
            
            {/* Edge line glows */}
            <div className="absolute top-0 left-0 right-0 h-[1px] opacity-10 bg-gradient-to-r from-transparent via-[#7A5CFF] to-transparent z-20" />
            
            {/* Seamless Section Blending Gradients */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#020305]/80 to-transparent pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020305]/80 to-transparent pointer-events-none z-0" />
            
            <div className="absolute bottom-0 left-0 right-0 h-[1px] opacity-10 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent z-20" />
        </section>
    );
}
