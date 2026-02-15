'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { useMessageStore, type Conversation, type ConversationMessage } from '@/store/message-store';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';
import { MessageSquare, Send, ArrowLeft, Search, Loader2, User, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function MessagesPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const {
        conversations, activeConversation, messages,
        loading, messagesLoading,
        fetchConversations, fetchMessages, setActiveConversation, sendMessage, initSocket, disconnectSocket, startConversation
    } = useMessageStore();
    const searchParams = useSearchParams();
    const startWith = searchParams.get('startWith');
    const listingId = searchParams.get('listing');
    const initialMessage = searchParams.get('message');

    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const initializingRef = useRef(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const init = async () => {
            if (initializingRef.current) return;
            initializingRef.current = true;

            await fetchConversations();

            // Handle startWith if present
            if (startWith) {
                // Check if we already have a conversation with this user (ANY conversation)
                const existing = useMessageStore.getState().conversations.find(conv =>
                    conv.participants.some(p => p.user.id === startWith)
                );

                if (existing) {
                    setActiveConversation(existing);
                    setShowMobileChat(true);
                    // If there's an initial message, send it to the existing conversation
                    if (initialMessage && existing.id) {
                        await sendMessage(existing.id, initialMessage);
                        // Remove from URL to avoid resending on refresh
                        const newUrl = window.location.pathname + window.location.search.replace(/[&?]message=[^&]*/, '');
                        window.history.replaceState({}, '', newUrl);
                    }
                } else {
                    // Create a new conversation and send initial message if provided
                    const newConv = await startConversation(startWith, listingId || undefined, initialMessage || undefined);
                    if (newConv) {
                        setActiveConversation(newConv);
                        setShowMobileChat(true);
                        if (initialMessage) {
                            // Remove from URL
                            const newUrl = window.location.pathname + window.location.search.replace(/[&?]message=[^&]*/, '');
                            window.history.replaceState({}, '', newUrl);
                        }
                    }
                }
            }
            initializingRef.current = false;
        };

        init();
        if (user) initSocket(user.id);
        return () => {
            disconnectSocket();
            initializingRef.current = false;
        };
    }, [isAuthenticated, startWith, listingId, initialMessage]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || !activeConversation) return;
        const text = newMessage;
        setNewMessage('');
        await sendMessage(activeConversation.id, text);
    };

    const handleSelectConversation = (conv: Conversation) => {
        setActiveConversation(conv);
        setShowMobileChat(true);
    };

    const handleStartConversationWithUser = async (userToMessage: any) => {
        // If we already have a conversation with this user, just select it
        const existing = conversations.find(conv =>
            conv.participants.some(p => p.user.id === userToMessage.id)
        );

        if (existing) {
            setActiveConversation(existing);
        } else {
            // Otherwise start a new one
            const newConv = await startConversation(userToMessage.id);
            if (newConv) {
                setActiveConversation(newConv);
            }
        }
        setUserSearchTerm('');
        setUserSearchResults([]);
        setShowMobileChat(true);
    };

    const getOtherParticipant = (conv: Conversation) => {
        return conv.participants.find(p => p.user.id !== user?.id)?.user;
    };

    const filteredConversations = conversations
        .filter(conv => {
            if (!searchTerm) return true;
            const other = getOtherParticipant(conv);
            return other?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                other?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conv.listing?.title.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .filter((conv, index, self) => {
            const other = getOtherParticipant(conv);
            if (!other) return false;
            // Only keep the first occurrence of each unique user in the list
            return index === self.findIndex(c => getOtherParticipant(c)?.id === other.id);
        });

    useEffect(() => {
        if (!userSearchTerm || userSearchTerm.length < 2) {
            setUserSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearchingUsers(true);
            try {
                const res = await apiClient.get<{ users: any[] }>(`/users/search?q=${encodeURIComponent(userSearchTerm)}`);
                setUserSearchResults(res.users);
            } catch (err) {
                console.error('Failed to search users:', err);
            } finally {
                setIsSearchingUsers(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [userSearchTerm]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (!isAuthenticated) return null;

    return (
        <>
            <Navbar />
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
                paddingTop: '80px',
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '20px',
                    height: 'calc(100vh - 80px)',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {/* Header */}
                    <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        style={{ marginBottom: '20px' }}
                    >
                        <h1 style={{
                            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                            fontWeight: 700,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}>
                            <MessageSquare size={28} style={{ color: '#818cf8' }} />
                            Messages
                        </h1>
                    </motion.div>

                    {/* Main Content */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        gap: '0',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.02)',
                        backdropFilter: 'blur(20px)',
                        minHeight: 0,
                    }}>
                        {/* Conversation List */}
                        <div style={{
                            width: '380px',
                            borderRight: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                        }} className="conv-list">
                            {/* Global User Search */}
                            <div style={{ padding: '16px 16px 0', borderBottom: 'none' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    background: 'rgba(129, 140, 248, 0.1)',
                                    border: '1px solid rgba(129, 140, 248, 0.2)',
                                }}>
                                    <User size={18} style={{ color: '#818cf8' }} />
                                    <input
                                        type="text"
                                        placeholder="Find users to message..."
                                        value={userSearchTerm}
                                        onChange={e => setUserSearchTerm(e.target.value)}
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: '0.9rem',
                                            outline: 'none',
                                        }}
                                    />
                                    {isSearchingUsers && <Loader2 size={14} className="animate-spin" style={{ color: '#818cf8' }} />}
                                </div>
                            </div>

                            {/* User Results Dropdown/List */}
                            <AnimatePresence>
                                {userSearchTerm.length >= 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{
                                            overflow: 'hidden',
                                            background: 'rgba(129, 140, 248, 0.05)',
                                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                                        }}
                                    >
                                        <div style={{ padding: '10px 16px' }}>
                                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                                                Global User Search
                                            </p>
                                            {userSearchResults.length === 0 && !isSearchingUsers ? (
                                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', padding: '10px 0' }}>No users found</p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {userSearchResults.map(u => (
                                                        <button
                                                            key={u.id}
                                                            onClick={() => handleStartConversationWithUser(u)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                padding: '8px',
                                                                borderRadius: '8px',
                                                                background: 'rgba(255,255,255,0.03)',
                                                                border: '1px solid rgba(255,255,255,0.05)',
                                                                cursor: 'pointer',
                                                                width: '100%',
                                                                textAlign: 'left',
                                                            }}
                                                        >
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', overflow: 'hidden' }}>
                                                                {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.firstName[0]}
                                                            </div>
                                                            <span style={{ fontSize: '0.85rem', color: '#fff' }}>{u.firstName} {u.lastName}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Search */}
                            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}>
                                    <Search size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: '0.9rem',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                                {loading ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                                        <Loader2 size={24} style={{ color: '#818cf8', animation: 'spin 1s linear infinite' }} />
                                    </div>
                                ) : filteredConversations.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.4)' }}>
                                        <MessageSquare size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                        <p>No conversations yet</p>
                                        <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Start a conversation from any listing page</p>
                                    </div>
                                ) : (
                                    filteredConversations.map(conv => {
                                        const other = getOtherParticipant(conv);
                                        const lastMsg = conv.messages[0];
                                        const isActive = activeConversation?.id === conv.id;

                                        return (
                                            <motion.button
                                                key={conv.id}
                                                onClick={() => handleSelectConversation(conv)}
                                                whileHover={{ backgroundColor: 'rgba(129,140,248,0.08)' }}
                                                style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    gap: '12px',
                                                    padding: '14px 12px',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    background: isActive ? 'rgba(129,140,248,0.12)' : 'transparent',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'background 0.2s',
                                                    marginBottom: '4px',
                                                }}
                                            >
                                                {/* Avatar */}
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    overflow: 'hidden',
                                                }}>
                                                    {other?.avatar ? (
                                                        <img src={other.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>
                                                            {other?.firstName?.[0]}{other?.lastName?.[0]}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                                                            {other?.firstName} {other?.lastName}
                                                        </span>
                                                        {lastMsg && (
                                                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
                                                                {formatTime(lastMsg.createdAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {conv.listing && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            marginBottom: '4px',
                                                        }}>
                                                            <Package size={12} style={{ color: '#818cf8' }} />
                                                            <span style={{ color: '#818cf8', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {conv.listing.title}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <p style={{
                                                            color: 'rgba(255,255,255,0.5)',
                                                            fontSize: '0.85rem',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            margin: 0,
                                                            maxWidth: '200px',
                                                        }}>
                                                            {lastMsg ? `${lastMsg.sender.firstName}: ${lastMsg.text}` : 'No messages yet'}
                                                        </p>
                                                        {conv.unreadCount > 0 && (
                                                            <span style={{
                                                                background: '#818cf8',
                                                                color: '#fff',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 700,
                                                                padding: '2px 8px',
                                                                borderRadius: '10px',
                                                                minWidth: '20px',
                                                                textAlign: 'center',
                                                            }}>
                                                                {conv.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Chat Window */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: 0,
                        }} className="chat-window">
                            {activeConversation ? (
                                <>
                                    {/* Chat Header */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px 20px',
                                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                                        background: 'rgba(255,255,255,0.02)',
                                    }}>
                                        <button
                                            onClick={() => { setShowMobileChat(false); setActiveConversation(null); }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'rgba(255,255,255,0.6)',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'none',
                                            }}
                                            className="mobile-back-btn"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                        }}>
                                            {(() => {
                                                const other = getOtherParticipant(activeConversation);
                                                return other?.avatar ? (
                                                    <img src={other.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                                                        {other?.firstName?.[0]}{other?.lastName?.[0]}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div>
                                            <Link
                                                href={`/profile/${getOtherParticipant(activeConversation)?.id}`}
                                                style={{ color: '#fff', fontWeight: 600, textDecoration: 'none' }}
                                            >
                                                {getOtherParticipant(activeConversation)?.firstName} {getOtherParticipant(activeConversation)?.lastName}
                                            </Link>
                                            {activeConversation.listing && (
                                                <p style={{ margin: 0, color: '#818cf8', fontSize: '0.8rem' }}>
                                                    RE: {activeConversation.listing.title}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        padding: '20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                    }}>
                                        {messagesLoading ? (
                                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                                <Loader2 size={24} style={{ color: '#818cf8', animation: 'spin 1s linear infinite' }} />
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px' }}>
                                                <p>No messages yet. Say hello! 👋</p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isMine = msg.senderId === user?.id;
                                                return (
                                                    <motion.div
                                                        key={msg.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                                                        }}
                                                    >
                                                        <div style={{
                                                            maxWidth: '70%',
                                                            padding: '10px 16px',
                                                            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                                            background: isMine
                                                                ? 'linear-gradient(135deg, #818cf8, #6366f1)'
                                                                : 'rgba(255,255,255,0.08)',
                                                            color: '#fff',
                                                        }}>
                                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{msg.text}</p>
                                                            <p style={{
                                                                margin: '4px 0 0',
                                                                fontSize: '0.7rem',
                                                                opacity: 0.6,
                                                                textAlign: 'right',
                                                            }}>
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input */}
                                    <div style={{
                                        padding: '16px 20px',
                                        borderTop: '1px solid rgba(255,255,255,0.06)',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'center',
                                    }}>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                                            placeholder="Type a message..."
                                            style={{
                                                flex: 1,
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(255,255,255,0.05)',
                                                color: '#fff',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                            }}
                                        />
                                        <motion.button
                                            onClick={handleSend}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            disabled={!newMessage.trim()}
                                            style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: newMessage.trim() ? 'linear-gradient(135deg, #818cf8, #6366f1)' : 'rgba(255,255,255,0.1)',
                                                color: '#fff',
                                                cursor: newMessage.trim() ? 'pointer' : 'default',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Send size={18} />
                                        </motion.button>
                                    </div>
                                </>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: 'rgba(255,255,255,0.3)',
                                    textAlign: 'center',
                                    padding: '40px',
                                }}>
                                    <MessageSquare size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                    <h3 style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Select a conversation</h3>
                                    <p style={{ fontSize: '0.9rem' }}>Choose a conversation from the list to start messaging</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <style jsx global>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }

                    @media (max-width: 768px) {
                        .conv-list {
                            width: 100% !important;
                            max-width: ${showMobileChat ? '0 !important' : '100% !important'};
                            min-width: ${showMobileChat ? '0 !important' : '100% !important'};
                        }
                        .chat-window {
                            display: ${showMobileChat ? 'flex' : 'none'} !important;
                        }
                        .mobile-back-btn {
                            display: block !important;
                        }
                    }
                `}</style>
            </div>
        </>
    );
}
