'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { useAIAgent } from '@/hooks/useAIAgent';
import {
    Sparkles, X, Send, Mic, Loader2, Bot, User, Check, XCircle,
    ChevronRight, Trash2, ArrowRight, MapPin, Star, DollarSign, 
    Package, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Typing Indicator ───
function TypingIndicator() {
    return (
        <div className="flex items-center gap-1.5 px-4 py-3">
            <div className="flex items-center gap-1">
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[#8B5CF6]"
                        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                ))}
            </div>
            <span className="text-xs text-white/30 ml-2">Nexis AI is thinking...</span>
        </div>
    );
}

// ─── Listing Card (for search results) ───
function ListingCard({ listing, onClick }: { listing: any; onClick: () => void }) {
    return (
        <motion.button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-left group"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#8B5CF6]/20 to-[#A5B4FC]/20 flex items-center justify-center border border-white/[0.06] shrink-0 overflow-hidden">
                {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                    <Package className="h-5 w-5 text-white/30" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">{listing.title}</p>
                <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                    {listing.category && <span>{listing.category}</span>}
                    {listing.rating > 0 && (
                        <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {listing.rating.toFixed(1)}
                        </span>
                    )}
                </div>
            </div>
            <div className="text-right shrink-0">
                <span className="text-sm font-semibold text-[#cdf876]">${listing.price}</span>
                <p className="text-[10px] text-white/30">/{listing.priceUnit?.toLowerCase() || 'day'}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
        </motion.button>
    );
}

// ─── Action Confirmation Card ───
function ConfirmationCard({ action, onConfirm, onReject, isProcessing }: {
    action: { type: string; payload: any };
    onConfirm: () => void;
    onReject: () => void;
    isProcessing: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-1 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] backdrop-blur-sm"
        >
            <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-xs font-medium text-amber-300">Confirmation Required</span>
            </div>
            <p className="text-sm text-white/70 mb-3">
                {action.type === 'cancel_booking' && `Cancel booking ${action.payload.bookingId?.slice(0, 8)}...?`}
                {action.type === 'delete' && 'Are you sure you want to delete this?'}
            </p>
            <div className="flex gap-2">
                <motion.button
                    onClick={onConfirm}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#cdf876]/20 text-[#cdf876] text-sm font-medium hover:bg-[#cdf876]/30 transition-colors disabled:opacity-50"
                    whileTap={{ scale: 0.95 }}
                >
                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Yes, proceed
                </motion.button>
                <motion.button
                    onClick={onReject}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.05] text-white/50 text-sm font-medium hover:bg-white/[0.08] transition-colors disabled:opacity-50"
                    whileTap={{ scale: 0.95 }}
                >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel
                </motion.button>
            </div>
        </motion.div>
    );
}

