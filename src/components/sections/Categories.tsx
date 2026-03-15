'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { Camera, Car, Home, Film, Shirt, Music, Hammer, Laptop, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const categories = [
    { name: 'tech & gadgets', icon: <Camera size={36} strokeWidth={1.5} />, count: '2.4k', glow: '#00F0FF', video: 'tech video.mp4' },
    { name: 'vehicles', icon: <Car size={36} strokeWidth={1.5} />, count: '1.8k', glow: '#00FFB3', video: 'vehicles video.mp4' },
    { name: 'rooms & spaces', icon: <Home size={36} strokeWidth={1.5} />, count: '3.2k', glow: '#FF4D9D', video: 'room video.mp4' },
    { name: 'film equipment', icon: <Film size={36} strokeWidth={1.5} />, count: '980', glow: '#7A5CFF', video: 'film video.mp4' },
    { name: 'fashion', icon: <Shirt size={36} strokeWidth={1.5} />, count: '1.5k', glow: '#A18CFF', video: 'fashion video.mp4' },
    { name: 'music studios', icon: <Music size={36} strokeWidth={1.5} />, count: '640', glow: '#00FFE1', video: 'studio video.mp4' },
    { name: 'power tools', icon: <Hammer size={36} strokeWidth={1.5} />, count: '1.1k', glow: '#FF4D9D', video: 'tools video.mp4' },
    { name: 'digital gear', icon: <Laptop size={36} strokeWidth={1.5} />, count: '2.1k', glow: '#00F0FF', video: 'gear video.mp4' },
];

const spring = { type: 'spring' as const, stiffness: 200, damping: 20 };

export default function Categories() {
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

    // Only play the active video, pause all others
    useEffect(() => {
        videoRefs.current.forEach((video, i) => {
            if (!video) return;
            if (i === hoveredIndex) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, [hoveredIndex]);

    return (
        <section className="section-padding relative" id="categories">
            
            <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 relative z-10">
                
                {/* Header */}
                 <motion.div
                    className="flex flex-col md:flex-row justify-between items-end mb-12 sm:mb-16 gap-6 relative z-10"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                   <div>
                        <span className="text-label mb-4 block" style={{ color: '#00F0FF' }}>categories</span>
                        <h2 className="text-section mb-4">
                            explore <span className="gradient-text">dimensions</span>
                        </h2>
                        <p className="text-body text-white/40 max-w-md">
                            interactive environments representing our diverse global rental ecosystems.
                        </p>
                    </div>
                </motion.div>

                {/* Cinematic Accordion Slider */}
                <div className="w-full flex flex-col lg:flex-row h-[1200px] lg:h-[75vh] min-h-[600px] gap-2 sm:gap-4 rounded-[2.5rem] overflow-hidden">
                    {categories.map((category, i) => {
                        const isActive = hoveredIndex === i;
                        const num = `0${i + 1}`;
                        
                        return (
                            <Link 
                                href={isActive ? "/explore" : "#"}
                                onClick={(e) => {
                                    if (!isActive) {
                                        e.preventDefault();
                                        setHoveredIndex(i);
                                    }
                                }}
                                key={category.name}
                                className="group relative flex overflow-hidden rounded-[2rem] cursor-none transition-all duration-[700ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
                                style={{ 
                                    flex: isActive ? '6' : '1',
                                    border: isActive ? `1px solid ${category.glow}40` : '1px solid rgba(255,255,255,0.05)'
                                }}
                                onMouseEnter={() => {
                                    setCursorVariant('hover');
                                    setHoveredIndex(i);
                                }}
                                onMouseLeave={() => setCursorVariant('default')}
                            >
                                {/* Background Video Layer */}
                                <div className="absolute inset-0 w-full h-full z-0 bg-[#050608]">
                                    <video 
                                        ref={el => { videoRefs.current[i] = el; }}
                                        src={`/videos/categories/${category.video}`}
                                        className={`absolute inset-0 w-full h-full object-cover origin-center transition-all duration-[1200ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
                                            isActive 
                                              ? 'scale-100 brightness-110 contrast-125 saturate-100 opacity-100' 
                                              : 'scale-125 brightness-[0.25] contrast-75 saturate-0 opacity-70'
                                        }`}
                                        muted loop playsInline
                                        preload="metadata"
                                        autoPlay={isActive}
                                    />
                                    {/* Gradients to merge text properly */}
                                    <div 
                                        className={`absolute inset-0 bg-gradient-to-t transition-all duration-[800ms] ${
                                            isActive 
                                              ? 'from-[#020305] via-black/20 to-transparent opacity-80' 
                                              : 'from-[#020305] via-black/60 to-black/30 opacity-100'
                                        }`} 
                                    />
                                </div>

                                {/* Shared Interface Elements */}
                                <div className="relative z-10 w-full h-full flex flex-col justify-between p-5 sm:p-8 pointer-events-none overflow-hidden">
                                    
                                    {/* Top Section */}
                                    <div className="flex justify-between items-start w-full leading-none">
                                        <div 
                                            className={`font-display tracking-tighter transition-all duration-700 select-none ${
                                                isActive 
                                                  ? 'text-5xl lg:text-7xl opacity-40 text-white font-medium scale-100 origin-top-left' 
                                                  : 'text-4xl lg:text-3xl text-white opacity-20 scale-90 origin-top-left'
                                            }`}
                                        >
                                            {num}
                                        </div>
                                        
                                        <div className={`bg-white text-black w-14 h-14 rounded-full flex items-center justify-center transition-all duration-700 ease-in-out pointer-events-auto shadow-2xl ${
                                            isActive ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 -translate-y-10'
                                        }`}>
                                            <ArrowUpRight className="w-6 h-6" />
                                        </div>
                                    </div>

                                    {/* Bottom Info Layout */}
                                    <div className="flex flex-col w-full relative h-[100px] lg:h-[130px] justify-end">
                                        
                                        {/* State-Shifting Icon */}
                                        <div 
                                            className={`absolute transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] flex items-center justify-center rounded-2xl ${
                                                isActive 
                                                  ? 'top-[-20px] lg:top-[-70px] left-0 w-12 h-12 lg:w-16 lg:h-16 bg-black/40 backdrop-blur-md scale-100' 
                                                  : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 scale-90'
                                            }`}
                                            style={{
                                                border: `1px solid ${isActive ? category.glow + '60' : 'rgba(255,255,255,0.05)'}`,
                                                color: isActive ? category.glow : 'rgba(255,255,255,0.3)',
                                                boxShadow: isActive ? `0 0 40px ${category.glow}40` : 'none',
                                            }}
                                        >
                                            {category.icon}
                                        </div>

                                        {/* Giant Title & Data */}
                                        <div className={`flex flex-col justify-end w-full transition-all duration-[700ms] ease-out absolute bottom-0 left-0 ${
                                            isActive ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-8 invisible'
                                        }`}>
                                            <h3 className="font-display font-bold text-white text-3xl sm:text-4xl lg:text-5xl xl:text-6xl tracking-tighter whitespace-nowrap drop-shadow-2xl lowercase leading-none">
                                                {category.name}
                                            </h3>
                                            
                                            <div className="flex items-center gap-4 mt-3 sm:mt-4">
                                                <div className="w-10 sm:w-16 h-[2px]" style={{ background: category.glow, boxShadow: `0 0 15px ${category.glow}` }} />
                                                <p className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-white/70 uppercase">
                                                    {category.count} <span className="opacity-50 hidden sm:inline">items available</span>
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
