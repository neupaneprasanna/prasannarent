'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Search, Home, Send, Plus, CheckCheck, ArrowDown,
    PanelLeftClose, PanelLeftOpen, Sun, Moon, MessageSquare,
    Trash2, X, Settings, Info, LogOut, SlidersHorizontal,
    Flag, Lock, Pin, ChevronDown, ChevronUp, Image as ImageIcon,
    MoreVertical, ArrowLeft, Paperclip, FileText, Music, Video,
    File, Loader2, Download, X as XIcon, Phone
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import { CallProvider, useCall } from '@/components/call/CallProvider';
import CallUI from '@/components/call/CallUI';
import VoiceRecorder from '@/components/call/VoiceRecorder';

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

interface PendingFile {
    file: File;
    preview?: string;
    type: string;
    uploading: boolean;
    uploaded: boolean;
    url?: string;
}

interface Message {
    id: string;
    content: string | null;
    createdAt: string;
    senderId: string;
    isDeleted?: boolean;
    chatRoomId?: string;
    sender: { id: string; firstName: string; lastName?: string; avatar: string | null };
    attachments: MessageAttachment[];
}

interface ChatRoom {
    id: string;
    isGroup: boolean;
    name?: string;
    updatedAt: string;
    members: ChatMember[];
    messages: Message[];
    unreadCount: number;
}

