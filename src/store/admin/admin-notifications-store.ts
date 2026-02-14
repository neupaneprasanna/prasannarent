import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminNotification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    category: 'system' | 'user' | 'booking' | 'payment' | 'security';
}

export interface AdminAnnouncement {
    id: string;
    subject: string;
    message: string;
    targetAudience: 'all' | 'hosts' | 'guests' | 'admins';
    sentAt: string;
    status: 'draft' | 'sent' | 'scheduled';
    scheduledFor?: string;
}

interface AdminNotificationsState {
    notifications: AdminNotification[];
    announcements: AdminAnnouncement[];

    // Notification Actions
    addNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
    clearAllNotifications: () => void;

    // Announcement Actions
    createAnnouncement: (announcement: Omit<AdminAnnouncement, 'id' | 'sentAt'>) => void;
    deleteAnnouncement: (id: string) => void;
}

// Mock initial data
const initialNotifications: AdminNotification[] = [
    { id: '1', type: 'warning', title: 'High Server Load', message: 'CPU usage exceeded 85% on US-East region.', timestamp: new Date(Date.now() - 120000).toISOString(), read: false, category: 'system' },
    { id: '2', type: 'success', title: 'New Booking', message: 'User "Alice" booked "Sunset Villa" for $1,200.', timestamp: new Date(Date.now() - 900000).toISOString(), read: false, category: 'booking' },
    { id: '3', type: 'info', title: 'System Update', message: 'Platform maintenance scheduled for 2:00 AM UTC.', timestamp: new Date(Date.now() - 3600000).toISOString(), read: true, category: 'system' },
    { id: '4', type: 'error', title: 'Payment Failed', message: 'Transaction #TX-992 failed. Gateway timeout.', timestamp: new Date(Date.now() - 10800000).toISOString(), read: true, category: 'payment' },
    { id: '5', type: 'info', title: 'New User Registration', message: '12 new users joined in the last hour.', timestamp: new Date(Date.now() - 14400000).toISOString(), read: true, category: 'user' },
];

export const useAdminNotificationsStore = create<AdminNotificationsState>()(
    persist(
        (set) => ({
            notifications: initialNotifications,
            announcements: [],

            addNotification: (notification) => set((state) => ({
                notifications: [
                    {
                        ...notification,
                        id: Math.random().toString(36).substr(2, 9),
                        timestamp: new Date().toISOString(),
                        read: false,
                    },
                    ...state.notifications
                ]
            })),

            markAsRead: (id) => set((state) => ({
                notifications: state.notifications.map(n =>
                    n.id === id ? { ...n, read: true } : n
                )
            })),

            markAllAsRead: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, read: true }))
            })),

            deleteNotification: (id) => set((state) => ({
                notifications: state.notifications.filter(n => n.id !== id)
            })),

            clearAllNotifications: () => set({ notifications: [] }),

            createAnnouncement: (announcement) => set((state) => ({
                announcements: [
                    {
                        ...announcement,
                        id: Math.random().toString(36).substr(2, 9),
                        sentAt: new Date().toISOString(),
                    },
                    ...state.announcements
                ]
            })),

            deleteAnnouncement: (id) => set((state) => ({
                announcements: state.announcements.filter(a => a.id !== id)
            })),
        }),
        {
            name: 'admin-notifications-storage',
        }
    )
);
