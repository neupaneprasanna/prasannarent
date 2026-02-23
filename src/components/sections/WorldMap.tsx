'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { useIsMobile } from '@/hooks/use-is-mobile';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import StaticGlobe from '../ui/StaticGlobe';

const Globe = dynamic(() => import('@/components/ui/Globe'), {
    ssr: false,
    loading: () => null
});

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function WorldMap() {
    const isMobile = useIsMobile();
    const [mounted, setMounted] = useState(false);
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return (
        <section className="section-padding relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <span className="text-label text-[#00FFE1] mb-4 block">global network</span>
                    <h2 className="text-section mb-4">
                        available <span className="gradient-text-energy">worldwide</span>
                    </h2>
                    <p className="text-body text-white/30 max-w-md mx-auto">
                        rent from verified owners in 120+ cities across the globe.
                    </p>
                </motion.div>

                {/* Globe container */}
                <motion.div
                    className="capsule relative p-3 sm:p-4 md:p-8 overflow-hidden"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <div className="relative w-full aspect-square md:aspect-[2/1] min-h-[400px] md:min-h-[500px] cursor-grab active:cursor-grabbing">
                        {/* Background glow */}
                        {!isMobile && <div className="absolute inset-0 rounded-full blur-[120px] scale-75 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(122,92,255,0.06) 0%, transparent 70%)' }} />}

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

                        {/* Info overlay */}
                        <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 z-10 hidden md:block">
                            <div className="capsule p-5 max-w-[220px]">
                                <div className="text-label text-[#00FFE1] mb-2">live status</div>
                                <div className="text-2xl font-light text-white/80 mb-1 tracking-tight">worldwide</div>
                                <p className="text-[11px] text-white/30 leading-relaxed">
                                    our network spans every timezone, offering 24/7 availability.
                                </p>
                            </div>
                        </div>

                        {/* Mobile hint */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden">
                            <div className="px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-[10px] text-white/30 tracking-[0.2em] uppercase flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-[#7A5CFF] animate-pulse" />
                                drag to rotate
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
