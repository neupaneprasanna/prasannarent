import { create } from 'zustand';
import type { AdminDashboardStats, AdminActivityEvent, AdminRevenueDataPoint } from '@/types/admin';

interface AdminDashboardState {
    stats: AdminDashboardStats | null;
    revenueData: AdminRevenueDataPoint[];
    activityFeed: AdminActivityEvent[];
    systemHealth: any | null;
    loading: boolean;
    error: string | null;

    fetchStats: (token: string) => Promise<void>;
    fetchRevenue: (token: string, days?: number) => Promise<void>;
    fetchActivity: (token: string, limit?: number) => Promise<void>;
    fetchHealth: (token: string) => Promise<void>;
    updateStats: (stats: Partial<AdminDashboardStats>) => void;
    addActivity: (event: AdminActivityEvent) => void;
}

export const useAdminDashboardStore = create<AdminDashboardState>()((set, get) => ({
    stats: null,
    revenueData: [],
    activityFeed: [],
    systemHealth: null,
    loading: false,
    error: null,

    fetchStats: async (token: string) => {
        set({ loading: true });
        try {
            const res = await fetch(`/api/admin/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const stats = await res.json();
                set({ stats, loading: false });
            } else {
                set({ error: 'Failed to fetch stats', loading: false });
            }
        } catch {
            set({ error: 'Failed to fetch stats', loading: false });
        }
    },

    fetchRevenue: async (token: string, days = 30) => {
        try {
            const res = await fetch(`/api/admin/dashboard/revenue?days=${days}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ revenueData: data.data });
            }
        } catch {
            // silent fail
        }
    },

    fetchActivity: async (token: string, limit = 20) => {
        try {
            const res = await fetch(`/api/admin/dashboard/activity?limit=${limit}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ activityFeed: data.activities });
            }
        } catch {
            // silent fail
        }
    },

    fetchHealth: async (token: string) => {
        try {
            const res = await fetch(`/api/admin/system/health`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const health = await res.json();
                set({ systemHealth: health });
            }
        } catch {
            // silent fail
        }
    },

    updateStats: (partialStats) => {
        const { stats } = get();
        if (stats) {
            set({ stats: { ...stats, ...partialStats } });
        }
    },

    addActivity: (event) => {
        set((state) => ({
            activityFeed: [event, ...state.activityFeed].slice(0, 50),
        }));
    },
}));
