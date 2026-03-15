'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RentalItem } from '@/store/rental-store';
import { apiClient } from '@/lib/api-client';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Loader2, ArrowUpRight, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function TrendingCarousel() {
    const isMobile = useIsMobile();
    const [items, setItems] = useState<RentalItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchPopular = async () => {
            try {
                const data = await apiClient.get<{ listings: any[] }>('/listings', {
                    params: { popular: 'true' }
                });
                const mapped = data.listings.map(l => ({
                    ...l,
                    owner: {
                        name: l.owner.firstName,
                        avatar: l.owner.avatar || '',
                        verified: l.owner.verified
                    }
                }));
                const uniqueItems = Array.from(new Map(mapped.map(item => [item.id, item])).values());
                setItems(uniqueItems);
            } catch (error) {
                console.error('Failed to fetch popular items:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPopular();
    }, []);

    const activeItem = items[activeIndex ?? 0];

    return (
        <section className="py-24 sm:py-32 relative" ref={containerRef} id="trending">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">
                {/* Header */}
                <motion.div
                    className="flex flex-col items-center text-center mb-16 sm:mb-24"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <span className="text-label text-[#00FFB3] mb-4 block tracking-[0.3em] uppercase" style={{ textShadow: '0 0 20px rgba(0,255,179,0.3)' }}>trending showcase</span>
                    <h2 className="text-5xl sm:text-6xl md:text-7xl font-display font-medium tracking-tighter">
                        elite <span className="text-white/30 italic font-light">selection</span>
                    </h2>
                </motion.div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-[#00FFB3] animate-spin" />
                            <span className="text-label text-white/40 tracking-[0.2em]">loading selection</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
                        
                        {/* LEFT: Sticky Presentation Window */}
                        <div className="w-full lg:w-[45%] lg:sticky lg:top-32 shrink-0 h-[450px] sm:h-[600px] lg:h-[700px] rounded-[2rem] overflow-hidden group shadow-2xl relative border border-white/5 bg-[#050508]">
                            <AnimatePresence mode="popLayout">
                                {activeItem && (
                                    <motion.div
                                        key={`img-${activeItem.id}`}
                                        initial={{ opacity: 0, scale: 1.05 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, filter: 'blur(10px)' }}
                                        transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
                                        className="absolute inset-0 w-full h-full"
                                    >
                                        <img src={activeItem.images[0]} alt={activeItem.title} className="w-full h-full object-cover" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* UI Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 pointer-events-none" />
                            
                            {activeItem && (
                                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between pointer-events-none">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-black/50 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#00FFB3]">
                                            {activeItem.category}
                                        </div>
                                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FDE68A] fill-[#FDE68A]" />
                                            <span className="text-xs sm:text-sm font-bold">{activeItem.rating}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-end justify-between gap-4">
                                        <div className="max-w-[75%] sm:max-w-[70%]">
                                            <h3 className="text-2xl sm:text-4xl font-display font-medium text-white mb-2 leading-[1.1] tracking-tight drop-shadow-xl">
                                                {activeItem.title}
                                            </h3>
                                            <p className="text-white/60 font-mono text-[10px] sm:text-xs tracking-widest uppercase">
                                                Owner: <span className="text-white">{activeItem.owner.name}</span>
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex shrink-0 items-center justify-center text-black pointer-events-auto transform -rotate-45 hover:rotate-0 hover:bg-[#00FFB3] hover:scale-110 transition-all duration-300 cursor-pointer shadow-lg mt-auto mb-2">
                                            <Link href={`/listings/${activeItem.id}`}>
                                                <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Editorial Horizontal List */}
                        <div className="w-full lg:w-[55%] flex flex-col pt-4 sm:pt-12">
                            <div className="hidden sm:flex justify-between items-center pb-4 border-b border-white/10 text-xs font-bold uppercase tracking-widest text-white/40 px-6">
                                <span>Index / Item</span>
                                <span>Rate</span>
                            </div>

                            <div className="flex flex-col">
                                {items.slice(0, 8).map((item, i) => {
                                    const isActive = activeIndex === i;
                                    return (
                                        <Link
                                            href={`/listings/${item.id}`}
                                            key={item.id}
                                            onMouseEnter={() => !isMobile && setActiveIndex(i)}
                                            className="group relative flex flex-col sm:flex-row sm:items-center justify-between py-6 sm:py-8 border-b border-white/5 hover:border-white/20 overflow-hidden transition-all duration-500"
                                        >
                                            {/* Hover highlight line left */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-[#00FFB3] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${isActive ? 'scale-y-100' : 'scale-y-0'}`} />

                                            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-10 px-4 sm:px-8">
                                                <span className={`font-mono text-xs sm:text-sm transition-colors duration-500 ${isActive ? 'text-[#00FFB3] font-bold' : 'text-white/30'}`}>
                                                    0{i + 1}
                                                </span>
                                                <h4 className={`text-xl sm:text-3xl font-display tracking-tight transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] max-w-[280px] sm:max-w-[320px] truncate ${isActive ? 'text-white sm:translate-x-4' : 'text-white/60'}`}>
                                                    {item.title}
                                                </h4>
                                            </div>

                                            <div className="relative z-10 flex items-center gap-6 px-4 sm:px-8 mt-4 sm:mt-0 justify-between sm:justify-end w-full sm:w-auto">
                                                <div className="flex flex-col sm:text-right">
                                                    <span className={`text-lg sm:text-2xl font-light transition-colors duration-500 ${isActive ? 'text-white' : 'text-white/40'}`}>
                                                        ${item.price}
                                                    </span>
                                                    <span className={`text-[10px] uppercase tracking-widest ${isActive ? 'text-[#00FFB3]/70' : 'text-white/20'}`}>
                                                        per {item.priceUnit}
                                                    </span>
                                                </div>
                                                <div className={`hidden sm:flex transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                                                    <ArrowRight className="w-5 h-5 text-[#00FFB3]" />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            <motion.div 
                                className="mt-12 flex justify-center lg:justify-start px-2 sm:px-6"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                            >
                                <Link href="/explore" className="text-xs font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest border border-white/10 hover:border-white/30 px-6 py-3 rounded-full">
                                    view all top rentals
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        </div>

                    </div>
                )}
            </div>
        </section>
    );
}
