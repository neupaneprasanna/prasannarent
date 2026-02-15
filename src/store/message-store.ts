'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ConversationParticipant {
    id: string;
    userId: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
}

export interface ConversationMessage {
    id: string;
    text: string;
    senderId: string;
    conversationId: string;
    read: boolean;
    createdAt: string;
    sender: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
}

export interface Conversation {
    id: string;
    listingId?: string;
    listing?: { id: string; title: string; images: string[] };
    participants: ConversationParticipant[];
    messages: ConversationMessage[];
    unreadCount: number;
    updatedAt: string;
    createdAt: string;
}

interface MessageState {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    messages: ConversationMessage[];
    loading: boolean;
    messagesLoading: boolean;
    socket: Socket | null;

    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    setActiveConversation: (conv: Conversation | null) => void;
    sendMessage: (conversationId: string, text: string) => Promise<void>;
    startConversation: (receiverId: string, listingId?: string, message?: string) => Promise<Conversation | null>;
    initSocket: (userId: string) => void;
    disconnectSocket: () => void;
    totalUnread: () => number;
}

export const useMessageStore = create<MessageState>()((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    loading: false,
    messagesLoading: false,
    socket: null,

    fetchConversations: async () => {
        set({ loading: true });
        try {
            const res = await apiClient.get<{ conversations: Conversation[] }>('/conversations');
            set({ conversations: res.conversations, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    fetchMessages: async (conversationId: string) => {
        set({ messagesLoading: true });
        try {
            const res = await apiClient.get<{ messages: ConversationMessage[] }>(`/conversations/${conversationId}/messages`);
            set({ messages: res.messages, messagesLoading: false });
        } catch {
            set({ messagesLoading: false });
        }
    },

    setActiveConversation: (conv) => {
        set({ activeConversation: conv, messages: [] });
        if (conv) {
            get().fetchMessages(conv.id);
        }
    },

    sendMessage: async (conversationId: string, text: string) => {
        try {
            const res = await apiClient.post<{ message: ConversationMessage }>(`/conversations/${conversationId}/messages`, { text });
            set((state) => ({
                messages: [...state.messages, res.message],
            }));
        } catch (err) {
            console.error('Send message failed:', err);
        }
    },

    startConversation: async (receiverId: string, listingId?: string, message?: string) => {
        try {
            const res = await apiClient.post<{ conversation: Conversation }>('/conversations', { receiverId, listingId, message });
            const conv = res.conversation;
            await get().fetchConversations();
            return conv;
        } catch (err) {
            console.error('Start conversation failed:', err);
            return null;
        }
    },

    initSocket: (userId: string) => {
        const { socket } = get();
        if (socket?.connected) return;

        const newSocket = io(API_URL.replace('/api', ''));

        newSocket.on(`message:${userId}`, (data: { conversationId: string; message: ConversationMessage }) => {
            const { activeConversation, messages } = get();

            // If we're viewing this conversation, add the message
            if (activeConversation?.id === data.conversationId) {
                set({ messages: [...messages, data.message] });
            }

            // Refresh conversations list for updated previews & unread counts
            get().fetchConversations();
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

    totalUnread: () => {
        return get().conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    },
}));
