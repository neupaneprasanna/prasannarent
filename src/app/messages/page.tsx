'use client';

import { Bricolage_Grotesque } from 'next/font/google';
const avantGardeFont = Bricolage_Grotesque({ subsets: ['latin'], weight: ['200', '300', '400', '500', '600', '700', '800'] });


import { useState, useEffect, useRef, useCallback, useMemo, TouchEvent as ReactTouchEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Home, Send, Plus, CheckCheck, Check, ArrowDown,
    PanelLeftClose, PanelLeftOpen, Sun, Moon, MessageSquare,
    Trash2, X, Settings, Info, LogOut, SlidersHorizontal,
    Flag, Lock, Pin, ChevronDown, ChevronUp, Image as ImageIcon,
    MoreVertical, ArrowLeft, Paperclip, FileText, Music, Video,
    File, Loader2, Download, Phone, Smile, Reply, Forward,
    Pencil, SearchIcon, ExternalLink, ZoomIn, ChevronRight, ChevronLeft,
    CornerUpRight, Volume2, VolumeX, PinOff, BellOff, Bell, Copy,
    Package, DollarSign, Calendar, MapPin, Star, ShoppingBag, Tag
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import { CallProvider, useCall } from '@/components/call/CallProvider';
import CallUI from '@/components/call/CallUI';
import VoiceRecorder from '@/components/call/VoiceRecorder';

const MESSAGING_THEME_CSS = `
  .theme-dark {
    --bg-main: linear-gradient(135deg, #0B0F19 0%, #0F172A 50%, #020617 100%);
    --bg-nav: linear-gradient(180deg, #0F172A 0%, #0B0F19 100%);
    --bg-sidebar: rgba(15, 23, 42, 0.6);
    --bg-header: rgba(15, 23, 42, 0.5);
    --bg-chat: linear-gradient(180deg, #0B0F19 0%, #0B0F19 100%);
    --bg-input: rgba(30, 41, 59, 0.8);
    --bg-other-msg: rgba(30, 41, 59, 0.8);
    --bg-icon-bg: rgba(51, 65, 85, 0.6);
  }
  .theme-dim {
    --bg-main: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    --bg-nav: #1e293b;
    --bg-sidebar: #1e293b;
    --bg-header: rgba(30, 41, 59, 0.8);
    --bg-chat: #0f172a;
    --bg-input: #334155;
    --bg-other-msg: #334155;
    --bg-icon-bg: #475569;
    --accent-plum: #A855F7;
  }

    .messaging-page-root ::-webkit-scrollbar {
        width: 5px;
    }
    .messaging-page-root ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.01);
    }
    .messaging-page-root ::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #8B5CF6, #34D399);
        border-radius: 10px;
    }
    .messaging-page-root .bg-grid-pattern {
        background-image: radial-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px);
        background-size: 30px 30px;
    }
`;


interface ChatUser {
    id: string;
    firstName: string;
    lastName?: string;
    avatar: string | null;
    lastSeenAt?: string;
}

interface ChatMember {
    id: string;
    userId: string;
    user: ChatUser;
    lastReadAt?: string;
}

interface MessageAttachment {
    id?: string;
    url: string;
    type: string;
    name?: string;
    size?: number;
}

interface MessageReaction {
    id: string;
    emoji: string;
    userId: string;
    user: { id: string; firstName: string };
}

interface ReplyTo {
    id: string;
    content: string | null;
    isDeleted?: boolean;
    sender: { id: string; firstName: string };
    attachments?: { type: string }[];
}

interface PendingFile {
    file: File;
    preview?: string;
    type: string;
    uploading: boolean;
    uploaded: boolean;
    url?: string;
}

interface LinkPreviewData {
    url: string;
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
}

interface ListingShareData {
    id: string;
    title: string;
    price: number;
    priceUnit?: string;
    category?: string;
    location?: string;
    rating?: number;
    images: string[];
    owner?: { firstName: string; avatar?: string | null };
    media?: { url: string; type: string }[];
}

interface Message {
    id: string;
    content: string | null;
    createdAt: string;
    senderId: string;
    isDeleted?: boolean;
    isEdited?: boolean;
    isForwarded?: boolean;
    chatRoomId?: string;
    sender: { id: string; firstName: string; lastName?: string; avatar: string | null };
    attachments: MessageAttachment[];
    reactions?: MessageReaction[];
    replyTo?: ReplyTo | null;
}

interface ChatRoom {
    id: string;
    isGroup: boolean;
    name?: string;
    updatedAt: string;
    members: ChatMember[];
    messages: Message[];
    unreadCount: number;
    isMuted?: boolean;
    isPinned?: boolean;
}

export default function MessagesPage() {
    const { user, isAuthenticated } = useAuthStore();
    const { setActiveChatContext, aiDraftedReply, setAiDraftedReply } = useAppStore();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [themeMode, setThemeMode] = useState<'dark' | 'dim'>('dim');
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
    const [showDetailsPanel, setShowDetailsPanel] = useState(true);
    const [showMediaSection, setShowMediaSection] = useState(true);
    const [sidebarMode, setSidebarMode] = useState<'messages' | 'search'>('messages');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [detailsWidth, setDetailsWidth] = useState(280);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const [isResizingDetails, setIsResizingDetails] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [inputDragOver, setInputDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── NEW FEATURE STATES ───
    // Editing
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    // Reply
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    // In-chat search
    const [chatSearchOpen, setChatSearchOpen] = useState(false);
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [chatSearchResults, setChatSearchResults] = useState<Message[]>([]);
    const [chatSearchIdx, setChatSearchIdx] = useState(0);
    // Emoji picker
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
    // Lightbox
    const [lightboxImages, setLightboxImages] = useState<{ url: string; name?: string }[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    // Forward
    const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
    // Link previews cache
    const [linkPreviews, setLinkPreviews] = useState<Map<string, LinkPreviewData>>(new Map());
    // Pagination
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [messageCursor, setMessageCursor] = useState<string | null>(null);
    // Context menu
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msgId: string } | null>(null);
    // Highlighted message (for search scroll-to)
    const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
    // Long press for mobile reactions
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    // ─── RENTAL FEATURES STATE ───
    const [showListingSearch, setShowListingSearch] = useState(false);
    const [listingSearchQuery, setListingSearchQuery] = useState('');
    const [listingSearchResults, setListingSearchResults] = useState<ListingShareData[]>([]);
    const [listingSearchLoading, setListingSearchLoading] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState<{ listingId: string; title: string; price: number; priceUnit?: string } | null>(null);
    const [bookingDates, setBookingDates] = useState<{ start: string; end: string }>({ start: '', end: '' });
    const [bookingLoading, setBookingLoading] = useState(false);

    const isDark = theme === 'dark';
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const activeRoomIdRef = useRef<string | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    // Refs for click-outside-to-close
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const reactionPickerRef = useRef<HTMLDivElement>(null);
    const attachMenuRef = useRef<HTMLDivElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);

    // ─── AI CONTEXT SYNC ───
    useEffect(() => {
        if (activeRoomId) {
            const room = rooms.find(r => r.id === activeRoomId);
            setActiveChatContext({
                roomId: activeRoomId,
                roomName: room?.name,
                members: room?.members?.map(m => ({ id: m.user.id, name: m.user.firstName })),
                messages: messages.slice(-20).map(m => ({
                    sender: m.senderId === user?.id ? 'Me' : m.sender.firstName,
                    content: m.content,
                    time: new Date(m.createdAt).toLocaleTimeString()
                }))
            });
        } else {
            setActiveChatContext(null);
        }
        return () => setActiveChatContext(null);
    }, [activeRoomId, messages, rooms, setActiveChatContext, user?.id]);

    useEffect(() => {
        if (aiDraftedReply) {
            setMessageInput(aiDraftedReply);
            setAiDraftedReply(null);
            setTimeout(() => {
                const el = document.getElementById('chat-message-input');
                if (el) el.focus();
            }, 100);
        }
    }, [aiDraftedReply, setAiDraftedReply]);
    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // ─── SORT ROOMS HELPER (pinned first, then by updatedAt) ───
    const sortRooms = useCallback((roomsList: ChatRoom[]) => {
        return [...roomsList].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    }, []);

    // ─── CLICK-OUTSIDE-TO-CLOSE ALL POPOVERS ───
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
                setShowEmojiPicker(false);
            }
            if (showReactionPicker && reactionPickerRef.current && !reactionPickerRef.current.contains(target)) {
                setShowReactionPicker(null);
            }
            if (showAttachMenu && attachMenuRef.current && !attachMenuRef.current.contains(target)) {
                setShowAttachMenu(false);
            }
            if (contextMenu && contextMenuRef.current && !contextMenuRef.current.contains(target)) {
                setContextMenu(null);
            }
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowEmojiPicker(false);
                setShowReactionPicker(null);
                setShowAttachMenu(false);
                setContextMenu(null);
                setForwardingMessage(null);
                setShowLightbox(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [showEmojiPicker, showReactionPicker, showAttachMenu, contextMenu]);

    // ─── LONG PRESS HANDLER FOR MOBILE REACTIONS ───
    const handleMessageTouchStart = useCallback((msgId: string, e: React.TouchEvent) => {
        longPressTimerRef.current = setTimeout(() => {
            const touch = e.touches[0];
            setContextMenu({ x: touch.clientX, y: touch.clientY, msgId });
        }, 500);
    }, []);

    const handleMessageTouchEnd = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    // ─── RIGHT-CLICK CONTEXT MENU ───
    const handleMessageContextMenu = useCallback((e: React.MouseEvent, msgId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, msgId });
    }, []);

    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    }, []);

    // Only auto-scroll when user is already near bottom (fixes scroll-yank bug)
    const isNearBottomRef = useRef(true);
    useEffect(() => {
        if (isNearBottomRef.current) scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setShowScrollBtn(distFromBottom > 150);
        isNearBottomRef.current = distFromBottom < 100;
    }, []);

    // Resizing logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingSidebar) {
                // Icon nav rail is 60px wide
                const newWidth = e.clientX - 60;
                if (newWidth >= 240 && newWidth <= 500) {
                    setSidebarWidth(newWidth);
                }
            }
            if (isResizingDetails) {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth >= 240 && newWidth <= 450) {
                    setDetailsWidth(newWidth);
                }
            }
        };

        const stopResizing = () => {
            setIsResizingSidebar(false);
            setIsResizingDetails(false);
            document.body.style.cursor = 'auto';
        };

        if (isResizingSidebar || isResizingDetails) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'auto';
        };
    }, [isResizingSidebar, isResizingDetails]);

    // Socket.IO + initial data
    useEffect(() => {
        if (!isAuthenticated || !user) return;
        const url = typeof window !== 'undefined' ? window.location.origin : '';
        const socket = io(url, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => { socket.emit('authenticate', user.id); });
        socket.on('online_users', (ids: string[]) => { setOnlineUserIds(new Set(ids)); });
        socket.on('user_online', ({ userId }: { userId: string }) => {
            setOnlineUserIds(prev => new Set(prev).add(userId));
        });
        socket.on('user_offline', ({ userId }: { userId: string }) => {
            setOnlineUserIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
        });

        socket.on('new_message', (msg: Message & { chatRoomId: string }) => {
            const curRoom = activeRoomIdRef.current;
            if (curRoom && msg.chatRoomId === curRoom) {
                setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
            }
            setRooms(prev => sortRooms(prev.map(r => {
                if (r.id === msg.chatRoomId) {
                    return { ...r, updatedAt: msg.createdAt, messages: [msg],
                        unreadCount: msg.chatRoomId === curRoom ? r.unreadCount : r.unreadCount + 1 };
                }
                return r;
            })));
        });

        socket.on('user_typing', ({ roomId, name }: { roomId: string; userId: string; name: string }) => {
            if (roomId === activeRoomIdRef.current) {
                setTypingUsers(prev => new Map(prev).set(roomId, name));
            }
        });
        socket.on('user_stopped_typing', ({ roomId }: { roomId: string }) => {
            setTypingUsers(prev => { const m = new Map(prev); m.delete(roomId); return m; });
        });
        socket.on('message_removed', ({ messageId }: { messageId: string }) => {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true, content: null } : m));
        });

        // New: edited messages
        socket.on('message_updated', (msg: Message & { chatRoomId: string }) => {
            if (msg.chatRoomId === activeRoomIdRef.current) {
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...msg } : m));
            }
        });

        // New: reaction changes
        socket.on('reaction_changed', (data: { roomId: string; messageId: string; reactions: MessageReaction[] }) => {
            if (data.roomId === activeRoomIdRef.current) {
                setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
            }
        });

        const load = async () => {
            try {
                // Fetch rooms and users from the Next.js API endpoints
                const [fetchedRooms, usersRes] = await Promise.all([
                    apiClient.get<ChatRoom[]>('/chat/rooms'), 
                    apiClient.get<{users: ChatUser[]}>('/users/search')
                ]);
                setRooms(fetchedRooms);
                setAvailableUsers(usersRes.users ? usersRes.users.filter((u: any) => u.id !== user.id) : []);
            } catch (err) { console.error('Failed to load initial data:', err); }
            finally { setIsLoading(false); }
        };
        load();

        return () => { socket.disconnect(); socketRef.current = null; };
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (!activeRoomId || !isAuthenticated) return;
        let active = true;
        const load = async () => {
            setMessagesLoading(true);
            // Reset feature states when switching rooms
            setReplyingTo(null); setEditingMessageId(null); setChatSearchOpen(false);
            setShowEmojiPicker(false); setShowReactionPicker(null); setForwardingMessage(null);
            setContextMenu(null); setLinkPreviews(new Map());
            try {
                const res = await apiClient.get<{ messages: Message[]; hasMore: boolean; nextCursor: string | null }>(`/chat/rooms/${activeRoomId}/messages`);
                if (active) {
                    setMessages(res.messages);
                    setHasMoreMessages(res.hasMore);
                    setMessageCursor(res.nextCursor);
                    isNearBottomRef.current = true;
                }
                await apiClient.post(`/chat/rooms/${activeRoomId}/read`, {});
                setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, unreadCount: 0 } : r));
            } catch (err) { console.error('Failed to load messages:', err); }
            finally { if (active) setMessagesLoading(false); }
        };
        socketRef.current?.emit('join_room', activeRoomId);
        load();
        return () => { active = false; };
    }, [activeRoomId, isAuthenticated]);

    // Live search for available users from server
    useEffect(() => {
        if (!isAuthenticated || !user) return;
        const timeout = setTimeout(async () => {
            try {
                const q = userSearchQuery.trim();
                const fetchedUsers = await apiClient.get<{users: ChatUser[]}>(`/users/search${q ? `?q=${encodeURIComponent(q)}` : ''}`);
                if (fetchedUsers && fetchedUsers.users) {
                    setAvailableUsers(fetchedUsers.users.filter((u: any) => u.id !== user.id));
                }
            } catch (err) { console.error('Failed to search users:', err); }
        }, 300);
        return () => clearTimeout(timeout);
    }, [userSearchQuery, isAuthenticated, user]);

    // ─── FILE UPLOAD HELPERS ───
    const getFileType = useCallback((file: File): string => {
        if (file.type.startsWith('image/')) return 'IMAGE';
        if (file.type.startsWith('video/')) return 'VIDEO';
        if (file.type.startsWith('audio/')) return 'AUDIO';
        return 'DOCUMENT';
    }, []);

    const getFileIcon = useCallback((type: string) => {
        switch (type) {
            case 'IMAGE': return <ImageIcon size={16} />;
            case 'VIDEO': return <Video size={16} />;
            case 'AUDIO': return <Music size={16} />;
            default: return <FileText size={16} />;
        }
    }, []);

    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }, []);

    const handleFileSelect = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;
        const newFiles: PendingFile[] = Array.from(files).map(file => ({
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            type: getFileType(file),
            uploading: false,
            uploaded: false,
        }));
        setPendingFiles(prev => [...prev, ...newFiles]);
        setShowAttachMenu(false);
    }, [getFileType]);

    const removePendingFile = useCallback((index: number) => {
        setPendingFiles(prev => {
            const file = prev[index];
            if (file.preview) URL.revokeObjectURL(file.preview);
            return prev.filter((_, i) => i !== index);
        });
    }, []);

    const uploadPendingFiles = useCallback(async (): Promise<MessageAttachment[]> => {
        const attachments: MessageAttachment[] = [];
        setIsUploadingFiles(true);

        for (let i = 0; i < pendingFiles.length; i++) {
            const pf = pendingFiles[i];
            if (pf.uploaded && pf.url) {
                attachments.push({ url: pf.url, type: pf.type, name: pf.file.name, size: pf.file.size });
                continue;
            }

            setPendingFiles(prev => prev.map((f, idx) => idx === i ? { ...f, uploading: true } : f));

            try {
                const fileExt = pf.file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `chat/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, pf.file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                attachments.push({ url: publicUrl, type: pf.type, name: pf.file.name, size: pf.file.size });
                setPendingFiles(prev => prev.map((f, idx) => idx === i ? { ...f, uploading: false, uploaded: true, url: publicUrl } : f));
            } catch (err) {
                console.error('File upload failed:', err);
                setPendingFiles(prev => prev.map((f, idx) => idx === i ? { ...f, uploading: false } : f));
            }
        }

        setIsUploadingFiles(false);
        return attachments;
    }, [pendingFiles]);

    const handleInputDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setInputDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    const handleSendMessage = useCallback(async () => {
        const hasText = messageInput.trim().length > 0;
        const hasFiles = pendingFiles.length > 0;
        if ((!hasText && !hasFiles) || !activeRoomId || !user) return;

        const content = messageInput.trim();
        setMessageInput('');
        socketRef.current?.emit('typing_end', { roomId: activeRoomId, userId: user.id });

        try {
            let attachments: MessageAttachment[] = [];
            if (hasFiles) {
                attachments = await uploadPendingFiles();
            }

            const payload: any = {};
            if (content) payload.content = content;
            if (attachments.length > 0) payload.attachments = attachments;
            if (replyingTo) payload.replyToId = replyingTo.id;

            const msg = await apiClient.post<Message & { chatRoomId: string }>(`/chat/rooms/${activeRoomId}/messages`, payload);
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
            socketRef.current?.emit('send_message', { roomId: activeRoomId, message: msg });
            setRooms(prev => sortRooms(prev.map(r => r.id === activeRoomId ? { ...r, updatedAt: msg.createdAt, messages: [msg] } : r)));

            pendingFiles.forEach(pf => { if (pf.preview) URL.revokeObjectURL(pf.preview); });
            setPendingFiles([]);
            setReplyingTo(null);
        } catch (err) {
            console.error('Send failed:', err);
            if (content) setMessageInput(content);
        }
    }, [messageInput, activeRoomId, user, pendingFiles, uploadPendingFiles, replyingTo]);

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        if (!activeRoomId) return;
        try {
            await apiClient.delete(`/chat/rooms/${activeRoomId}/messages/${messageId}`);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true, content: null } : m));
            socketRef.current?.emit('message_deleted', { roomId: activeRoomId, messageId });
        } catch (err) { console.error('Delete failed:', err); }
    }, [activeRoomId]);

    // ─── NEW FEATURE HANDLERS ───

    const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
        if (!activeRoomId || !newContent.trim()) return;
        try {
            const updated = await apiClient.patch<Message & { chatRoomId: string }>(`/chat/rooms/${activeRoomId}/messages/${messageId}`, { content: newContent.trim() });
            setMessages(prev => prev.map(m => m.id === messageId ? { ...updated } : m));
            socketRef.current?.emit('message_edited', { roomId: activeRoomId, message: updated });
            setEditingMessageId(null); setEditContent('');
        } catch (err) { console.error('Edit failed:', err); }
    }, [activeRoomId]);

    const handleReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!activeRoomId) return;
        try {
            const res = await apiClient.post<{ reactions: MessageReaction[]; messageId: string }>(`/chat/rooms/${activeRoomId}/messages/${messageId}/reactions`, { emoji });
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: res.reactions } : m));
            socketRef.current?.emit('reaction_updated', { roomId: activeRoomId, messageId, reactions: res.reactions });
            setShowReactionPicker(null);
        } catch (err) { console.error('Reaction failed:', err); }
    }, [activeRoomId]);

    const handleForwardMessage = useCallback(async (msg: Message, targetRoomId: string) => {
        try {
            const payload: any = {
                content: msg.content,
                isForwarded: true,
                forwardedFromId: msg.id,
            };
            if (msg.attachments?.length > 0) {
                payload.attachments = msg.attachments.map(a => ({ url: a.url, type: a.type, name: a.name, size: a.size }));
            }
            const fwd = await apiClient.post<Message & { chatRoomId: string }>(`/chat/rooms/${targetRoomId}/messages`, payload);
            socketRef.current?.emit('message_forwarded', { roomId: targetRoomId, message: fwd });
            setForwardingMessage(null);
        } catch (err) { console.error('Forward failed:', err); }
    }, []);

    const handleChatSearch = useCallback(async (query: string) => {
        if (!activeRoomId || query.trim().length < 2) { setChatSearchResults([]); return; }
        try {
            const res = await apiClient.get<{ results: Message[] }>(`/chat/rooms/${activeRoomId}/messages/search?q=${encodeURIComponent(query)}`);
            setChatSearchResults(res.results);
            setChatSearchIdx(0);
            // Scroll to first result
            if (res.results.length > 0) {
                scrollToMessage(res.results[0].id);
            }
        } catch (err) { console.error('Search failed:', err); }
    }, [activeRoomId]);

    // Scroll to and highlight a specific message
    const scrollToMessage = useCallback((msgId: string) => {
        setHighlightedMsgId(msgId);
        setTimeout(() => {
            const el = document.getElementById(`msg-${msgId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
        // Remove highlight after 2s
        setTimeout(() => setHighlightedMsgId(null), 2500);
    }, []);

    const handlePinToggle = useCallback(async () => {
        if (!activeRoomId) return;
        const room = rooms.find(r => r.id === activeRoomId);
        const newVal = !(room?.isPinned || false);
        try {
            await apiClient.patch(`/chat/rooms/${activeRoomId}/settings`, { isPinned: newVal });
            setRooms(prev => sortRooms(prev.map(r => r.id === activeRoomId ? { ...r, isPinned: newVal } : r)));
        } catch (err) { console.error('Pin toggle failed:', err); }
    }, [activeRoomId, rooms]);

    const handleMuteToggle = useCallback(async () => {
        if (!activeRoomId) return;
        const room = rooms.find(r => r.id === activeRoomId);
        const newVal = !(room?.isMuted || false);
        try {
            await apiClient.patch(`/chat/rooms/${activeRoomId}/settings`, { isMuted: newVal });
            setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, isMuted: newVal } : r));
        } catch (err) { console.error('Mute toggle failed:', err); }
    }, [activeRoomId, rooms]);

    // ─── RENTAL FEATURE HANDLERS ───

    const searchListings = useCallback(async (query: string) => {
        setListingSearchLoading(true);
        try {
            const res = await apiClient.get<{ listings: ListingShareData[] }>(`/listings${query ? `?search=${encodeURIComponent(query)}` : ''}`);
            setListingSearchResults(res.listings || []);
        } catch (err) { 
            console.error('Listing search failed:', err);
            setListingSearchResults([]);
        }
        finally { setListingSearchLoading(false); }
    }, []);

    const handleShareListing = useCallback(async (listing: ListingShareData) => {
        if (!activeRoomId || !user) return;
        try {
            const imageUrl = listing.media?.[0]?.url || listing.images?.[0] || '';
            const listingMeta = JSON.stringify({
                listingId: listing.id,
                title: listing.title,
                price: listing.price,
                priceUnit: listing.priceUnit || 'DAY',
                category: listing.category || '',
                location: listing.location || '',
                rating: listing.rating || 0,
                image: imageUrl,
                ownerName: listing.owner?.firstName || '',
            });
            
            const payload: any = {
                content: `📦 Shared a listing: ${listing.title}`,
                attachments: [{
                    url: imageUrl,
                    type: 'LISTING_SHARE',
                    name: listingMeta,
                    size: listing.price,
                }]
            };

            const msg = await apiClient.post<Message & { chatRoomId: string }>(`/chat/rooms/${activeRoomId}/messages`, payload);
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
            socketRef.current?.emit('send_message', { roomId: activeRoomId, message: msg });
            setRooms(prev => sortRooms(prev.map(r => r.id === activeRoomId ? { ...r, updatedAt: msg.createdAt, messages: [msg] } : r)));
            setShowListingSearch(false);
            setListingSearchQuery('');
        } catch (err) { console.error('Share listing failed:', err); }
    }, [activeRoomId, user, sortRooms]);

    const handleRequestBooking = useCallback(async () => {
        if (!showBookingModal || !bookingDates.start || !bookingDates.end || !activeRoomId || !user) return;
        setBookingLoading(true);
        try {
            const start = new Date(bookingDates.start);
            const end = new Date(bookingDates.end);
            const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
            const totalPrice = days * showBookingModal.price;

            await apiClient.post('/bookings', {
                listingId: showBookingModal.listingId,
                startDate: bookingDates.start,
                endDate: bookingDates.end,
                totalPrice,
            });

            // Send a system-like message about the booking request
            const payload = {
                content: `📋 Booking requested for "${showBookingModal.title}"\n📅 ${start.toLocaleDateString()} → ${end.toLocaleDateString()}\n💰 $${totalPrice.toFixed(2)} (${days} day${days > 1 ? 's' : ''})`,
            };
            const msg = await apiClient.post<Message & { chatRoomId: string }>(`/chat/rooms/${activeRoomId}/messages`, payload);
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
            socketRef.current?.emit('send_message', { roomId: activeRoomId, message: msg });
            setRooms(prev => sortRooms(prev.map(r => r.id === activeRoomId ? { ...r, updatedAt: msg.createdAt, messages: [msg] } : r)));

            setShowBookingModal(null);
            setBookingDates({ start: '', end: '' });
        } catch (err) { console.error('Booking request failed:', err); }
        finally { setBookingLoading(false); }
    }, [showBookingModal, bookingDates, activeRoomId, user, sortRooms]);

    const loadOlderMessages = useCallback(async () => {
        if (!activeRoomId || !hasMoreMessages || loadingOlder || !messageCursor) return;
        setLoadingOlder(true);
        try {
            const el = messagesContainerRef.current;
            const prevHeight = el?.scrollHeight || 0;
            const res = await apiClient.get<{ messages: Message[]; hasMore: boolean; nextCursor: string | null }>(`/chat/rooms/${activeRoomId}/messages?cursor=${messageCursor}`);
            setMessages(prev => [...res.messages, ...prev]);
            setHasMoreMessages(res.hasMore);
            setMessageCursor(res.nextCursor);
            // Maintain scroll position after prepending
            requestAnimationFrame(() => {
                if (el) el.scrollTop = el.scrollHeight - prevHeight;
            });
        } catch (err) { console.error('Load older failed:', err); }
        finally { setLoadingOlder(false); }
    }, [activeRoomId, hasMoreMessages, loadingOlder, messageCursor]);

    const fetchLinkPreview = useCallback(async (url: string) => {
        if (linkPreviews.has(url)) return;
        try {
            const data = await apiClient.get<LinkPreviewData>(`/chat/link-preview?url=${encodeURIComponent(url)}`);
            setLinkPreviews(prev => new Map(prev).set(url, data));
        } catch { /* silently fail */ }
    }, [linkPreviews]);

    const openLightbox = useCallback((images: { url: string; name?: string }[], startIdx: number) => {
        setLightboxImages(images);
        setLightboxIndex(startIdx);
        setShowLightbox(true);
    }, []);

    const getLastSeen = useCallback((dateStr?: string) => {
        if (!dateStr) return 'Offline';
        const d = new Date(dateStr);
        const mins = Math.floor((Date.now() - d.getTime()) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }, []);

    const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

    const handleTyping = useCallback(() => {
        if (!activeRoomId || !user) return;
        socketRef.current?.emit('typing_start', { roomId: activeRoomId, userId: user.id, name: user.firstName });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit('typing_end', { roomId: activeRoomId, userId: user.id });
        }, 2000);
    }, [activeRoomId, user]);

    const startDirectMessage = useCallback(async (targetUserId: string) => {
        try {
            const room = await apiClient.post<ChatRoom>('/chat/direct', { targetUserId });
            setRooms(prev => {
                const exists = prev.find(r => r.id === room.id);
                if (exists) return prev;
                return [room, ...prev];
            });
            setActiveRoomId(room.id);
            socketRef.current?.emit('join_room', room.id);
            setSearchQuery('');
            if (isMobile) setMobileView('chat');
            return room;
        } catch (err) { 
            console.error('Failed to start chat:', err); 
            return null;
        }
    }, [isMobile]);

    const getTargetUser = useCallback((room: ChatRoom) => {
        if (!user) return null;
        return room.members.find(m => m.user.id !== user.id)?.user || null;
    }, [user]);

    const isUserOnline = useCallback((userId: string) => onlineUserIds.has(userId), [onlineUserIds]);

    const getDateLabel = useCallback((dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 86400000 && d.getDate() === now.getDate()) return 'Today';
        if (diff < 172800000) return 'Yesterday';
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }, []);

    const activeRoom = useMemo(() => rooms.find(r => r.id === activeRoomId), [rooms, activeRoomId]);
    const targetUser = useMemo(() => activeRoom ? getTargetUser(activeRoom) : null, [activeRoom, getTargetUser]);
    const typingName = activeRoomId ? typingUsers.get(activeRoomId) : null;
    const targetOnline = targetUser ? isUserOnline(targetUser.id) : false;

    const filteredRooms = useMemo(() => searchQuery.trim()
        ? rooms.filter(r => {
            const t = getTargetUser(r);
            return t && `${t.firstName} ${t.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
        })
        : rooms, [rooms, searchQuery, getTargetUser]);

    const filteredUsers = useMemo(() => {
        // This is only used in messages sidebar - shows non-chatted users when searching
        if (!searchQuery.trim()) return [];
        return availableUsers.filter(u => {
            const inRoom = rooms.some(r => r.members.some(m => m.user.id === u.id));
            return !inRoom && `${u.firstName} ${u.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [availableUsers, rooms, searchQuery]);

    // All users search (for the Search tab)
    // Server-side filtering handles the search now, returning exact matches for name and email
    const allUsersFiltered = availableUsers;

    const messagesWithDates = useMemo(() => {
        let lastDate = '';
        return messages.map(msg => {
            const dateLabel = getDateLabel(msg.createdAt);
            const showDate = dateLabel !== lastDate;
            if (showDate) lastDate = dateLabel;
            return { msg, dateLabel, showDate };
        });
    }, [messages, getDateLabel]);

    // Group messages by time for centered timestamps
    const getTimeLabel = useCallback((dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, []);

    if (!isMounted) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
            <div className="text-white/40 text-sm">Loading...</div>
        </div>
    );

    if (!user || !isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg-main)' }}>
                <p className="mb-4 text-white/60">Please log in to view messages.</p>
                <Link href="/login" className="px-6 py-2.5 bg-[#8B5CF6] rounded-full text-white font-medium hover:bg-[#d80032] transition-colors">Go to Login</Link>
            </div>
        );
    }

    // ─── ICON NAV RAIL ───
    const navRail = (
        <div className="w-[60px] flex-shrink-0 flex flex-col items-center py-6 gap-1" style={{ background: 'var(--bg-nav)' }}>
            <Link href="/" className="p-3 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all mb-2">
                <Home size={20} />
            </Link>
            {/* Search all users icon */}
            <button onClick={() => { setSidebarMode('search'); setUserSearchQuery(''); }}
                className={`relative p-3 rounded-2xl transition-all ${sidebarMode === 'search' ? 'bg-[#8B5CF6]/20 text-[#A855F7]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                <Search size={20} />
                {sidebarMode === 'search' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#8B5CF6]" />}
            </button>
            {/* Messages (chatted users) icon */}
            <button onClick={() => { setSidebarMode('messages'); setSearchQuery(''); }}
                className={`relative p-3 rounded-2xl transition-all my-1 ${sidebarMode === 'messages' ? 'bg-[#8B5CF6]/20 text-[#A855F7]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                <MessageSquare size={20} />
                {sidebarMode === 'messages' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#8B5CF6]" />}
            </button>
            
            <button onClick={() => setThemeMode(themeMode === 'dark' ? 'dim' : 'dark')} className="p-3 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all" title="Toggle Theme">
                {themeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-3 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                <Settings size={20} />
            </button>
            <button className="p-3 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                <Info size={20} />
            </button>
            <div className="flex-1" />
            <Link href="/" className="p-3 rounded-2xl text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all">
                <LogOut size={18} />
            </Link>
        </div>
    );

    // ─── SIDEBAR ───
    const sidebarContent = sidebarMode === 'messages' ? (
        // ═══ MESSAGES MODE: search only existing chats ═══
        <div className="flex flex-col h-full" style={{ background: 'var(--bg-sidebar)' }}>
            <div className="p-5 pb-3 flex-shrink-0">
                <div className="mb-1">
                    <h2 className="text-[17px] font-bold text-white tracking-tight">Messages</h2>
                    {user && <p className="text-[11px] text-white/30 mt-0.5">{user.email}</p>}
                </div>
                <div className="relative mt-4">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                    <input type="text" placeholder="Search conversations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full text-[13px] rounded-2xl pl-10 pr-10 py-3 outline-none bg-[#1E293B]/60 text-white border border-white/[0.06] focus:border-[#8B5CF6]/40 placeholder:text-white/25 transition-all"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors">
                        {searchQuery ? <X size={14} onClick={() => setSearchQuery('')} /> : <SlidersHorizontal size={14} />}
                    </button>
                </div>
            </div>

            <div className="px-5 pt-2 pb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-white/80">Direct Message</h3>
                <button className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/50 transition-colors">
                    Newest <ChevronDown size={12} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5" data-lenis-prevent="true">
                {isLoading ? (
                    <div className="p-6 text-center text-[13px] text-white/30">Loading chats...</div>
                ) : filteredRooms.length === 0 ? (
                    <div className="p-8 text-center">
                        <MessageSquare size={36} className="mx-auto mb-3 text-white/10" />
                        <p className="text-[13px] text-white/30">{searchQuery ? 'No conversations found.' : 'No conversations yet.'}</p>
                        <p className="text-[11px] text-white/20 mt-1">Click the <Search size={10} className="inline" /> icon to find users!</p>
                    </div>
                ) : filteredRooms.map(room => {
                    const t = getTargetUser(room);
                    if (!t) return null;
                    const lastMsg = room.messages?.[0];
                    const preview = lastMsg?.isDeleted ? '🚫 Message deleted' : (lastMsg?.content || (lastMsg?.attachments?.length ? (lastMsg.attachments[0]?.type === 'IMAGE' ? '📷 Photo' : lastMsg.attachments[0]?.type === 'VIDEO' ? '📹 Video' : lastMsg.attachments[0]?.type === 'AUDIO' ? '🎵 Audio' : '📎 File') : 'Start chatting...'));
                    const isActive = activeRoomId === room.id;
                    const online = isUserOnline(t.id);
                    return (
                        <motion.button key={room.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.5 }}
                            whileHover={{ scale: 1.02, rotateX: 5, rotateY: -5, zIndex: 10, boxShadow: '0 10px 30px rgba(139, 92, 246, 0.2)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setActiveRoomId(room.id); if (isMobile) setMobileView('chat'); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-colors group ${isActive
                                ? 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 shadow-[0_0_20px_rgba(139, 92, 246, 0.1)]'
                                : 'hover:bg-white/[0.02] border border-transparent'
                            }`}>
                            <div className="relative flex-shrink-0">
                                <div className="w-[44px] h-[44px] rounded-full overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#D946EF] flex items-center justify-center ring-2 ring-white/5">
                                    {t.avatar ? <img src={t.avatar} alt="" className="w-full h-full object-cover" /> :
                                        <span className="text-[14px] font-bold text-white">{t.firstName?.charAt(0)}</span>}
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] rounded-full ${online ? 'bg-[#34D399] border-[#0F172A]' : 'bg-gray-500/50 border-[#0F172A]'}`} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <p className={`text-[13px] font-semibold truncate ${isActive ? 'text-white' : 'text-white/80'}`}>{t.firstName} {t.lastName || ''}</p>
                                    <span className="text-[10px] whitespace-nowrap ml-2 text-white/25">
                                        {new Date(room.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] truncate flex-1 text-white/35">{preview}</p>
                                    {room.unreadCount > 0 ? (
                                        <span className="ml-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#34D399] text-[#0B0F19] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                                        </span>
                                    ) : online ? (
                                        <div className="ml-2 w-2.5 h-2.5 rounded-full bg-[#34D399] flex-shrink-0" />
                                    ) : null}
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    ) : (
        // ═══ SEARCH MODE: find ALL logged-in users to start new chats ═══
        <div className="flex flex-col h-full" style={{ background: 'var(--bg-sidebar)' }}>
            <div className="p-5 pb-3 flex-shrink-0">
                <div className="mb-1">
                    <h2 className="text-[17px] font-bold text-white tracking-tight">Find Users</h2>
                    <p className="text-[11px] text-white/30 mt-0.5">Search all users to start a conversation</p>
                </div>
                <div className="relative mt-4">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                    <input type="text" placeholder="Search users..." value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)}
                        className="w-full text-[13px] rounded-2xl pl-10 pr-10 py-3 outline-none bg-[#1E293B]/60 text-white border border-white/[0.06] focus:border-[#8B5CF6]/40 placeholder:text-white/25 transition-all"
                    />
                    {userSearchQuery && (
                        <button onClick={() => setUserSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-5 pt-1 pb-2">
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#8B5CF6]/60">
                    {allUsersFiltered.length} user{allUsersFiltered.length !== 1 ? 's' : ''} found
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 min-h-0" data-lenis-prevent="true">
                {allUsersFiltered.length === 0 ? (
                    <div className="p-8 text-center">
                        <Search size={36} className="mx-auto mb-3 text-white/10" />
                        <p className="text-[13px] text-white/30">No users found.</p>
                    </div>
                ) : allUsersFiltered.map(u => {
                    const online = isUserOnline(u.id);
                    const alreadyChatting = rooms.some(r => r.members.some(m => m.user.id === u.id));
                    return (
                        <button key={u.id}
                            onClick={async (e) => { 
                                const btn = e.currentTarget;
                                btn.disabled = true;
                                btn.classList.add('opacity-50');
                                const room = await startDirectMessage(u.id); 
                                if (room) setSidebarMode('messages'); 
                                btn.disabled = false;
                                btn.classList.remove('opacity-50');
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.03] border border-transparent transition-all group disabled:cursor-not-allowed">
                            <div className="relative flex-shrink-0">
                                <div className="w-[44px] h-[44px] rounded-full overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#D946EF] flex items-center justify-center ring-2 ring-white/5">
                                    {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> :
                                        <span className="text-[14px] font-bold text-white">{u.firstName?.charAt(0)}</span>}
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] rounded-full ${online ? 'bg-[#34D399] border-[#0F172A]' : 'bg-gray-500/50 border-[#0F172A]'}`} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-[13px] font-semibold text-white/80 truncate">{u.firstName} {u.lastName || ''}</p>
                                <p className="text-[11px] text-white/30">
                                    {online ? <span className="text-[#34D399]">● Online</span> : 'Offline'}
                                    {alreadyChatting && <span className="ml-2 text-[#8B5CF6]/60">• Already chatting</span>}
                                </p>
                            </div>
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-9 h-9 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
                                    <MessageSquare size={14} className="text-[#8B5CF6]" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // ─── CHAT AREA ───
    const chatContent = activeRoomId && targetUser ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative min-h-0" style={{ background: 'var(--bg-chat)' }}>
            <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-40" />
            {/* Header */}
            <div className="h-[72px] flex-shrink-0 flex items-center justify-between px-5 border-b border-white/[0.04]" style={{ background: 'var(--bg-header)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-3.5">
                    {isMobile && (
                        <button onClick={() => setMobileView('list')} className="p-2 rounded-xl hover:bg-white/5 text-white/50 transition-all mr-1">
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div className="relative">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#D946EF] flex items-center justify-center ring-2 ring-white/10">
                            {targetUser.avatar ? <img src={targetUser.avatar} alt="" className="w-full h-full object-cover" /> :
                                <span className="text-[14px] font-bold text-white">{targetUser.firstName?.charAt(0)}</span>}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full ${targetOnline ? 'bg-[#34D399] border-[#0B0F19]' : 'bg-gray-500 border-[#0B0F19]'}`} />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-bold text-white">{targetUser.firstName} {targetUser.lastName || ''}</h2>
                        <p className="text-[11px]">
                            {typingName
                                ? <span className="text-[#34D399]">typing...</span>
                                : targetOnline
                                    ? <span className="text-[#34D399]">Online</span>
                                    : <span className="text-white/30">Last seen {getLastSeen(targetUser.lastSeenAt)}</span>
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => { setChatSearchOpen(!chatSearchOpen); setChatSearchQuery(''); setChatSearchResults([]); }}
                        className={`p-2.5 rounded-xl transition-all ${chatSearchOpen ? 'bg-[#8B5CF6]/20 text-[#A855F7]' : 'hover:bg-white/5 text-white/40 hover:text-white/70'}`}>
                        <SearchIcon size={16} />
                    </button>
                    <CallButtons
                        targetUserId={targetUser.id}
                        targetName={`${targetUser.firstName} ${targetUser.lastName || ''}`}
                        targetAvatar={targetUser.avatar}
                        roomId={activeRoomId!}
                    />
                    <button onClick={handlePinToggle} className={`p-2.5 rounded-xl transition-all ${rooms.find(r => r.id === activeRoomId)?.isPinned ? 'bg-[#34D399]/10 text-[#34D399]' : 'hover:bg-white/5 text-white/40 hover:text-white/70'}`}
                        title={rooms.find(r => r.id === activeRoomId)?.isPinned ? 'Unpin' : 'Pin'}>
                        {rooms.find(r => r.id === activeRoomId)?.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                    <button onClick={handleMuteToggle} className={`p-2.5 rounded-xl transition-all ${rooms.find(r => r.id === activeRoomId)?.isMuted ? 'bg-yellow-500/10 text-yellow-400' : 'hover:bg-white/5 text-white/40 hover:text-white/70'}`}
                        title={rooms.find(r => r.id === activeRoomId)?.isMuted ? 'Unmute' : 'Mute'}>
                        {rooms.find(r => r.id === activeRoomId)?.isMuted ? <BellOff size={16} /> : <Bell size={16} />}
                    </button>
                    <button onClick={() => setShowDetailsPanel(!showDetailsPanel)} className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            {/* In-Chat Search Bar */}
            {chatSearchOpen && (
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04]" style={{ background: 'var(--bg-sidebar)' }}>
                    <Search size={14} className="text-white/30 flex-shrink-0" />
                    <input type="text" value={chatSearchQuery} placeholder="Search in conversation..."
                        onChange={(e) => { setChatSearchQuery(e.target.value); handleChatSearch(e.target.value); }}
                        className="flex-1 text-[12px] bg-transparent outline-none text-white placeholder:text-white/25" autoFocus />
                    {chatSearchResults.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-white/30">{chatSearchIdx + 1}/{chatSearchResults.length}</span>
                            <button onClick={() => { const newIdx = Math.max(0, chatSearchIdx - 1); setChatSearchIdx(newIdx); scrollToMessage(chatSearchResults[newIdx].id); }} className="p-1 rounded hover:bg-white/5 text-white/40"><ChevronUp size={14} /></button>
                            <button onClick={() => { const newIdx = Math.min(chatSearchResults.length - 1, chatSearchIdx + 1); setChatSearchIdx(newIdx); scrollToMessage(chatSearchResults[newIdx].id); }} className="p-1 rounded hover:bg-white/5 text-white/40"><ChevronDown size={14} /></button>
                        </div>
                    )}
                    <button onClick={() => { setChatSearchOpen(false); setChatSearchQuery(''); setChatSearchResults([]); }} className="p-1 rounded hover:bg-white/5 text-white/40"><X size={14} /></button>
                </div>
            )}

            {/* Messages */}
            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1.5 relative min-h-0 touch-pan-y" style={{ overscrollBehavior: 'contain' }} data-lenis-prevent="true">
                {messagesLoading ? (
                    <div className="flex-1 flex items-center justify-center"><span className="text-[13px] text-white/25">Loading messages...</span></div>
                ) : messages.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center">
                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="w-16 h-16 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center mb-4">
                            <MessageSquare size={28} className="text-[#8B5CF6]/40" />
                        </motion.div>
                        <p className="text-[13px] text-white/30">No messages yet. Say hello! 👋</p>
                    </motion.div>
                ) : (<>
                    {/* Load Older */}
                    {hasMoreMessages && (
                        <div className="flex justify-center py-3">
                            <button onClick={loadOlderMessages} disabled={loadingOlder}
                                className="px-5 py-2 rounded-full text-[11px] font-medium text-white/40 hover:text-white/60 transition-all"
                                style={{ background: 'var(--bg-icon-bg)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                {loadingOlder ? <Loader2 size={14} className="animate-spin" /> : 'Load older messages'}
                            </button>
                        </div>
                    )}
                    {messagesWithDates.map(({ msg, dateLabel, showDate }, idx) => {
                    const isMe = msg.sender.id === user.id;
                    const timeStr = getTimeLabel(msg.createdAt);
                    // Show time label if first msg or gap > 5 min from previous
                    const prevMsg = idx > 0 ? messagesWithDates[idx - 1].msg : null;
                    const showTime = !prevMsg || (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 300000);
                    const isHighlighted = highlightedMsgId === msg.id;

                    return (
                        <div key={msg.id || idx}
                            id={`msg-${msg.id}`}
                            className={`relative mb-2 ${isHighlighted ? 'ring-2 ring-[#8B5CF6]/50 rounded-2xl bg-[#8B5CF6]/5 transition-all duration-500' : ''}`}
                            onContextMenu={(e) => handleMessageContextMenu(e, msg.id)}
                        >
                            {showDate && (
                                <div className="flex justify-center my-4">
                                    <span className="px-5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide text-white/40" style={{ background: 'var(--bg-icon-bg)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        {dateLabel}
                                    </span>
                                </div>
                            )}
                            {showTime && (
                                <div className="flex justify-center my-2">
                                    <span className="text-[10px] text-white/20">{timeStr}</span>
                                </div>
                            )}
                            <div className={`flex items-end gap-2.5 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {msg.isDeleted ? (
                                    <div className={`px-5 py-3 rounded-[20px] text-[13px] italic text-white/20 max-w-[70%] ${isMe ? 'rounded-br-md' : 'rounded-bl-md'}`}
                                        style={{ background: 'var(--bg-icon-bg)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        Message deleted
                                    </div>
                                ) : (
                                    <>
                                        {/* Action toolbar (hover) */}
                                        {isMe && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 self-center">
                                                <button onClick={() => { setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id); }} className="p-1.5 rounded-lg hover:bg-white/5" title="React"><Smile size={12} className="text-white/30" /></button>
                                                <button onClick={() => { setReplyingTo(msg); }} className="p-1.5 rounded-lg hover:bg-white/5" title="Reply"><Reply size={12} className="text-white/30" /></button>
                                                <button onClick={() => { setEditingMessageId(msg.id); setEditContent(msg.content || ''); }} className="p-1.5 rounded-lg hover:bg-white/5" title="Edit"><Pencil size={12} className="text-white/30" /></button>
                                                <button onClick={() => setForwardingMessage(msg)} className="p-1.5 rounded-lg hover:bg-white/5" title="Forward"><Forward size={12} className="text-white/30" /></button>
                                                <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 rounded-lg hover:bg-red-500/10" title="Delete"><Trash2 size={12} className="text-red-400/60" /></button>
                                            </div>
                                        )}

                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                            {/* Forwarded label */}
                                            {msg.isForwarded && (
                                                <div className="flex items-center gap-1 mb-1 text-[10px] text-white/25"><CornerUpRight size={10} /> Forwarded</div>
                                            )}
                                            {/* Reply-to quote */}
                                            {msg.replyTo && (
                                                <div className={`px-3 py-1.5 mb-1 rounded-lg text-[11px] border-l-2 ${isMe ? 'border-[#34D399]/50 bg-[#34D399]/5' : 'border-[#8B5CF6]/50 bg-[#8B5CF6]/5'}`}>
                                                    <span className={`font-semibold ${isMe ? 'text-[#34D399]/60' : 'text-[#A855F7]/60'}`}>{msg.replyTo.sender?.firstName}</span>
                                                    <p className="text-white/30 truncate max-w-[200px]">{msg.replyTo.isDeleted ? 'Deleted message' : (msg.replyTo.content || '📎 Attachment')}</p>
                                                </div>
                                            )}
                                            {/* Attachments */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className={`flex flex-col gap-1.5 mb-1 ${msg.attachments.length > 1 ? 'w-full' : ''}`}>
                                                    {msg.attachments.map((att, ai) => (
                                                        <div key={ai}>
                                                            {att.type === 'LISTING_SHARE' ? (() => {
                                                                let meta: any = {};
                                                                try { meta = JSON.parse(att.name || '{}'); } catch {}
                                                                return (
                                                                    <div className={`rounded-[16px] ${isMe ? 'rounded-br-md' : 'rounded-bl-md'} overflow-hidden max-w-[300px] min-w-[260px]`}
                                                                        style={{ background: isMe ? 'rgba(52, 211, 153, 0.08)' : 'rgba(30, 41, 59, 0.9)', border: `1px solid ${isMe ? 'rgba(52, 211, 153, 0.2)' : 'rgba(139, 92, 246, 0.2)'}` }}>
                                                                        {meta.image && (
                                                                            <div className="relative h-[140px] overflow-hidden">
                                                                                <img src={meta.image} alt={meta.title} className="w-full h-full object-cover" loading="lazy" />
                                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                                                {meta.category && (
                                                                                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#8B5CF6]/80 text-white">
                                                                                        {meta.category}
                                                                                    </span>
                                                                                )}
                                                                                {meta.rating > 0 && (
                                                                                    <span className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-black/50 text-yellow-400">
                                                                                        <Star size={10} className="fill-yellow-400" /> {meta.rating.toFixed(1)}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        <div className="p-3">
                                                                            <h4 className="text-[13px] font-bold text-white truncate">{meta.title || 'Listing'}</h4>
                                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                                <span className="text-[14px] font-bold text-[#34D399]">
                                                                                    ${meta.price?.toFixed(0) || '0'}<span className="text-[10px] text-white/30 font-normal">/{(meta.priceUnit || 'DAY').toLowerCase()}</span>
                                                                                </span>
                                                                                {meta.location && (
                                                                                    <span className="flex items-center gap-0.5 text-[10px] text-white/30">
                                                                                        <MapPin size={9} /> {meta.location}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-2.5">
                                                                                <Link href={`/listings/${meta.listingId}`} 
                                                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold bg-[#8B5CF6]/15 text-[#A855F7] hover:bg-[#8B5CF6]/25 transition-colors">
                                                                                    <ExternalLink size={11} /> View Listing
                                                                                </Link>
                                                                                {!isMe && (
                                                                                    <button onClick={() => setShowBookingModal({ listingId: meta.listingId, title: meta.title, price: meta.price, priceUnit: meta.priceUnit })}
                                                                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold bg-[#34D399]/15 text-[#34D399] hover:bg-[#34D399]/25 transition-colors">
                                                                                        <ShoppingBag size={11} /> Request to Rent
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })() : att.type === 'IMAGE' ? (
                                                                <div className={`rounded-[16px] ${isMe ? 'rounded-br-md' : 'rounded-bl-md'} overflow-hidden max-w-[280px] cursor-pointer relative group/img`}
                                                                    onClick={() => openLightbox(msg.attachments.filter(a => a.type === 'IMAGE').map(a => ({ url: a.url, name: a.name })), msg.attachments.filter(a => a.type === 'IMAGE').indexOf(att))}>
                                                                    <img src={att.url} alt={att.name || 'Image'} className="w-full h-auto max-h-[240px] object-cover" loading="lazy" />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                                                                        <ZoomIn size={20} className="text-white opacity-0 group-hover/img:opacity-70 transition-opacity" />
                                                                    </div>
                                                                </div>
                                                            ) : att.type === 'VIDEO' ? (
                                                                <div className={`rounded-[16px] ${isMe ? 'rounded-br-md' : 'rounded-bl-md'} overflow-hidden max-w-[280px]`}>
                                                                    <video src={att.url} controls className="w-full max-h-[240px]" preload="metadata" />
                                                                </div>
                                                            ) : att.type === 'AUDIO' ? (
                                                                <div className={`flex items-center gap-3 px-4 py-3 rounded-[16px] ${isMe ? 'rounded-br-md' : 'rounded-bl-md'} min-w-[200px]`}
                                                                    style={{ background: isMe ? 'rgba(205, 248, 118, 0.15)' : 'rgba(30, 41, 59, 0.8)', border: `1px solid ${isMe ? 'rgba(205, 248, 118, 0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                                                                    <Music size={18} className={isMe ? 'text-[#34D399] flex-shrink-0' : 'text-[#8B5CF6] flex-shrink-0'} />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[11px] font-medium text-white/80 truncate">{att.name || 'Audio file'}</p>
                                                                        {att.size && <p className="text-[9px] text-white/30">{formatFileSize(att.size)}</p>}
                                                                        <audio src={att.url} controls className="w-full h-7 mt-1" preload="metadata" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <a href={att.url} target="_blank" rel="noopener noreferrer"
                                                                    className={`flex items-center gap-3 px-4 py-3 rounded-[16px] ${isMe ? 'rounded-br-md' : 'rounded-bl-md'} min-w-[180px] hover:opacity-80 transition-opacity`}
                                                                    style={{ background: isMe ? 'rgba(52, 211, 153, 0.1)' : 'rgba(139, 92, 246, 0.1)', border: `1px solid ${isMe ? 'rgba(52, 211, 153, 0.3)' : 'rgba(139, 92, 246, 0.3)'}` }}>
                                                                    <div className={`w-10 h-10 rounded-xl ${isMe ? 'bg-[#34D399]/20' : 'bg-[#8B5CF6]/20'} flex items-center justify-center flex-shrink-0`}>
                                                                        <FileText size={18} className={isMe ? 'text-[#34D399]' : 'text-[#8B5CF6]'} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[11px] font-medium text-white/80 truncate">{att.name || 'Document'}</p>
                                                                        {att.size && <p className="text-[9px] text-white/30">{formatFileSize(att.size)}</p>}
                                                                    </div>
                                                                    <Download size={14} className="text-white/30 flex-shrink-0" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Message content or edit mode */}
                                            {editingMessageId === msg.id ? (
                                                <div className="flex items-center gap-2 w-full">
                                                    <input ref={editInputRef} value={editContent} onChange={e => setEditContent(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') handleEditMessage(msg.id, editContent); if (e.key === 'Escape') { setEditingMessageId(null); setEditContent(''); } }}
                                                        className="flex-1 px-4 py-2 rounded-[16px] text-[13px] bg-white/10 text-white outline-none border border-[#8B5CF6]/30 focus:border-[#8B5CF6]" autoFocus />
                                                    <button onClick={() => handleEditMessage(msg.id, editContent)} className="p-2 rounded-lg bg-[#8B5CF6] text-white"><Check size={14} /></button>
                                                    <button onClick={() => { setEditingMessageId(null); setEditContent(''); }} className="p-2 rounded-lg bg-white/5 text-white/40"><X size={14} /></button>
                                                </div>
                                            ) : msg.content && !(msg.attachments?.some(a => a.type === 'LISTING_SHARE')) ? (
                                                <div className={`px-5 py-3 text-[13.5px] leading-relaxed rounded-[20px] ${isMe ? 'rounded-br-md text-[#0B0F19] font-bold tracking-tight' : 'rounded-bl-md text-white/95'}`}
                                                    style={isMe ? { 
                                                        background: 'linear-gradient(135deg, #34D399 0%, #38BDF8 100%)', 
                                                        boxShadow: '0 8px 32px rgba(52, 211, 153, 0.2), inset 0 1px 1px rgba(255,255,255,0.4)',
                                                        textShadow: '0 0 1px rgba(0,0,0,0.1)'
                                                    } : { 
                                                        background: 'var(--bg-other-msg)', 
                                                        backdropFilter: 'blur(12px)',
                                                        border: '1px solid rgba(139, 92, 246, 0.2)', 
                                                        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 15px rgba(139, 92, 246, 0.05)' 
                                                    }}>
                                                    {msg.content}
                                                </div>
                                            ) : null}

                                            {/* Reactions */}
                                            {msg.reactions && msg.reactions.length > 0 && (
                                                <div className="relative z-10 flex flex-wrap gap-1.5 mt-1.5">
                                                    {Object.entries(msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([emoji, count]) => (
                                                        <button key={emoji} onClick={() => handleReaction(msg.id, emoji)}
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] leading-none transition-all whitespace-nowrap ${msg.reactions!.some(r => r.emoji === emoji && r.userId === user.id) ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 shadow-sm shadow-[#8B5CF6]/10' : 'bg-white/[0.06] border border-white/10 hover:bg-white/10'}`}>
                                                            <span className="text-[14px] leading-none">{emoji}</span>
                                                            <span className="text-white/50 font-medium text-[11px]">{count as number}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Quick reaction picker */}
                                            {showReactionPicker === msg.id && (
                                                <div ref={reactionPickerRef} className="relative z-20 flex flex-wrap gap-1.5 mt-1.5 px-3 py-2 rounded-full shadow-lg" style={{ background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
                                                    {QUICK_EMOJIS.map(e => (
                                                        <button key={e} onClick={() => handleReaction(msg.id, e)} className="hover:scale-125 active:scale-95 transition-transform text-[18px] leading-none px-0.5">{e}</button>
                                                    ))}
                                                </div>
                                            )}

                                            <span className="text-[10px] text-white/20 mt-1 flex items-center gap-1">
                                                {msg.isEdited && <span className="text-white/15 italic mr-1">edited</span>}
                                                {timeStr}
                                                {isMe && <CheckCheck size={12} className="text-[#34D399]/60" />}
                                            </span>
                                        </div>

                                        {/* Action toolbar for received messages */}
                                        {!isMe && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 self-center">
                                                <button onClick={() => { setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id); }} className="p-1.5 rounded-lg hover:bg-white/5" title="React"><Smile size={12} className="text-white/30" /></button>
                                                <button onClick={() => { setReplyingTo(msg); }} className="p-1.5 rounded-lg hover:bg-white/5" title="Reply"><Reply size={12} className="text-white/30" /></button>
                                                <button onClick={() => setForwardingMessage(msg)} className="p-1.5 rounded-lg hover:bg-white/5" title="Forward"><Forward size={12} className="text-white/30" /></button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                    })}

                    {typingName && (
                        <div className="flex items-center gap-2 mt-2">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8, y: 10, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="flex gap-1.5 px-5 py-3 rounded-[20px] rounded-bl-md" 
                                style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.0 }} className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_10px_#34D399]" />
                                <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.15 }} className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_10px_#34D399]" />
                                <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }} className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_10px_#34D399]" />
                            </motion.div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </>)}
            </div>

            {showScrollBtn && (
                <button onClick={() => scrollToBottom()}
                    className="absolute bottom-28 right-8 p-3 rounded-full shadow-xl z-20 bg-[#8B5CF6] text-white hover:bg-[#d80032] transition-colors"
                    style={{ boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)' }}>
                    <ArrowDown size={16} />
                </button>
            )}

            {/* Pending Files Preview */}
            {pendingFiles.length > 0 && (
                <div className="px-4 pt-3 pb-1 border-t border-white/[0.04]" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Paperclip size={12} className="text-white/30" />
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">{pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} attached</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {pendingFiles.map((pf, i) => (
                            <div key={i} className="relative flex-shrink-0 group">
                                {pf.type === 'IMAGE' && pf.preview ? (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                                        <img src={pf.preview} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1 px-1">
                                        {getFileIcon(pf.type)}
                                        <p className="text-[7px] text-white/40 truncate w-full text-center">{pf.file.name.split('.').pop()?.toUpperCase()}</p>
                                    </div>
                                )}
                                {pf.uploading && (
                                    <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                                        <Loader2 size={16} className="animate-spin text-[#8B5CF6]" />
                                    </div>
                                )}
                                <button onClick={() => removePendingFile(i)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-lg">
                                    <X size={10} />
                                </button>
                                <p className="text-[7px] text-white/25 mt-0.5 max-w-[64px] truncate text-center">{pf.file.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reply Preview Bar */}
            {replyingTo && (
                <div className="flex items-center gap-3 px-5 py-2.5 border-t border-white/[0.04]" style={{ background: 'var(--bg-sidebar)' }}>
                    <div className="w-1 h-8 rounded-full bg-[#8B5CF6]" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-[#A855F7]">Replying to {replyingTo.sender.firstName}</p>
                        <p className="text-[11px] text-white/30 truncate">{replyingTo.content || '📎 Attachment'}</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30"><X size={14} /></button>
                </div>
            )}

            {/* Input Bar */}
            <div
                className={`p-4 border-t border-white/[0.04] transition-colors ${inputDragOver ? 'bg-[#8B5CF6]/10' : ''}`}
                style={!inputDragOver ? { background: 'rgba(15, 23, 42, 0.4)' } : {}}
                onDragOver={(e) => { e.preventDefault(); setInputDragOver(true); }}
                onDragLeave={() => setInputDragOver(false)}
                onDrop={handleInputDrop}
            >
                {inputDragOver && (
                    <div className="flex items-center justify-center gap-2 mb-3 py-3 border-2 border-dashed border-[#8B5CF6]/40 rounded-xl">
                        <Paperclip size={16} className="text-[#8B5CF6]" />
                        <span className="text-[12px] text-[#A855F7] font-medium">Drop files to attach</span>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    {/* Attachment button with menu */}
                    <div className="relative" ref={attachMenuRef}>
                        <button
                            onClick={() => setShowAttachMenu(!showAttachMenu)}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 border border-white/[0.06] ${
                                showAttachMenu ? 'bg-[#8B5CF6]/20 text-[#A855F7]' : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {showAttachMenu ? <X size={20} /> : <Plus size={20} />}
                        </button>
                        <AnimatePresence>
                        {showAttachMenu && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="absolute bottom-14 left-0 w-52 rounded-2xl overflow-hidden shadow-2xl z-50"
                                style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
                                {[
                                    { icon: <ImageIcon size={16} />, label: 'Photo', accept: 'image/*', color: 'text-emerald-400' },
                                    { icon: <Video size={16} />, label: 'Video', accept: 'video/*', color: 'text-blue-400' },
                                    { icon: <Music size={16} />, label: 'Audio', accept: 'audio/*', color: 'text-pink-400' },
                                    { icon: <FileText size={16} />, label: 'Document', accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar', color: 'text-amber-400' },
                                    { icon: <File size={16} />, label: 'Any File', accept: '*', color: 'text-purple-400' },
                                ].map((item, i) => (
                                    <button key={i}
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = item.accept;
                                            input.multiple = true;
                                            input.onchange = (e) => handleFileSelect((e.target as HTMLInputElement).files);
                                            input.click();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left"
                                    >
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color} bg-white/5`}>
                                            {item.icon}
                                        </div>
                                        <span className="text-[13px] text-white/70 font-medium">{item.label}</span>
                                    </button>
                                ))}
                                {/* Divider */}
                                <div className="h-px bg-white/[0.06] mx-3" />
                                {/* Share Listing */}
                                <button
                                    onClick={() => { setShowAttachMenu(false); setShowListingSearch(true); searchListings(''); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[#34D399] bg-[#34D399]/10">
                                        <Package size={16} />
                                    </div>
                                    <span className="text-[13px] text-white/70 font-medium">Share Listing</span>
                                </button>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>

                    {/* Emoji button */}
                    <div className="relative" ref={emojiPickerRef}>
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-2.5 rounded-full transition-all flex-shrink-0 ${showEmojiPicker ? 'bg-[#8B5CF6]/20 text-[#A855F7]' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>
                            <Smile size={20} />
                        </button>
                        <AnimatePresence>
                        {showEmojiPicker && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8, y: 20, rotate: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 20, rotate: -5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="absolute bottom-14 left-0 sm:-left-4 z-50 rounded-2xl overflow-hidden shadow-2xl w-[280px] sm:w-[320px]"
                                style={{ background: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
                                <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5 p-3 max-h-[250px] overflow-y-auto" data-lenis-prevent="true">
                                    {['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','👍','👎','👏','🙌','🤝','❤️','🔥','⭐','🎉','💯','🙏','💪','👀','💀','🤷'].map(e => (
                                        <button key={e} onClick={() => { setMessageInput(prev => prev + e); setShowEmojiPicker(false); }}
                                            className="w-full aspect-square flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-[20px] active:scale-90">{e}</button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>

                    <div className="flex-1 relative">
                        <input type="text" placeholder={pendingFiles.length > 0 ? 'Add a caption...' : replyingTo ? `Reply to ${replyingTo.sender.firstName}...` : 'Type a message...'} value={messageInput}
                            onChange={e => { setMessageInput(e.target.value); handleTyping(); }}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            className="w-full text-[13.5px] rounded-full pl-5 pr-4 py-3 outline-none bg-[#1E293B]/50 text-white border border-white/[0.06] focus:border-[#8B5CF6]/30 placeholder:text-white/20 transition-all"
                        />
                    </div>
                    <AnimatePresence mode="popLayout" initial={false}>
                    {(messageInput.trim() || pendingFiles.length > 0) ? (
                        <motion.button key="send" onClick={handleSendMessage}
                            layoutId="action-btn"
                            initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
                            whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(205,248,118,0.4)' }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="h-11 px-5 rounded-full font-semibold text-[13px] flex items-center gap-2 transition-colors flex-shrink-0 text-[#0B0F19] shadow-[0_4px_20px_rgba(205,248,118,0.3)]"
                            style={{ background: 'linear-gradient(135deg, #34D399 0%, #38BDF8 100%)' }}>
                            {isUploadingFiles ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            {isUploadingFiles ? 'Uploading' : 'Send'}
                        </motion.button>
                    ) : (
                        <motion.div key="voice" layoutId="action-btn"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                            <VoiceRecorder
                            onSend={async (attachment) => {
                                if (!activeRoomId || !user) return;
                                try {
                                    const msg = await apiClient.post<Message & { chatRoomId: string }>(`/chat/rooms/${activeRoomId}/messages`, { attachments: [attachment] });
                                    setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
                                    socketRef.current?.emit('send_message', { roomId: activeRoomId, message: msg });
                                    setRooms(prev => sortRooms(prev.map(r => r.id === activeRoomId ? { ...r, updatedAt: msg.createdAt, messages: [msg] } : r)));
                                } catch (err) { console.error('Voice send failed:', err); }
                            }}
                        />
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    ) : (
        <div className="flex-1 flex flex-col items-center justify-center relative" style={{ background: 'var(--bg-chat)' }}>
            {isMobile && (
                <button onClick={() => setMobileView('list')} className="absolute top-4 left-4 p-2.5 rounded-xl bg-white/5 text-white/50">
                    <ArrowLeft size={20} />
                </button>
            )}
            <div className="w-20 h-20 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center mb-5">
                <MessageSquare size={36} className="text-[#8B5CF6]/30" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Your Messages</h2>
            <p className="text-[13px] text-white/30">Select a conversation to start chatting.</p>
        </div>
    );

    // ─── RIGHT DETAILS PANEL ───
    const detailsPanel = activeRoomId && targetUser && showDetailsPanel && !isMobile ? (
        <div className="h-full flex flex-shrink-0">
            {/* Resizer */}
            <div
                className="w-1.5 h-full cursor-col-resize hover:bg-[#8B5CF6]/30 transition-colors z-30"
                onMouseDown={(e) => { setIsResizingDetails(true); e.preventDefault(); }}
            />
            <div className="flex-shrink-0 overflow-y-auto border-l border-white/[0.04]" style={{ width: `${detailsWidth}px`, background: 'rgba(15, 23, 42, 0.6)' }} data-lenis-prevent="true">
                <div className="flex flex-col items-center pt-8 pb-5">
                    <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#D946EF] flex items-center justify-center mb-4 ring-4 ring-[#8B5CF6]/15">
                        {targetUser.avatar ? <img src={targetUser.avatar} alt="" className="w-full h-full object-cover" /> :
                            <span className="text-2xl font-bold text-white">{targetUser.firstName?.charAt(0)}</span>}
                    </div>
                    <h3 className="text-[15px] font-bold text-white">{targetUser.firstName} {targetUser.lastName || ''}</h3>
                    <p className="text-[11px] text-white/30 mt-0.5">
                        {targetOnline ? <span className="text-[#34D399]">● Online</span> : 'Offline'}
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-2 px-5 pb-5">
                    <button onClick={handlePinToggle} title={activeRoom?.isPinned ? 'Unpin' : 'Pin'}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border border-white/[0.06] ${activeRoom?.isPinned ? 'bg-[#34D399]/10 text-[#34D399]' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>
                        {activeRoom?.isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                    </button>
                    <button onClick={handleMuteToggle} title={activeRoom?.isMuted ? 'Unmute' : 'Mute'}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border border-white/[0.06] ${activeRoom?.isMuted ? 'bg-yellow-500/10 text-yellow-400' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>
                        {activeRoom?.isMuted ? <BellOff size={15} /> : <Bell size={15} />}
                    </button>
                    <button onClick={() => { setChatSearchOpen(true); setChatSearchQuery(''); setChatSearchResults([]); }} title="Search"
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-all border border-white/[0.06]">
                        <SearchIcon size={15} />
                    </button>
                    <button title="Info"
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-all border border-white/[0.06]">
                        <Info size={15} />
                    </button>
                </div>

                <div className="mx-5 h-px bg-white/[0.04]" />

                {/* Shared Media section */}
                <div className="px-5 pt-4">
                    <button onClick={() => setShowMediaSection(!showMediaSection)}
                        className="w-full flex items-center justify-between py-2 text-[13px] font-semibold text-white/70 hover:text-white transition-colors">
                        Shared Media
                        {showMediaSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showMediaSection && (() => {
                        const sharedMedia = messages.flatMap(m => 
                            (m.attachments || []).filter(a => a.type === 'IMAGE' || a.type === 'VIDEO')
                        );
                        return sharedMedia.length > 0 ? (
                            <div className="mt-2 grid grid-cols-3 gap-1.5">
                                {sharedMedia.slice(0, 9).map((att, i) => (
                                    <div key={i} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                        style={{ background: 'rgba(51, 65, 85, 0.5)', border: '1px solid rgba(255,255,255,0.03)' }}
                                        onClick={() => {
                                            if (att.type === 'IMAGE') {
                                                openLightbox(sharedMedia.filter(a => a.type === 'IMAGE').map(a => ({ url: a.url, name: a.name })), sharedMedia.filter(a => a.type === 'IMAGE').indexOf(att));
                                            }
                                        }}>
                                        {att.type === 'IMAGE' ? (
                                            <img src={att.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Video size={20} className="text-white/30" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-2 flex flex-col items-center py-4">
                                <ImageIcon size={24} className="text-white/10 mb-2" />
                                <p className="text-[11px] text-white/20">No shared media yet</p>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    ) : null;

    // ─── LIGHTBOX OVERLAY ───
    const lightboxOverlay = showLightbox && lightboxImages.length > 0 ? (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setShowLightbox(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setShowLightbox(false); if (e.key === 'ArrowLeft') setLightboxIndex(p => Math.max(0, p - 1)); if (e.key === 'ArrowRight') setLightboxIndex(p => Math.min(lightboxImages.length - 1, p + 1)); }}
            tabIndex={0}>
            <button onClick={(e) => { e.stopPropagation(); setShowLightbox(false); }} className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"><X size={20} /></button>
            {lightboxImages.length > 1 && (
                <>
                    <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(p => Math.max(0, p - 1)); }} disabled={lightboxIndex === 0}
                        className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 z-10"><ChevronLeft size={24} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(p => Math.min(lightboxImages.length - 1, p + 1)); }} disabled={lightboxIndex === lightboxImages.length - 1}
                        className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 z-10"><ChevronRight size={24} /></button>
                </>
            )}
            <img src={lightboxImages[lightboxIndex]?.url} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <span className="text-white/50 text-[12px]">{lightboxIndex + 1} / {lightboxImages.length}</span>
                <a href={lightboxImages[lightboxIndex]?.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"><ExternalLink size={14} /></a>
            </div>
        </div>
    ) : null;

    // ─── FORWARD DIALOG ───
    const forwardDialog = forwardingMessage ? (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center" onClick={() => setForwardingMessage(null)}>
            <div className="w-[360px] max-h-[500px] rounded-2xl overflow-hidden flex flex-col"
                style={{ background: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <h3 className="text-[15px] font-bold text-white">Forward Message</h3>
                    <button onClick={() => setForwardingMessage(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40"><X size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto" data-lenis-prevent="true">
                    {rooms.filter(r => r.id !== activeRoomId).map(room => {
                        const otherMember = room.members.find(m => m.userId !== user.id)?.user;
                        const roomLabel = room.isGroup ? (room.name || 'Group') : (otherMember ? `${otherMember.firstName} ${otherMember.lastName || ''}` : 'Unknown');
                        return (
                            <button key={room.id} onClick={() => handleForwardMessage(forwardingMessage, room.id)}
                                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors text-left">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#D946EF] flex items-center justify-center flex-shrink-0">
                                    {otherMember?.avatar ? <img src={otherMember.avatar} alt="" className="w-full h-full object-cover" /> :
                                        <span className="text-[12px] font-bold text-white">{roomLabel.charAt(0)}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium text-white truncate">{roomLabel}</p>
                                </div>
                                <Forward size={14} className="text-white/20 flex-shrink-0" />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    ) : null;

    // ─── LISTING SEARCH MODAL ───
    const listingSearchModal = showListingSearch ? (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowListingSearch(false)}>
            <div className="w-full max-w-[500px] h-[600px] max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
                style={{ background: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
                        <Package size={16} className="text-[#34D399]" /> Share a Listing
                    </h3>
                    <button onClick={() => setShowListingSearch(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40"><X size={16} /></button>
                </div>
                <div className="p-4 border-b border-white/[0.04]">
                    <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input type="text" placeholder="Search your listings..." value={listingSearchQuery}
                            onChange={e => {
                                setListingSearchQuery(e.target.value);
                                searchListings(e.target.value);
                            }}
                            className="w-full text-[13px] rounded-xl pl-10 pr-4 py-3 outline-none bg-[#1E293B]/60 text-white border border-white/[0.06] focus:border-[#34D399]/40 placeholder:text-white/25 transition-all"
                            autoFocus
                        />
                        {listingSearchLoading && <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 animate-spin" />}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2" data-lenis-prevent="true">
                    {listingSearchResults.length === 0 && !listingSearchLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <Package size={32} className="text-white/10 mb-3" />
                            <p className="text-[13px] text-white/40">No listings found matching your search.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {listingSearchResults.map(listing => (
                                <div key={listing.id} className="flex gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.04] group">
                                    <div className="w-[80px] h-[80px] rounded-lg overflow-hidden flex-shrink-0 bg-white/5 relative">
                                        {(listing.media?.[0]?.url || listing.images?.[0]) ? (
                                            <img src={listing.media?.[0]?.url || listing.images?.[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-white/20" /></div>
                                        )}
                                        {listing.category && (
                                            <span className="absolute top-1 left-1 px-1.5 rounded bg-black/60 text-[8px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
                                                {listing.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <div>
                                            <h4 className="text-[13px] font-bold text-white truncate">{listing.title}</h4>
                                            <p className="text-[11px] text-[#34D399] font-medium mt-0.5">${listing.price}<span className="text-white/30 font-normal">/{listing.priceUnit || 'DAY'}</span></p>
                                        </div>
                                        <button onClick={() => handleShareListing(listing)}
                                            className="self-start mt-2 px-4 py-1.5 rounded-lg text-[11px] font-bold bg-[#34D399]/15 text-[#34D399] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all hover:bg-[#34D399]/25">
                                            Share to Chat
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    ) : null;

    // ─── BOOKING REQUEST MODAL ───
    const bookingRequestModal = showBookingModal ? (
        <div className="fixed inset-0 z-[150] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowBookingModal(null)}>
            <div className="w-full max-w-[400px] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
                style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(30px)' }}
                onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-[#34D399]/15 flex items-center justify-center mb-4">
                        <ShoppingBag size={24} className="text-[#34D399]" />
                    </div>
                    <h3 className="text-[20px] font-bold text-white mb-1">Request Booking</h3>
                    <p className="text-[13px] text-white/50 mb-6 truncate">{showBookingModal.title}</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Start Date</label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input type="date" min={new Date().toISOString().split('T')[0]} value={bookingDates.start} onChange={e => setBookingDates(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-full rounded-xl pl-9 pr-3 py-2.5 text-[13px] outline-none bg-black/20 text-white border border-white/[0.06] focus:border-[#34D399]/40 transition-[border-color,background-color] [color-scheme:dark]" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">End Date</label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input type="date" min={bookingDates.start || new Date().toISOString().split('T')[0]} value={bookingDates.end} onChange={e => setBookingDates(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-full rounded-xl pl-9 pr-3 py-2.5 text-[13px] outline-none bg-black/20 text-white border border-white/[0.06] focus:border-[#34D399]/40 transition-[border-color,background-color] [color-scheme:dark]" />
                            </div>
                        </div>
                    </div>

                    {bookingDates.start && bookingDates.end && (
                        <div className="mt-6 p-4 rounded-xl bg-black/20 border border-white/[0.04]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[12px] text-white/50">Rate</span>
                                <span className="text-[13px] text-white font-medium">${showBookingModal.price} / {showBookingModal.priceUnit || 'DAY'}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[12px] text-white/50">Duration</span>
                                <span className="text-[13px] text-white font-medium">
                                    {Math.max(1, Math.ceil((new Date(bookingDates.end).getTime() - new Date(bookingDates.start).getTime()) / 86400000))} Days
                                </span>
                            </div>
                            <div className="h-px bg-white/[0.06] mb-3" />
                            <div className="flex justify-between items-center">
                                <span className="text-[13px] font-bold text-white">Estimated Total</span>
                                <span className="text-[16px] font-bold text-[#34D399]">
                                    ${(Math.max(1, Math.ceil((new Date(bookingDates.end).getTime() - new Date(bookingDates.start).getTime()) / 86400000)) * showBookingModal.price).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 mt-8">
                        <button onClick={() => setShowBookingModal(null)}
                            className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white hover:bg-white/5 border border-white/10 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleRequestBooking} disabled={!bookingDates.start || !bookingDates.end || bookingLoading}
                            className="flex-1 py-3 rounded-xl text-[13px] font-bold text-black border border-transparent transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #34D399 0%, #38BDF8 100%)', boxShadow: '0 4px 15px rgba(52, 211, 153, 0.2)' }}>
                            {bookingLoading ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
                            {bookingLoading ? 'Sending...' : 'Request'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    ) : null;

    // ─── CONTEXT MENU OVERLAY ───
    const contextMenuOverlay = contextMenu ? (() => {
        const contextMsg = messages.find(m => m.id === contextMenu.msgId);
        if (!contextMsg) return null;
        const isMyMsg = contextMsg.sender.id === user.id;
        return (
            <div className="fixed inset-0 z-[200]" onClick={() => setContextMenu(null)}>
                <div ref={contextMenuRef}
                    className="absolute w-52 rounded-2xl overflow-hidden shadow-2xl py-1"
                    style={{
                        top: Math.min(contextMenu.y, window.innerHeight - 320),
                        left: Math.min(contextMenu.x, window.innerWidth - 220),
                        background: 'rgba(15, 23, 42, 0.98)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(20px)'
                    }}
                    onClick={e => e.stopPropagation()}>
                    {/* Quick reactions row */}
                    <div className="flex gap-1 px-3 py-2 border-b border-white/[0.06]">
                        {QUICK_EMOJIS.map(e => (
                            <button key={e} onClick={() => { handleReaction(contextMenu.msgId, e); setContextMenu(null); }}
                                className="hover:scale-125 transition-transform text-[18px] px-0.5">{e}</button>
                        ))}
                    </div>
                    {/* Actions */}
                    <button onClick={() => { setReplyingTo(contextMsg); setContextMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left">
                        <Reply size={14} className="text-white/40" />
                        <span className="text-[13px] text-white/70">Reply</span>
                    </button>
                    <button onClick={() => { setForwardingMessage(contextMsg); setContextMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left">
                        <Forward size={14} className="text-white/40" />
                        <span className="text-[13px] text-white/70">Forward</span>
                    </button>
                    {contextMsg.content && (
                        <button onClick={() => { navigator.clipboard.writeText(contextMsg.content || ''); setContextMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left">
                            <Copy size={14} className="text-white/40" />
                            <span className="text-[13px] text-white/70">Copy</span>
                        </button>
                    )}
                    {isMyMsg && (
                        <>
                            <button onClick={() => { setEditingMessageId(contextMsg.id); setEditContent(contextMsg.content || ''); setContextMenu(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left">
                                <Pencil size={14} className="text-white/40" />
                                <span className="text-[13px] text-white/70">Edit</span>
                            </button>
                            <button onClick={() => { handleDeleteMessage(contextMsg.id); setContextMenu(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/5 transition-colors text-left">
                                <Trash2 size={14} className="text-red-400/60" />
                                <span className="text-[13px] text-red-400/70">Delete</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    })() : null;

    // ─── MOBILE LAYOUT ───
    if (isMobile) {
        return (
            <CallProvider socketRef={socketRef} userId={user.id} userName={user.firstName || ''} userAvatar={user.avatar || null}>
                <style dangerouslySetInnerHTML={{ __html: MESSAGING_THEME_CSS }} />
                <CallUI />
                {lightboxOverlay}
                {forwardDialog}
                {contextMenuOverlay}
                {listingSearchModal}
                {bookingRequestModal}
                <div className={`messaging-page-root theme-${themeMode} flex h-[100dvh] overflow-hidden font-sans ${avantGardeFont.className}`} style={{ background: 'var(--bg-main)' }}>
                    {mobileView === 'list' ? (
                        <div className="w-full h-full min-h-0">{sidebarContent}</div>
                    ) : (
                        <div className="w-full h-full flex flex-col relative min-h-0">{chatContent}</div>
                    )}
                </div>
            </CallProvider>
        );
    }

    // ─── DESKTOP LAYOUT ───
    return (
        <CallProvider socketRef={socketRef} userId={user.id} userName={user.firstName || ''} userAvatar={user.avatar || null}>
            <style dangerouslySetInnerHTML={{ __html: MESSAGING_THEME_CSS }} />
            <CallUI />
            {lightboxOverlay}
            {forwardDialog}
            {contextMenuOverlay}
            {listingSearchModal}
            {bookingRequestModal}
            <div className={`messaging-page-root theme-${themeMode} flex h-[100dvh] overflow-hidden font-sans ${avantGardeFont.className}`} style={{ background: 'var(--bg-main)' }}>
                {navRail}

                <div className="flex h-full flex-shrink-0 min-h-0">
                    <div className="flex-shrink-0 overflow-hidden border-r border-white/[0.04] flex flex-col min-h-0" style={{ width: `${sidebarWidth}px` }}>
                        {sidebarContent}
                    </div>
                    {/* Resizer */}
                    <div
                        className="w-1.5 h-full cursor-col-resize hover:bg-[#8B5CF6]/30 transition-colors z-30"
                        onMouseDown={(e) => { setIsResizingSidebar(true); e.preventDefault(); }}
                    />
                </div>

                <div className="flex-1 flex flex-col relative overflow-hidden min-h-0"
style={{ boxShadow: "inset 0 0 150px rgba(139, 92, 246, 0.03)" }}>
                    {chatContent}
                </div>

                {detailsPanel}
            </div>
        </CallProvider>
    );
}

// ─── Call Buttons Sub-component ───
function CallButtons({ targetUserId, targetName, targetAvatar, roomId }: { targetUserId: string; targetName: string; targetAvatar: string | null; roomId: string }) {
    const call = useCall();
    return (
        <>
            <button
                onClick={() => call.startCall(targetUserId, targetName, targetAvatar, 'audio', roomId)}
                className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-[#34D399] transition-all"
                title="Audio call"
            >
                <Phone size={18} />
            </button>
            <button
                onClick={() => call.startCall(targetUserId, targetName, targetAvatar, 'video', roomId)}
                className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-[#8B5CF6] transition-all"
                title="Video call"
            >
                <Video size={18} />
            </button>
        </>
    );
}
