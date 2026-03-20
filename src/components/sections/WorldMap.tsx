'use client';

import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { CITIES } from '../ui/Globe';
import StaticGlobe from '../ui/StaticGlobe';
import { Globe2, Zap, Users, TrendingUp, ArrowUpRight, MapPin, Activity } from 'lucide-react';

const Globe = dynamic(() => import('@/components/ui/Globe'), { ssr: false, loading: () => null });

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!isInView) return;
        const start = performance.now();
        const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [isInView, target, duration]);

    return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

// ─── Region data ─────────────────────────────────────────────────────────────

const REGIONS = [
    { name: 'Americas',      count: 6100,  color: '#00FFB3', pct: 33, icon: '🌎' },
    { name: 'Europe',        count: 7200,  color: '#7A5CFF', pct: 38, icon: '🌍' },
    { name: 'Asia-Pacific',  count: 8700,  color: '#00F0FF', pct: 47, icon: '🌏' },
    { name: 'Middle East',   count: 2600,  color: '#F59E0B', pct: 14, icon: '🕌' },
    { name: 'Africa',        count: 800,   color: '#F43F5E', pct: 4,  icon: '🌍' },
];

const spring = { type: 'spring' as const, stiffness: 80, damping: 20 };

export default function WorldMap() {
    const isMobile = useIsMobile();
    const [mounted, setMounted] = useState(false);
    const [hoveredCity, setHoveredCity] = useState<number | null>(null);
    const [activeRegion, setActiveRegion] = useState<string | null>(null);
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    const focusLng = hoveredCity !== null ? CITIES[hoveredCity].lng : null;

    const displayedCities = activeRegion
        ? CITIES.filter(c => c.region === activeRegion)
        : CITIES;

    return (
        <section ref={sectionRef} className="relative py-16 sm:py-24 overflow-hidden bg-[#020206]">

            {/* Background grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

            {/* Background glow blobs */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.04) 0%, transparent 70%)', filter: 'blur(60px)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(122,92,255,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

                {/* ── Header ── */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-[#00F0FF]/20 bg-[#00F0FF]/5">
                        <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00F0FF]">live network</span>
                    </div>
                    <h2 className="text-5xl sm:text-6xl md:text-7xl font-display font-medium tracking-tighter mb-4">
                        available <span className="text-white/25 italic font-light">worldwide</span>
                    </h2>
                    <p className="text-white/40 text-sm max-w-lg mx-auto">
                        Real-time rentals from verified owners across 120+ cities in 47 countries — every timezone, 24/7.
                    </p>
                </motion.div>

                {/* ── Top stats bar ── */}
                <motion.div
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...spring, delay: 0.1 }}
                >
                    {[
                        { icon: Globe2,    label: 'Cities',    value: 120,  suffix: '+', color: '#00FFB3' },
                        { icon: MapPin,    label: 'Countries', value: 47,   suffix: '',  color: '#7A5CFF' },
                        { icon: Zap,       label: 'Listings',  value: 18400,suffix: '+', color: '#00F0FF' },
                        { icon: Activity,  label: 'Avg. Response', value: 12, suffix: 'min', color: '#F59E0B' },
                    ].map(({ icon: Icon, label, value, suffix, color }, i) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ ...spring, delay: 0.05 * i }}
                            className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5 overflow-hidden group hover:border-white/15 transition-colors duration-300"
                        >
                            <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                                    <Icon className="w-4 h-4" style={{ color }} />
                                </div>
                                <TrendingUp className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors" />
                            </div>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color }}>
                                {isInView && <AnimatedCounter target={value} suffix={suffix} duration={1800 + i * 200} />}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ── Main 2-column layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

                    {/* LEFT: City leaderboard */}
                    <motion.div
                        className="lg:col-span-2 flex flex-col gap-3"
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ ...spring, delay: 0.15 }}
                    >
                        {/* Panel header */}
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black uppercase tracking-widest text-white/50">Top Cities</span>
                            <div className="flex items-center gap-1.5">
                                <motion.div className="w-1.5 h-1.5 rounded-full bg-[#00FFB3]"
                                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                                <span className="text-[9px] uppercase tracking-wider text-[#00FFB3]/70">live</span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            {CITIES.map((city, i) => {
                                const maxCount = 5200;
                                const numCount = parseFloat(city.count) * 1000;
                                const pct = Math.round((numCount / maxCount) * 100);
                                const isHovered = hoveredCity === i;
                                const regionColors: Record<string, string> = {
                                    'Americas': '#00FFB3', 'Europe': '#7A5CFF',
                                    'Asia-Pacific': '#00F0FF', 'Middle East': '#F59E0B', 'Africa': '#F43F5E',
                                };
                                const color = regionColors[city.region] ?? '#00FFB3';

                                return (
                                    <motion.div
                                        key={city.city}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.04 * i, duration: 0.4 }}
                                        className="group relative rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
                                        style={{
                                            borderColor: isHovered ? `${color}40` : 'rgba(255,255,255,0.05)',
                                            backgroundColor: isHovered ? `${color}08` : 'rgba(255,255,255,0.02)',
                                        }}
                                        onMouseEnter={() => setHoveredCity(i)}
                                        onMouseLeave={() => setHoveredCity(null)}
                                    >
                                        {/* Animated progress bar background */}
                                        <motion.div
                                            className="absolute inset-y-0 left-0 rounded-xl"
                                            initial={{ width: '0%' }}
                                            whileInView={{ width: `${pct}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.2, delay: 0.06 * i, ease: [0.25, 1, 0.5, 1] }}
                                            style={{ background: `linear-gradient(90deg, ${color}10, transparent)` }}
                                        />

                                        <div className="relative flex items-center gap-3 px-3 py-2.5">
                                            <span className="text-[10px] font-black text-white/20 w-5 shrink-0" style={{ color: isHovered ? `${color}80` : undefined }}>
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm font-semibold truncate transition-colors duration-300 ${isHovered ? 'text-white' : 'text-white/70'}`}>
                                                        {city.city}
                                                    </span>
                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                                        <span className="text-xs font-black" style={{ color }}>{city.count}</span>
                                                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                                                        style={{ backgroundColor: `${color}15`, color: `${color}90` }}>
                                                        {city.region}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* RIGHT: Globe */}
                    <motion.div
                        className="lg:col-span-3 relative rounded-3xl overflow-hidden border border-white/5 bg-[#04040c]"
                        style={{ minHeight: isMobile ? 320 : 580 }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ ...spring, delay: 0.2 }}
                    >
                        {/* Globe canvas glow */}
                        <div className="absolute inset-0 pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,240,255,0.04), transparent)' }} />

                        {/* Hovering city label */}
                        <AnimatePresence>
                            {hoveredCity !== null && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(0,255,179,0.3)', color: '#00FFB3', backdropFilter: 'blur(8px)' }}
                                >
                                    ↻ rotating to {CITIES[hoveredCity].city}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Drag hint */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                            <div className="px-3 py-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-[9px] text-white/30 tracking-[0.2em] uppercase flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-[#00FFB3] animate-pulse" />
                                drag to explore
                            </div>
                        </div>

                        <div className="w-full h-full" style={{ minHeight: isMobile ? 320 : 580 }}>
                            {isMobile ? (
                                <StaticGlobe />
                            ) : (
                                <Canvas>
                                    <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={42} />
                                    <OrbitControls
                                        enableZoom={false}
                                        enablePan={false}
                                        minPolarAngle={Math.PI / 4}
                                        maxPolarAngle={Math.PI / 1.5}
                                    />
                                    <Globe focusLng={focusLng} />
                                </Canvas>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* ── Region breakdown ── */}
                <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...spring, delay: 0.25 }}
                >
                    {REGIONS.map((region, i) => (
                        <motion.div
                            key={region.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.06 * i }}
                            whileHover={{ scale: 1.03 }}
                            onClick={() => setActiveRegion(activeRegion === region.name ? null : region.name)}
                            className="relative rounded-2xl border p-4 cursor-pointer overflow-hidden transition-all duration-300"
                            style={{
                                borderColor: activeRegion === region.name ? `${region.color}50` : 'rgba(255,255,255,0.05)',
                                backgroundColor: activeRegion === region.name ? `${region.color}08` : 'rgba(255,255,255,0.02)',
                            }}
                        >
                            <div className="absolute top-0 left-0 w-full h-[1px]"
                                style={{ background: `linear-gradient(90deg, transparent, ${region.color}40, transparent)` }} />

                            <div className="text-xl mb-2">{region.icon}</div>
                            <div className="text-xs font-black uppercase tracking-wider text-white/60 mb-1">{region.name}</div>
                            <div className="text-lg font-black" style={{ color: region.color }}>
                                {isInView && <AnimatedCounter target={region.count} suffix="+" duration={1600 + i * 150} />}
                            </div>

                            {/* Percentage bar */}
                            <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    initial={{ width: '0%' }}
                                    whileInView={{ width: `${region.pct}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.2, delay: 0.1 * i, ease: [0.25, 1, 0.5, 1] }}
                                    style={{ backgroundColor: region.color }}
                                />
                            </div>
                            <div className="text-[10px] text-white/30 mt-1">{region.pct}% of network</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
