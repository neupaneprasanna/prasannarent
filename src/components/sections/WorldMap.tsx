'use client';

import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations/motion-config';
import { useAppStore } from '@/store/app-store';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

const Globe = dynamic(() => import('@/components/ui/Globe'), { ssr: false });

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
                    className="relative glass-card rounded-[3rem] p-4 md:p-8 overflow-hidden bg-black/40 backdrop-blur-3xl border border-white/5"
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <div className="relative w-full aspect-square md:aspect-[2/1] min-h-[500px] cursor-grab active:cursor-grabbing">
                        {/* Background subtle glow */}
                        <div className="absolute inset-0 bg-[#6c5ce7]/5 rounded-full blur-[120px] scale-75 pointer-events-none" />

                        <Canvas>
                            <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={45} />
                            <OrbitControls
                                enableZoom={false}
                                enablePan={false}
                                minPolarAngle={Math.PI / 4}
                                maxPolarAngle={Math.PI / 1.5}
                                autoRotate
                                autoRotateSpeed={0.5}
                            />
                            <Globe />
                        </Canvas>

                        {/* Overlay info */}
                        <div className="absolute bottom-10 left-10 z-10 hidden md:block">
                            <div className="glass-card rounded-2xl p-6 border border-white/10 max-w-[240px]">
                                <div className="text-[#00cec9] text-[10px] font-black uppercase tracking-widest mb-2">Live Status</div>
                                <div className="text-3xl font-bold text-white mb-1">Worldwide</div>
                                <p className="text-white/40 text-[11px] leading-relaxed">
                                    Our network spans across every timezone, offering 24/7 availability for all your rental needs.
                                </p>
                            </div>
                        </div>

                        {/* Mobile interaction hint */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:hidden">
                            <div className="px-4 py-2 rounded-full glass border border-white/10 text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-[#6c5ce7] animate-pulse" />
                                Drag to rotate Earth
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
