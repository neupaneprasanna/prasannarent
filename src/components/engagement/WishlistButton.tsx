'use client';

import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/engagement-store';
import { useAuthStore } from '@/store/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface WishlistButtonProps {
    listingId: string;
    size?: number;
    className?: string;
    showLabel?: boolean;
}

export default function WishlistButton({ listingId, size = 18, className = '', showLabel = false }: WishlistButtonProps) {
    const { isAuthenticated } = useAuthStore();
    const { savedListingIds, quickSave, quickUnsave } = useWishlistStore();
    const [animating, setAnimating] = useState(false);

    const isSaved = savedListingIds.has(listingId);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) return;

        setAnimating(true);
        setTimeout(() => setAnimating(false), 600);

        if (isSaved) {
            await quickUnsave(listingId);
        } else {
            await quickSave(listingId);
        }
    };

    return (
        <button
            onClick={handleClick}
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
    );
}
