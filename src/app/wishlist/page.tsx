'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { useWishlistStore } from '@/store/engagement-store';
import { Heart, Plus, Trash2, ArrowRight, Loader2, MapPin, Star, Search, Filter, X, FolderOpen, ArrowUpDown, GripHorizontal, Share2, Globe, Lock } from 'lucide-react';
import Link from 'next/link';

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'rating';
type CategoryFilter = 'all' | string;

export default function WishlistPage() {
    const { isAuthenticated } = useAuthStore();
    const { collections, loading, fetchCollections, createCollection, deleteCollection, removeItem } = useWishlistStore();
    
    // Core state
    const [activeCollection, setActiveCollection] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmoji, setNewEmoji] = useState('📁');
    const [isPublic, setIsPublic] = useState(false);
    const [hoveredCollection, setHoveredCollection] = useState<string | null>(null);

    const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');

    // Filters & Sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    // Context Menu for Items (Move)
    const [activeContextMenu, setActiveContextMenu] = useState<string | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isAuthenticated) fetchCollections();
    }, [isAuthenticated, fetchCollections]);

    useEffect(() => {
        if (collections.length > 0 && !activeCollection) {
            setActiveCollection(collections[0].id);
        }
    }, [collections, activeCollection]);

    // Derived data
    const activeCollectionData = collections.find(c => c.id === activeCollection);
    const activeItems = activeCollectionData?.items || [];
    const totalItems = collections.reduce((sum, c) => sum + (c._count?.items || c.items?.length || 0), 0);

    const availableCategories = useMemo(() => {
        const cats = new Set<string>();
        activeItems.forEach(item => {
            const listing = item.listing as any;
            if (listing?.category) cats.add(listing.category);
        });
        return Array.from(cats);
    }, [activeItems]);

    const filteredItems = useMemo(() => {
        let items = [...activeItems];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.listing.title.toLowerCase().includes(q) ||
                item.listing.location?.toLowerCase().includes(q)
            );
        }
        if (categoryFilter !== 'all') {
            items = items.filter(item => {
                const listing = item.listing as any;
                return listing?.category?.toLowerCase() === categoryFilter.toLowerCase();
            });
        }
        switch (sortBy) {
            case 'newest': items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()); break;
            case 'oldest': items.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()); break;
            case 'price_asc': items.sort((a, b) => (a.listing.price || 0) - (b.listing.price || 0)); break;
            case 'price_desc': items.sort((a, b) => (b.listing.price || 0) - (a.listing.price || 0)); break;
            case 'rating': items.sort((a, b) => (b.listing.rating || 0) - (a.listing.rating || 0)); break;
        }
        return items;
    }, [activeItems, searchQuery, categoryFilter, sortBy]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        await createCollection(newName.trim(), newEmoji, isPublic);
        setNewName('');
        setNewEmoji('📁');
        setIsPublic(false);
        setShowCreateModal(false);
    };

    const handleMoveItem = async (listingId: string, targetCollectionId: string) => {
        if (!activeCollection) return;
        try {
            await useWishlistStore.getState().addItem(targetCollectionId, listingId);
            await removeItem(activeCollection, listingId);
            setActiveContextMenu(null);
        } catch (err) {
            console.error('Failed to move item:', err);
        }
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center bg-[#020305]">
                <Navbar />
                <div className="text-center px-6 relative z-10">
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                        <Heart size={80} className="mx-auto text-white/5 mb-8 stroke-[1]" />
                        <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white tracking-tight">Your Wishlist</h2>
                        <p className="text-white/40 mb-10 max-w-md mx-auto text-lg font-light">Curate your perfect rentals. Sign in to save items and create custom collections.</p>
                        <Link href="/login">
                            <motion.button 
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="px-8 py-4 bg-white text-black rounded-full font-bold text-sm uppercase tracking-widest hover:bg-white/90 transition-colors"
                            >
                                Sign In
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </main>
        );
    }

    return (
        <main className="relative h-screen bg-[#020305] overflow-hidden flex flex-col">
            <Navbar />

            {/* Cinematic Noise/Grain */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=... noise SVG ...")' }}></div>

            <div className="flex-1 flex flex-col lg:flex-row relative z-10 pt-[80px]">
                
                {/* ─── LEFT PANEL: EDITORIAL TYPOGRAPHY ─── */}
                <div className="w-full lg:w-[40%] flex-shrink-0 flex flex-col border-r border-white/5 bg-[#020305]/80 backdrop-blur-3xl relative z-20">
                    <div className="p-8 lg:p-12 pb-4 flex-shrink-0">
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                            className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em] mb-4 flex items-center gap-4"
                        >
                            <span><span className="text-white mr-2">{collections.length}</span>Collections</span>
                            <div className="h-px bg-white/10 flex-1"/>
                            <span><span className="text-white mr-2">{totalItems}</span>Items</span>
                        </motion.h1>
                    </div>

                    <div className="flex-1 overflow-y-auto hide-scrollbar px-8 lg:px-12 pb-12">
                        {loading && collections.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 mt-4">
                                <AnimatePresence mode="popLayout">
                                    {collections.map((c, i) => {
                                        const isActive = activeCollection === c.id;
                                        const isHovered = hoveredCollection === c.id;
                                        const opacity = isActive ? 1 : (hoveredCollection && !isHovered ? 0.2 : 0.4);
                                        
                                        return (
                                            <motion.div
                                                key={c.id}
                                                layout
                                                initial={{ opacity: 0, x: -30 }} animate={{ opacity, x: 0 }} exit={{ opacity: 0, x: -30 }}
                                                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
                                                onMouseEnter={() => { setHoveredCollection(c.id); }}
                                                onMouseLeave={() => { setHoveredCollection(null); }}
                                                onClick={() => {
                                                    setActiveCollection(c.id);
                                                    setSearchQuery(''); setCategoryFilter('all');
                                                }}
                                                className="group cursor-pointer relative py-4"
                                            >
                                                {isActive && (
                                                    <motion.div layoutId="activeHighlight" className="absolute -left-8 lg:-left-12 top-0 bottom-0 w-1 bg-white" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                                                )}
                                                
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <span className={`text-3xl transition-transform duration-500 ${isActive ? 'scale-110' : 'scale-100 grayscale hover:grayscale-0'}`}>{c.emoji}</span>
                                                        <div>
                                                            <h3 className={`font-display font-bold tracking-tight transition-all duration-500 origin-left ${isActive ? 'text-4xl lg:text-5xl text-white' : 'text-3xl lg:text-4xl text-white'}`}>
                                                                {c.name}
                                                            </h3>
                                                            <motion.p 
                                                                initial={false}
                                                                animate={{ height: isActive ? 'auto' : 0, opacity: isActive ? 1 : 0 }}
                                                                className="text-white/40 font-mono text-xs uppercase tracking-widest mt-2 overflow-hidden"
                                                            >
                                                                {c._count?.items || c.items?.length || 0} Assets
                                                            </motion.p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {c.isPublic && (
                                                            <Globe size={14} className="text-white/30" />
                                                        )}
                                                        {!c.isDefault && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, color: '#ef4444' }} whileTap={{ scale: 0.9 }}
                                                                onClick={(e) => { e.stopPropagation(); deleteCollection(c.id); }}
                                                                className={`p-3 rounded-full bg-white/5 backdrop-blur-md transition-all duration-300 ${isHovered || isActive ? 'opacity-100' : 'opacity-0'} text-white/30`}
                                                            >
                                                                <Trash2 size={16} />
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {/* Add New Collection Button - Editorial Style */}
                                <motion.div 
                                    layout
                                    className="mt-12 group cursor-pointer"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    <div className="flex items-center gap-6 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-white flex items-center justify-center">
                                            <Plus size={16} className="text-white" />
                                        </div>
                                        <h3 className="font-display font-bold text-3xl lg:text-4xl text-white tracking-tight">New Collection</h3>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── RIGHT PANEL: CINEMATIC GALLERY ─── */}
                <div className="w-full lg:w-[60%] h-full flex flex-col relative bg-[#020305] z-10">
                    
                    {/* Header / Filters Bar */}
                    <div className="p-6 lg:p-8 flex-shrink-0 flex items-center justify-between border-b border-white/5 bg-[#020305]/80 backdrop-blur-xl z-20">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative group w-full max-w-xs">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" />
                                <input
                                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search this collection..."
                                    className="w-full bg-transparent border-b border-white/10 px-10 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white transition-colors"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {activeCollectionData && activeCollectionData.isPublic && (
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/wishlist/${activeCollectionData.id}`);
                                            alert('Link copied to clipboard!');
                                        }}
                                        className="flex items-center gap-2 px-4 py-3 rounded-full text-xs font-bold uppercase tracking-widest bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        <Share2 size={14} /> Share
                                    </button>
                                )}
                                <button 
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${showFilters ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                                >
                                    <Filter size={14} /> Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Expandable Filters */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="border-b border-white/5 bg-[#050608] overflow-hidden flex-shrink-0 z-10"
                            >
                                <div className="p-6 lg:p-8 space-y-8">
                                    <div>
                                        <h4 className="text-white/40 font-mono text-[10px] uppercase tracking-[0.2em] mb-4">Categories</h4>
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => setCategoryFilter('all')} className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${categoryFilter === 'all' ? 'bg-white text-black' : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/30'}`}>All</button>
                                            {availableCategories.map(cat => (
                                                <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${categoryFilter === cat ? 'bg-white text-black' : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/30'}`}>{cat}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-white/40 font-mono text-[10px] uppercase tracking-[0.2em] mb-4">Sort By</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { id: 'newest' as SortOption, label: 'Newest Arrivals' },
                                                { id: 'price_asc' as SortOption, label: 'Price: Low to High' },
                                                { id: 'price_desc' as SortOption, label: 'Price: High to Low' },
                                                { id: 'rating' as SortOption, label: 'Highest Rated' },
                                            ].map(opt => (
                                                <button key={opt.id} onClick={() => setSortBy(opt.id)} className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${sortBy === opt.id ? 'bg-white text-black' : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/30'}`}>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Scrollable Grid */}
                    <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-8" ref={scrollContainerRef}>
                        {filteredItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                <GripHorizontal size={64} className="mb-6 stroke-[0.5]" />
                                <h3 className="text-2xl font-display font-light">No items found</h3>
                                <p className="text-sm mt-2">Adjust your filters or add items to this collection.</p>
                            </div>
                        ) : (
                            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                                <AnimatePresence mode="popLayout">
                                    {filteredItems.map((item, i) => {
                                        const mainImage = item.listing.media?.find((m: any) => m.type === 'IMAGE')?.url || (item.listing.images && item.listing.images.length > 0 ? item.listing.images[0] : null);
                                        const isCardHovered = hoveredCard === item.listingId;
                                        
                                        return (
                                            <motion.div
                                                layout
                                                key={item.id}
                                                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: -40 }}
                                                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
                                                onMouseEnter={() => { setHoveredCard(item.listingId); }}
                                                onMouseLeave={() => { setHoveredCard(null); }}
                                                className={`group relative ${isCardHovered || activeContextMenu === item.listingId ? 'z-[60]' : 'z-0'}`}
                                                style={{ perspective: 1000 }}
                                            >
                                                {/* Card Outer */}
                                                <motion.div 
                                                    className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/5"
                                                    animate={{ rotateX: isCardHovered ? 2 : 0, rotateY: isCardHovered ? -2 : 0, y: isCardHovered ? -8 : 0 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                >
                                                    <Link href={`/items/${item.listingId}`} className="absolute inset-0 z-0">
                                                        {mainImage ? (
                                                            <motion.img 
                                                                src={mainImage} alt={item.listing.title} 
                                                                className="w-full h-full object-cover origin-center"
                                                                animate={{ scale: isCardHovered ? 1.05 : 1 }}
                                                                transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-[#1a1c29] to-[#0A0A0A]" />
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 opacity-80 group-hover:opacity-100" />
                                                    </Link>

                                                    {/* Floating Actions Header */}
                                                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
                                                        {(item.listing as any)?.category && (
                                                            <span className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                                                                {(item.listing as any).category}
                                                            </span>
                                                        )}
                                                        
                                                        {/* Actions Container - slides in on hover */}
                                                        <motion.div 
                                                            initial={{ x: 20, opacity: 0 }}
                                                            animate={{ x: isCardHovered || activeContextMenu === item.listingId ? 0 : 20, opacity: isCardHovered || activeContextMenu === item.listingId ? 1 : 0 }}
                                                            transition={{ duration: 0.3 }}
                                                            className="flex flex-col gap-2 pointer-events-auto ml-auto"
                                                        >
                                                            {/* Dropdown container */}
                                                            <div className="relative">
                                                                <button 
                                                                    onClick={(e) => { e.preventDefault(); setActiveContextMenu(activeContextMenu === item.listingId ? null : item.listingId); }}
                                                                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                                                                >
                                                                    <FolderOpen size={16} />
                                                                </button>
                                                                
                                                                <AnimatePresence>
                                                                    {activeContextMenu === item.listingId && (
                                                                        <motion.div 
                                                                            initial={{ opacity: 0, scale: 0.9, x: 10 }}
                                                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                                                            exit={{ opacity: 0, scale: 0.9, x: 10 }}
                                                                            className="absolute right-12 top-0 w-48 bg-[#0F111A] border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-2xl"
                                                                        >
                                                                            <div className="space-y-1 mb-2">
                                                                                <button 
                                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingNoteFor(item.listingId); setNoteText(item.note || ''); setActiveContextMenu(null); }}
                                                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors text-left"
                                                                                >
                                                                                    <span className="text-white/50">✏️</span> <span>Edit Note</span>
                                                                                </button>
                                                                            </div>
                                                                            <p className="px-3 py-2 text-[9px] font-mono uppercase tracking-[0.2em] text-white/40 border-t border-white/5 pt-2 mt-1">Move to...</p>
                                                                            <div className="space-y-1">
                                                                                {collections.filter(c => c.id !== activeCollection).map(c => (
                                                                                    <button 
                                                                                        key={c.id}
                                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMoveItem(item.listingId, c.id); }}
                                                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors text-left"
                                                                                    >
                                                                                        <span>{c.emoji}</span> <span className="truncate">{c.name}</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>

                                                            <button 
                                                                onClick={(e) => { e.preventDefault(); if (activeCollection) removeItem(activeCollection, item.listingId); }}
                                                                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </motion.div>
                                                    </div>

                                                    {/* Note Box */}
                                                    {item.note && (
                                                        <div className="absolute top-20 left-4 right-16 z-10 pointer-events-none">
                                                            <div className="px-3 py-2 bg-black/60 backdrop-blur-md rounded-xl text-[10px] font-medium text-white/80 border border-white/10 italic">
                                                                "{item.note}"
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Footer Info */}
                                                    <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                                                        <h3 className="font-display text-2xl font-bold text-white leading-tight mb-2 line-clamp-2">{item.listing.title}</h3>
                                                        
                                                        <div className="flex items-center gap-4 text-xs font-medium text-white/60 mb-4">
                                                            <span className="flex items-center gap-1.5"><MapPin size={12} /> {item.listing.location}</span>
                                                            {item.listing.rating && (
                                                                <span className="flex items-center gap-1.5"><Star size={12} className="fill-[#FDE68A] text-[#FDE68A]" /> {item.listing.rating.toFixed(1)}</span>
                                                            )}
                                                        </div>

                                                        {/* Reveal Price Line */}
                                                        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                                                            <div>
                                                                <span className="text-xl font-bold text-white">${item.listing.price}</span>
                                                                <span className="text-[10px] text-white/40 uppercase tracking-widest ml-1">/{item.listing.priceUnit}</span>
                                                            </div>
                                                            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-white opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-2">
                                                                View Details <ArrowRight size={12} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </motion.div>
                        )}
                        <div className="h-20" /> {/* Bottom pad */}
                    </div>
                </div>
            </div>

            {/* Create Collection Modal Overlay */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: -20, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            
                            <h3 className="font-display text-3xl font-bold text-white mb-6">New Space</h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 block mb-2">Space Name</label>
                                    <input
                                        type="text" value={newName} onChange={e => setNewName(e.target.value)}
                                        placeholder="E.g. Summer Studio Gear..."
                                        className="w-full bg-transparent border-b border-white/20 py-3 text-lg font-medium text-white placeholder-white/20 focus:outline-none focus:border-white transition-colors"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 block mb-3">Cover Emoji</label>
                                    <div className="flex gap-3 flex-wrap">
                                        {['📁', '🎥', '✨', '📸', '🏠', '🎙️', '🎸', '🏖️', '✈️', '💎'].map(emoji => (
                                            <button
                                                key={emoji} onClick={() => setNewEmoji(emoji)}
                                                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${newEmoji === emoji ? 'bg-white border-2 border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
                                            >
                                                <span className={newEmoji === emoji ? '' : 'grayscale'}>{emoji}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setIsPublic(!isPublic)}>
                                    <div>
                                        <p className="text-white text-sm font-bold flex items-center gap-2">
                                            {isPublic ? <Globe size={14} /> : <Lock size={14} />} 
                                            {isPublic ? 'Public Collection' : 'Private Collection'}
                                        </p>
                                        <p className="text-white/40 text-xs mt-1">
                                            {isPublic ? 'Anyone with the link can view this collection.' : 'Only you can see this collection.'}
                                        </p>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full relative transition-colors ${isPublic ? 'bg-white' : 'bg-white/20'}`}>
                                        <div className={`absolute top-1 bottom-1 w-4 rounded-full bg-black transition-all ${isPublic ? 'left-5' : 'left-1 bg-white'}`} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button onClick={() => setShowCreateModal(false)} className="flex-1 py-4 rounded-full text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleCreate} disabled={!newName.trim()}
                                    className="flex-[2] py-4 rounded-full text-xs font-bold uppercase tracking-widest bg-white text-black disabled:opacity-50 hover:bg-white/90 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                >
                                    Create Collection
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Note Modal */}
            <AnimatePresence>
                {editingNoteFor && activeCollection && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        onClick={() => setEditingNoteFor(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: -20, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            <h3 className="font-display text-2xl font-bold text-white mb-6">Item Note</h3>
                            
                            <textarea
                                value={noteText} onChange={e => setNoteText(e.target.value)}
                                placeholder="Why are you saving this item?"
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
                                autoFocus
                            />

                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setEditingNoteFor(null)} className="flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button 
                                    onClick={async () => {
                                        await useWishlistStore.getState().addItem(activeCollection, editingNoteFor, noteText);
                                        setEditingNoteFor(null);
                                    }}
                                    className="flex-[2] py-3 rounded-full text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-white/90 transition-colors"
                                >
                                    Save Note
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
