'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { useMessageStore } from '@/store/message-store';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthenticated } = useAuthStore();
    const { addNotification, fetchNotifications } = useNotificationStore();
    const { fetchConversations, addMessage } = useMessageStore();

    const setupRealtime = useCallback(() => {
        if (!user?.id) return;

        const channel = supabase.channel(`user:${user.id}`);

        channel
            .on('broadcast', { event: 'notification' }, (payload) => {
                const notification = payload.payload;
                console.log(`[Supabase] Notification received:`, notification);

                if (notification && notification.title && notification.message) {
                    addNotification(notification);
                    fetchNotifications();
                    toast.success(notification.title, {
                        description: notification.message,
                        duration: 5000,
                        position: 'top-right',
                    });
                    if (notification.type === 'NEW_MESSAGE') {
                        fetchConversations();
                    }
                }
            })
            .on('broadcast', { event: 'message' }, (payload) => {
                const { conversationId, message } = payload.payload;
                console.log('[Supabase] New message received:', message);
                addMessage(conversationId, message);
                fetchConversations();
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Subscribed to Supabase Realtime for user: ${user.id}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, addNotification, fetchNotifications, fetchConversations, addMessage]);

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            const cleanup = setupRealtime();
            fetchNotifications();
            return cleanup;
        }
    }, [isAuthenticated, user?.id, setupRealtime, fetchNotifications]);

    return <>{children}</>;
};
