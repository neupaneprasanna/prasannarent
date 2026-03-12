'use client';

import { useRecentlyViewedStore } from '@/store/engagement-store';
import { motion } from 'framer-motion';
import RentalCard from '@/components/cards/RentalCard';
import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function RecentlyViewedSection() {
    const { items, fetchRecentlyViewed } = useRecentlyViewedStore();

    useEffect(() => {
        fetchRecentlyViewed();
    }, []);

    if (items.length === 0) return null;

    return (
        <section className="py-24 px-6 relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock size={16} className="text-[#a29bfe]" />
                            <span className="text-[10px] font-bold text-[#a29bfe] uppercase tracking-[0.3em]">Your History</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white">Recently <span className="gradient-text">Viewed</span></h2>
                    </div>
                    <Link href="/recently-viewed" className="group flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-all uppercase tracking-widest">
                        View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.slice(0, 4).map((item, i) => (
                        <RentalCard 
                            key={item.id} 
                            item={{
                                ...item,
                                priceUnit: (item.priceUnit?.toLowerCase() || 'day') as any,
                                owner: {
                                    name: 'Owner',
                                    avatar: '',
                                    verified: false
                                }
                            } as any} 
                            index={i} 
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
