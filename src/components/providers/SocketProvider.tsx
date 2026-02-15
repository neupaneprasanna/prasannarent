'use client';

import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore, Notification } from '@/store/notification-store';
import { useMessageStore } from '@/store/message-store';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');

let socket: Socket | null = null;

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthenticated } = useAuthStore();
    const { addNotification, fetchNotifications } = useNotificationStore();
    const { fetchConversations } = useMessageStore();

    const connectSocket = useCallback(() => {
        if (!user?.id || socket?.connected) return;

        socket = io(SOCKET_URL, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('Connected to socket server');
            socket?.emit('join-room', user.id);
        });

        socket.on(`notification:${user.id}`, async (notification: any) => {
            console.log(`[Socket] Notification received for user ${user.id}:`, notification);

            // Safety check for notification data
            if (!notification || !notification.title || !notification.message) {
                console.warn('[Socket] Received malformed notification:', notification);
                return;
            }

            // Ensure we don't process notifications meant for someone else if they somehow leaked
            // and don't show notifications for our own actions if the backend misidentified us
            if (notification.userId && notification.userId !== user.id) {
                console.warn('[Socket] Notification userId mismatch. User:', user.id, 'Target:', notification.userId);
                return;
            }

            // Add locally for immediate feedback
            addNotification(notification);

            // Sync with server for absolute truth on unread count
            fetchNotifications();

            // Show a toast
            toast.success(notification.title, {
                description: notification.message,
                duration: 5000,
                position: 'top-right',
            });

            // If it's a message, we might want to refresh conversations too
            if (notification.type === 'NEW_MESSAGE') {
                fetchConversations();
            }
        });

        socket.on(`message:${user.id}`, (data: any) => {
            console.log('New message received via socket:', data);
            // The message-store also handles this, but we can sync here if needed
            fetchConversations();
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });

        return () => {
            socket?.disconnect();
            socket = null;
        };
    }, [user?.id, addNotification, fetchConversations]);

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            connectSocket();
            fetchNotifications();
        } else {
            if (socket) {
                socket.disconnect();
                socket = null;
            }
        }
    }, [isAuthenticated, user?.id, connectSocket, fetchNotifications]);

    return <>{children}</>;
};
