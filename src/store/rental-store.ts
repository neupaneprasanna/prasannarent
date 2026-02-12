import { create } from 'zustand';

export interface RentalItem {
    id: string;
    title: string;
    description: string;
    price: number;
    priceUnit: 'hour' | 'day' | 'week' | 'month';
    category: string;
    images: string[];
    rating: number;
    reviewCount: number;
    location: string;
    owner: {
        name: string;
        avatar: string;
        verified: boolean;
    };
    available: boolean;
    featured: boolean;
    tags: string[];
    loveCount: number;
}

interface RentalState {
    listings: RentalItem[];
    searchQuery: string;
    selectedCategory: string;
    cart: RentalItem[];
    filters: {
        priceRange: [number, number];
        rating: number;
        location: string;
        available: boolean;
    };
    setListings: (listings: RentalItem[]) => void;
    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: string) => void;
    addToCart: (item: RentalItem) => void;
    removeFromCart: (id: string) => void;
    setFilters: (filters: Partial<RentalState['filters']>) => void;
}

export const useRentalStore = create<RentalState>((set) => ({
    listings: [],
    searchQuery: '',
    selectedCategory: 'all',
    cart: [],
    filters: {
        priceRange: [0, 1000],
        rating: 0,
        location: '',
        available: true,
    },
    setListings: (listings) => set({ listings }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedCategory: (category) => set({ selectedCategory: category }),
    addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
    removeFromCart: (id) => set((state) => ({ cart: state.cart.filter((i) => i.id !== id) })),
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));
