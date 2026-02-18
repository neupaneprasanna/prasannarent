'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { useWishlistStore } from '@/store/engagement-store';
import { Heart, Plus, Trash2, MoreHorizontal, Grid3X3, List, Loader2, ExternalLink, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { collections, loading, fetchCollections, createCollection, deleteCollection, removeItem } = useWishlistStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeCollection, setActiveCollection] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmoji, setNewEmoji] = useState('📁');

    useEffect(() => {
        if (isAuthenticated) fetchCollections();
    }, [isAuthenticated]);

    useEffect(() => {
        if (collections.length > 0 && !activeCollection) {
            setActiveCollection(collections[0].id);
        }
    }, [collections]);

    const activeItems = collections.find(c => c.id === activeCollection)?.items || [];
    const totalItems = collections.reduce((sum, c) => sum + (c._count?.items || c.items?.length || 0), 0);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        await createCollection(newName.trim(), newEmoji);
        setNewName('');
        setNewEmoji('📁');
        setShowCreateModal(false);
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
                                        onClick={() => setActiveCollection(c.id)}
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
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-white/40">{activeItems.length} items</p>
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
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" />
                            </div>
                        ) : activeItems.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass-card rounded-2xl p-12 text-center"
                            >
                                <Heart size={48} className="mx-auto text-white/10 mb-4" />
                                <h3 className="text-lg font-bold text-white/60 mb-2">No items saved</h3>
                                <p className="text-sm text-white/30 mb-6 max-w-sm mx-auto">Browse the explore page to find items you love</p>
                                <Link href="/explore" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white text-sm">
                                    Explore Items
                                </Link>
                            </motion.div>
                        ) : (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
                                <AnimatePresence mode="popLayout">
                                    {activeItems.map((item, i) => (
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
                                                            {item.listing.media?.[0]?.url || item.listing.images?.[0] ? (
                                                                <img src={item.listing.media?.[0]?.url || item.listing.images[0]} alt={item.listing.title} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02]" />
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />

                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (activeCollection) removeItem(activeCollection, item.listingId);
                                                                }}
                                                                className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm text-[#ff6b6b] hover:bg-red-500/20 transition-all"
                                                            >
                                                                <Heart size={16} className="fill-current" />
                                                            </button>

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
                                                            {item.listing.media?.[0]?.url || item.listing.images?.[0] ? (
                                                                <img src={item.listing.media?.[0]?.url || item.listing.images[0]} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02]" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-bold text-white truncate">{item.listing.title}</h3>
                                                            <p className="text-[10px] text-white/30 flex items-center gap-1"><MapPin size={10} />{item.listing.location}</p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="text-sm font-bold text-white">${item.listing.price}</div>
                                                            <div className="text-[10px] text-white/30">/{item.listing.priceUnit?.toLowerCase()}</div>
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
