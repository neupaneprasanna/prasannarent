'use client';

import { useRecentlyViewedStore } from '@/store/engagement-store';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-is-mobile';

export default function RecentlyViewedSection() {
    const { items, fetchRecentlyViewed } = useRecentlyViewedStore();
    const isMobile = useIsMobile();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchRecentlyViewed();
    }, []);

    if (items.length === 0) return null;

    return (
        <section className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden bg-transparent">
            
            {/* Ambient Background Glow purely for Recently Viewed context */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                 <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[300px] bg-[#a29bfe]/5 rounded-full blur-[100px]" />
                 <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-[#00F0FF]/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-[1400px] mx-auto relative z-10 w-full">
                
                {/* Minimal Editorial Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 sm:mb-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full border border-[#a29bfe]/30 flex items-center justify-center bg-[#a29bfe]/10">
                                <Clock size={14} className="text-[#a29bfe]" />
                            </div>
                            <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#a29bfe]">your history</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium text-white tracking-tighter">
                            Recently <span className="text-white/30 italic font-light">Viewed</span>
                        </h2>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <Link href="/recently-viewed" className="group mt-8 md:mt-0 flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 hover:border-white/30 bg-white/5 backdrop-blur-md text-xs font-bold text-white/60 hover:text-white transition-all uppercase tracking-widest">
                            View Log <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>

                {/* Ticket Stub Infinite Slider Component */}
                <div 
                    ref={scrollRef}
                    className="-mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto pb-12 cursor-grab active:cursor-grabbing hide-scrollbar"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="flex gap-4 sm:gap-6 w-max items-center pr-12 lg:pr-24 h-[180px] sm:h-[220px]">
                        {items.slice(0, 8).map((item, i) => {
                            const delay = i * 0.1;
                            
                            return (
                                <motion.div
                                    key={`recent-${item.id}-${i}`}
                                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                    whileInView={{ opacity: 1, scale: 1, x: 0 }}
                                    viewport={{ once: true, margin: "0px 100px 0px 0px" }}
                                    transition={{ duration: 0.6, delay, ease: [0.19, 1, 0.22, 1] }}
                                    className="h-full"
                                >
                                    <Link 
                                        href={`/item/${item.id}`}
                                        className="group relative flex h-full w-[85vw] sm:w-[500px] shrink-0 bg-[#050608] rounded-3xl overflow-hidden border border-white/10 hover:border-[#a29bfe]/40 transition-colors duration-500 shadow-xl"
                                    >
                                        
                                        {/* Ticket Cutout Effects purely visual css */}
                                        <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full bg-[#020305] border-r border-[#020305] z-20 group-hover:border-[#a29bfe]/40 transition-colors duration-500" />
                                        <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-[#020305] border-l border-[#020305] z-20 group-hover:border-[#a29bfe]/40 transition-colors duration-500" />

                                        {/* Left Side: Image Square */}
                                        <div className="w-[120px] sm:w-[160px] h-full relative overflow-hidden shrink-0 border-r border-dashed border-white/10 group-hover:border-[#a29bfe]/30 transition-colors duration-500">
                                            <div className="absolute inset-0 bg-[#0a0f16]" />
                                            {item.images?.[0] ? (
                                                <img 
                                                    src={item.images[0]} 
                                                    alt={item.title} 
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]" 
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/20 font-bold bg-[#111]">
                                                    {item.category.charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side: Editorial Ticket Info */}
                                        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between ml-2 sm:ml-0 overflow-hidden relative">
                                            
                                            {/* Top Metadata */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#a29bfe] mb-1">
                                                        {item.category}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">
                                                        REF: {item.id.substring(0,6)}
                                                    </span>
                                                </div>
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-white/50 group-hover:bg-[#a29bfe] group-hover:text-black group-hover:-rotate-45 transition-all duration-500 shadow-md">
                                                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h3 className="font-display font-medium text-lg sm:text-2xl text-white tracking-tight truncate w-full group-hover:text-[#00F0FF] transition-colors duration-300">
                                                {item.title}
                                            </h3>

                                            {/* Bottom Price Metadata */}
                                            <div className="flex items-end justify-between border-t border-white/5 pt-3 sm:pt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 mb-1">Rate</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-lg sm:text-xl font-display font-medium text-white">${item.price}</span>
                                                        <span className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest">/{(item.priceUnit?.toLowerCase() || 'day')}</span>
                                                    </div>
                                                </div>
                                                
                                            </div>

                                        </div>

                                        {/* Subliminal Hover Background FX purely css */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] pointer-events-none" />

                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </section>
    );
}
