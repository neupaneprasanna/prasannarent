'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import RentalCard from '@/components/cards/RentalCard';
import Footer from '@/components/sections/Footer';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';
import { useAppStore } from '@/store/app-store';
import { apiClient } from '@/lib/api-client';
import { Loader2, Filter, Star, Info, Map as MapIcon, LayoutGrid } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapboxMap = dynamic(() => import('@/components/map/MapboxMap'), {
    ssr: false,
    loading: () => <div className="w-full h-[600px] bg-[#0a0a0a] animate-pulse rounded-3xl" />
});

const allCategories = ['All', 'Tech', 'Vehicles', 'Rooms', 'Equipment', 'Fashion', 'Studios', 'Tools', 'Digital'];

import { Listing } from '@/types/rental';

export default function ExplorePage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [priceRange, setPriceRange] = useState([0, 500]);
    const [minRating, setMinRating] = useState(0);
    const [availableOnly, setAvailableOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    // Unified debounced fetch for all filters and search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchListings();
        }, 400);
        return () => clearTimeout(timer);
    }, [activeCategory, priceRange[1], minRating, availableOnly, searchQuery, searchParams.get('id')]);

    const fetchListings = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            const itemId = searchParams.get('id');

            if (itemId) {
                params.append('id', itemId);
            } else {
                if (activeCategory !== 'All') {
                    params.append('category', activeCategory.toLowerCase());
                }
                if (priceRange[1] < 500) {
                    params.append('maxPrice', priceRange[1].toString());
                }
                if (minRating > 0) {
                    params.append('minRating', minRating.toString());
                }
                if (availableOnly) {
                    params.append('availableOnly', 'true');
                }
                if (searchQuery) {
                    params.append('search', searchQuery);
                }
            }

            const data = await apiClient.get<{ listings: any[] }>(`/listings?${params.toString()}`);
            // Deduplicate by ID
            const uniqueListings = Array.from(new Map(data.listings.map(l => [l.id, l])).values());
            setListings(uniqueListings);
        } catch (error) {
            console.error('Failed to fetch listings:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen">
            <Navbar />

            <div className="pt-28 pb-8 px-6 max-w-7xl mx-auto">
                {/* Page Header */}
                <motion.div
                    className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-4">
                            Explore <span className="gradient-text">Rentals</span>
                        </h1>
                        <p className="text-white/40 max-w-lg">
                            Discover thousands of items available for rent from verified owners around the world.
                        </p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                        >
                            <LayoutGrid size={16} /> Grid
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                        >
                            <MapIcon size={16} /> Map
                        </button>
                    </div>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <motion.aside
                        className={`lg:w-72 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="glass-card rounded-2xl p-6 sticky top-28">
                            <h3 className="text-sm font-semibold text-white/70 mb-6 flex items-center gap-2">
                                <Filter size={16} /> Filters
                            </h3>

                            {/* Price Range */}
                            <div className="mb-6">
                                <label className="text-xs text-white/40 mb-3 block">Price Range</label>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm text-white/60">${priceRange[0]}</span>
                                    <div className="flex-1 h-px bg-white/10" />
                                    <span className="text-sm text-white/60">${priceRange[1]}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="500"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    className="w-full accent-[#6c5ce7]"
                                    suppressHydrationWarning
                                />
                            </div>

                            {/* Rating */}
                            <div className="mb-6">
                                <label className="text-xs text-white/40 mb-3 block">Minimum Rating</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            className={`transition-colors ${minRating >= star ? 'text-[#fdcb6e]' : 'text-white/20 hover:text-[#fdcb6e]/50'}`}
                                            onClick={() => setMinRating(minRating === star ? 0 : star)}
                                            suppressHydrationWarning
                                        >
                                            <Star size={18} fill={minRating >= star ? "currentColor" : "none"} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="mb-6">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div
                                        className={`relative w-10 h-5 rounded-full transition-colors ${availableOnly ? 'bg-[#6c5ce7]/50' : 'bg-white/10'}`}
                                        onClick={() => setAvailableOnly(!availableOnly)}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#6c5ce7] transition-all ${availableOnly ? 'left-[22px]' : 'left-0.5'}`} />
                                    </div>
                                    <span className="text-xs text-white/50">Available now</span>
                                </label>
                            </div>

                            {/* Reset */}
                            <button
                                className="w-full py-2.5 text-xs text-white/40 hover:text-white/70 border border-white/10 rounded-xl hover:border-white/20 transition-all font-medium"
                                onClick={() => {
                                    setActiveCategory('All');
                                    setPriceRange([0, 500]);
                                    setMinRating(0);
                                    setAvailableOnly(false);
                                }}
                                suppressHydrationWarning
                            >
                                Reset Filters
                            </button>
                        </div>
                    </motion.aside>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Category pills */}
                        <motion.div
                            className="flex flex-wrap gap-2 mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            {/* Mobile filter toggle */}
                            <button
                                className="lg:hidden px-4 py-2 rounded-xl glass text-xs text-white/50 hover:text-white/70"
                                onClick={() => setShowFilters(!showFilters)}
                                suppressHydrationWarning
                            >
                                <Filter size={14} className="inline mr-1" /> Filters
                            </button>

                            {allCategories.map((cat) => (
                                <motion.button
                                    key={cat}
                                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${activeCategory === cat
                                        ? 'bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white shadow-lg shadow-[#6c5ce7]/20'
                                        : 'glass text-white/50 hover:text-white/70'
                                        }`}
                                    onClick={() => setActiveCategory(cat)}
                                    whileTap={{ scale: 0.95 }}
                                    onMouseEnter={() => setCursorVariant('hover')}
                                    onMouseLeave={() => setCursorVariant('default')}
                                    suppressHydrationWarning
                                >
                                    {cat}
                                </motion.button>
                            ))}
                        </motion.div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-white/20">
                                <Loader2 size={32} className="animate-spin mb-4 text-[#6c5ce7]" />
                                <p className="text-sm">Fetching rentals...</p>
                            </div>
                        ) : (
                            <>
                                {/* Results count */}
                                <motion.p
                                    className="text-xs text-white/30 mb-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    Showing {listings.length} results
                                </motion.p>

                                {/* Grid or Map */}
                                <AnimatePresence mode="wait">
                                    {viewMode === 'map' ? (
                                        <motion.div
                                            key="map"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3 }}
                                            className="h-[500px] md:h-[600px] rounded-3xl overflow-hidden glass-card border border-white/5 relative z-0"
                                        >
                                            <MapboxMap listings={listings} />
                                        </motion.div>
                                    ) : (
                                        listings.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-center py-20 glass-card rounded-3xl"
                                            >
                                                <Info size={40} className="mx-auto mb-4 text-white/10" />
                                                <h3 className="text-lg font-medium text-white/70">No listings found</h3>
                                                <p className="text-sm text-white/30">Try selecting a different category or adjusting filters.</p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="grid"
                                                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                                                variants={staggerContainer}
                                                initial="hidden"
                                                animate="visible"
                                                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                            >
                                                {listings.map((item, i) => (
                                                    <RentalCard key={item.id} item={{
                                                        ...item,
                                                        priceUnit: (item.priceUnit?.toLowerCase() || 'day') as 'day' | 'week' | 'month' | 'hour',
                                                        rating: item.rating || 0,
                                                        reviewCount: item.reviewCount || 0,
                                                        featured: item.featured || false,
                                                        tags: item.tags || [],
                                                        owner: {
                                                            name: item.owner?.firstName || 'Owner',
                                                            avatar: '',
                                                            verified: item.owner?.verified || false
                                                        }
                                                    } as any} index={i} />
                                                ))}
                                            </motion.div>
                                        )
                                    )}
                                </AnimatePresence>

                                {/* Load more (only in grid view) */}
                                {viewMode === 'grid' && listings.length > 0 && (
                                    <motion.div
                                        className="flex justify-center mt-12"
                                        variants={fadeInUp}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                    >
                                        <button className="px-8 py-3 glass rounded-2xl text-sm text-white/50 hover:text-white/70 transition-colors" suppressHydrationWarning>
                                            Load More
                                        </button>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </main >
    );
}
