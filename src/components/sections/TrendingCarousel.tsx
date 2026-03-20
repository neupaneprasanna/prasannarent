'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { RentalItem } from '@/store/rental-store';
import { apiClient } from '@/lib/api-client';
import { Loader2, ArrowRight, ArrowUpRight, Star } from 'lucide-react';
import Link from 'next/link';

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

const positionStyles: Record<number, {
    transform: string;
    zIndex: number;
    filter: string;
    shadow: string;
    opacity: number;
}> = {
    [-2]: {
        transform: 'translate3d(-310px, -24px, -240px) rotateY(18deg) scale(0.72)',
        zIndex: 1,
        filter: 'brightness(0.45) contrast(1.1)',
        shadow: '0 20px 40px rgba(0,0,0,0.6)',
        opacity: 1,
    },
    [-1]: {
        transform: 'translate3d(-160px, -12px, -120px) rotateY(7deg) scale(0.86)',
        zIndex: 2,
        filter: 'brightness(0.65) contrast(1.1)',
        shadow: '0 24px 48px rgba(0,0,0,0.55)',
        opacity: 1,
    },
    [0]: {
        transform: 'translate3d(0, 0, 0) scale(1)',
        zIndex: 5,
        filter: 'none',
        shadow: '0 30px 60px rgba(0,0,0,0.65), 0 0 50px rgba(0,255,179,0.12), inset 0 1px 0 rgba(255,255,255,0.15)',
        opacity: 1,
    },
    [1]: {
        transform: 'translate3d(160px, -12px, -120px) rotateY(-7deg) scale(0.86)',
        zIndex: 2,
        filter: 'brightness(0.65) contrast(1.1)',
        shadow: '0 24px 48px rgba(0,0,0,0.55)',
        opacity: 1,
    },
    [2]: {
        transform: 'translate3d(310px, -24px, -240px) rotateY(-18deg) scale(0.72)',
        zIndex: 1,
        filter: 'brightness(0.45) contrast(1.1)',
        shadow: '0 20px 40px rgba(0,0,0,0.6)',
        opacity: 1,
    },
};

const categoryGradient = (category: string): string => {
    const cat = category?.toLowerCase() ?? '';
    if (cat.includes('electron') || cat.includes('tech') || cat.includes('camera')) return 'from-blue-600/55 to-cyan-500/20';
    if (cat.includes('vehicle') || cat.includes('car') || cat.includes('bike')) return 'from-violet-600/60 to-fuchsia-600/25';
    if (cat.includes('outdoor') || cat.includes('camp') || cat.includes('sport')) return 'from-emerald-600/55 to-teal-500/20';
    if (cat.includes('music') || cat.includes('audio') || cat.includes('dj')) return 'from-purple-600/55 to-pink-500/20';
    if (cat.includes('tool') || cat.includes('equipment')) return 'from-orange-600/55 to-amber-500/20';
    if (cat.includes('fashion') || cat.includes('cloth')) return 'from-rose-600/55 to-pink-500/20';
    return 'from-indigo-600/55 to-blue-500/20';
};

