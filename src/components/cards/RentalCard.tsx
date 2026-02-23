'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import Link from 'next/link';
import type { RentalItem } from '@/store/rental-store';
import CompareButton from '@/components/listing/CompareButton';
import { Listing } from '@/types/rental';

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

    // Tilt toward cursor — perspective transform
    const rotateX = useTransform(y, [-150, 150], [12, -12]);
    const rotateY = useTransform(x, [-150, 150], [-12, 12]);
    const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 25 });
    const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 25 });

    // Glow position follows cursor
    const glowX = useTransform(x, [-150, 150], [0, 100]);
    const glowY = useTransform(y, [-150, 150], [0, 100]);

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

    const mainImage = item.media?.find((m: any) => m.type === 'IMAGE')?.url ||
        (item.images && item.images.length > 0 ? item.images[0] : null);

    return (
        <motion.div
            ref={ref}
            className="group relative"
            style={{
                perspective: 800,
                transformStyle: 'preserve-3d',
            }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
                type: 'spring',
                stiffness: 100,
                damping: 18,
                delay: index * 0.08,
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
                    className="capsule relative h-full overflow-hidden"
                    style={{
                        rotateX: springRotateX,
                        rotateY: springRotateY,
                        transformStyle: 'preserve-3d',
                    }}
                    animate={{
                        y: isHovered ? -10 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    {/* Cursor-following glow */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                            background: useTransform(
                                [glowX, glowY],
                                ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(122,92,255,0.15) 0%, transparent 60%)`
                            ),
                        }}
                    />

                    {/* Image area */}
                    <div className="relative h-48 md:h-56 overflow-hidden bg-[#0a0b10]">
                        {mainImage && !imgError ? (
                            <motion.div
                                className="absolute inset-0"
                                animate={{ scale: isHovered ? 1.08 : 1 }}
                                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                            >
                                <img
                                    src={mainImage}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    loading={index < 3 ? "eager" : "lazy"}
                                    onError={() => setImgError(true)}
                                />
                            </motion.div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#7A5CFF]/10 to-[#0B0E13]">
                                <motion.div
                                    className="text-5xl opacity-20"
                                    animate={isHovered ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
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

                        {/* Bottom gradient overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a0b10] to-transparent" />

                        {/* Featured badge */}
                        {item.featured && (
                            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-[#7A5CFF] to-[#A18CFF] text-[10px] font-medium text-white tracking-wider uppercase"
                                style={{ boxShadow: '0 4px 12px rgba(122,92,255,0.3)' }}
                            >
                                featured
                            </div>
                        )}

                        {/* Availability pulse halo */}
                        <div className="absolute top-3 right-3">
                            <div className="relative">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#00FFB3]" style={{ boxShadow: '0 0 8px rgba(0,255,179,0.5)' }} />
                                <div className="absolute inset-0 rounded-full bg-[#00FFB3] animate-ping opacity-40" />
                            </div>
                        </div>

                        {/* Compare button on hover */}
                        <motion.div
                            className="absolute bottom-3 right-3 flex items-center gap-2 z-10"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CompareButton item={item as unknown as Listing} variant="icon" />
                        </motion.div>

                        {/* "rent now" emerges from depth on hover */}
                        <motion.div
                            className="absolute bottom-3 left-3 z-10"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <span className="text-[10px] font-medium text-white/70 tracking-[0.2em] uppercase px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl">
                                rent now
                            </span>
                        </motion.div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-medium text-white/80 text-sm leading-tight line-clamp-1 group-hover:text-white transition-colors tracking-tight">
                                {item.title}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="#fdcb6e" stroke="none">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <span className="text-xs text-white/50">{item.rating}</span>
                                <span className="text-xs text-white/20">({item.reviewCount})</span>
                            </div>
                        </div>

                        <p className="text-[11px] text-white/30 mb-3 flex items-center gap-1 tracking-wide">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            {item.location}
                        </p>

                        <div className="flex items-end justify-between">
                            {/* Price — styled as subtle metallic */}
                            <div>
                                <span className="text-lg font-semibold gradient-text-chrome">${item.price}</span>
                                <span className="text-[11px] text-white/25 ml-1 tracking-wide">/ {item.priceUnit}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {item.owner.verified && (
                                    <div className="w-4 h-4 rounded-full bg-[#00FFB3]/15 flex items-center justify-center">
                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="#00FFB3" stroke="none">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    </div>
                                )}
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#7A5CFF]/25 to-[#A18CFF]/25 flex items-center justify-center text-[9px] font-medium text-white/50 overflow-hidden border border-white/[0.04]">
                                    {item.owner.avatar ? (
                                        <img src={item.owner.avatar} alt={item.owner.name} className="w-full h-full object-cover" />
                                    ) : (
                                        item.owner.name[0]
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shimmer edge effect on hover */}
                    <motion.div
                        className="absolute inset-0 rounded-[1.25rem] pointer-events-none"
                        style={{
                            background: 'linear-gradient(135deg, rgba(122,92,255,0.2), transparent 40%, transparent 60%, rgba(0,240,255,0.1))',
                        }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.4 }}
                    />
                </motion.div>
            </Link>
        </motion.div>
    );
}
