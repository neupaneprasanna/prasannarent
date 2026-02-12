'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

export default function SearchOverlay() {
    const isSearchActive = useAppStore((s) => s.isSearchActive);
    const setSearchActive = useAppStore((s) => s.setSearchActive);

    return (
        <AnimatePresence>
            {isSearchActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[45] bg-[#050508]/80 backdrop-blur-sm cursor-pointer"
                    onClick={() => setSearchActive(false)}
                />
            )}
        </AnimatePresence>
    );
}
