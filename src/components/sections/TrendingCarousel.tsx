'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import RentalCard from '@/components/cards/RentalCard';
import type { RentalItem } from '@/store/rental-store';
import { apiClient } from '@/lib/api-client';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Loader2 } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function TrendingCarousel() {
    const isMobile = useIsMobile();
    const [items, setItems] = useState<RentalItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchPopular = async () => {
            try {
                const data = await apiClient.get<{ listings: any[] }>('/listings', {
                    params: { popular: 'true' }
                });
                const mapped = data.listings.map(l => ({
                    ...l,
                    owner: {
                        name: l.owner.firstName,
                        avatar: l.owner.avatar || '',
                        verified: l.owner.verified
                    }
                }));
                const uniqueItems = Array.from(new Map(mapped.map(item => [item.id, item])).values());
                setItems(uniqueItems);
            } catch (error) {
                console.error('Failed to fetch popular items:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPopular();
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start'],
    });

    const x = useTransform(scrollYProgress, [0, 1], [0, -80]);

    return (
        <section className="section-padding relative overflow-hidden" ref={containerRef} id="trending">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    className="flex flex-col md:flex-row md:items-end justify-between mb-14"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <div>
                        <span className="text-label text-[#00FFB3] mb-4 block" style={{ textShadow: '0 0 20px rgba(0,255,179,0.3)' }}>trending now</span>
                        <h2 className="text-section">
                            most <span className="gradient-text-energy">popular</span> rentals
                        </h2>
                    </div>
                    <a href="/explore" className="text-sm text-white/30 hover:text-white/60 transition-colors mt-4 md:mt-0 flex items-center gap-1.5 tracking-wide">
                        view all
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </a>
                </motion.div>

                {/* Cards — hologram materialization */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-6 h-6 text-[#7A5CFF] animate-spin" />
                            <span className="text-label text-white/20">loading artifacts</span>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        style={isMobile ? {} : { x }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
                    >
                        {items.slice(0, 8).map((item, i) => (
                            <RentalCard key={item.id} item={item} index={i} />
                        ))}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
