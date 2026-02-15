'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    data?: any;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;

    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    fetchNotifications: async () => {
        set({ loading: true });
        try {
            const res = await apiClient.get<{ notifications: Notification[], unreadCount: number }>('/notifications');
            set({
                notifications: res.notifications,
                unreadCount: res.unreadCount,
                loading: false
            });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            set({ loading: false });
        }
    },

    markAsRead: async (id: string) => {
        try {
            await apiClient.patch(`/notifications/${id}/read`, {});
            set(state => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await apiClient.patch('/notifications/read-all', {});
            set(state => ({
                notifications: state.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0
            }));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    },

    addNotification: (notification: Notification) => {
        set(state => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1
        }));
    },
}));
