'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import Link from 'next/link';
import type { RentalItem } from '@/store/rental-store';

interface RentalCardProps {
    item: RentalItem;
    index?: number;
}

export default function RentalCard({ item, index = 0 }: RentalCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);
    const setCursorText = useAppStore((s) => s.setCursorText);
    const [isHovered, setIsHovered] = useState(false);
    const [imgError, setImgError] = useState(false);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-100, 100], [8, -8]);
    const rotateY = useTransform(x, [-100, 100], [-8, 8]);
    const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
    const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(e.clientX - centerX);
        y.set(e.clientY - centerY);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        setIsHovered(false);
        setCursorVariant('default');
        setCursorText('');
    };

    const categoryGradients: Record<string, string> = {
        tech: 'from-blue-500/20 to-purple-500/20',
        vehicles: 'from-emerald-500/20 to-cyan-500/20',
        rooms: 'from-orange-500/20 to-rose-500/20',
        equipment: 'from-yellow-500/20 to-amber-500/20',
        fashion: 'from-pink-500/20 to-fuchsia-500/20',
        studios: 'from-violet-500/20 to-indigo-500/20',
        tools: 'from-slate-500/20 to-zinc-500/20',
        digital: 'from-cyan-500/20 to-blue-500/20',
    };

    const gradient = categoryGradients[item.category] || 'from-[#6c5ce7]/20 to-[#a29bfe]/20';

    return (
        <motion.div
            ref={ref}
            className="group relative"
            style={{
                perspective: 1000,
                transformStyle: 'preserve-3d',
            }}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
                duration: 0.7,
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => {
                setIsHovered(true);
                setCursorVariant('text');
                setCursorText('View');
            }}
        >
            <Link href={`/item/${item.id}`} className="block h-full">
                <motion.div
                    className="relative glass-card rounded-2xl overflow-hidden h-full"
                    style={{
                        rotateX: springRotateX,
                        rotateY: springRotateY,
                        transformStyle: 'preserve-3d',
                    }}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    {/* Image area */}
                    <div className={`relative h-48 md:h-56 bg-gradient-to-br ${gradient} overflow-hidden`}>
                        {/* Real Image with fallback */}
                        {item.images && item.images.length > 0 && !imgError && (
                            <motion.div
                                className="absolute inset-0"
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: isHovered ? 1.05 : 1 }}
                                transition={{ duration: 0.6 }}
                            >
                                <img
                                    src={item.images[0]}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    loading={index < 3 ? "eager" : "lazy"}
                                    onError={() => setImgError(true)}
                                />
                            </motion.div>
                        )}

                        {/* Placeholder image with gradient (Visible if no image or error) */}
                        {(!item.images || item.images.length === 0 || imgError) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    className="text-6xl opacity-30"
                                    animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    {item.category === 'tech' && '📸'}
                                    {item.category === 'vehicles' && '🚗'}
                                    {item.category === 'rooms' && '🏠'}
                                    {item.category === 'equipment' && '🎬'}
                                    {item.category === 'fashion' && '👗'}
                                    {item.category === 'studios' && '🎵'}
                                    {item.category === 'tools' && '🔧'}
                                    {item.category === 'digital' && '💻'}
                                </motion.div>
                            </div>
                        )}

                        {/* Hover overlay */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isHovered ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                        />

                        {/* Featured badge */}
                        {item.featured && (
                            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-xs font-medium text-white">
                                Featured
                            </div>
                        )}

                        {/* Quick actions on hover */}
                        <motion.div
                            className="absolute bottom-3 right-3 flex items-center gap-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Actions like compare or share can go here */}
                        </motion.div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-white/90 text-sm leading-tight line-clamp-1 group-hover:text-white transition-colors">
                                {item.title}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fdcb6e" stroke="none">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <span className="text-xs text-white/60">{item.rating}</span>
                                <span className="text-xs text-white/30">({item.reviewCount})</span>
                            </div>
                        </div>

                        <p className="text-xs text-white/40 mb-3 flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            {item.location}
                        </p>

                        <div className="flex items-end justify-between">
                            <div>
                                <span className="text-lg font-bold gradient-text">${item.price}</span>
                                <span className="text-xs text-white/40 ml-1">/ {item.priceUnit}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {item.owner.verified && (
                                    <div className="w-5 h-5 rounded-full bg-[#00cec9]/20 flex items-center justify-center">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#00cec9" stroke="none">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    </div>
                                )}
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6c5ce7]/30 to-[#a29bfe]/30 flex items-center justify-center text-[10px] font-medium text-white/60 overflow-hidden border border-white/5">
                                    {item.owner.avatar ? (
                                        <img src={item.owner.avatar} alt={item.owner.name} className="w-full h-full object-cover" />
                                    ) : (
                                        item.owner.name[0]
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Glow effect on hover */}
                    <motion.div
                        className="absolute -inset-px rounded-2xl pointer-events-none"
                        style={{
                            background: 'linear-gradient(135deg, rgba(108,92,231,0.3), transparent, rgba(253,121,168,0.2))',
                            opacity: 0,
                        }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.4 }}
                    />
                </motion.div>
            </Link>
        </motion.div>
    );
}
