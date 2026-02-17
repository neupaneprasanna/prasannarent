import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

// ═══════════════════════════════════════════
//  WISHLIST STORE
// ═══════════════════════════════════════════

interface WishlistCollection {
    id: string;
    name: string;
    emoji: string;
    isDefault: boolean;
    items: WishlistItem[];
    _count: { items: number };
    createdAt: string;
}

interface WishlistItem {
    id: string;
    collectionId: string;
    listingId: string;
    listing: {
        id: string;
        title: string;
        price: number;
        priceUnit: string;
        images: string[];
        rating: number;
        location: string;
        available: boolean;
    };
    addedAt: string;
}

interface WishlistStore {
    collections: WishlistCollection[];
    loading: boolean;
    savedListingIds: Set<string>;

    fetchCollections: () => Promise<void>;
    createCollection: (name: string, emoji?: string) => Promise<void>;
    deleteCollection: (collectionId: string) => Promise<void>;
    addItem: (collectionId: string, listingId: string) => Promise<void>;
    removeItem: (collectionId: string, listingId: string) => Promise<void>;
    quickSave: (listingId: string) => Promise<void>;
    quickUnsave: (listingId: string) => Promise<void>;
    isListingSaved: (listingId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
    collections: [],
    loading: false,
    savedListingIds: new Set(),

    fetchCollections: async () => {
        set({ loading: true });
        try {
            const data = await apiClient.get<{ collections: WishlistCollection[] }>(
                '/engagement/wishlist'
            );
            const savedIds = new Set<string>();
            data.collections.forEach(c => c.items.forEach(i => savedIds.add(i.listingId)));
            set({ collections: data.collections, savedListingIds: savedIds, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    createCollection: async (name: string, emoji?: string) => {
        try {
            await apiClient.post('/engagement/wishlist/collections', { name, emoji });
            await get().fetchCollections();
        } catch (error) {
            console.error('Failed to create collection:', error);
        }
    },

    deleteCollection: async (collectionId: string) => {
        try {
            await apiClient.delete(`/engagement/wishlist/collections/${collectionId}`);
            await get().fetchCollections();
        } catch (error) {
            console.error('Failed to delete collection:', error);
        }
    },

    addItem: async (collectionId: string, listingId: string) => {
        try {
            await apiClient.post(`/engagement/wishlist/${collectionId}/items`, { listingId });
            set(s => ({ savedListingIds: new Set([...s.savedListingIds, listingId]) }));
            await get().fetchCollections();
        } catch (error) {
            console.error('Failed to add item:', error);
        }
    },

    removeItem: async (collectionId: string, listingId: string) => {
        try {
            await apiClient.delete(`/engagement/wishlist/items/${collectionId}/${listingId}`);
            await get().fetchCollections();
        } catch (error) {
            console.error('Failed to remove item:', error);
        }
    },

    quickSave: async (listingId: string) => {
        set(s => ({ savedListingIds: new Set([...s.savedListingIds, listingId]) }));
        try {
            await apiClient.post('/engagement/wishlist/quick-save', { listingId });
        } catch (error) {
            set(s => {
                const ids = new Set(s.savedListingIds);
                ids.delete(listingId);
                return { savedListingIds: ids };
            });
            console.error('Failed to quick save:', error);
        }
    },

    quickUnsave: async (listingId: string) => {
        set(s => {
            const ids = new Set(s.savedListingIds);
            ids.delete(listingId);
            return { savedListingIds: ids };
        });
        try {
            await apiClient.post('/engagement/wishlist/quick-unsave', { listingId });
        } catch (error) {
            set(s => ({ savedListingIds: new Set([...s.savedListingIds, listingId]) }));
            console.error('Failed to quick unsave:', error);
        }
    },

    isListingSaved: (listingId: string) => get().savedListingIds.has(listingId),
}));

// ═══════════════════════════════════════════
//  RECENTLY VIEWED STORE
// ═══════════════════════════════════════════

interface RecentlyViewedItem {
    id: string;
    title: string;
    price: number;
    priceUnit: string;
    images: string[];
    rating: number;
    location: string;
    available: boolean;
    category: string;
    reviewCount: number;
    viewedAt: string;
}

interface RecentlyViewedStore {
    items: RecentlyViewedItem[];
    loading: boolean;
    fetchRecentlyViewed: () => Promise<void>;
    trackView: (listingId: string) => Promise<void>;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>((set) => ({
    items: [],
    loading: false,

    fetchRecentlyViewed: async () => {
        set({ loading: true });
        try {
            const data = await apiClient.get<{ items: RecentlyViewedItem[] }>(
                '/engagement/recently-viewed'
            );
            set({ items: data.items, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    trackView: async (listingId: string) => {
        try {
            await apiClient.post('/engagement/recently-viewed', { listingId });
        } catch {
            // silent fail — tracking is non-critical
        }
    },
}));

// ═══════════════════════════════════════════
//  HOST DASHBOARD STORE
// ═══════════════════════════════════════════

interface HostStats {
    totalListings: number;
    activeListings: number;
    totalViews: number;
    totalBookings: number;
    completedBookings: number;
    conversionRate: string;
    totalEarnings: number;
    avgRating: string;
    reviewCount: number;
}

interface ListingPerformance {
    id: string;
    title: string;
    image: string | null;
    price: number;
    priceUnit: string;
    views: number;
    rating: number;
    reviewCount: number;
    status: string;
    totalBookings: number;
    completedBookings: number;
    revenue: number;
    conversionRate: string;
}

interface EarningsDataPoint {
    date: string;
    earnings: number;
    bookings: number;
}

interface HostDashboardStore {
    stats: HostStats | null;
    listings: ListingPerformance[];
    earnings: EarningsDataPoint[];
    loading: boolean;

    fetchStats: () => Promise<void>;
    fetchListingPerformance: () => Promise<void>;
    fetchEarnings: (days?: number) => Promise<void>;
}

export const useHostDashboardStore = create<HostDashboardStore>((set) => ({
    stats: null,
    listings: [],
    earnings: [],
    loading: false,

    fetchStats: async () => {
        set({ loading: true });
        try {
            const stats = await apiClient.get<HostStats>('/engagement/host/stats');
            set({ stats, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    fetchListingPerformance: async () => {
        try {
            const data = await apiClient.get<{ listings: ListingPerformance[] }>(
                '/engagement/host/listings/performance'
            );
            set({ listings: data.listings });
        } catch (error) {
            console.error('Failed to fetch listing performance:', error);
        }
    },

    fetchEarnings: async (days = 30) => {
        try {
            const data = await apiClient.get<{ data: EarningsDataPoint[] }>(
                `/engagement/host/earnings?days=${days}`
            );
            set({ earnings: data.data });
        } catch (error) {
            console.error('Failed to fetch earnings:', error);
        }
    },
}));

// ═══════════════════════════════════════════
//  RENTER DASHBOARD STORE
// ═══════════════════════════════════════════

interface RenterStats {
    active: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    totalSpent: number;
    totalBookings: number;
}

interface RenterBooking {
    id: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: string;
    listing: {
        id: string;
        title: string;
        images: string[];
        price: number;
        priceUnit: string;
        location: string;
        owner: { firstName: string; lastName: string; avatar: string | null };
    };
    createdAt: string;
}

interface RenterDashboardStore {
    stats: RenterStats | null;
    bookings: RenterBooking[];
    totalBookings: number;
    totalPages: number;
    currentTab: 'active' | 'upcoming' | 'past';
    loading: boolean;

    fetchStats: () => Promise<void>;
    fetchBookings: (status?: string, page?: number) => Promise<void>;
    setTab: (tab: 'active' | 'upcoming' | 'past') => void;
}

export const useRenterDashboardStore = create<RenterDashboardStore>((set) => ({
    stats: null,
    bookings: [],
    totalBookings: 0,
    totalPages: 0,
    currentTab: 'active',
    loading: false,

    fetchStats: async () => {
        try {
            const stats = await apiClient.get<RenterStats>('/engagement/renter/stats');
            set({ stats });
        } catch (error) {
            console.error('Failed to fetch renter stats:', error);
        }
    },

    fetchBookings: async (status?: string, page = 1) => {
        set({ loading: true });
        try {
            const data = await apiClient.get<{
                bookings: RenterBooking[];
                total: number;
                totalPages: number;
            }>(`/engagement/renter/bookings?status=${status || ''}&page=${page}`);
            set({
                bookings: data.bookings,
                totalBookings: data.total,
                totalPages: data.totalPages,
                loading: false,
            });
        } catch {
            set({ loading: false });
        }
    },

    setTab: (tab) => set({ currentTab: tab }),
}));

// ═══════════════════════════════════════════
//  SOCIAL STORE (Follow Host)
// ═══════════════════════════════════════════

interface SocialStore {
    following: Record<string, boolean>; // hostId -> isFollowing
    loading: boolean;
    followHost: (hostId: string) => Promise<void>;
    unfollowHost: (hostId: string) => Promise<void>;
    checkFollowStatus: (hostId: string) => Promise<void>;
}

export const useSocialStore = create<SocialStore>((set, get) => ({
    following: {},
    loading: false,

    followHost: async (hostId: string) => {
        // Optimistic update
        set((state) => ({ following: { ...state.following, [hostId]: true } }));
        try {
            await apiClient.post(`/engagement/follow/${hostId}`, {});
        } catch (error) {
            // Revert on fail
            set((state) => ({ following: { ...state.following, [hostId]: false } }));
            console.error('Failed to follow host:', error);
        }
    },

    unfollowHost: async (hostId: string) => {
        // Optimistic update
        set((state) => ({ following: { ...state.following, [hostId]: false } }));
        try {
            await apiClient.delete(`/engagement/follow/${hostId}`);
        } catch (error) {
            // Revert on fail
            set((state) => ({ following: { ...state.following, [hostId]: true } }));
            console.error('Failed to unfollow host:', error);
        }
    },

    checkFollowStatus: async (hostId: string) => {
        try {
            const { following } = await apiClient.get<{ following: boolean }>(`/engagement/follow/check/${hostId}`);
            set((state) => ({ following: { ...state.following, [hostId]: following } }));
        } catch (error) {
            console.error('Failed to check follow status:', error);
        }
    },
}));

// ═══════════════════════════════════════════
//  CALENDAR STORE (Blocking & Availability)
// ═══════════════════════════════════════════

interface CalendarEvent {
    type: 'booking' | 'block';
    startDate: string;
    endDate: string;
    status?: string; // for bookings
    reason?: string; // for blocks
}

interface CalendarStore {
    events: CalendarEvent[];
    loading: boolean;
    fetchAvailability: (listingId: string, months?: number) => Promise<void>;
    blockDates: (listingId: string, startDate: Date, endDate: Date, reason?: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
    events: [],
    loading: false,

    fetchAvailability: async (listingId: string, months = 3) => {
        set({ loading: true });
        try {
            const { bookings, blocks } = await apiClient.get<{ bookings: any[], blocks: any[] }>(
                `/engagement/listings/${listingId}/availability?months=${months}`
            );

            const events: CalendarEvent[] = [
                ...bookings.map(b => ({ type: 'booking' as const, ...b })),
                ...blocks.map(b => ({ type: 'block' as const, ...b }))
            ];

            set({ events, loading: false });
        } catch (error) {
            console.error('Failed to fetch availability:', error);
            set({ loading: false });
        }
    },

    blockDates: async (listingId: string, startDate: Date, endDate: Date, reason?: string) => {
        try {
            await apiClient.post(`/engagement/listings/${listingId}/calendar/block`, {
                startDate,
                endDate,
                reason
            });
            await get().fetchAvailability(listingId);
        } catch (error) {
            console.error('Failed to block dates:', error);
            throw error;
        }
    },
}));
