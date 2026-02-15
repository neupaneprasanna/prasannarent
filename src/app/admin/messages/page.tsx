'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { Loader2, MessageSquare, Search, User, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminMessagesPage() {
    const { token, user: adminUser } = useAdminAuthStore();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [activeConvData, setActiveConvData] = useState<any>(null);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (token) {
            fetchConversations();
        }
    }, [token]);

    useEffect(() => {
        if (selectedId && token) {
            fetchMessages(selectedId);
        }
    }, [selectedId, token]);

    const fetchConversations = async (term = searchTerm) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/messages?search=${term}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setConversations(data.items || []);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (id: string) => {
        setMessagesLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/messages/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setMessages(data.messages || []);
            setActiveConvData(data.conversation);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchConversations();
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-[calc(100vh-120px)] flex gap-6 overflow-hidden">
            {/* Conversations Sidebar */}
            <div className="w-80 flex flex-col bg-[#0d0d14]/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <MessageSquare size={16} className="text-cyan-400" />
                            Global Chats
                        </h2>
                        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold">
                            {conversations.length} Threads
                        </span>
                    </div>
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                        <input
                            type="text"
                            placeholder="Find conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all"
                        />
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 gap-3">
                            <Loader2 className="animate-spin text-cyan-500" size={24} />
                            <span className="text-[10px] text-white/20 font-bold uppercase tracking-wider">Loading history</span>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <Search size={32} className="text-white/5 mb-3" />
                            <p className="text-xs text-white/20 italic font-medium">No matches found</p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const lastMsg = conv.messages?.[0];
                            const p1 = conv.participants[0]?.user;
                            const p2 = conv.participants[1]?.user;

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedId(conv.id)}
                                    className={`w-full group p-3 rounded-xl transition-all relative overflow-hidden ${selectedId === conv.id
                                            ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.05)]'
                                            : 'hover:bg-white/[0.03] border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex -space-x-2">
                                            <div className="w-6 h-6 rounded-full border border-[#0d0d14] bg-white/10 overflow-hidden">
                                                {p1?.avatar ? <img src={p1.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">{p1?.firstName?.[0]}</div>}
                                            </div>
                                            <div className="w-6 h-6 rounded-full border border-[#0d0d14] bg-white/10 overflow-hidden">
                                                {p2?.avatar ? <img src={p2.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">{p2?.firstName?.[0]}</div>}
                                            </div>
                                        </div>
                                        <span className="text-[9px] text-white/20 group-hover:text-white/40 transition-colors">
                                            {formatTime(conv.updatedAt)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] font-bold text-white/90 truncate">
                                            {p1?.firstName} & {p2?.firstName}
                                        </span>
                                        {conv.listing && (
                                            <span className="text-[9px] text-cyan-400/60 font-medium flex items-center gap-1">
                                                <Calendar size={8} />
                                                {conv.listing.title}
                                            </span>
                                        )}
                                        <p className="text-[10px] text-white/30 truncate mt-1 italic">
                                            {lastMsg ? `"${lastMsg.text}"` : "No messages yet"}
                                        </p>
                                    </div>
                                    {selectedId === conv.id && (
                                        <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-500" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col bg-[#0d0d14]/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
                {selectedId ? (
                    <>
                        {/* Conversation Header */}
                        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-white">Monitoring Conversation</h3>
                                        <span className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/40 font-mono">
                                            {selectedId}
                                        </span>
                                    </div>
                                    {activeConvData && (
                                        <p className="text-[10px] text-white/30 mt-0.5">
                                            Participants: <span className="text-white/50">{activeConvData.participants.map((p: any) => `${p.user.firstName} ${p.user.lastName}`).join(' and ')}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            {activeConvData?.listing && (
                                <Link
                                    href={`/admin/listings/${activeConvData.listing.id}`}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-white/60 transition-all"
                                >
                                    <ExternalLink size={12} />
                                    View Listing
                                </Link>
                            )}
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.03),transparent_40%)]">
                            {messagesLoading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <Loader2 className="animate-spin text-cyan-500" size={32} />
                                    <p className="text-xs text-white/20 font-bold uppercase tracking-[0.2em]">Retreiving logs</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-white/20 gap-4">
                                    <MessageSquare size={48} className="opacity-10 stroke-[1.5]" />
                                    <p className="text-sm italic font-medium">No message history recorded</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex gap-4 group"
                                    >
                                        <div className="w-9 h-9 rounded-xl ring-1 ring-white/10 bg-gradient-to-br from-white/10 to-white/5 p-0.5 flex-shrink-0">
                                            <div className="w-full h-full rounded-[10px] overflow-hidden bg-[#0d0d14]">
                                                {msg.sender.avatar ? (
                                                    <img src={msg.sender.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">
                                                        {msg.sender.firstName?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-3 mb-1.5">
                                                <span className="text-[12px] font-extra-bold text-white/80 group-hover:text-white transition-colors">
                                                    {msg.sender.firstName} {msg.sender.lastName}
                                                </span>
                                                <span className="text-[9px] text-white/10 group-hover:text-white/20 transition-colors font-mono uppercase tracking-tighter">
                                                    {new Date(msg.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <div className="text-[13px] text-white/60 leading-relaxed bg-white/[0.03] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none group-hover:bg-white/[0.04] group-hover:border-white/10 transition-all max-w-[85%]">
                                                    {msg.text}
                                                </div>
                                                <div className="absolute -left-2 top-0 w-2 h-2 bg-white/[0.03] border-l border-t border-white/5" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Oversight Footer */}
                        <div className="px-6 py-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-white/10 uppercase tracking-[0.3em]">Auditable oversight stream</span>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                    <span className="text-[10px] text-cyan-500/80 font-bold uppercase tracking-widest">Live Feed</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/10 gap-6">
                        <div className="relative">
                            <MessageSquare size={80} className="opacity-5 stroke-[1]" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-0 bg-cyan-500 blur-3xl opacity-10"
                            />
                        </div>
                        <div className="text-center">
                            <h4 className="text-sm font-bold text-white/30 tracking-[0.2em] mb-2 uppercase">Select Stream</h4>
                            <p className="text-[11px] text-white/10 font-medium">Choose a conversation from the sidebar to begin monitoring</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper icons missing from earlier import if needed
function Shield({ size, className }: { size?: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    )
}
