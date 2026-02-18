import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Listing } from '@/types/rental';

interface CompareState {
    items: Listing[];
    addItem: (item: Listing) => void;
    removeItem: (id: string) => void;
    clearItems: () => void;
    isInCompare: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                const { items } = get();
                if (items.find((i) => i.id === item.id)) return;
                if (items.length >= 4) {
                    // Could add a toast here later if needed
                    return;
                }
                set({ items: [...items, item] });
            },
            removeItem: (id) => {
                set({ items: get().items.filter((i) => i.id !== id) });
            },
            clearItems: () => set({ items: [] }),
            isInCompare: (id) => !!get().items.find((i) => i.id === id),
        }),
        {
            name: 'rentverse-compare',
        }
    )
);