// ─── Suggestion Chips ───
function SuggestionChips({ suggestions, onSelect }: { suggestions: string[]; onSelect: (s: string) => void }) {
    if (!suggestions.length) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mt-2 px-1">
            {suggestions.map((s, i) => (
                <motion.button
                    key={i}
                    onClick={() => onSelect(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                >
                    {s}
                </motion.button>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════
//  MAIN AI PANEL
// ═══════════════════════════════════════════

export default function NexisAI() {
    const isOpen = useAppStore(s => s.isAIAgentOpen);
    const setOpen = useAppStore(s => s.setAIAgentOpen);
    const activeChatContext = useAppStore(s => s.activeChatContext);
    const { isAuthenticated, token } = useAuthStore();
    const pathname = usePathname();
    const isMessagesPage = pathname?.startsWith('/messages');

    const { messages, isProcessing, pendingAction, sendMessage, confirmAction, rejectAction, clearChat } = useAIAgent();

    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Keyboard shortcut: Ctrl+J
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(!isOpen);
            }
            if (e.key === 'Escape' && isOpen) {
                setOpen(false);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, setOpen]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isProcessing) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    // ─── Voice Recognition via Whisper API ───
    const startVoiceInput = useCallback(async () => {
        if (isListening) {
            // Stop recording
            mediaRecorderRef.current?.stop();
            setIsListening(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const audioChunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Release microphone immediately
                stream.getTracks().forEach(track => track.stop());
                
                if (audioChunks.length === 0) return;
                
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                setIsTranscribing(true);
                toast.loading("Transcribing...", { id: 'transcribe' });

                try {
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'audio.webm');

                    const res = await fetch('/api/ai-voice', {
                        method: 'POST',
                        headers: {
                            ...(token ? { Authorization: `Bearer ${token}` } : {})
                        },
                        body: formData
                    });

                    const data = await res.json();
                    
                    if (!res.ok) throw new Error(data.error || 'Server error');
                    
                    if (data.text?.trim()) {
                        setInputValue(data.text.trim());
                        toast.success("Done!", { id: 'transcribe' });
                        
                        // Focus the input so the user can hit Enter or edit it
                        setTimeout(() => {
                            inputRef.current?.focus();
                        }, 100);
                    } else {
                        toast.dismiss('transcribe');
                    }
                } catch (err: any) {
                    console.error('Whisper transcription failed:', err);
                    toast.error(`Transcription Failed: ${err.message}`, { id: 'transcribe' });
                } finally {
                    setIsTranscribing(false);
                }
            };

            mediaRecorder.start();
            setIsListening(true);
            toast.success("Listening...");

        } catch (error) {
            console.error('Microphone access denied:', error);
            toast.error('Microphone access denied. Please check your browser permissions.');
        }
    }, [isListening, sendMessage]);

    // ─── Render Helper: Parse listings from tool results ───
    const extractListings = (toolResults?: any[]) => {
        if (!toolResults) return [];
        for (const r of toolResults) {
            if (r.tool === 'search_listings' && r.success && r.data?.listings) {
                return r.data.listings;
            }
        }
        return [];
    };

    const renderNavigationBadge = (actions?: any[]) => {
        if (!actions) return null;
        const nav = actions.find((a: any) => a.type === 'navigate' && !a.requiresConfirmation);
        if (!nav) return null;
        return (
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 text-xs text-[#A5B4FC] mt-2"
            >
                <ArrowRight className="w-3 h-3" />
                Navigating to {nav.payload.page}
            </motion.div>
        );
    };

    // Don't render for non-authenticated users (AFTER all hooks)
    if (!isAuthenticated) return null;

    return (
        <>
            {/* Override global cursor: none !important for the AI panel on pages where CustomCursor is disabled */}
            {isMessagesPage && (
                <style dangerouslySetInnerHTML={{ __html: `
                    .nexis-ai-panel, .nexis-ai-panel * {
                        cursor: auto !important;
                    }
                `}} />
            )}

            {/* ─── Floating Trigger Button ─── */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        drag
                        dragMomentum={false}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={() => setOpen(true)}
                        className="nexis-ai-panel fixed bottom-6 left-6 sm:bottom-10 sm:left-10 z-[9999] w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl group overflow-hidden touch-none"
                        style={{
                            background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                            boxShadow: '0 8px 40px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
                        }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        aria-label="Open Nexis AI"
                    >
                        {/* Pulse ring */}
                        <motion.div
                            className="absolute inset-0 rounded-2xl border-2 border-[#8B5CF6]"
                            animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                        />
                        <Sparkles className="w-6 h-6 text-white relative z-10" />

                        {/* Tooltip */}
                        <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{ background: 'rgba(10,11,16,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            Nexis AI <span className="text-white/40 ml-1">⌘J</span>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ─── AI Chat Panel ─── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="nexis-ai-panel fixed z-[9999] flex flex-col
                            bottom-0 right-0 w-full h-[100dvh]
                            sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[600px] sm:max-h-[80vh] sm:rounded-2xl
                            border-0 sm:border border-white/[0.08]
                            overflow-hidden"
                        style={{
                            background: 'linear-gradient(180deg, rgba(10,11,16,0.98), rgba(8,9,14,0.99))',
                            backdropFilter: 'blur(40px)',
                            WebkitBackdropFilter: 'blur(40px)',
                            boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
                        }}
                    >
                        {/* ─── Header ─── */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
                                    >
                                        <Sparkles className="w-4.5 h-4.5 text-white" />
                                    </div>
                                    <motion.div
                                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#cdf876] border-2 border-[#0a0b10]"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white/90 tracking-wide">Nexis AI</h3>
                                    <p className="text-[10px] text-white/30">Autonomous Agent • Online</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                {messages.length > 0 && (
                                    <motion.button
                                        onClick={clearChat}
                                        className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                                        whileTap={{ scale: 0.9 }}
                                        title="Clear chat"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                )}
                                <motion.button
                                    onClick={() => setOpen(false)}
                                    className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X className="w-4.5 h-4.5" />
                                </motion.button>
                            </div>
                        </div>

                        {/* ─── Messages Area ─── */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
                            {/* Welcome message when empty */}
                            {messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-col items-center text-center pt-8 pb-4"
                                >
                                    <motion.div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                                        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.2))', border: '1px solid rgba(139,92,246,0.15)' }}
                                        animate={{ rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    >
                                        <Sparkles className="w-7 h-7 text-[#A5B4FC]" />
                                    </motion.div>
                                    <h3 className="text-lg font-semibold text-white/90 mb-1.5">Hey! I&apos;m Nexis AI</h3>
                                    <p className="text-sm text-white/40 max-w-[280px] leading-relaxed">
                                        I can search items, manage bookings, navigate you anywhere, and more. Just ask!
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-[320px]">
                                        {(activeChatContext ? [
                                            { label: "Summarize chat", icon: MessageSquare },
                                            { label: "Extract agreed price", icon: DollarSign },
                                            { label: "Draft a polite reply", icon: Send },
                                            { label: "Decline the offer", icon: XCircle },
                                        ] : [
                                            { label: "Find cheapest items", icon: DollarSign },
                                            { label: "Show my bookings", icon: Package },
                                            { label: "Go to messages", icon: MessageSquare },
                                            { label: "Summarize this page", icon: Star },
                                        ]).map((item, i) => (
                                            <motion.button
                                                key={i}
                                                onClick={() => { sendMessage(item.label); }}
                                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-white/50 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/70 hover:border-white/[0.1] transition-all text-left"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.97 }}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 + i * 0.08 }}
                                            >
                                                <item.icon className="w-3.5 h-3.5 shrink-0 text-[#8B5CF6]" />
                                                {item.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Chat Messages */}
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    {/* Avatar */}
                                    <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
                                        msg.role === 'user'
                                            ? 'bg-white/[0.08]'
                                            : 'bg-gradient-to-br from-[#8B5CF6]/30 to-[#6D28D9]/30 border border-[#8B5CF6]/15'
                                    }`}>
                                        {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-white/60" /> : <Bot className="w-3.5 h-3.5 text-[#A5B4FC]" />}
                                    </div>

                                    {/* Content */}
                                    <div className={`flex flex-col max-w-[82%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        {msg.isLoading ? (
                                            <TypingIndicator />
                                        ) : (
                                            <>
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                                    msg.role === 'user'
                                                        ? 'bg-[#8B5CF6]/20 text-white/90 rounded-tr-md'
                                                        : 'bg-white/[0.04] text-white/80 rounded-tl-md border border-white/[0.04]'
                                                }`}>
                                                    {msg.content}
                                                </div>

                                                {/* Navigation badge */}
                                                {renderNavigationBadge(msg.actions)}

                                                {/* Listing results */}
                                                {extractListings(msg.toolResults).length > 0 && (
                                                    <div className="mt-2 space-y-1.5 w-full">
                                                        {extractListings(msg.toolResults).map((listing: any) => (
                                                            <ListingCard
                                                                key={listing.id}
                                                                listing={listing}
                                                                onClick={() => {
                                                                    window.location.href = `/item/${listing.id}`;
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Confirmation card for pending actions */}
                                                {pendingAction && pendingAction.messageId === msg.id && (
                                                    <div className="mt-2 w-full">
                                                        <ConfirmationCard
                                                            action={{ type: pendingAction.tool, payload: pendingAction.args }}
                                                            onConfirm={confirmAction}
                                                            onReject={rejectAction}
                                                            isProcessing={isProcessing}
                                                        />
                                                    </div>
                                                )}

                                                {/* Suggestions */}
                                                {msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && (
                                                    <SuggestionChips suggestions={msg.suggestions} onSelect={handleSuggestionClick} />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* ─── Input Area ─── */}
                        <div className="shrink-0 px-4 pb-4 pt-2 sm:pb-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                            <AnimatePresence>
                                {activeChatContext && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 mb-2.5 px-1 overflow-hidden">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400/80">Context Linked: Chat with {activeChatContext.roomName || 'User'}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={isListening ? 'Listening...' : isTranscribing ? 'Transcribing...' : 'Ask anything...'}
                                        disabled={isProcessing || isTranscribing}
                                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 outline-none focus:border-[#8B5CF6]/30 focus:bg-white/[0.06] transition-all disabled:opacity-50"
                                    />

                                    {/* Voice button inside input */}
                                    <button
                                        type="button"
                                        onClick={startVoiceInput}
                                        disabled={isTranscribing}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                                            isListening
                                                ? 'bg-red-500/20 text-red-400 animate-pulse'
                                                : isTranscribing 
                                                    ? 'text-[#8B5CF6] animate-pulse cursor-wait'
                                                    : 'text-white/30 hover:text-white/60 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <Mic className="w-4 h-4" />
                                    </button>
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={!inputValue.trim() || isProcessing}
                                    className="p-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                                    style={{
                                        background: inputValue.trim() ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'rgba(255,255,255,0.04)',
                                    }}
                                    whileHover={inputValue.trim() ? { scale: 1.05 } : {}}
                                    whileTap={inputValue.trim() ? { scale: 0.9 } : {}}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-4.5 h-4.5 text-white animate-spin" />
                                    ) : (
                                        <Send className="w-4.5 h-4.5 text-white" />
                                    )}
                                </motion.button>
                            </form>

                            <div className="flex items-center justify-between mt-2 px-1">
                                <span className="text-[10px] text-white/20">Powered by Nexis AI</span>
                                <span className="text-[10px] text-white/20 flex items-center gap-1">
                                    <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-[9px]">⌘</kbd>
                                    <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-[9px]">J</kbd>
                                    to toggle
                                </span>
                            </div>
                        </div>

                        {/* Accent glow at top */}
                        <motion.div
                            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)' }}
                            animate={{ opacity: [0.3, 0.8, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