export default function MessagesPage() {
    const { user, isAuthenticated } = useAuthStore();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
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

    const isDark = theme === 'dark';
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const activeRoomIdRef = useRef<string | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);
    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
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
            setRooms(prev => prev.map(r => {
                if (r.id === msg.chatRoomId) {
                    return { ...r, updatedAt: msg.createdAt, messages: [msg],
                        unreadCount: msg.chatRoomId === curRoom ? r.unreadCount : r.unreadCount + 1 };
                }
                return r;
            }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
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
            try {
                const res = await apiClient.get<{ messages: Message[] }>(`/chat/rooms/${activeRoomId}/messages`);
                if (active) setMessages(res.messages);
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

            const msg = await apiClient.post<Message & { chatRoomId: string }>(`/chat/rooms/${activeRoomId}/messages`, payload);
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
            socketRef.current?.emit('send_message', { roomId: activeRoomId, message: msg });
            setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, updatedAt: msg.createdAt, messages: [msg] } : r)
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

            // Clear pending files
            pendingFiles.forEach(pf => { if (pf.preview) URL.revokeObjectURL(pf.preview); });
            setPendingFiles([]);
        } catch (err) {
            console.error('Send failed:', err);
            if (content) setMessageInput(content);
        }
    }, [messageInput, activeRoomId, user, pendingFiles, uploadPendingFiles]);

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        if (!activeRoomId) return;
        try {
            await apiClient.delete(`/chat/rooms/${activeRoomId}/messages/${messageId}`);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true, content: null } : m));
            socketRef.current?.emit('message_deleted', { roomId: activeRoomId, messageId });
        } catch (err) { console.error('Delete failed:', err); }
    }, [activeRoomId]);

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
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0b1e 0%, #12103a 50%, #0d0e24 100%)' }}>
            <div className="text-white/40 text-sm">Loading...</div>
        </div>
    );

    if (!user || !isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0b1e 0%, #12103a 50%, #0d0e24 100%)' }}>
                <p className="mb-4 text-white/60">Please log in to view messages.</p>
                <Link href="/login" className="px-6 py-2.5 bg-[#8B5CF6] rounded-full text-white font-medium hover:bg-[#7c3aed] transition-colors">Go to Login</Link>
            </div>
        );
    }

    // ─── ICON NAV RAIL ───
    const navRail = (
        <div className="w-[60px] flex-shrink-0 flex flex-col items-center py-6 gap-1" style={{ background: 'linear-gradient(180deg, #0e0f2a 0%, #0a0b1e 100%)' }}>
            <Link href="/" className="p-3 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all mb-2">
                <Home size={20} />
            </Link>
            {/* Search all users icon */}
            <button onClick={() => { setSidebarMode('search'); setUserSearchQuery(''); }}
                className={`relative p-3 rounded-2xl transition-all ${sidebarMode === 'search' ? 'bg-[#8B5CF6]/20 text-[#a78bfa]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                <Search size={20} />
                {sidebarMode === 'search' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#8B5CF6]" />}
            </button>
            {/* Messages (chatted users) icon */}
            <button onClick={() => { setSidebarMode('messages'); setSearchQuery(''); }}
                className={`relative p-3 rounded-2xl transition-all my-1 ${sidebarMode === 'messages' ? 'bg-[#8B5CF6]/20 text-[#a78bfa]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                <MessageSquare size={20} />
                {sidebarMode === 'messages' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#8B5CF6]" />}
            </button>
            <button className="p-3 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                <Settings size={20} />
            </button>
            <button className="p-3 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                <Info size={20} />
            </button>
            <div className="flex-1" />
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="p-3 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href="/" className="p-3 rounded-2xl text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all">
                <LogOut size={18} />
            </Link>
        </div>
    );

    // ─── SIDEBAR ───
    const sidebarContent = sidebarMode === 'messages' ? (
        // ═══ MESSAGES MODE: search only existing chats ═══
        <div className="flex flex-col h-full" style={{ background: 'rgba(14, 15, 42, 0.6)' }}>
            <div className="p-5 pb-3 flex-shrink-0">
                <div className="mb-1">
                    <h2 className="text-[17px] font-bold text-white tracking-tight">Messages</h2>
                    {user && <p className="text-[11px] text-white/30 mt-0.5">{user.email}</p>}
                </div>
                <div className="relative mt-4">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                    <input type="text" placeholder="Search conversations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full text-[13px] rounded-2xl pl-10 pr-10 py-3 outline-none bg-[#1a1b3a]/60 text-white border border-white/[0.06] focus:border-[#8B5CF6]/40 placeholder:text-white/25 transition-all"
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

            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
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
                        <button key={room.id}
                            onClick={() => { setActiveRoomId(room.id); if (isMobile) setMobileView('chat'); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${isActive
                                ? 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 shadow-[0_0_20px_rgba(139,92,246,0.08)]'
                                : 'hover:bg-white/[0.02] border border-transparent'
                            }`}>
                            <div className="relative flex-shrink-0">
                                <div className="w-[44px] h-[44px] rounded-full overflow-hidden bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center ring-2 ring-white/5">
                                    {t.avatar ? <img src={t.avatar} alt="" className="w-full h-full object-cover" /> :
                                        <span className="text-[14px] font-bold text-white">{t.firstName?.charAt(0)}</span>}
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] rounded-full ${online ? 'bg-[#cdf876] border-[#0e0f2a]' : 'bg-gray-500/50 border-[#0e0f2a]'}`} />
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
                                        <span className="ml-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#cdf876] text-[#0a0b1e] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                                        </span>
                                    ) : online ? (
                                        <div className="ml-2 w-2.5 h-2.5 rounded-full bg-[#cdf876] flex-shrink-0" />
                                    ) : null}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    ) : (
        // ═══ SEARCH MODE: find ALL logged-in users to start new chats ═══
        <div className="flex flex-col h-full" style={{ background: 'rgba(14, 15, 42, 0.6)' }}>
            <div className="p-5 pb-3 flex-shrink-0">
                <div className="mb-1">
                    <h2 className="text-[17px] font-bold text-white tracking-tight">Find Users</h2>
                    <p className="text-[11px] text-white/30 mt-0.5">Search all users to start a conversation</p>
                </div>
                <div className="relative mt-4">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                    <input type="text" placeholder="Search users..." value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)}
                        className="w-full text-[13px] rounded-2xl pl-10 pr-10 py-3 outline-none bg-[#1a1b3a]/60 text-white border border-white/[0.06] focus:border-[#8B5CF6]/40 placeholder:text-white/25 transition-all"
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

            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
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
                                <div className="w-[44px] h-[44px] rounded-full overflow-hidden bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center ring-2 ring-white/5">
                                    {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> :
                                        <span className="text-[14px] font-bold text-white">{u.firstName?.charAt(0)}</span>}
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] rounded-full ${online ? 'bg-[#cdf876] border-[#0e0f2a]' : 'bg-gray-500/50 border-[#0e0f2a]'}`} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-[13px] font-semibold text-white/80 truncate">{u.firstName} {u.lastName || ''}</p>
                                <p className="text-[11px] text-white/30">
                                    {online ? <span className="text-[#cdf876]">● Online</span> : 'Offline'}
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
        <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #0d0e28 0%, #0a0b1e 100%)' }}>
            {/* Header */}
            <div className="h-[72px] flex-shrink-0 flex items-center justify-between px-5 border-b border-white/[0.04]" style={{ background: 'rgba(14, 15, 42, 0.5)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-3.5">
                    {isMobile && (
                        <button onClick={() => setMobileView('list')} className="p-2 rounded-xl hover:bg-white/5 text-white/50 transition-all mr-1">
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div className="relative">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center ring-2 ring-white/10">
                            {targetUser.avatar ? <img src={targetUser.avatar} alt="" className="w-full h-full object-cover" /> :
                                <span className="text-[14px] font-bold text-white">{targetUser.firstName?.charAt(0)}</span>}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full ${targetOnline ? 'bg-[#cdf876] border-[#0d0e28]' : 'bg-gray-500 border-[#0d0e28]'}`} />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-bold text-white">{targetUser.firstName} {targetUser.lastName || ''}</h2>
                        <p className="text-[11px]">
                            {typingName
                                ? <span className="text-[#cdf876]">typing...</span>
                                : targetOnline
                                    ? <span className="text-[#cdf876]">Online</span>
                                    : <span className="text-white/30">Offline</span>
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <CallButtons
                        targetUserId={targetUser.id}
                        targetName={`${targetUser.firstName} ${targetUser.lastName || ''}`}
                        targetAvatar={targetUser.avatar}
                        roomId={activeRoomId!}
                    />
                    <button onClick={() => setShowDetailsPanel(!showDetailsPanel)} className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1.5 relative">
                {messagesLoading ? (
                    <div className="flex-1 flex items-center justify-center"><span className="text-[13px] text-white/25">Loading messages...</span></div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center mb-4">
                            <MessageSquare size={28} className="text-[#8B5CF6]/40" />
                        </div>
                        <p className="text-[13px] text-white/30">No messages yet. Say hello! 👋</p>
                    </div>
                ) : messagesWithDates.map(({ msg, dateLabel, showDate }, idx) => {
                    const isMe = msg.sender.id === user.id;
                    const timeStr = getTimeLabel(msg.createdAt);
                    // Show time label if first msg or gap > 5 min from previous
                    const prevMsg = idx > 0 ? messagesWithDates[idx - 1].msg : null;
                    const showTime = !prevMsg || (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 300000);

                    return (
                        <div key={msg.id || idx}>
                            {showDate && (
                                <div className="flex justify-center my-4">
                                    <span className="px-5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide text-white/40" style={{ background: 'rgba(30, 32, 70, 0.6)', border: '1px solid rgba(255,255,255,0.04)' }}>
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
                                        style={{ background: 'rgba(30, 32, 70, 0.4)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        Message deleted
                                    </div>
                                ) : isMe ? (
                                    <>
                                        <button onClick={() => handleDeleteMessage(msg.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 self-center">
                                            <Trash2 size={12} className="text-red-400/60" />
                                        </button>
                                        <div className="flex flex-col items-end max-w-[70%]">
                                            {/* Attachments */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className={`flex flex-col gap-1.5 mb-1 ${msg.attachments.length > 1 ? 'w-full' : ''}`}>
                                                    {msg.attachments.map((att, ai) => (
                                                        <div key={ai}>
                                                            {att.type === 'IMAGE' ? (
                                                                <div className="rounded-[16px] rounded-br-md overflow-hidden max-w-[280px] cursor-pointer" onClick={() => window.open(att.url, '_blank')}>
                                                                    <img src={att.url} alt={att.name || 'Image'} className="w-full h-auto max-h-[240px] object-cover" loading="lazy" />
                                                                </div>
                                                            ) : att.type === 'VIDEO' ? (
                                                                <div className="rounded-[16px] rounded-br-md overflow-hidden max-w-[280px]">
                                                                    <video src={att.url} controls className="w-full max-h-[240px]" preload="metadata" />
                                                                </div>
                                                            ) : att.type === 'AUDIO' ? (
                                                                <div className="flex items-center gap-3 px-4 py-3 rounded-[16px] rounded-br-md min-w-[200px]"
                                                                    style={{ background: 'rgba(205, 248, 118, 0.15)', border: '1px solid rgba(205, 248, 118, 0.2)' }}>
                                                                    <Music size={18} className="text-[#cdf876] flex-shrink-0" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[11px] font-medium text-white/80 truncate">{att.name || 'Audio file'}</p>
                                                                        {att.size && <p className="text-[9px] text-white/30">{formatFileSize(att.size)}</p>}
                                                                        <audio src={att.url} controls className="w-full h-7 mt-1" preload="metadata" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <a href={att.url} target="_blank" rel="noopener noreferrer"
                                                                    className="flex items-center gap-3 px-4 py-3 rounded-[16px] rounded-br-md min-w-[180px] hover:opacity-80 transition-opacity"
                                                                    style={{ background: 'rgba(205, 248, 118, 0.15)', border: '1px solid rgba(205, 248, 118, 0.2)' }}>
                                                                    <div className="w-10 h-10 rounded-xl bg-[#cdf876]/20 flex items-center justify-center flex-shrink-0">
                                                                        <FileText size={18} className="text-[#cdf876]" />
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
                                            {msg.content && (
                                                <div className="px-5 py-3 text-[13.5px] leading-relaxed rounded-[20px] rounded-br-md text-[#0a0b1e] font-medium"
                                                    style={{ background: 'linear-gradient(135deg, #cdf876 0%, #b8e85a 100%)', boxShadow: '0 4px 20px rgba(205, 248, 118, 0.15)' }}>
                                                    {msg.content}
                                                </div>
                                            )}
                                            <span className="text-[10px] text-white/20 mt-1 flex items-center gap-1">
                                                {timeStr} <CheckCheck size={12} className="text-[#cdf876]/60" />
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-start max-w-[70%]">
                                        {/* Attachments */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className={`flex flex-col gap-1.5 mb-1 ${msg.attachments.length > 1 ? 'w-full' : ''}`}>
                                                {msg.attachments.map((att, ai) => (
                                                    <div key={ai}>
                                                        {att.type === 'IMAGE' ? (
                                                            <div className="rounded-[16px] rounded-bl-md overflow-hidden max-w-[280px] cursor-pointer" onClick={() => window.open(att.url, '_blank')}>
                                                                <img src={att.url} alt={att.name || 'Image'} className="w-full h-auto max-h-[240px] object-cover" loading="lazy" />
                                                            </div>
                                                        ) : att.type === 'VIDEO' ? (
                                                            <div className="rounded-[16px] rounded-bl-md overflow-hidden max-w-[280px]">
                                                                <video src={att.url} controls className="w-full max-h-[240px]" preload="metadata" />
                                                            </div>
                                                        ) : att.type === 'AUDIO' ? (
                                                            <div className="flex items-center gap-3 px-4 py-3 rounded-[16px] rounded-bl-md min-w-[200px]"
                                                                style={{ background: 'rgba(25, 27, 60, 0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <Music size={18} className="text-[#8B5CF6] flex-shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[11px] font-medium text-white/80 truncate">{att.name || 'Audio file'}</p>
                                                                    {att.size && <p className="text-[9px] text-white/30">{formatFileSize(att.size)}</p>}
                                                                    <audio src={att.url} controls className="w-full h-7 mt-1" preload="metadata" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <a href={att.url} target="_blank" rel="noopener noreferrer"
                                                                className="flex items-center gap-3 px-4 py-3 rounded-[16px] rounded-bl-md min-w-[180px] hover:opacity-80 transition-opacity"
                                                                style={{ background: 'rgba(25, 27, 60, 0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center flex-shrink-0">
                                                                    <FileText size={18} className="text-[#8B5CF6]" />
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
                                        {msg.content && (
                                            <div className="px-5 py-3 text-[13.5px] leading-relaxed rounded-[20px] rounded-bl-md text-white/90"
                                                style={{ background: 'rgba(25, 27, 60, 0.8)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
                                                {msg.content}
                                            </div>
                                        )}
                                        <span className="text-[10px] text-white/20 mt-1">{timeStr}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {typingName && (
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex gap-1.5 px-5 py-3 rounded-[20px] rounded-bl-md" style={{ background: 'rgba(25, 27, 60, 0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
                            <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse [animation-delay:0.15s]" />
                            <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse [animation-delay:0.3s]" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {showScrollBtn && (
                <button onClick={() => scrollToBottom()}
                    className="absolute bottom-28 right-8 p-3 rounded-full shadow-xl z-20 bg-[#8B5CF6] text-white hover:bg-[#7c3aed] transition-colors"
                    style={{ boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)' }}>
                    <ArrowDown size={16} />
                </button>
            )}

            {/* Pending Files Preview */}
            {pendingFiles.length > 0 && (
                <div className="px-4 pt-3 pb-1 border-t border-white/[0.04]" style={{ background: 'rgba(14, 15, 42, 0.5)' }}>
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

            {/* Input Bar */}
            <div
                className={`p-4 border-t border-white/[0.04] transition-colors ${inputDragOver ? 'bg-[#8B5CF6]/10' : ''}`}
                style={!inputDragOver ? { background: 'rgba(14, 15, 42, 0.4)' } : {}}
                onDragOver={(e) => { e.preventDefault(); setInputDragOver(true); }}
                onDragLeave={() => setInputDragOver(false)}
                onDrop={handleInputDrop}
            >
                {inputDragOver && (
                    <div className="flex items-center justify-center gap-2 mb-3 py-3 border-2 border-dashed border-[#8B5CF6]/40 rounded-xl">
                        <Paperclip size={16} className="text-[#8B5CF6]" />
                        <span className="text-[12px] text-[#a78bfa] font-medium">Drop files to attach</span>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    {/* Attachment button with menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowAttachMenu(!showAttachMenu)}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 border border-white/[0.06] ${
                                showAttachMenu ? 'bg-[#8B5CF6]/20 text-[#a78bfa]' : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {showAttachMenu ? <X size={20} /> : <Plus size={20} />}
                        </button>
                        {showAttachMenu && (
                            <div className="absolute bottom-14 left-0 w-52 rounded-2xl overflow-hidden shadow-2xl z-50"
                                style={{ background: 'rgba(20, 22, 50, 0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
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
                            </div>
                        )}
                    </div>
                    <div className="flex-1 relative">
                        <input type="text" placeholder={pendingFiles.length > 0 ? 'Add a caption...' : 'Type a message...'} value={messageInput}
                            onChange={e => { setMessageInput(e.target.value); handleTyping(); }}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            className="w-full text-[13.5px] rounded-full pl-5 pr-4 py-3 outline-none bg-[#1a1b3a]/50 text-white border border-white/[0.06] focus:border-[#8B5CF6]/30 placeholder:text-white/20 transition-all"
                        />
                    </div>
                    {(messageInput.trim() || pendingFiles.length > 0) ? (
                        <button onClick={handleSendMessage}
                            className="h-11 px-5 rounded-full font-semibold text-[13px] flex items-center gap-2 transition-all flex-shrink-0 text-[#0a0b1e] shadow-[0_4px_20px_rgba(205,248,118,0.3)]"
                            style={{ background: 'linear-gradient(135deg, #cdf876 0%, #b8e85a 100%)' }}>
                            {isUploadingFiles ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            {isUploadingFiles ? 'Uploading' : 'Send'}
                        </button>
                    ) : (
                        <VoiceRecorder
                            onSend={async (attachment) => {
                                if (!activeRoomId || !user) return;
                                try {
                                    const msg = await apiClient.post<Message & { chatRoomId: string }>(`/chat/rooms/${activeRoomId}/messages`, { attachments: [attachment] });
                                    setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
                                    socketRef.current?.emit('send_message', { roomId: activeRoomId, message: msg });
                                    setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, updatedAt: msg.createdAt, messages: [msg] } : r)
                                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
                                } catch (err) { console.error('Voice send failed:', err); }
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    ) : (
        <div className="flex-1 flex flex-col items-center justify-center relative" style={{ background: 'linear-gradient(180deg, #0d0e28 0%, #0a0b1e 100%)' }}>
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
            <div className="flex-shrink-0 overflow-y-auto border-l border-white/[0.04]" style={{ width: `${detailsWidth}px`, background: 'rgba(14, 15, 42, 0.6)' }}>
                <div className="flex flex-col items-center pt-8 pb-5">
                    <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center mb-4 ring-4 ring-[#8B5CF6]/15">
                        {targetUser.avatar ? <img src={targetUser.avatar} alt="" className="w-full h-full object-cover" /> :
                            <span className="text-2xl font-bold text-white">{targetUser.firstName?.charAt(0)}</span>}
                    </div>
                    <h3 className="text-[15px] font-bold text-white">{targetUser.firstName} {targetUser.lastName || ''}</h3>
                    <p className="text-[11px] text-white/30 mt-0.5">
                        {targetOnline ? <span className="text-[#cdf876]">● Online</span> : 'Offline'}
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-2 px-5 pb-5">
                    {[
                        { icon: <Flag size={15} />, label: 'Flag' },
                        { icon: <Lock size={15} />, label: 'Lock' },
                        { icon: <Info size={15} />, label: 'Info' },
                        { icon: <Pin size={15} />, label: 'Pin' },
                    ].map((action, i) => (
                        <button key={i} title={action.label}
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-all border border-white/[0.06]">
                            {action.icon}
                        </button>
                    ))}
                </div>

                <div className="mx-5 h-px bg-white/[0.04]" />

                {/* Shared Media section */}
                <div className="px-5 pt-4">
                    <button onClick={() => setShowMediaSection(!showMediaSection)}
                        className="w-full flex items-center justify-between py-2 text-[13px] font-semibold text-white/70 hover:text-white transition-colors">
                        Shared Media
                        {showMediaSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showMediaSection && (
                        <div className="mt-2 grid grid-cols-3 gap-1.5">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="aspect-square rounded-xl overflow-hidden flex items-center justify-center"
                                    style={{ background: 'rgba(30, 32, 70, 0.5)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <ImageIcon size={16} className="text-white/10" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    ) : null;

    // ─── MOBILE LAYOUT ───
    if (isMobile) {
        return (
            <CallProvider socketRef={socketRef} userId={user.id} userName={user.firstName || ''} userAvatar={user.avatar || null}>
                <CallUI />
                <div className="messaging-page-root flex h-[100dvh] overflow-hidden font-sans" style={{ background: 'linear-gradient(135deg, #0a0b1e 0%, #12103a 50%, #0d0e24 100%)' }}>
                    {mobileView === 'list' ? (
                        <div className="w-full h-full">{sidebarContent}</div>
                    ) : (
                        <div className="w-full h-full flex flex-col relative">{chatContent}</div>
                    )}
                </div>
            </CallProvider>
        );
    }

    // ─── DESKTOP LAYOUT ───
    return (
        <CallProvider socketRef={socketRef} userId={user.id} userName={user.firstName || ''} userAvatar={user.avatar || null}>
            <CallUI />
            <div className="messaging-page-root flex h-screen overflow-hidden font-sans" style={{ background: 'linear-gradient(135deg, #0a0b1e 0%, #12103a 50%, #0d0e24 100%)' }}>
                {navRail}

                <div className="flex h-full flex-shrink-0">
                    <div className="flex-shrink-0 overflow-hidden border-r border-white/[0.04]" style={{ width: `${sidebarWidth}px` }}>
                        {sidebarContent}
                    </div>
                    {/* Resizer */}
                    <div
                        className="w-1.5 h-full cursor-col-resize hover:bg-[#8B5CF6]/30 transition-colors z-30"
                        onMouseDown={(e) => { setIsResizingSidebar(true); e.preventDefault(); }}
                    />
                </div>

                <div className="flex-1 flex flex-col relative overflow-hidden">
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
                className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-[#cdf876] transition-all"
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
