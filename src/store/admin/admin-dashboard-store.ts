import { create } from 'zustand';
import type { AdminDashboardStats, AdminActivityEvent, AdminRevenueDataPoint } from '@/types/admin';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface AdminDashboardState {
    stats: AdminDashboardStats | null;
    revenueData: AdminRevenueDataPoint[];
    activityFeed: AdminActivityEvent[];
    systemHealth: any | null;
    loading: boolean;
    error: string | null;
    socket: Socket | null;

    fetchStats: (token: string) => Promise<void>;
    fetchRevenue: (token: string, days?: number) => Promise<void>;
    fetchActivity: (token: string, limit?: number) => Promise<void>;
    fetchHealth: (token: string) => Promise<void>;
    initSocket: (token: string) => void;
    disconnectSocket: () => void;
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
    socket: null,

    fetchStats: async (token: string) => {
        set({ loading: true });
        try {
            const res = await fetch(`${API_URL}/admin/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const stats = await res.json();
                set({ stats, loading: false });
            }
        } catch {
            set({ error: 'Failed to fetch stats', loading: false });
        }
    },

    fetchRevenue: async (token: string, days = 30) => {
        try {
            const res = await fetch(`${API_URL}/admin/dashboard/revenue?days=${days}`, {
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
            const res = await fetch(`${API_URL}/admin/dashboard/activity?limit=${limit}`, {
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
            const res = await fetch(`${API_URL}/admin/system/health`, {
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

    initSocket: (token: string) => {
        const { socket } = get();
        if (socket?.connected) return;

        const newSocket = io(API_URL.replace('/api', ''), {
            auth: { token },
        });

        newSocket.on('connect', () => {
            console.log('Admin Socket connected');
        });

        newSocket.on('admin:activity', (event) => {
            get().addActivity(event);
        });

        newSocket.on('admin:stats:update', (stats) => {
            get().updateStats(stats);
        });

        set({ socket: newSocket });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null });
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
