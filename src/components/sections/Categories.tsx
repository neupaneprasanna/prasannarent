'use client';

import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';
import { useAppStore } from '@/store/app-store';

import { Camera, Car, Home, Film, Shirt, Music, Hammer, Laptop } from 'lucide-react';

const categories = [
    { name: 'Tech & Gadgets', icon: <Camera size={32} />, count: '2.4k', color: 'from-blue-500/20 to-purple-500/20', border: 'border-blue-500/20' },
    { name: 'Vehicles', icon: <Car size={32} />, count: '1.8k', color: 'from-emerald-500/20 to-cyan-500/20', border: 'border-emerald-500/20' },
    { name: 'Rooms & Spaces', icon: <Home size={32} />, count: '3.2k', color: 'from-orange-500/20 to-rose-500/20', border: 'border-orange-500/20' },
    { name: 'Film Equipment', icon: <Film size={32} />, count: '980', color: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/20' },
    { name: 'Fashion', icon: <Shirt size={32} />, count: '1.5k', color: 'from-pink-500/20 to-fuchsia-500/20', border: 'border-pink-500/20' },
    { name: 'Music Studios', icon: <Music size={32} />, count: '640', color: 'from-violet-500/20 to-indigo-500/20', border: 'border-violet-500/20' },
    { name: 'Power Tools', icon: <Hammer size={32} />, count: '1.1k', color: 'from-slate-400/20 to-zinc-500/20', border: 'border-slate-500/20' },
    { name: 'Digital Gear', icon: <Laptop size={32} />, count: '2.1k', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/20' },
];

export default function Categories() {
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);

    return (
        <section className="section-padding relative" id="categories">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <motion.span className="inline-block text-xs tracking-[0.3em] uppercase text-[#a29bfe] mb-4">
                        Categories
                    </motion.span>
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        Rent <span className="gradient-text">Anything</span> You Need
                    </h2>
                    <p className="text-white/40 max-w-md mx-auto">
                        Browse through diverse categories and find exactly what you&apos;re looking for.
                    </p>
                </motion.div>

                {/* Grid */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                >
                    {categories.map((category, i) => (
                        <motion.a
                            href="/explore"
                            key={category.name}
                            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.color} border ${category.border} p-6 md:p-8 transition-all duration-500 hover:scale-[1.02]`}
                            variants={fadeInUp}
                            custom={i}
                            onMouseEnter={() => setCursorVariant('hover')}
                            onMouseLeave={() => setCursorVariant('default')}
                            whileHover={{ y: -4 }}
                        >
                            <motion.div
                                className="text-4xl md:text-5xl mb-4"
                                whileHover={{ scale: 1.2, rotate: 5 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                {category.icon}
                            </motion.div>
                            <h3 className="font-semibold text-white/80 text-sm md:text-base mb-1 group-hover:text-white transition-colors">
                                {category.name}
                            </h3>
                            <p className="text-xs text-white/30">{category.count} items</p>

                            {/* Hover glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </motion.a>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