export default function TrendingCarousel() {
    const [items, setItems] = useState<RentalItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
                setItems(uniqueItems.slice(0, 8));
            } catch (error) {
                console.error('Failed to fetch popular items:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPopular();
    }, []);

    // Auto-advance loop — pauses on hover
    useEffect(() => {
        if (isHovering || items.length === 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % items.length);
        }, 2400);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isHovering, items.length]);

    const handleCardHover = (index: number) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setIsHovering(true);
        setActiveIndex(index);
    };

    const handleClusterLeave = () => {
        hoverTimeout.current = setTimeout(() => setIsHovering(false), 400);
    };

    // Compute which items are visible (positions -2 to +2 relative to activeIndex)
    const visibleItems = items.map((item, i) => {
        const pos = i - activeIndex;
        // Wrap around for looping
        const n = items.length;
        let wrapped = ((pos % n) + n) % n;
        if (wrapped > n / 2) wrapped -= n;
        const clampedPos = Math.max(-2, Math.min(2, wrapped));
        return { item, i, pos: wrapped, clampedPos, isVisible: Math.abs(wrapped) <= 2 };
    });

    const activeItem = items[activeIndex];

    return (
        <section className="py-24 sm:py-32 relative" id="trending">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">

                {/* Header */}
                <motion.div
                    className="flex flex-col items-center text-center mb-16 sm:mb-24"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <span className="text-label text-[#00FFB3] mb-4 block tracking-[0.3em] uppercase">trending showcase</span>
                    <h2 className="text-5xl sm:text-6xl md:text-7xl font-display font-medium tracking-tighter">
                        elite <span className="text-white/30 italic font-light">selection</span>
                    </h2>
                </motion.div>

                {/* Loading */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-[#00FFB3] animate-spin" />
                            <span className="text-label text-white/40 tracking-[0.2em]">loading selection</span>
                        </div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex items-center justify-center py-32">
                        <p className="text-white/30 text-sm tracking-widest uppercase">No listings available yet</p>
                    </div>
                ) : (
                    <motion.div
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ ...spring, delay: 0.1 }}
                    >
                        {/* Spatial Card Arc */}
                        <div
                            className="relative w-full flex items-center justify-center mb-10"
                            style={{ height: 420, perspective: '1200px' }}
                            onMouseLeave={handleClusterLeave}
                        >
                            <div
                                className="relative"
                                style={{ width: 300, height: 400, transformStyle: 'preserve-3d' }}
                            >
                                {visibleItems.filter(v => v.isVisible).map(({ item, i, clampedPos }) => {
                                    const style = positionStyles[clampedPos as keyof typeof positionStyles];
                                    const isCenter = clampedPos === 0;
                                    const gradient = categoryGradient(item.category);
                                    const imgSrc = item.images?.[0];

                                    return (
                                        <div
                                            key={item.id}
                                            className="absolute inset-0 rounded-2xl border border-white/10 flex flex-col overflow-hidden cursor-pointer group"
                                            style={{
                                                transform: style.transform,
                                                zIndex: style.zIndex,
                                                opacity: style.opacity,
                                                filter: style.filter,
                                                boxShadow: style.shadow,
                                                backgroundColor: 'rgba(5, 5, 12, 0.85)',
                                                backdropFilter: 'blur(16px)',
                                                transition: 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.55s ease, box-shadow 0.55s ease, opacity 0.4s ease',
                                            }}
                                            onMouseEnter={() => handleCardHover(i)}
                                        >
                                            {/* Image / Gradient Area */}
                                            <div className={`h-[60%] w-full relative overflow-hidden flex items-center justify-center ${!imgSrc ? `bg-gradient-to-br ${gradient}` : ''}`}>
                                                {imgSrc ? (
                                                    <img
                                                        src={imgSrc}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                                                )}
                                                {/* Subtle noise overlay */}
                                                <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none"
                                                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
                                                {/* Category badge */}
                                                {isCenter && (
                                                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-black/50 backdrop-blur-md border border-[#00FFB3]/30 text-[#00FFB3]">
                                                        {item.category}
                                                    </div>
                                                )}
                                                {/* Rating */}
                                                {isCenter && item.rating && (
                                                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                        <span className="text-[10px] font-bold text-white">{item.rating}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content Area */}
                                            <div className="h-[40%] p-4 flex flex-col justify-between bg-black/50 relative">
                                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                                                <h3 className={`font-medium leading-tight truncate transition-colors duration-300 ${isCenter ? 'text-base text-white' : 'text-sm text-white/60'}`}>
                                                    {item.title}
                                                </h3>
                                                <div className="flex items-center justify-between">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-300 ${
                                                        isCenter
                                                            ? 'bg-[#00FFB3]/15 text-[#00FFB3] border border-[#00FFB3]/25'
                                                            : 'bg-white/5 text-white/40 border border-white/10'
                                                    }`}>
                                                        ${item.price}/{item.priceUnit?.toLowerCase() ?? 'day'}
                                                    </span>
                                                    {isCenter && (
                                                        <Link
                                                            href={`/listings/${item.id}`}
                                                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#00FFB3] hover:text-black flex items-center justify-center border border-white/10 transition-all duration-300"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Active item title */}
                        <motion.div
                            key={activeItem?.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-center mb-6 h-8"
                        >
                            {activeItem && (
                                <p className="text-white/50 text-sm tracking-widest uppercase font-mono">
                                    {activeItem.owner?.name && (
                                        <span>Owner: <span className="text-white/80">{activeItem.owner.name}</span></span>
                                    )}
                                </p>
                            )}
                        </motion.div>

                        {/* Dot indicators */}
                        <div className="flex items-center gap-2 mb-12">
                            {items.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setActiveIndex(i); setIsHovering(false); }}
                                    className="rounded-full transition-all duration-400"
                                    style={{
                                        width: i === activeIndex ? 24 : 6,
                                        height: 6,
                                        backgroundColor: i === activeIndex ? '#00FFB3' : 'rgba(255,255,255,0.15)',
                                    }}
                                    aria-label={`Go to item ${i + 1}`}
                                />
                            ))}
                        </div>

                        {/* View all link */}
                        <Link
                            href="/explore"
                            className="text-xs font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest border border-white/10 hover:border-white/30 px-6 py-3 rounded-full"
                        >
                            view all top rentals
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
