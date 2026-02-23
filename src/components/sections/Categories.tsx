'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { Camera, Car, Home, Film, Shirt, Music, Hammer, Laptop } from 'lucide-react';

const categories = [
    { name: 'tech & gadgets', icon: <Camera size={28} />, count: '2.4k', glow: '#00F0FF' },
    { name: 'vehicles', icon: <Car size={28} />, count: '1.8k', glow: '#00FFB3' },
    { name: 'rooms & spaces', icon: <Home size={28} />, count: '3.2k', glow: '#FF4D9D' },
    { name: 'film equipment', icon: <Film size={28} />, count: '980', glow: '#7A5CFF' },
    { name: 'fashion', icon: <Shirt size={28} />, count: '1.5k', glow: '#A18CFF' },
    { name: 'music studios', icon: <Music size={28} />, count: '640', glow: '#00FFE1' },
    { name: 'power tools', icon: <Hammer size={28} />, count: '1.1k', glow: '#FF4D9D' },
    { name: 'digital gear', icon: <Laptop size={28} />, count: '2.1k', glow: '#00F0FF' },
];

const spring = { type: 'spring' as const, stiffness: 200, damping: 20 };

export default function Categories() {
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);

    return (
        <section className="section-padding relative" id="categories">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <span className="text-label mb-4 block" style={{ color: '#00F0FF', textShadow: '0 0 20px rgba(0,240,255,0.3)' }}>categories</span>
                    <h2 className="text-section mb-4">
                        rent <span className="gradient-text">anything</span> you need
                    </h2>
                    <p className="text-body text-white/35 max-w-md mx-auto">
                        browse through diverse categories and find exactly what you&apos;re looking for.
                    </p>
                </motion.div>

                {/* Floating category capsules */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {categories.map((category, i) => (
                        <motion.a
                            href="/explore"
                            key={category.name}
                            className="group p-5 sm:p-6 relative rounded-2xl"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ ...spring, delay: i * 0.06 }}
                            whileHover={{ y: -8, scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onMouseEnter={() => setCursorVariant('hover')}
                            onMouseLeave={() => setCursorVariant('default')}
                            style={{
                                background: 'linear-gradient(135deg, rgba(16,17,26,0.9) 0%, rgba(10,11,16,0.8) 100%)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
                            }}
                        >
                            {/* Icon with colored background */}
                            <motion.div
                                className="mb-4 transition-colors duration-300"
                                whileHover={{ scale: 1.15, rotate: 5 }}
                                transition={spring}
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{
                                        background: `${category.glow}15`,
                                        color: category.glow,
                                        boxShadow: `0 0 20px ${category.glow}15`,
                                    }}
                                >
                                    {category.icon}
                                </div>
                            </motion.div>

                            <h3 className="font-medium text-white/80 text-sm mb-1 group-hover:text-white transition-colors tracking-tight">
                                {category.name}
                            </h3>
                            <p className="text-[11px] text-white/25 tracking-wide">{category.count} items</p>

                            {/* Hover glow aura — much more visible */}
                            <div
                                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background: `radial-gradient(circle at 30% 30%, ${category.glow}20 0%, transparent 70%)`,
                                    boxShadow: `0 0 40px ${category.glow}10, inset 0 0 30px ${category.glow}05`,
                                }}
                            />

                            {/* Bottom accent line — always slightly visible, full on hover */}
                            <div
                                className="absolute bottom-0 left-[10%] right-[10%] h-[2px] transition-opacity duration-500 opacity-30 group-hover:opacity-100"
                                style={{ background: `linear-gradient(90deg, transparent, ${category.glow}80, transparent)` }}
                            />

                            {/* Top-left corner accent */}
                            <div
                                className="absolute top-0 left-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background: `radial-gradient(circle at 0% 0%, ${category.glow}15, transparent 70%)`,
                                }}
                            />
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
}
