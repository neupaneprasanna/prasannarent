'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Bell, Folder, Home, Settings, Info, LogOut, 
    MoreVertical, Plus, Send, Image as ImageIcon,
    Bookmark, Lock, Pin, Share, CheckCheck,
    PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
    Sun, Moon
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api-client';

// Interfaces mapping to Prisma models
export interface ChatRoom {
    id: string;
    isGroup: boolean;
    name?: string;
    updatedAt: string;
    members: ChatMember[];
    messages: Message[];
}

export interface ChatMember {
    id: string;
    userId: string;
    isAdmin: boolean;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string | null;
        lastSeenAt: string;
    };
}

export interface Message {
    id: string;
    content: string | null;
    createdAt: string;
    sender: {
        id: string;
        firstName: string;
        avatar: string | null;
    };
    attachments: any[];
}

export default function MessagesPage() {
    const { user, isAuthenticated } = useAuthStore();
    
    // State
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [isHoveredSidebar, setIsHoveredSidebar] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest'>('Newest');
    
    // Resizing State
    const [leftPanelWidth, setLeftPanelWidth] = useState(320);
    const [rightPanelWidth, setRightPanelWidth] = useState(340);
    const [isLeftMinimized, setIsLeftMinimized] = useState(false);
    const [isRightMinimized, setIsRightMinimized] = useState(false);
    const [isDraggingLeftState, setIsDraggingLeftState] = useState(false);
    const [isDraggingRightState, setIsDraggingRightState] = useState(false);
    const isDraggingLeft = useRef(false);
    const isDraggingRight = useRef(false);

    // Theme State
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const isDark = theme === 'dark';
    
    // Refs
    const [isMounted, setIsMounted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const activeRoomIdRef = useRef<string | null>(null);

    // Keep activeRoomIdRef in sync with state
    useEffect(() => {
        activeRoomIdRef.current = activeRoomId;
    }, [activeRoomId]);

    // Initial hydration mount
    useEffect(() => {
        setIsMounted(true);
    }, []);
    const socketRef = useRef<Socket | null>(null);

    // Auto-scroll Down
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Resizing Handle
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingLeft.current) {
                const newWidth = e.clientX - 64; // Subtract 64px app sidebar
                if (newWidth > 200 && newWidth < 600) {
                    setLeftPanelWidth(newWidth);
                }
            } else if (isDraggingRight.current) {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth > 250 && newWidth < 600) {
                    setRightPanelWidth(newWidth);
                }
            }
            if (isDraggingLeft.current || isDraggingRight.current) {
                // Prevent text selection while dragging
                e.preventDefault();
            }
        };

        const handleMouseUp = () => {
            if (isDraggingLeft.current || isDraggingRight.current) {
                isDraggingLeft.current = false;
                isDraggingRight.current = false;
                setIsDraggingLeftState(false);
                setIsDraggingRightState(false);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // 1. Initialize Socket.IO connection and Fetch Rooms
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // Connect Socket
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';
        const socket = io(wsUrl, { transports: ['websocket'] });
        socketRef.current = socket;

        // Listeners for global updates or active room push events
        socket.on('new_message', (newMessage: Message & { chatRoomId: string }) => {
            const currentActiveRoomId = activeRoomIdRef.current;
            // If the message is for the currently active room, append it directly
            if (currentActiveRoomId && newMessage.chatRoomId === currentActiveRoomId) {
                setMessages(prev => {
                    // Prevent duplicate appends if we already have it
                    if (prev.some(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
            }
            // Update the latest message snippet in the sidebar room list
            setRooms(prevRooms => prevRooms.map(room => {
                if (room.id === newMessage.chatRoomId) {
                    return {
                        ...room,
                        updatedAt: newMessage.createdAt,
                        messages: [newMessage]
                    };
                }
                return room;
            }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
        });

        // Load chat rooms and available users
        const loadInitialData = async () => {
            try {
                const [fetchedRooms, fetchedUsers] = await Promise.all([
                    apiClient.get<ChatRoom[]>('/chat/rooms'),
                    apiClient.get<any[]>('/chat/users')
                ]);
                setRooms(fetchedRooms);
                setAvailableUsers(fetchedUsers);
                
                // Subscribe to ALL existing rooms to get side-bar notifications
                fetchedRooms.forEach(room => {
                    socket.emit('join_room', room.id);
                });

                if (fetchedRooms.length > 0 && !activeRoomIdRef.current) {
                    setActiveRoomId(fetchedRooms[0].id);
                }
            } catch (err) {
                console.error('Failed to load initial data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, user]);

    // 2. Handle room switching (join cleanly via socket and load messages)
    useEffect(() => {
        if (!activeRoomId || !socketRef.current || !isAuthenticated) return;

        let isActive = true;
        const socket = socketRef.current;
        
        // We ensure we have joined the room on click, though initial load also joins it.
        socket.emit('join_room', activeRoomId);

        // Fetch Historical Messages
        const loadMessages = async () => {
            setIsLoading(true);
            try {
                const history = await apiClient.get<Message[]>(`/chat/rooms/${activeRoomId}/messages`);
                if (isActive) {
                    setMessages(history);
                }
            } catch (err) {
                console.error(`Failed to load messages for room ${activeRoomId}`, err);
            } finally {
                if (isActive) setIsLoading(false);
            }
        };

        loadMessages();

        return () => {
            isActive = false;
            // Optionally: socket.emit('leave_room', activeRoomId); // Though we are keeping sidebar open, so maybe don't strictly leave!
        };
    }, [activeRoomId, isAuthenticated]);

    // Handle sending a real message
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !activeRoomId || !user) return;
        
        const tempContent = messageInput;
        setMessageInput(''); // Optimistic clear

        try {
            // 1. Post to API
            const sentMessage = await apiClient.post<Message & { chatRoomId: string }>(`/chat/rooms/${activeRoomId}/messages`, {
                content: tempContent
            });

            // 2. Render locally immediately if we haven't already received it via sockets
            setMessages(prev => {
                if (prev.some(m => m.id === sentMessage.id)) return prev;
                return [...prev, sentMessage];
            });

            // 3. Emit via socket to others
            socketRef.current?.emit('send_message', { 
                roomId: activeRoomId, 
                message: sentMessage 
            });

            // 4. Update local room summary
            setRooms(prevRooms => prevRooms.map(room => {
                if (room.id === activeRoomId) {
                    return { ...room, updatedAt: sentMessage.createdAt, messages: [sentMessage] };
                }
                return room;
            }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

        } catch (error) {
            console.error('Failed to send message:', error);
            // Optionally could restore tempContent into messageInput if it failed
        }
    };

    // Helper: Find the target user in a 1-1 chat
    const getTargetUser = (room: ChatRoom) => {
        if (room.isGroup) return null; // Logic for group chat isn't implemented strictly here
        const targetMember = room.members.find(m => m.user.id !== user?.id);
        return targetMember?.user;
    };

    // Handle starting a new direct message
    const startDirectMessage = async (targetUserId: string) => {
        try {
            const room = await apiClient.post<ChatRoom>('/chat/direct', { targetUserId });
            setRooms(prev => {
                const exists = prev.find(r => r.id === room.id);
                if (exists) return prev;
                return [room, ...prev];
            });
            setActiveRoomId(room.id);
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };


    if (!isMounted) {
        return <div className="min-h-screen bg-[#020305] text-white/50 flex items-center justify-center text-sm">Loading chat interface...</div>;
    }

    if (!user || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#020305] text-white flex flex-col items-center justify-center">
                <p className="mb-4">Please log in to view messages.</p>
                <Link href="/login" className="px-6 py-2 bg-[#8B5CF6] rounded-xl text-white font-medium hover:bg-[#7c3aed] transition-colors">Go to Login</Link>
            </div>
        );
    }

    const activeRoom = rooms.find(r => r.id === activeRoomId);
    const targetUser = activeRoom ? getTargetUser(activeRoom) : null;

    const uniqueRooms = Array.from(new Map(
        rooms.map(room => {
            const tUser = getTargetUser(room);
            const key = tUser ? tUser.id : room.id;
            return [key, room];
        })
    ).values());

    const displayRooms = [...uniqueRooms].sort((a, b) => {
        const timeA = new Date(a.updatedAt).getTime();
        const timeB = new Date(b.updatedAt).getTime();
        return sortOrder === 'Newest' ? timeB - timeA : timeA - timeB;
    });

    return (
        <div className={`messaging-page-root flex h-screen overflow-hidden font-sans transition-colors duration-500 ${isDark ? 'bg-[#020305] text-white' : 'bg-gray-100 text-gray-900'}`}>
            
            {/* COLUMN 1: App Sidebar (Mini) */}
            <motion.div 
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`w-16 flex-shrink-0 flex flex-col items-center py-6 gap-6 z-20 transition-colors duration-500 ${isDark ? 'bg-[#0a0b10] border-r border-white/[0.05]' : 'bg-white border-r border-gray-200'}`}
            >
                {/* Apps Navigation */}
                <Link href="/" className={`p-3 rounded-xl transition-colors group relative ${isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-100'}`}>
                    <Home size={20} className={`transition-colors ${isDark ? 'text-white/40 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
                </Link>
                <button className={`p-3 rounded-xl transition-colors group relative ${isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-100'}`}>
                    <Bell size={20} className={`transition-colors ${isDark ? 'text-white/40 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
                </button>
                <button className={`p-3 rounded-xl transition-colors group relative ${isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-100'}`}>
                    <Folder size={20} className={`transition-colors ${isDark ? 'text-white/40 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
                </button>
                
                <div className={`h-px w-8 my-2 ${isDark ? 'bg-white/[0.05]' : 'bg-gray-200'}`} />
                
                {/* Active App (Messages) */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-[#cdf876]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button className={`p-3 rounded-xl relative z-10 transition-transform active:scale-95 ${isDark ? 'bg-[#cdf876]/10 text-[#cdf876] shadow-[0_0_15px_rgba(205,248,118,0.15)]' : 'bg-[#10b981]/15 text-[#10b981] shadow-sm'}`}>
                        <Share size={20} />
                    </button>
                    {/* Indicator Dot */}
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full ${isDark ? 'bg-[#cdf876]' : 'bg-[#10b981]'}`} />
                </div>

                <div className="flex-1" />

                <button className={`p-3 rounded-xl transition-colors group relative ${isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-100'}`}>
                    <Settings size={20} className={`transition-colors ${isDark ? 'text-white/40 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
                </button>
                <button className={`p-3 rounded-xl transition-colors group relative ${isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-100'}`}>
                    <Info size={20} className={`transition-colors ${isDark ? 'text-white/40 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
                </button>
                <button className="p-3 rounded-xl hover:bg-red-500/10 transition-colors group mt-2">
                    <LogOut size={20} className={`transition-colors ${isDark ? 'text-white/40 group-hover:text-red-400' : 'text-gray-400 group-hover:text-red-500'}`} />
                </button>
            </motion.div>

            {/* COLUMN 2: Inbox / Chat List */}
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 30 }}
                style={{ width: isLeftMinimized ? 0 : leftPanelWidth }}
                className={`flex-shrink-0 flex flex-col z-10 overflow-hidden ${!isDraggingLeftState ? 'transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]' : ''} ${isLeftMinimized ? 'border-none' : (isDark ? 'border-r border-white/[0.05]' : 'border-r border-gray-200')} ${isDark ? 'bg-[#07080c]' : 'bg-gray-50'}`}
            >
                <div style={{ width: leftPanelWidth }} className="h-full flex flex-col flex-shrink-0">
                    <div className="p-6 pb-2 flex-shrink-0">
                    <h2 className={`text-lg font-semibold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Message category</h2>
                    <p className={`text-xs mb-5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{user.email}</p>
                    
                    {/* Search */}
                    <div className="relative group mb-6">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search size={16} className={`transition-colors ${isDark ? 'text-white/30 group-focus-within:text-[#8B5CF6]' : 'text-gray-400 group-focus-within:text-indigo-600'}`} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search Message..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full text-sm rounded-xl pl-9 pr-10 py-2.5 outline-none transition-all ${isDark ? 'bg-[#12131a] text-white border border-white/[0.03] focus:border-[#8B5CF6]/50 focus:bg-[#15161e] placeholder:text-white/20' : 'bg-white text-gray-900 border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 placeholder:text-gray-400'}`}
                        />
                        <button className={`absolute inset-y-0 right-2 flex items-center p-1.5 my-1 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'}`}>
                            <Settings size={14} />
                        </button>
                    </div>

                    {/* Available Users List */}
                    {searchQuery.trim().length > 0 && (
                    <div className="space-y-1 mb-6 relative">
                        {availableUsers.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())).map((u) => {
                            const isSelected = !!activeRoomId && rooms.find(r => r.id === activeRoomId)?.members.some((m: any) => m.user.id === u.id);
                            return (
                                <button
                                    key={u.id}
                                    onClick={() => startDirectMessage(u.id)}
                                    onMouseEnter={() => setIsHoveredSidebar(u.id)}
                                    onMouseLeave={() => setIsHoveredSidebar(null)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl relative transition-colors ${isSelected ? '' : 'hover:text-white text-white/60'}`}
                                >
                                    {/* Liquid Background Hover/Active */}
                                    {isSelected && (
                                        <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-[#8B5CF6]/10 rounded-xl" />
                                    )}
                                    {isHoveredSidebar === u.id && !isSelected && (
                                        <motion.div layoutId="sidebar-hover" className="absolute inset-0 bg-white/[0.03] rounded-xl" />
                                    )}
                                    
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center relative z-10 shadow-lg bg-gradient-to-br from-[#8B5CF6] to-[#7c3aed] overflow-hidden">
                                        {u.avatar ? (
                                            <img src={u.avatar} alt={u.firstName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-xs font-bold">{u.firstName?.charAt(0) || 'U'}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left relative z-10">
                                        <p className={`text-sm font-medium leading-none mb-1 ${isSelected ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-white/80' : 'text-gray-700')}`}>{u.firstName} {u.lastName}</p>
                                        <p className={`text-[10px] leading-none ${isDark ? 'text-white/30' : 'text-gray-500'}`}>Registered User</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold relative z-10 ${isSelected ? (isDark ? 'bg-[#8B5CF6] text-white' : 'bg-indigo-600 text-white') : (isDark ? 'bg-white/5 text-white/40' : 'bg-gray-200 text-gray-500')}`}>
                                        <Plus size={12} />
                                    </div>
                                </button>
                            );
                        })}
                        {availableUsers.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && !isLoading && (
                            <p className={`text-xs text-center py-4 ${isDark ? 'text-white/30' : 'text-gray-500'}`}>No other users found for &quot;{searchQuery}&quot;.</p>
                        )}
                    </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-sm font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Direct Message</h3>
                        <button 
                            onClick={() => setSortOrder(prev => prev === 'Newest' ? 'Oldest' : 'Newest')}
                            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors ${isDark ? 'text-white/50 bg-white/5 hover:bg-white/10 hover:text-white' : 'text-gray-600 bg-gray-200 hover:bg-gray-300 hover:text-gray-900'}`}>
                            {sortOrder} <ChevronDownIcon size={12} className={`transform transition-transform ${sortOrder === 'Oldest' ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Direct Messages List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 custom-scrollbar">
                    {isLoading ? (
                         <div className={`p-4 text-center text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Loading chats...</div>
                    ) : displayRooms.length === 0 ? (
                        <div className={`p-4 text-center text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>No conversations yet.<br/>Find a host or user to chat with!</div>
                    ) : displayRooms.map((room, i) => {
                        const targetUserForRoom = getTargetUser(room);
                        const latestMessage = room.messages?.[0]?.content || 'Started a conversation';
                        
                        return (
                            <motion.button
                                key={room.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + (i * 0.05) }}
                                onClick={() => setActiveRoomId(room.id)}
                                className={`w-full flex items-start gap-3 p-3 rounded-2xl transition-all ${activeRoomId === room.id ? (isDark ? 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/20' : 'bg-indigo-50 border border-indigo-200') : (isDark ? 'hover:bg-white/[0.02] border border-transparent' : 'hover:bg-white border border-transparent')}`}
                            >
                                <div className="relative">
                                    {targetUserForRoom?.avatar ? (
                                        <img src={targetUserForRoom.avatar} alt={targetUserForRoom.firstName} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-white/10">
                                            <span className="text-sm font-bold text-white">{targetUserForRoom?.firstName?.charAt(0) || 'U'}</span>
                                        </div>
                                    )}
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full ${isDark ? 'bg-[#cdf876] border-[#07080c]' : 'bg-[#10b981] border-white'}`} />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className={`text-sm font-medium truncate ${activeRoomId === room.id ? (isDark ? 'text-white' : 'text-indigo-900') : (isDark ? 'text-white/80' : 'text-gray-700')}`}>{targetUserForRoom?.firstName || 'User'} {targetUserForRoom?.lastName || ''}</p>
                                        <span className={`text-[10px] whitespace-nowrap ml-2 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                                            {new Date(room.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                        {latestMessage}
                                    </p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
                </div>
            </motion.div>

            {/* Left Resizer Handle */}
            {!isLeftMinimized && (
                <div 
                    onMouseDown={() => { isDraggingLeft.current = true; setIsDraggingLeftState(true); }}
                    className="w-1 cursor-col-resize hover:bg-[#8B5CF6]/50 transition-colors z-20 shrink-0 select-none ml-[-1px] relative"
                    style={{ height: '100%' }}
                />
            )}

            {/* COLUMN 3: Main Chat Area */}
            <div className={`flex-1 flex flex-col relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#050608]' : 'bg-gray-50'}`}>

                {activeRoomId && targetUser ? (
                    <>
                        {/* Chat Header */}
                        <div className={`h-[76px] flex-shrink-0 border-b flex items-center justify-between px-8 backdrop-blur-xl sticky top-0 z-10 transition-colors duration-500 ${isDark ? 'bg-[#0a0b10]/80 border-white/[0.05]' : 'bg-white/80 border-black/[0.05] shadow-sm'}`}>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setIsLeftMinimized(!isLeftMinimized)} 
                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors mr-2 ${isDark ? 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] text-white/60 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border border-gray-200'}`}
                                    title={isLeftMinimized ? "Expand Messages" : "Collapse Messages"}
                                >
                                    {isLeftMinimized ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                                </button>
                                <div className="relative">
                                    {targetUser.avatar ? (
                                        <img src={targetUser.avatar} alt={targetUser.firstName} className="w-11 h-11 rounded-full object-cover shadow-lg border border-white/10" />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-white/10 shadow-lg">
                                            <span className="text-sm font-bold text-white">{targetUser.firstName?.charAt(0) || 'U'}</span>
                                        </div>
                                    )}
                                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 rounded-full shadow-[0_0_8px_rgba(205,248,118,0.4)] ${isDark ? 'bg-[#cdf876] border-[#0a0b10]' : 'bg-[#10b981] border-white'}`} />
                                </div>
                                <div>
                                    <h2 className={`text-base font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{targetUser.firstName} {targetUser.lastName}</h2>
                                    <p className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}><span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#cdf876]' : 'bg-[#10b981]'}`} /> Online</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] text-white/50 hover:text-yellow-300' : 'bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-500 hover:text-indigo-600'}`}
                                    title="Toggle Theme"
                                >
                                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                                </button>
                                <button 
                                    onClick={() => setIsRightMinimized(!isRightMinimized)}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] text-white/50 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border border-gray-200'}`}
                                    title={isRightMinimized ? "Expand Details" : "Collapse Details"}
                                >
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Thread */}
                        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar relative z-10">
                            <div className="flex justify-center my-4 sticky top-4 z-10">
                                <div className={`px-4 py-1.5 rounded-full backdrop-blur-md text-[10px] uppercase font-bold tracking-wider ${isDark ? 'bg-[#12131a]/80 border border-white/[0.05] text-white/30' : 'bg-white/80 border border-black/[0.05] text-gray-500 shadow-sm'}`}>
                                    Chat History
                                </div>
                            </div>

                            {messages.map((msg, idx) => {
                                const isMe = msg.sender.id === user.id;

                                return (
                                    <motion.div 
                                        key={msg.id || idx}
                                        initial={{ opacity: 0, y: 10, originX: isMe ? 1 : 0 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }} 
                                        className={`flex items-end gap-3 max-w-[75%] ${isMe ? 'self-end flex-row-reverse' : ''}`}
                                    >
                                        {msg.content && (
                                            <div className={`${isMe ? 'bg-gradient-to-br from-[#8B5CF6] to-[#7c3aed] text-white shadow-[0_10px_30px_rgba(139,92,246,0.3)] border border-[#a78bfa]/30 rounded-2xl rounded-br-sm' : isDark ? 'bg-[#12141d] border border-white/[0.03] shadow-lg rounded-2xl rounded-bl-sm text-white/90' : 'bg-white border border-gray-100 shadow-md rounded-2xl rounded-bl-sm text-gray-800'} px-5 py-3.5 text-sm leading-relaxed`} style={{wordBreak: 'break-word'}}>
                                                {msg.content}
                                            </div>
                                        )}
                                        {/* Attachments mapping (Not strictly typed here, just defensive) */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="bg-[#12141d] border border-white/[0.03] p-1.5 rounded-2xl shadow-xl">
                                                {msg.attachments.map((att: any, aIdx: number) => (
                                                    <img key={aIdx} src={att.url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400"} alt="attachment" className="w-64 h-40 object-cover rounded-xl" />
                                                ))}
                                            </div>
                                        )}
                                        <div className={`flex flex-col mb-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className={`text-[10px] flex items-center gap-1 ${isMe ? (isDark ? 'text-[#cdf876]' : 'text-[#8B5CF6]') + ' font-medium' : (isDark ? 'text-white/20' : 'text-gray-400')}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                                {isMe && <CheckCheck size={12} />}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input Area */}
                        <div className={`p-6 border-t z-10 transition-colors ${isDark ? 'bg-[#0a0b10] border-white/[0.05]' : 'bg-white border-black/[0.05]'}`}>
                            <div className={`max-w-4xl mx-auto relative flex items-center gap-3 p-2 rounded-2xl border transition-colors shadow-[0_4px_25px_rgba(0,0,0,0.05)] ${isDark ? 'bg-[#12141d] border-white/[0.05] focus-within:border-[#8B5CF6]/50 focus-within:bg-[#151620]' : 'bg-gray-50 border-gray-200 focus-within:border-[#8B5CF6]/30 focus-within:bg-white'}`}>
                                <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 group ${isDark ? 'bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white' : 'bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200 shadow-sm'}`}>
                                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                                
                                <input 
                                    type="text" 
                                    placeholder="Type a message..." 
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage();
                                        }
                                    }}
                                    className={`flex-1 bg-transparent text-sm outline-none px-2 h-10 ${isDark ? 'text-white placeholder:text-white/20' : 'text-gray-900 placeholder:text-gray-400'}`}
                                />

                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim()}
                                    className={`h-10 px-5 rounded-xl font-bold text-sm tracking-wide flex items-center gap-2 transition-all shadow-md flex-shrink-0 ${messageInput.trim() ? (isDark ? 'bg-[#cdf876] text-[#07080c] shadow-[0_0_20px_rgba(205,248,118,0.3)]' : 'bg-[#10b981] text-white shadow-[0_5px_15px_rgba(16,185,129,0.3)]') : (isDark ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')}`}
                                >
                                    Send <Send size={14} className={messageInput.trim() ? "translate-x-0.5" : ""} />
                                </motion.button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col relative z-10 w-full h-full">
                        <div className="h-[76px] flex-shrink-0 flex items-center justify-between px-8 sticky top-0 z-20">
                            <div>
                                {isLeftMinimized && (
                                <button 
                                    onClick={() => setIsLeftMinimized(false)} 
                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] text-white/60 hover:text-white' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 shadow-sm'}`}
                                >
                                    <PanelLeftOpen size={16} />
                                </button>
                                )}
                            </div>
                            <div>
                                {isRightMinimized && (
                                <button 
                                    onClick={() => setIsRightMinimized(false)} 
                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] text-white/60 hover:text-white' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 shadow-sm'}`}
                                >
                                    <PanelRightOpen size={16} />
                                </button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center select-none pb-20 mt-[-76px]">
                            <div className={`p-8 rounded-full mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-200/50'}`}>
                                <Share size={64} className={`${isDark ? 'text-white/20' : 'text-gray-400'}`} />
                            </div>
                            <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Your Messages</h2>
                            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Select a chat or start a new conversation.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Resizer Handle */}
            {!isRightMinimized && (
                <div 
                    onMouseDown={() => { isDraggingRight.current = true; setIsDraggingRightState(true); }}
                    className="w-1 cursor-col-resize hover:bg-[#8B5CF6]/50 transition-colors z-20 shrink-0 select-none mr-[-1px] relative"
                    style={{ height: '100%' }}
                />
            )}

            {/* COLUMN 4: Details Panel */}
            <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
                style={{ width: isRightMinimized ? 0 : rightPanelWidth }}
                className={`flex-shrink-0 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar z-10 ${isDark ? 'bg-[#07080c]' : 'bg-gray-50'} ${!isDraggingRightState ? 'transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]' : ''} ${isRightMinimized ? 'border-none' : (isDark ? 'border-l border-white/[0.05]' : 'border-l border-gray-200')}`}
            >
                <div style={{ width: rightPanelWidth }} className="h-full flex flex-col flex-shrink-0">
                {targetUser ? (
                    <>
                        {/* Profile Overview */}
                        <div className={`p-8 flex flex-col items-center border-b ${isDark ? 'border-white/[0.03] bg-gradient-to-b from-white/[0.02] to-transparent' : 'border-gray-200 bg-gradient-to-b from-white to-transparent'}`}>
                            <div className={`w-24 h-24 rounded-full overflow-hidden mb-4 border-4 shadow-[0_0_30px_rgba(139,92,246,0.15)] relative group ${isDark ? 'border-[#0a0b10]' : 'border-white'}`}>
                                {targetUser.avatar ? (
                                    <img src={targetUser.avatar} alt={targetUser.firstName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-white">{targetUser.firstName?.charAt(0) || 'U'}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-[#8B5CF6]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />
                            </div>
                            <h2 className={`text-xl font-bold mb-1 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{targetUser.firstName} {targetUser.lastName}</h2>
                            <p className={`text-sm mb-6 font-medium ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Verified Renter</p>

                            {/* Quick Actions */}
                            <div className="flex gap-2 w-full justify-center">
                                {[Bookmark, Lock, Info, Pin].map((Icon, i) => (
                                    <motion.button 
                                        key={i}
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shadow-md hover:shadow-[0_5px_15px_rgba(139,92,246,0.15)] ${isDark ? 'bg-[#12131a] border-white/[0.03] hover:border-[#8B5CF6]/30 text-white/50 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10' : 'bg-white border-gray-200 hover:border-indigo-300 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                    >
                                        <Icon size={16} />
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Settings & Info Accordions */}
                        <div className="p-6 space-y-6 flex-1">
                            
                            <div>
                                <div className="flex items-center justify-between mb-4 hover:opacity-80 cursor-pointer transition-opacity">
                                    <h3 className={`text-sm font-semibold tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>Shared Media</h3>
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}>
                                        <ChevronDownIcon size={14} className={`${isDark ? 'text-white/40' : 'text-gray-500'}`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mb-4 opacity-70">
                                    {/* Mocked for UI */}
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`aspect-square rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer border hover:border-[#8B5CF6]/30 ${isDark ? 'bg-white/5 border-white/[0.03]' : 'bg-gray-100 border-gray-200'}`}>
                                            <img src={`https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200&h=200&sig=${i}`} className="w-full h-full object-cover" alt="shared" />
                                        </div>
                                    ))}
                                </div>
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full py-3 rounded-xl font-bold text-xs tracking-wide transition-all ${isDark ? 'bg-[#cdf876]/10 text-[#cdf876] shadow-[0_5px_20px_rgba(205,248,118,0.1)] hover:bg-[#cdf876]/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm'}`}
                                >
                                    View All
                                </motion.button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={`p-8 text-center text-sm mt-32 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                        Select a chat to view user details
                    </div>
                )}
                </div>
            </motion.div>

        </div>
    );
}

function ChevronDownIcon({ className, size }: { className?: string; size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    )
}
