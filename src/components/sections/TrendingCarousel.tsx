import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { fadeInUp } from '@/lib/animations/motion-config';
import RentalCard from '@/components/cards/RentalCard';
import type { RentalItem } from '@/store/rental-store';
import { apiClient } from '@/lib/api-client';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Loader2 } from 'lucide-react';

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
                // Map API owner to frontend owner structure if needed
                const mapped = data.listings.map(l => ({
                    ...l,
                    owner: {
                        name: l.owner.firstName,
                        avatar: l.owner.avatar || '',
                        verified: l.owner.verified
                    }
                }));

                // Deduplicate by ID
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

    const x = useTransform(scrollYProgress, [0, 1], [0, -100]);

    return (
        <section className="section-padding relative overflow-hidden" ref={containerRef}>
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    className="flex flex-col md:flex-row md:items-end justify-between mb-12"
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <div>
                        <motion.span className="inline-block text-xs tracking-[0.3em] uppercase text-[#00cec9] mb-4">
                            Trending Now
                        </motion.span>
                        <h2 className="text-3xl md:text-5xl font-bold">
                            Most <span className="gradient-text-alt">Popular</span> Rentals
                        </h2>
                    </div>
                    <a href="/explore" className="text-sm text-white/40 hover:text-white/70 transition-colors mt-4 md:mt-0 flex items-center gap-1">
                        View all
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </a>
                </motion.div>

                {/* Cards Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-[#6c5ce7] animate-spin" />
                    </div>
                ) : (
                    <motion.div style={isMobile ? {} : { x }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {items.slice(0, 8).map((item, i) => (
                            <RentalCard key={item.id} item={item} index={i} />
                        ))}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
