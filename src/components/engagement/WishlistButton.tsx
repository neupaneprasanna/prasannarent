'use client';

import { Heart, Plus } from 'lucide-react';
import { useWishlistStore } from '@/store/engagement-store';
import { useAuthStore } from '@/store/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

interface WishlistButtonProps {
    listingId: string;
    size?: number;
    className?: string;
    showLabel?: boolean;
}

export default function WishlistButton({ listingId, size = 18, className = '', showLabel = false }: WishlistButtonProps) {
    const { isAuthenticated } = useAuthStore();
    const { savedListingIds, collections, quickSave, quickUnsave, addItem, removeItem } = useWishlistStore();
    const [animating, setAnimating] = useState(false);
    const [showCollections, setShowCollections] = useState(false);

    const isSaved = savedListingIds.has(listingId);
    
    // Find which collection(s) this item belongs to
    const itemCollections = collections.filter(c => c.items?.some(i => i.listingId === listingId));

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) return;

        if (isSaved && itemCollections.length > 1) {
            // If in multiple collections, toggle picker instead of just unsaving
            setShowCollections(!showCollections);
            return;
        }

        setAnimating(true);
        setTimeout(() => setAnimating(false), 600);

        if (isSaved) {
            await quickUnsave(listingId);
        } else {
            await quickSave(listingId);
            // After quick save, show collections to allow moving it
            setShowCollections(true);
        }
    };

    const handleCollectionToggle = async (e: React.MouseEvent, collectionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isInCollection = itemCollections.some(c => c.id === collectionId);
        if (isInCollection) {
            await removeItem(collectionId, listingId);
        } else {
            await addItem(collectionId, listingId);
        }
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={handleClick}
                onMouseEnter={() => isSaved && setShowCollections(true)}
                className={`group/wish relative flex items-center gap-1.5 transition-all duration-300 ${className}`}
                aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            >
                <div className="relative">
                    <AnimatePresence>
                        {animating && isSaved && (
                            <motion.div
                                initial={{ scale: 0, opacity: 1 }}
                                animate={{ scale: 2, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <Heart size={size} className="text-[#ff6b6b] fill-[#ff6b6b]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <motion.div
                        animate={animating ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3 }}
                    >
                        <Heart
                            size={size}
                            className={`transition-all duration-300 ${isSaved
                                    ? 'text-[#ff6b6b] fill-[#ff6b6b] drop-shadow-[0_0_6px_rgba(255,107,107,0.6)]'
                                    : 'text-white/40 group-hover/wish:text-white/80'
                                }`}
                        />
                    </motion.div>
                </div>
                {showLabel && (
                    <span className={`text-xs font-medium transition-colors ${isSaved ? 'text-[#ff6b6b]' : 'text-white/40 group-hover/wish:text-white/80'}`}>
                        {isSaved ? 'Saved' : 'Save'}
                    </span>
                )}
            </button>

            {/* Collection Picker Popover */}
            <AnimatePresence>
                {showCollections && isSaved && (
                    <>
                        <div 
                            className="fixed inset-0 z-[190]" 
                            onClick={(e) => { e.stopPropagation(); setShowCollections(false); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full mb-3 right-0 z-[200] w-48 glass-card rounded-2xl border border-white/10 p-2 shadow-2xl backdrop-blur-2xl"
                            onClick={(e) => e.stopPropagation()}
                            onMouseLeave={() => setShowCollections(false)}
                        >
                            <p className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 mb-1">
                                Add to collection
                            </p>
                            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                                {collections.map(c => {
                                    const isIn = itemCollections.some(ic => ic.id === c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={(e) => handleCollectionToggle(e, c.id)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                                                isIn ? 'bg-[#6c5ce7]/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <span className="text-sm">{c.emoji}</span>
                                            <span className="flex-1 truncate text-left">{c.name}</span>
                                            {isIn && <div className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] shadow-[0_0_8px_#6c5ce7]" />}
                                        </button>
                                    );
                                })}
                                <Link 
                                    href="/wishlist" 
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#a29bfe] hover:bg-[#6c5ce7]/10 transition-all"
                                    onClick={() => setShowCollections(false)}
                                >
                                    <div className="w-5 h-5 rounded-lg bg-[#6c5ce7]/20 flex items-center justify-center">
                                        <Plus size={10} />
                                    </div>
                                    <span>Create New</span>
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
