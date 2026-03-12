'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { useRecentlyViewedStore } from '@/store/engagement-store';
import { Clock, MapPin, Star, Eye, Grid3X3, List } from 'lucide-react';
import Link from 'next/link';

export default function RecentlyViewedPage() {
    const { isAuthenticated } = useAuthStore();
    const { items, loading, fetchRecentlyViewed } = useRecentlyViewedStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        if (isAuthenticated) fetchRecentlyViewed();
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center">
                <Navbar />
                <div className="text-center px-6">
                    <Clock size={64} className="mx-auto text-white/10 mb-6" />
                    <h2 className="text-2xl font-bold mb-3 text-white">Recently Viewed</h2>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">Sign in to see items you&#39;ve recently browsed</p>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white">
                        Sign In
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen bg-[#030304]">
            <Navbar />

            <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Recently Viewed</h1>
                        <p className="text-sm text-white/40">{items.length} items in your browsing history</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
                        >
                            <Grid3X3 size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card rounded-2xl p-12 text-center"
                    >
                        <Eye size={48} className="mx-auto text-white/10 mb-4" />
                        <h3 className="text-lg font-bold text-white/60 mb-2">No recent views</h3>
                        <p className="text-sm text-white/30 mb-6 max-w-sm mx-auto">Start browsing listings to build your viewing history</p>
                        <Link href="/explore" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white text-sm">
                            Explore Items
                        </Link>
                    </motion.div>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
                        <AnimatePresence mode="popLayout">
                            {items.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                >
                                    <Link href={`/item/${item.id}`}>
                                        {viewMode === 'grid' ? (
                                            <div className="glass-card rounded-2xl overflow-hidden group hover:border-white/10 transition-all duration-300 hover:-translate-y-1">
                                                <div className="relative aspect-[4/3]">
                                                    {(() => {
                                                        const mainImage = item.media?.[0]?.url || item.images?.[0];
                                                        return mainImage ? (
                                                            <img src={mainImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                                                                <Eye size={24} className="text-white/10" />
                                                            </div>
                                                        );
                                                    })()}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />

                                                    {item.category && (
                                                        <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-lg text-[9px] font-bold text-white/80 uppercase tracking-wider border border-white/10">
                                                            {item.category}
                                                        </span>
                                                    )}

                                                    <div className="absolute bottom-3 left-3 right-3">
                                                        <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                                                        {item.location && (
                                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-white/60">
                                                                <MapPin size={10} />
                                                                <span className="truncate">{item.location}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-4 flex items-center justify-between">
                                                    <div>
                                                        <span className="text-lg font-bold text-white">${item.price}</span>
                                                        <span className="text-[10px] text-white/30 ml-1">/{item.priceUnit?.toLowerCase()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {item.rating > 0 && (
                                                            <div className="flex items-center gap-1 text-[#fdcb6e]">
                                                                <Star size={12} className="fill-current" />
                                                                <span className="text-xs font-bold">{item.rating.toFixed(1)}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1 text-[10px] text-white/30">
                                                            <Clock size={10} />
                                                            {new Date(item.viewedAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-white/10 transition-all">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                                    {(() => {
                                                        const mainImage = item.media?.[0]?.url || item.images?.[0];
                                                        return mainImage ? (
                                                            <img src={mainImage} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><Eye size={16} className="text-white/10" /></div>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-[10px] text-white/30 flex items-center gap-1">
                                                            <MapPin size={10} /> {item.location}
                                                        </p>
                                                        {item.category && (
                                                            <span className="text-[9px] text-[#a29bfe] bg-[#6c5ce7]/10 px-1.5 py-0.5 rounded font-medium">
                                                                {item.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-sm font-bold text-white">${item.price}</div>
                                                    <div className="text-[10px] text-white/30 flex items-center gap-1 justify-end">
                                                        <Clock size={10} /> {new Date(item.viewedAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </main>
    );
}
