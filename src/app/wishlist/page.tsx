'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { useWishlistStore } from '@/store/engagement-store';
import { Heart, Plus, Trash2, Grid3X3, List, Loader2, MapPin, Star, Filter, ArrowUpDown, Search, FolderOpen, Tag, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'rating';
type CategoryFilter = 'all' | string;

export default function WishlistPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { collections, loading, fetchCollections, createCollection, deleteCollection, removeItem } = useWishlistStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeCollection, setActiveCollection] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmoji, setNewEmoji] = useState('📁');

    // New filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [moveItemModal, setMoveItemModal] = useState<{ itemId: string; listingId: string; fromCollectionId: string } | null>(null);

    useEffect(() => {
        if (isAuthenticated) fetchCollections();
    }, [isAuthenticated]);

    useEffect(() => {
        if (collections.length > 0 && !activeCollection) {
            setActiveCollection(collections[0].id);
        }
    }, [collections]);

    const activeCollectionData = collections.find(c => c.id === activeCollection);
    const activeItems = activeCollectionData?.items || [];
    const totalItems = collections.reduce((sum, c) => sum + (c._count?.items || c.items?.length || 0), 0);

    // Extract unique categories from items
    const availableCategories = useMemo(() => {
        const cats = new Set<string>();
        activeItems.forEach(item => {
            // Try to infer category from listing data
            const listing = item.listing as any;
            if (listing?.category) cats.add(listing.category);
        });
        return Array.from(cats);
    }, [activeItems]);

    // Filter and sort items
    const filteredItems = useMemo(() => {
        let items = [...activeItems];

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.listing.title.toLowerCase().includes(q) ||
                item.listing.location?.toLowerCase().includes(q)
            );
        }

        // Category filter
        if (categoryFilter !== 'all') {
            items = items.filter(item => {
                const listing = item.listing as any;
                return listing?.category?.toLowerCase() === categoryFilter.toLowerCase();
            });
        }

        // Sort
        switch (sortBy) {
            case 'newest':
                items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
                break;
            case 'oldest':
                items.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
                break;
            case 'price_asc':
                items.sort((a, b) => (a.listing.price || 0) - (b.listing.price || 0));
                break;
            case 'price_desc':
                items.sort((a, b) => (b.listing.price || 0) - (a.listing.price || 0));
                break;
            case 'rating':
                items.sort((a, b) => (b.listing.rating || 0) - (a.listing.rating || 0));
                break;
        }

        return items;
    }, [activeItems, searchQuery, categoryFilter, sortBy]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        await createCollection(newName.trim(), newEmoji);
        setNewName('');
        setNewEmoji('📁');
        setShowCreateModal(false);
    };

    const handleMoveItem = async (listingId: string, targetCollectionId: string) => {
        if (!activeCollection) return;
        try {
            // Add to new collection
            await useWishlistStore.getState().addItem(targetCollectionId, listingId);
            // Remove from current collection
            await removeItem(activeCollection, listingId);
        } catch (err) {
            console.error('Failed to move item:', err);
        }
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center">
                <Navbar />
                <div className="text-center px-6">
                    <Heart size={64} className="mx-auto text-white/10 mb-6" />
                    <h2 className="text-2xl font-bold mb-3 text-white">Your Wishlist</h2>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">Sign in to save your favorite items and create custom collections</p>
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
                    className="mb-8"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Wishlist</h1>
                    <p className="text-sm text-white/40">
                        {totalItems} {totalItems === 1 ? 'item' : 'items'} saved across {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
                    </p>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Collections Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:w-72 flex-shrink-0"
                    >
                        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white">Collections</h3>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-[#6c5ce7]/20 text-white/40 hover:text-[#a29bfe] transition-all"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {collections.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            setActiveCollection(c.id);
                                            // Reset filters on collection change
                                            setSearchQuery('');
                                            setCategoryFilter('all');
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${activeCollection === c.id
                                            ? 'bg-[#6c5ce7]/10 border border-[#6c5ce7]/20'
                                            : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="text-lg">{c.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${activeCollection === c.id ? 'text-white' : 'text-white/60'}`}>
                                                {c.name}
                                            </p>
                                            <p className="text-[10px] text-white/30">{c._count?.items || c.items?.length || 0} items</p>
                                        </div>
                                        {!c.isDefault && activeCollection === c.id && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteCollection(c.id);
                                                }}
                                                className="p-1 rounded text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </button>
                                ))}

                                {collections.length === 0 && (
                                    <div className="py-8 text-center">
                                        <Heart size={32} className="mx-auto text-white/10 mb-3" />
                                        <p className="text-xs text-white/30">No collections yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Items Grid */}
                    <div className="flex-1">
                        {/* Filters Bar */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                                {/* Search */}
                                <div className="relative flex-1 sm:max-w-xs">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search saved items..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#6c5ce7]/40"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>

                                {/* Filter toggle */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-[#6c5ce7]/10 border-[#6c5ce7]/20 text-[#a29bfe]' : 'border-white/10 text-white/30 hover:text-white/60'}`}
                                >
                                    <Filter size={16} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <p className="text-xs text-white/40">{filteredItems.length} items</p>
                                <div className="flex items-center gap-1">
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
                            </div>
                        </div>

                        {/* Extended Filters */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-4 overflow-hidden"
                                >
                                    <div className="glass-card rounded-xl p-4 border border-white/5 space-y-3">
                                        {/* Category chips */}
                                        <div>
                                            <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 block">Category</label>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => setCategoryFilter('all')}
                                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${categoryFilter === 'all'
                                                        ? 'bg-[#6c5ce7]/20 text-[#a29bfe] border border-[#6c5ce7]/30'
                                                        : 'bg-white/5 text-white/40 hover:text-white/60 border border-white/10'
                                                        }`}
                                                >
                                                    All
                                                </button>
                                                {availableCategories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setCategoryFilter(cat)}
                                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${categoryFilter === cat
                                                            ? 'bg-[#6c5ce7]/20 text-[#a29bfe] border border-[#6c5ce7]/30'
                                                            : 'bg-white/5 text-white/40 hover:text-white/60 border border-white/10'
                                                            }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                                {/* Also show common categories even if not in items */}
                                                {['Tech', 'Vehicles', 'Rooms', 'Equipment', 'Fashion', 'Studios'].filter(c => !availableCategories.includes(c)).map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setCategoryFilter(cat)}
                                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${categoryFilter === cat
                                                            ? 'bg-[#6c5ce7]/20 text-[#a29bfe] border border-[#6c5ce7]/30'
                                                            : 'bg-white/5 text-white/30 hover:text-white/50 border border-white/5'
                                                            }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sort */}
                                        <div>
                                            <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 block">Sort By</label>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { id: 'newest' as SortOption, label: 'Newest' },
                                                    { id: 'oldest' as SortOption, label: 'Oldest' },
                                                    { id: 'price_asc' as SortOption, label: 'Price: Low → High' },
                                                    { id: 'price_desc' as SortOption, label: 'Price: High → Low' },
                                                    { id: 'rating' as SortOption, label: 'Top Rated' },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setSortBy(opt.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${sortBy === opt.id
                                                            ? 'bg-[#6c5ce7]/20 text-[#a29bfe] border border-[#6c5ce7]/30'
                                                            : 'bg-white/5 text-white/40 hover:text-white/60 border border-white/10'
                                                            }`}
                                                    >
                                                        <ArrowUpDown size={10} /> {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Clear filters */}
                                        {(categoryFilter !== 'all' || sortBy !== 'newest' || searchQuery) && (
                                            <button
                                                onClick={() => {
                                                    setCategoryFilter('all');
                                                    setSortBy('newest');
                                                    setSearchQuery('');
                                                }}
                                                className="text-[10px] text-[#a29bfe] hover:text-white transition-colors flex items-center gap-1"
                                            >
                                                <X size={10} /> Clear all filters
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" />
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass-card rounded-2xl p-12 text-center"
                            >
                                {searchQuery || categoryFilter !== 'all' ? (
                                    <>
                                        <Filter size={48} className="mx-auto text-white/10 mb-4" />
                                        <h3 className="text-lg font-bold text-white/60 mb-2">No matching items</h3>
                                        <p className="text-sm text-white/30 mb-6">Try adjusting your filters or search query</p>
                                        <button
                                            onClick={() => { setCategoryFilter('all'); setSearchQuery(''); setSortBy('newest'); }}
                                            className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-white/60 text-sm transition-colors"
                                        >
                                            Clear Filters
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Heart size={48} className="mx-auto text-white/10 mb-4" />
                                        <h3 className="text-lg font-bold text-white/60 mb-2">No items saved</h3>
                                        <p className="text-sm text-white/30 mb-6 max-w-sm mx-auto">Browse the explore page to find items you love</p>
                                        <Link href="/explore" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white text-sm">
                                            Explore Items
                                        </Link>
                                    </>
                                )}
                            </motion.div>
                        ) : (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
                                <AnimatePresence mode="popLayout">
                                    {filteredItems.map((item, i) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            {viewMode === 'grid' ? (
                                                <Link href={`/items/${item.listingId}`}>
                                                    <div className="glass-card rounded-2xl overflow-hidden group hover:border-white/10 transition-all duration-300 hover:-translate-y-1">
                                                        <div className="relative aspect-[4/3]">
                                                            {(() => {
                                                                const mainImage = item.listing.media?.find((m: any) => m.type === 'IMAGE')?.url ||
                                                                    (item.listing.images && item.listing.images.length > 0 ? item.listing.images[0] : null);
                                                                return mainImage ? (
                                                                    <img src={mainImage} alt={item.listing.title} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02]" />
                                                                );
                                                            })()}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />

                                                            {/* Category badge */}
                                                            {(item.listing as any)?.category && (
                                                                <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-lg text-[9px] font-bold text-white/80 uppercase tracking-wider border border-white/10">
                                                                    {(item.listing as any).category}
                                                                </span>
                                                            )}

                                                            <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        if (activeCollection) removeItem(activeCollection, item.listingId);
                                                                    }}
                                                                    className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-[#ff6b6b] hover:bg-red-500/20 border border-white/10 transition-all"
                                                                    title="Remove from collection"
                                                                >
                                                                    <Heart size={14} className="fill-current" />
                                                                </button>
                                                                
                                                                {/* Move Dropdown */}
                                                                <div className="relative group/move">
                                                                    <button
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                                        className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white/60 hover:text-white border border-white/10 transition-all"
                                                                        title="Move to collection"
                                                                    >
                                                                        <FolderOpen size={14} />
                                                                    </button>
                                                                    <div className="absolute right-0 top-0 hidden group-hover/move:block z-20 pt-2 pr-10 -mr-10">
                                                                        <div className="w-40 glass-card rounded-xl border border-white/10 p-1.5 shadow-2xl backdrop-blur-xl">
                                                                            <p className="px-2 py-1 text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">Move to</p>
                                                                            <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-0.5">
                                                                                {collections.filter(c => c.id !== activeCollection).map(c => (
                                                                                    <button
                                                                                        key={c.id}
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            handleMoveItem(item.listingId, c.id);
                                                                                        }}
                                                                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] text-white/50 hover:bg-white/5 hover:text-white transition-all text-left"
                                                                                    >
                                                                                        <span>{c.emoji}</span>
                                                                                        <span className="truncate">{c.name}</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="absolute bottom-3 left-3 right-3">
                                                                <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">{item.listing.title}</h3>
                                                                <div className="flex items-center gap-2 text-[10px] text-white/60">
                                                                    <MapPin size={10} />
                                                                    <span className="truncate">{item.listing.location}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-lg font-bold text-white">${item.listing.price}</span>
                                                                <span className="text-[10px] text-white/30">/{item.listing.priceUnit?.toLowerCase()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[#fdcb6e]">
                                                                <Star size={12} className="fill-current" />
                                                                <span className="text-xs font-bold">{item.listing.rating?.toFixed(1) || 'New'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ) : (
                                                <Link href={`/items/${item.listingId}`}>
                                                    <div className="glass-card rounded-xl p-4 flex items-center gap-4 group hover:border-white/10 transition-all">
                                                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                                            {(() => {
                                                                const mainImage = item.listing.media?.find((m: any) => m.type === 'IMAGE')?.url ||
                                                                    (item.listing.images && item.listing.images.length > 0 ? item.listing.images[0] : null);
                                                                return mainImage ? (
                                                                    <img src={mainImage} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02]" />
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-bold text-white truncate">{item.listing.title}</h3>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <p className="text-[10px] text-white/30 flex items-center gap-1"><MapPin size={10} />{item.listing.location}</p>
                                                                {(item.listing as any)?.category && (
                                                                    <span className="text-[9px] text-[#a29bfe] bg-[#6c5ce7]/10 px-1.5 py-0.5 rounded font-medium">
                                                                        {(item.listing as any).category}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="text-sm font-bold text-white">${item.listing.price}</div>
                                                            <div className="text-[10px] text-white/30">/{item.listing.priceUnit?.toLowerCase()}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {/* Move UI for List View */}
                                                            <div className="relative group/move">
                                                                <button
                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                                    className="p-2 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all"
                                                                    title="Move to collection"
                                                                >
                                                                    <FolderOpen size={14} />
                                                                </button>
                                                                <div className="absolute right-0 bottom-full mb-2 hidden group-hover/move:block z-20">
                                                                    <div className="w-40 glass-card rounded-xl border border-white/10 p-1.5 shadow-2xl backdrop-blur-xl">
                                                                        <p className="px-2 py-1 text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">Move to</p>
                                                                        <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-0.5">
                                                                            {collections.filter(c => c.id !== activeCollection).map(c => (
                                                                                <button
                                                                                    key={c.id}
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        handleMoveItem(item.listingId, c.id);
                                                                                    }}
                                                                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] text-white/50 hover:bg-white/5 hover:text-white transition-all text-left"
                                                                                >
                                                                                    <span>{c.emoji}</span>
                                                                                    <span className="truncate">{c.name}</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (activeCollection) removeItem(activeCollection, item.listingId);
                                                                }}
                                                                className="p-2 rounded-lg text-white/20 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </Link>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Collection Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass-card rounded-2xl p-6 w-full max-w-sm border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-white mb-4">New Collection</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-white/40 block mb-1.5">Name</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        placeholder="e.g. Summer gear"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#6c5ce7]/40"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 block mb-1.5">Emoji</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['📁', '❤️', '⭐', '🏠', '🎸', '📷', '🛋️', '🚗', '🎿', '🏕️'].map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => setNewEmoji(emoji)}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${newEmoji === emoji ? 'bg-[#6c5ce7]/20 border border-[#6c5ce7]/40 scale-110' : 'bg-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] hover:opacity-90 transition-opacity"
                                >
                                    Create
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
