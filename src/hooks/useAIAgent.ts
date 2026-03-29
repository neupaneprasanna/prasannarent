'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

interface AgentMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    toolResults?: any[];
    actions?: Array<{ type: string; payload: any; requiresConfirmation: boolean }>;
    suggestions?: string[];
    isLoading?: boolean;
}

interface PendingAction {
    messageId: string;
    tool: string;
    args: any;
}

export function useAIAgent() {
    const router = useRouter();
    const pathname = usePathname();
    const { token } = useAuthStore();
    const { activeChatContext, setAiDraftedReply } = useAppStore();
    const { setTheme } = useTheme();

    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const getConversationHistory = useCallback(() => {
        return messages
            .filter(m => !m.isLoading)
            .map(m => ({ role: m.role, content: m.content }));
    }, [messages]);

    const sendMessage = useCallback(async (userInput: string) => {
        if (!userInput.trim() || isProcessing) return;

        const userMsg: AgentMessage = {
            id: generateId(),
            role: 'user',
            content: userInput.trim(),
            timestamp: new Date()
        };

        const loadingMsg: AgentMessage = {
            id: generateId(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isLoading: true
        };

        setMessages(prev => [...prev, userMsg, loadingMsg]);
        setIsProcessing(true);

        try {
            abortControllerRef.current = new AbortController();

            // Extract context intelligently
            const pageContext: any = {};
            const listingMatch = pathname.match(/\/listings\/([^/]+)$/);
            if (listingMatch && listingMatch[1] !== 'new') {
                pageContext.listingId = listingMatch[1];
            }
            if (activeChatContext) {
                pageContext.activeChat = activeChatContext;
            }

            const res = await fetch('/api/ai-agent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    message: userInput.trim(),
                    currentPage: pathname || '/',
                    pageContext,
                    conversationHistory: getConversationHistory()
                }),
                signal: abortControllerRef.current.signal
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.message) {
                    const assistantMsg: AgentMessage = {
                        id: loadingMsg.id,
                        role: 'assistant',
                        content: data.message,
                        timestamp: new Date(),
                        suggestions: data.suggestions || ['Try again']
                    };
                    setMessages(prev => prev.map(m => m.id === loadingMsg.id ? assistantMsg : m));
                    return;
                }
                throw new Error(data.error || `Request failed (${res.status})`);
            }

            const assistantMsg: AgentMessage = {
                id: loadingMsg.id,
                role: 'assistant',
                content: data.message || "Done!",
                timestamp: new Date(),
                toolResults: data.toolResults,
                actions: data.actions,
                suggestions: data.suggestions
            };

            setMessages(prev => prev.map(m => m.id === loadingMsg.id ? assistantMsg : m));

            // Auto-execute navigation actions
            if (data.actions) {
                for (const action of data.actions) {
                    if (action.type === 'navigate' && !action.requiresConfirmation) {
                        setTimeout(() => {
                            router.push(action.payload.page);
                        }, 800);
                    } else if (action.type === 'theme') {
                        setTheme(action.payload.theme);
                        toast.success(`Switched to ${action.payload.theme} mode`);
                    } else if (action.type === 'toast') {
                        toast(action.payload.message, { description: action.payload.description });
                    } else if (action.type === 'populate_draft') {
                        // Store draft in generic localStorage so the listing form can pick it up
                        localStorage.setItem('ai_draft_listing', JSON.stringify(action.payload.draft));
                        toast.success("Prepared your listing draft!");
                        setTimeout(() => {
                            router.push('/listings/new');
                        }, 800);
                    } else if (action.type === 'draft_chat_reply') {
                        setAiDraftedReply(action.payload.content);
                        toast.success("Reply drafted!");
                    }

                    // Store pending confirmation actions
                    if (action.requiresConfirmation) {
                        setPendingAction({
                            messageId: assistantMsg.id,
                            tool: action.type,
                            args: action.payload
                        });
                    }
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return;

            const errorMsg = error?.message || 'Unknown error occurred';
            console.error('AI Agent error:', errorMsg);

            setMessages(prev => prev.map(m =>
                m.id === loadingMsg.id
                    ? { ...m, content: `Error: ${errorMsg}`, isLoading: false, suggestions: ['Try again'] }
                    : m
            ));
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, token, pathname, getConversationHistory, router]);

    const confirmAction = useCallback(async () => {
        if (!pendingAction) return;

        setIsProcessing(true);
        const loadingMsg: AgentMessage = {
            id: generateId(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isLoading: true
        };
        setMessages(prev => [...prev, loadingMsg]);

        try {
            const res = await fetch('/api/ai-agent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    message: 'Execute confirmed action',
                    currentPage: pathname || '/',
                    conversationHistory: getConversationHistory(),
                    confirmedAction: {
                        tool: pendingAction.tool,
                        args: pendingAction.args
                    }
                })
            });

            const data = await res.json();

            setMessages(prev => prev.map(m =>
                m.id === loadingMsg.id
                    ? {
                        ...m,
                        content: data.message || "Action completed.",
                        isLoading: false,
                        toolResults: data.toolResults,
                        suggestions: data.suggestions
                    }
                    : m
            ));
        } catch {
            setMessages(prev => prev.map(m =>
                m.id === loadingMsg.id
                    ? { ...m, content: "Failed to execute the action. Please try again.", isLoading: false }
                    : m
            ));
        } finally {
            setPendingAction(null);
            setIsProcessing(false);
        }
    }, [pendingAction, token, pathname, getConversationHistory]);

    const rejectAction = useCallback(() => {
        if (!pendingAction) return;
        setPendingAction(null);

        const rejectMsg: AgentMessage = {
            id: generateId(),
            role: 'assistant',
            content: "Got it — I've cancelled that action. What would you like to do instead?",
            timestamp: new Date(),
            suggestions: ['Show my bookings', 'Go to dashboard', 'Search for items']
        };
        setMessages(prev => [...prev, rejectMsg]);
    }, [pendingAction]);

    const clearChat = useCallback(() => {
        setMessages([]);
        setPendingAction(null);
        setIsProcessing(false);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    return {
        messages,
        isProcessing,
        pendingAction,
        sendMessage,
        confirmAction,
        rejectAction,
        clearChat
    };
}
