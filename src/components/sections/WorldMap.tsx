'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { fadeInUp } from '@/lib/animations/motion-config';
import { useAppStore } from '@/store/app-store';
import { useIsMobile } from '@/hooks/use-is-mobile';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import StaticGlobe from '../ui/StaticGlobe';

const Globe = dynamic(() => import('@/components/ui/Globe'), {
    ssr: false,
    loading: () => null // Avoid rendering text placeholders inside Canvas
});

export default function WorldMap() {
    const isMobile = useIsMobile();
    const [mounted, setMounted] = useState(false);
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

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
                        {!isMobile && <div className="absolute inset-0 bg-[#6c5ce7]/5 rounded-full blur-[120px] scale-75 pointer-events-none" />}

                        {isMobile ? (
                            <StaticGlobe />
                        ) : (
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
                        )}

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
