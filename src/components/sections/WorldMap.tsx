'use client';

import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations/motion-config';
import { useAppStore } from '@/store/app-store';

const hotspots: { city: string; x: number; y: number; count: string; size: 'lg' | 'md' | 'sm' }[] = [
    { city: 'New York', x: 28, y: 35, count: '5.2k', size: 'lg' },
    { city: 'London', x: 47, y: 28, count: '4.1k', size: 'lg' },
    { city: 'Tokyo', x: 82, y: 35, count: '3.8k', size: 'lg' },
    { city: 'San Francisco', x: 15, y: 38, count: '2.9k', size: 'md' },
    { city: 'Dubai', x: 60, y: 42, count: '2.1k', size: 'md' },
    { city: 'Sydney', x: 85, y: 72, count: '1.8k', size: 'md' },
    { city: 'Berlin', x: 51, y: 27, count: '1.5k', size: 'sm' },
    { city: 'Singapore', x: 76, y: 55, count: '1.3k', size: 'sm' },
    { city: 'São Paulo', x: 32, y: 65, count: '1.1k', size: 'sm' },
    { city: 'Mumbai', x: 68, y: 45, count: '900', size: 'sm' },
];

const sizeMap: Record<'lg' | 'md' | 'sm', string> = { lg: 'w-4 h-4', md: 'w-3 h-3', sm: 'w-2 h-2' };
const pulseMap: Record<'lg' | 'md' | 'sm', string> = { lg: 'w-8 h-8', md: 'w-6 h-6', sm: 'w-4 h-4' };

export default function WorldMap() {
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);

    return (
        <section className="section-padding relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <span className="inline-block text-xs tracking-[0.3em] uppercase text-[#00cec9] mb-4">
                        Global Network
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        Available <span className="gradient-text-alt">Worldwide</span>
                    </h2>
                    <p className="text-white/40 max-w-md mx-auto">
                        Rent from verified owners in 120+ cities across the globe.
                    </p>
                </motion.div>

                {/* Map */}
                <motion.div
                    className="relative glass-card rounded-3xl p-8 md:p-12 overflow-hidden"
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {/* Stylized world map using dots */}
                    <div className="relative w-full aspect-[2/1] min-h-[300px]">
                        {/* Grid lines */}
                        <div className="absolute inset-0" style={{
                            backgroundImage: `
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
              `,
                            backgroundSize: '50px 50px',
                        }} />

                        {/* Connection lines */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgba(108,92,231,0.3)" />
                                    <stop offset="50%" stopColor="rgba(162,155,254,0.1)" />
                                    <stop offset="100%" stopColor="rgba(0,206,201,0.3)" />
                                </linearGradient>
                            </defs>
                            {/* NY to London */}
                            <path d="M28,35 Q38,20 47,28" fill="none" stroke="url(#lineGrad)" strokeWidth="0.15" />
                            {/* London to Tokyo */}
                            <path d="M47,28 Q65,20 82,35" fill="none" stroke="url(#lineGrad)" strokeWidth="0.15" />
                            {/* NY to SF */}
                            <path d="M28,35 Q22,32 15,38" fill="none" stroke="url(#lineGrad)" strokeWidth="0.1" />
                            {/* London to Dubai */}
                            <path d="M47,28 Q54,32 60,42" fill="none" stroke="url(#lineGrad)" strokeWidth="0.1" />
                            {/* Tokyo to Sydney */}
                            <path d="M82,35 Q84,52 85,72" fill="none" stroke="url(#lineGrad)" strokeWidth="0.1" />
                        </svg>

                        {/* Hotspot dots */}
                        {hotspots.map((spot, i) => (
                            <motion.div
                                key={spot.city}
                                className="absolute group"
                                style={{
                                    left: `${spot.x}%`,
                                    top: `${spot.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                                initial={{ opacity: 0, scale: 0 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5 + i * 0.1, duration: 0.5, type: 'spring' }}
                                onMouseEnter={() => setCursorVariant('hover')}
                                onMouseLeave={() => setCursorVariant('default')}
                            >
                                {/* Pulse ring */}
                                <motion.div
                                    className={`absolute ${pulseMap[spot.size]} rounded-full bg-[#6c5ce7]/20 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2`}
                                    animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                                />

                                {/* Dot */}
                                <div className={`${sizeMap[spot.size]} rounded-full bg-[#6c5ce7] relative z-10 shadow-lg shadow-[#6c5ce7]/30`} />

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-20">
                                    <div className="glass-strong rounded-lg px-3 py-2 text-center">
                                        <div className="text-xs font-medium text-white/80">{spot.city}</div>
                                        <div className="text-[10px] text-[#a29bfe]">{spot.count} listings</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
