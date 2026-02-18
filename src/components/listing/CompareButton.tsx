'use client';

import { motion } from 'framer-motion';
import { Columns, Check } from 'lucide-react';
import { useCompareStore } from '@/store/compare-store';
import { Listing } from '@/types/rental';

interface CompareButtonProps {
    item: Listing;
    variant?: 'icon' | 'full';
}

export default function CompareButton({ item, variant = 'icon' }: CompareButtonProps) {
    const { addItem, removeItem, isInCompare, items } = useCompareStore();
    const active = isInCompare(item.id);
    const isFull = items.length >= 4;

    const toggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (active) {
            removeItem(item.id);
        } else {
            addItem(item);
        }
    };

    if (variant === 'icon') {
        return (
            <button
                onClick={toggle}
                disabled={!active && isFull}
                className={`p-2 rounded-full border transition-all duration-300 ${active
                        ? 'bg-[#6c5ce7] border-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/20'
                        : !active && isFull
                            ? 'bg-black/20 border-white/5 text-white/10 cursor-not-allowed'
                            : 'bg-black/20 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                    }`}
                title={!active && isFull ? 'Comparison limit reached' : active ? 'Remove from compare' : 'Add to compare'}
            >
                {active ? <Check size={14} /> : <Columns size={14} />}
            </button>
        );
    }

    return (
        <button
            onClick={toggle}
            disabled={!active && isFull}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${active
                    ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]'
                    : !active && isFull
                        ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
        >
            {active ? <Check size={14} /> : <Columns size={14} />}
            {active ? 'In Compare' : 'Compare'}
        </button>
    );
}
