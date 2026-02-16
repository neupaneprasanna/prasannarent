'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

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

    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    setActiveConversation: (conv: Conversation | null) => void;
    sendMessage: (conversationId: string, text: string) => Promise<void>;
    startConversation: (receiverId: string, listingId?: string, message?: string) => Promise<Conversation | null>;
    addMessage: (conversationId: string, message: ConversationMessage) => void;
    totalUnread: () => number;
}

export const useMessageStore = create<MessageState>()((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    loading: false,
    messagesLoading: false,

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
        // Guard: Cannot message yourself
        const { user } = (await import('@/store/auth-store')).useAuthStore.getState();
        if (user?.id === receiverId) {
            console.error('Cannot message yourself');
            return null;
        }

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

    addMessage: (conversationId: string, message: ConversationMessage) => {
        const { activeConversation, messages } = get();
        if (activeConversation?.id === conversationId) {
            // Check for duplicates to prevent issues with multiple update paths
            if (!messages.find(m => m.id === message.id)) {
                set({ messages: [...messages, message] });
            }
        }
    },

    totalUnread: () => {
        return get().conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    },
}));
