'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RentalItem } from '@/store/rental-store';
import { apiClient } from '@/lib/api-client';
import { Loader2, ArrowRight, ArrowUpRight, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

const CARD_W = 360;
const CARD_H = 500;

type SlotStyle = { transform: string; zIndex: number; brightness: number; shadow: string; opacity: number };

const slotStyles: Record<number, SlotStyle> = {
    [-2]: {
        transform: `translate3d(-500px, -40px, -320px) rotateY(22deg) scale(0.68)`,
        zIndex: 1, brightness: 0.35, opacity: 0.8,
        shadow: '0 20px 50px rgba(0,0,0,0.7)',
    },
    [-1]: {
        transform: `translate3d(-250px, -18px, -150px) rotateY(9deg) scale(0.84)`,
        zIndex: 2, brightness: 0.6, opacity: 1,
        shadow: '0 24px 56px rgba(0,0,0,0.65)',
    },
    [0]: {
        transform: `translate3d(0, 0, 0) scale(1.0)`,
        zIndex: 5, brightness: 1, opacity: 1,
        shadow: '0 40px 80px rgba(0,0,0,0.75)',
    },
    [1]: {
        transform: `translate3d(250px, -18px, -150px) rotateY(-9deg) scale(0.84)`,
        zIndex: 2, brightness: 0.6, opacity: 1,
        shadow: '0 24px 56px rgba(0,0,0,0.65)',
    },
    [2]: {
        transform: `translate3d(500px, -40px, -320px) rotateY(-22deg) scale(0.68)`,
        zIndex: 1, brightness: 0.35, opacity: 0.8,
        shadow: '0 20px 50px rgba(0,0,0,0.7)',
    },
};

type CategoryKey = 'vehicles' | 'electronics' | 'outdoors' | 'music' | 'tools' | 'fashion' | 'sports' | 'cameras' | 'default';

const categoryConfig: Record<CategoryKey, { gradient: string; glow: string; accent: string }> = {
    vehicles:    { gradient: 'from-red-900/60 via-orange-900/30 to-black',    glow: 'rgba(239,68,68,0.5)',    accent: '#ef4444' },
    electronics: { gradient: 'from-blue-900/60 via-cyan-900/30 to-black',     glow: 'rgba(59,130,246,0.5)',   accent: '#3b82f6' },
    outdoors:    { gradient: 'from-emerald-900/60 via-teal-900/30 to-black',   glow: 'rgba(16,185,129,0.5)',   accent: '#10b981' },
    music:       { gradient: 'from-purple-900/60 via-fuchsia-900/30 to-black', glow: 'rgba(168,85,247,0.5)',   accent: '#a855f7' },
    tools:       { gradient: 'from-orange-900/60 via-amber-900/30 to-black',   glow: 'rgba(249,115,22,0.5)',   accent: '#f97316' },
    fashion:     { gradient: 'from-rose-900/60 via-pink-900/30 to-black',      glow: 'rgba(244,63,94,0.5)',    accent: '#f43f5e' },
    sports:      { gradient: 'from-lime-900/60 via-green-900/30 to-black',     glow: 'rgba(132,204,22,0.5)',   accent: '#84cc16' },
    cameras:     { gradient: 'from-indigo-900/60 via-violet-900/30 to-black',  glow: 'rgba(99,102,241,0.5)',   accent: '#6366f1' },
    default:     { gradient: 'from-slate-800/60 via-slate-900/30 to-black',    glow: 'rgba(0,255,179,0.35)',   accent: '#00FFB3' },
};

function getCategoryConfig(category: string) {
    const cat = (category ?? '').toLowerCase();
    if (cat.includes('vehicle') || cat.includes('car') || cat.includes('bike') || cat.includes('auto')) return categoryConfig.vehicles;
    if (cat.includes('electron') || cat.includes('tech') || cat.includes('computer')) return categoryConfig.electronics;
    if (cat.includes('outdoor') || cat.includes('camp') || cat.includes('hike')) return categoryConfig.outdoors;
    if (cat.includes('music') || cat.includes('audio') || cat.includes('dj') || cat.includes('instrument')) return categoryConfig.music;
    if (cat.includes('tool') || cat.includes('power')) return categoryConfig.tools;
    if (cat.includes('fashion') || cat.includes('cloth') || cat.includes('apparel')) return categoryConfig.fashion;
    if (cat.includes('sport') || cat.includes('fitness') || cat.includes('gym')) return categoryConfig.sports;
    if (cat.includes('camera') || cat.includes('photo') || cat.includes('video')) return categoryConfig.cameras;
    return categoryConfig.default;
}

// Returns the wrapped position of item `i` relative to `activeIndex` in a circular array of length `n`
function circularPos(i: number, activeIndex: number, n: number): number {
    const raw = ((i - activeIndex) % n + n) % n;
    return raw > n / 2 ? raw - n : raw;
}

export default function TrendingCarousel() {
    const router = useRouter();
    const [items, setItems] = useState<RentalItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const selectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        apiClient.get<{ listings: any[] }>('/listings', { params: { popular: 'true' } })
            .then(data => {
                const mapped = data.listings.map(l => ({
                    ...l,
                    owner: { name: l.owner.firstName, avatar: l.owner.avatar || '', verified: l.owner.verified }
                }));
                const unique = Array.from(new Map(mapped.map(x => [x.id, x])).values());
                setItems(unique.slice(0, 8));
            })
            .catch(err => console.error('Failed to fetch listings:', err))
            .finally(() => setIsLoading(false));
    }, []);

    const advance = useCallback((dir: 1 | -1) => {
        if (items.length === 0) return;
        setActiveIndex(prev => ((prev + dir) % items.length + items.length) % items.length);
    }, [items.length]);

    // Auto-loop — pauses while hovering
    useEffect(() => {
        if (isHovering || items.length === 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(() => advance(1), 2200);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isHovering, items.length, advance]);

    const handleCardHover = (i: number) => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setIsHovering(true);
        if (activeIndex === i) return;
        
        // Add a slight delay before triggering the display flip 
        // to prevent erratic snapping if sweeping the mouse quickly
        if (selectionTimer.current) clearTimeout(selectionTimer.current);
        selectionTimer.current = setTimeout(() => {
            setActiveIndex(i);
        }, 180);
    };

    const handleCardClick = (id: string) => {
        router.push(`/item/${id}`);
    };

    const handleClusterLeave = () => {
        if (selectionTimer.current) clearTimeout(selectionTimer.current);
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => setIsHovering(false), 350);
    };

    const n = items.length;
    const activeItem = items[activeIndex];
    const activeCfg = activeItem ? getCategoryConfig(activeItem.category) : categoryConfig.default;

    return (
        <section className="py-8 sm:py-12 relative overflow-hidden" id="trending">

            {/* Dynamic background glow that shifts with the active item */}
            <AnimatePresence mode="wait">
                {activeItem && (
                    <motion.div
                        key={activeIndex}
                        className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2 }}
                        style={{
                            background: `radial-gradient(ellipse 60% 50% at 50% 60%, ${activeCfg.glow}, transparent 70%)`,
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">

                {/* Header */}
                <motion.div
                    className="flex flex-col items-center text-center mb-10 sm:mb-12"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <span className="text-sm sm:text-base text-[#00FFB3] mb-4 block tracking-[0.35em] uppercase font-bold">trending showcase</span>
                    <h2 className="text-6xl sm:text-7xl md:text-8xl font-display font-medium tracking-tighter">
                        elite <span className="text-white/25 italic font-light">selection</span>
                    </h2>
                </motion.div>

                {/* Loading */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-40">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-[#00FFB3] animate-spin" />
                            <span className="text-xs text-white/40 tracking-[0.2em] uppercase">loading selection</span>
                        </div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex items-center justify-center py-40">
                        <p className="text-white/30 text-sm tracking-widest uppercase">No listings yet</p>
                    </div>
                ) : (
                    <motion.div
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ ...spring, delay: 0.12 }}
                    >
                        {/* ── Carousel Stage ── */}
                        <div
                            className="relative flex items-center justify-center w-full mb-8"
                            style={{ height: CARD_H + 80, perspective: '1400px' }}
                            onMouseLeave={handleClusterLeave}
                        >
                            {/* Prev / Next arrows */}
                            <button
                                onClick={() => { advance(-1); setIsHovering(false); }}
                                className="absolute left-4 sm:left-8 z-20 w-11 h-11 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 flex items-center justify-center transition-all duration-300 group"
                                aria-label="Previous"
                            >
                                <ChevronLeft className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                            </button>
                            <button
                                onClick={() => { advance(1); setIsHovering(false); }}
                                className="absolute right-4 sm:right-8 z-20 w-11 h-11 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 flex items-center justify-center transition-all duration-300 group"
                                aria-label="Next"
                            >
                                <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                            </button>

                            {/* Card cluster — overflow visible so side cards show */}
                            <div style={{ position: 'relative', width: CARD_W, height: CARD_H, transformStyle: 'preserve-3d', overflow: 'visible' }}>
                                {items.map((item, i) => {
                                    const pos = circularPos(i, activeIndex, n);
                                    if (Math.abs(pos) > 2) return null;
                                    const slot = slotStyles[pos as keyof typeof slotStyles];
                                    const isCenter = pos === 0;
                                    const cfg = getCategoryConfig(item.category);
                                    const imgSrc = item.images?.[0];

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleCardClick(item.id)}
                                            className="absolute inset-0 rounded-2xl flex flex-col overflow-hidden cursor-pointer"
                                            style={{
                                                transform: slot.transform,
                                                zIndex: slot.zIndex,
                                                opacity: slot.opacity,
                                                filter: `brightness(${slot.brightness}) ${isCenter ? 'saturate(1.15)' : 'saturate(0.8)'}`,
                                                boxShadow: isCenter
                                                    ? `${slot.shadow}, 0 0 60px ${cfg.glow}, 0 0 120px ${cfg.glow.replace('0.5', '0.2')}`
                                                    : slot.shadow,
                                                border: isCenter
                                                    ? `1px solid ${cfg.accent}55`
                                                    : '1px solid rgba(255,255,255,0.07)',
                                                backgroundColor: 'rgba(4,4,10,0.92)',
                                                backdropFilter: 'blur(20px)',
                                                transition: 'transform 0.9s cubic-bezier(0.25,1.1,0.4,1), filter 0.9s ease, opacity 0.75s ease, box-shadow 0.9s ease, border-color 0.9s ease',
                                                willChange: 'transform',
                                            }}
                                            onMouseEnter={() => handleCardHover(i)}
                                            onMouseLeave={() => { if (selectionTimer.current) clearTimeout(selectionTimer.current); }}
                                        >
                                            {/* ── Photo / Gradient area ── */}
                                            <div className="relative flex-none overflow-hidden" style={{ height: '60%' }}>
                                                {imgSrc ? (
                                                    <img
                                                        src={imgSrc}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover transition-transform duration-700"
                                                        style={{ transform: isCenter ? 'scale(1.04)' : 'scale(1)' }}
                                                    />
                                                ) : (
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient}`} />
                                                )}
                                                {/* Overlay gradient at bottom */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#04040a] via-transparent to-transparent" />

                                                {/* Top badges — only on center */}
                                                {isCenter && (
                                                    <>
                                                        <div
                                                            className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest backdrop-blur-md border shadow-lg"
                                                            style={{ backgroundColor: `${cfg.accent}22`, borderColor: `${cfg.accent}55`, color: cfg.accent }}
                                                        >
                                                            {item.category}
                                                        </div>
                                                        {item.rating != null && (
                                                            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                                                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                                <span className="text-[10px] font-bold text-white">{item.rating}</span>
                                                            </div>
                                                        )}
                                                        {/* Accent scan line */}
                                                        <div
                                                            className="absolute bottom-0 left-0 right-0 h-[2px]"
                                                            style={{ background: `linear-gradient(90deg, transparent, ${cfg.accent}, transparent)`, opacity: 0.9 }}
                                                        />
                                                    </>
                                                )}
                                            </div>

                                            {/* ── Content area ── */}
                                            <div className="flex flex-col justify-between p-4 flex-1 relative">
                                                {/* Top accent line */}
                                                <div
                                                    className="absolute top-0 left-6 right-6 h-[1px]"
                                                    style={{ background: `linear-gradient(90deg, transparent, ${isCenter ? cfg.accent + '40' : 'rgba(255,255,255,0.08)'}, transparent)` }}
                                                />
                                                <h3 className={`font-semibold leading-tight truncate transition-all duration-500 ${isCenter ? 'text-white text-xl sm:text-2xl' : 'text-white/50 text-sm'}`}>
                                                    {item.title}
                                                </h3>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span
                                                        className="px-3 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all duration-500"
                                                        style={{
                                                            backgroundColor: isCenter ? `${cfg.accent}20` : 'rgba(255,255,255,0.05)',
                                                            color: isCenter ? cfg.accent : 'rgba(255,255,255,0.35)',
                                                            border: `1px solid ${isCenter ? cfg.accent + '35' : 'rgba(255,255,255,0.08)'}`,
                                                        }}
                                                    >
                                                        ${item.price}<span className="font-normal opacity-60">/{item.priceUnit?.toLowerCase() ?? 'day'}</span>
                                                    </span>
                                                    {isCenter && (
                                                        <Link
                                                            href={`/item/${item.id}`}
                                                            className="w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 hover:scale-110"
                                                            style={{
                                                                backgroundColor: `${cfg.accent}18`,
                                                                borderColor: `${cfg.accent}40`,
                                                                color: cfg.accent,
                                                            }}
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

                        {/* ── Active item meta ── */}
                        <AnimatePresence mode="wait">
                            {activeItem && (
                                <motion.div
                                    key={activeIndex}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.25 }}
                                    className="flex flex-col items-center gap-1 mb-7 h-10"
                                >
                                    {activeItem.owner?.name && (
                                        <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/35">
                                            Owner: <span className="text-white/65">{activeItem.owner.name}</span>
                                        </p>
                                    )}
                                    <p className="text-[11px] font-mono tracking-[0.2em] uppercase" style={{ color: activeCfg.accent + 'aa' }}>
                                        {String(activeIndex + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Progress dots ── */}
                        <div className="flex items-center gap-[7px] mb-12">
                            {items.map((_, i) => {
                                const isActive = i === activeIndex;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => { setActiveIndex(i); setIsHovering(false); }}
                                        aria-label={`Go to item ${i + 1}`}
                                        className="rounded-full transition-all duration-400"
                                        style={{
                                            width: isActive ? 28 : 6,
                                            height: 6,
                                            backgroundColor: isActive ? activeCfg.accent : 'rgba(255,255,255,0.12)',
                                            boxShadow: isActive ? `0 0 8px ${activeCfg.accent}` : 'none',
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* ── View all ── */}
                        <Link
                            href="/explore"
                            className="group text-xs font-bold text-white/40 hover:text-white transition-all duration-300 flex items-center gap-2 uppercase tracking-widest border border-white/10 hover:border-white/30 px-7 py-3.5 rounded-full hover:bg-white/5"
                        >
                            view all top rentals
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
