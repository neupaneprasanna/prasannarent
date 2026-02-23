'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LiquidButton from '@/components/motion/LiquidButton';
import { useAppStore } from '@/store/app-store';
import { Loader2 } from 'lucide-react';

// Types for Web Speech API
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: {
        length: number;
        [index: number]: {
            isFinal: boolean;
            [index: number]: {
                transcript: string;
            };
        };
    };
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
    onerror: (event: any) => void;
    start: () => void;
    stop: () => void;
}

const suggestions = [
    'Sony A7IV Camera',
    'Tesla Model 3',
    'Recording Studio in NYC',
    'DJI Mavic Pro Drone',
    'MacBook Pro M3',
    'Camping Gear Set',
    'Wedding Dress Designer',
    'Power Tools Kit',
];

export default function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const { isSearchActive, setSearchActive } = useAppStore();
    const [focused, setFocused] = useState(false);
    const [query, setQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [aiResults, setAiResults] = useState<any[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiIntent, setAiIntent] = useState<{ category: string | null; explanation: string } | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const [searchType, setSearchType] = useState<'rentals' | 'users'>('rentals');
    const [showTypeSelector, setShowTypeSelector] = useState(false);

    // Sync local focused state with global search state
    useEffect(() => {
        if (autoFocus) {
            handleFocus();
            // Small delay to ensure the field is rendered and ready for focus
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [autoFocus]);

    useEffect(() => {
        if (!isSearchActive && focused) {
            setFocused(false);
        }
    }, [isSearchActive, focused]);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionClass) {
            const recognition = new SpeechRecognitionClass() as SpeechRecognition;
            recognitionRef.current = recognition;
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let interimTranscript = '';
                let finalTranscript = '';

                // Correctly iterate through results
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setQuery(finalTranscript);
                    setIsListening(false);
                    recognition.stop();
                    inputRef.current?.focus();
                } else if (interimTranscript) {
                    setQuery(interimTranscript);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                const error = event?.error;
                if (error === 'no-speech' || error === 'audio-capture' || error === 'not-allowed') {
                    setIsListening(false);
                    return;
                }
                console.warn('Speech recognition status:', error);
                setIsListening(false);
            };

            return () => {
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                    recognitionRef.current = null;
                }
            };
        }
    }, []);

    const toggleVoiceSearch = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            try {
                recognitionRef.current.start();
            } catch (err) {
                console.error('Speech recognition start error:', err);
                setIsListening(false);
            }
        }
    };

    useEffect(() => {
        if (!query || query.length < 2) {
            setAiResults([]);
            setAiIntent(null);
            return;
        }

        const fetchSearchResults = async () => {
            setIsAiLoading(true);
            try {
                if (searchType === 'rentals') {
                    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    const data = await response.json();
                    setAiResults(data.results || []);
                    setAiIntent(data.intent || null);
                } else {
                    const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
                    const data = await response.json();
                    setAiResults(data.users || []); // Assuming API handles users
                    setAiIntent(null);
                }
            } catch (error) {
                console.error('Search fetch error:', error);
            } finally {
                setIsAiLoading(false);
            }
        };

        const timer = setTimeout(fetchSearchResults, 800);
        return () => clearTimeout(timer);
    }, [query, searchType]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setFocused(false);
                setSearchActive(false);
            }
        };
        if (focused) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focused, setSearchActive]);

    const handleFocus = () => {
        setFocused(true);
        setSearchActive(true);
    };

    const handleBlur = (e: React.FocusEvent) => {
        // If clicking on suggestions or search results, don't blur immediately
        // Wait for the next tick to see if focus moved to a related element
        if (e.relatedTarget instanceof HTMLElement && e.relatedTarget.closest('.search-element')) {
            return;
        }
        // setFocused(false);
    };

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        setSearchActive(false);
        if (searchType === 'rentals') {
            router.push(`/explore?search=${encodeURIComponent(query)}`);
        }
        // For users, maybe go to a search results page for users? or just stay here?
        // Current requirement implies clicking a user redirects to profile.
        // If they hit enter, maybe we show more results or just do nothing/explore?
    };

    const searchUI = (
        <div className={`relative w-full ${focused ? 'z-[1000]' : 'z-[1]'} search-element`}>
            <form
                onSubmit={handleSearch}
                className={`relative flex items-center rounded-2xl transition-all duration-500 ${focused
                    ? 'glass-strong shadow-[0_0_50px_rgba(139,92,246,0.3)] border-[#8B5CF6]/50 scale-[1.02] bg-[#07080D]/90'
                    : 'glass border-white/5'
                    } z-10`}
            >
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={focused ? {
                        boxShadow: ['0 0 20px rgba(139,92,246,0.2)', '0 0 40px rgba(139,92,246,0.4)', '0 0 20px rgba(139,92,246,0.2)']
                    } : { boxShadow: '0 0 0px rgba(139,92,246,0)' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Search Type Selector */}
                <div className="relative pl-2">
                    <button
                        type="button"
                        onClick={() => setShowTypeSelector(!showTypeSelector)}
                        className="flex items-center gap-1 pl-3 pr-2 py-2 text-white/50 hover:text-white/80 transition-colors text-xs font-medium uppercase tracking-wider relative z-20"
                        suppressHydrationWarning
                    >
                        {searchType === 'rentals' ? 'Rentals' : 'Users'}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${showTypeSelector ? 'rotate-180' : ''}`}>
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>

                    <AnimatePresence>
                        {showTypeSelector && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full left-2 mt-2 w-32 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 glass-strong"
                            >
                                <button
                                    type="button"
                                    onClick={() => { setSearchType('rentals'); setShowTypeSelector(false); inputRef.current?.focus(); }}
                                    className={`w-full px-4 py-2 text-left text-xs font-medium hover:bg-white/5 transition-colors ${searchType === 'rentals' ? 'text-[#8B5CF6]' : 'text-white/60'}`}
                                >
                                    RENTALS
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setSearchType('users'); setShowTypeSelector(false); inputRef.current?.focus(); }}
                                    className={`w-full px-4 py-2 text-left text-xs font-medium hover:bg-white/5 transition-colors ${searchType === 'users' ? 'text-[#8B5CF6]' : 'text-white/60'}`}
                                >
                                    USERS
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Divider */}
                <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={searchType === 'rentals' ? "Search anything to rent..." : "Search for users..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="flex-1 px-3 py-4 md:py-5 bg-transparent text-white/90 placeholder:text-white/25 outline-none text-sm md:text-base cursor-text"
                    suppressHydrationWarning
                />

                {/* AI badge (only for rentals) */}
                {searchType === 'rentals' && (
                    <div className="hidden sm:flex items-center gap-2 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[10px] text-[#A5B4FC] font-medium tracking-wider">
                            AI
                        </span>
                    </div>
                )}

                {/* Voice */}
                <div className="relative flex items-center">
                    <button
                        type="button"
                        onClick={toggleVoiceSearch}
                        className={`px-4 transition-all duration-300 relative z-10 ${isListening ? 'text-[#F472B6]' : 'text-white/30 hover:text-white/60'
                            }`}
                        suppressHydrationWarning
                        title="Voice Search"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" x2="12" y1="19" y2="22" />
                        </svg>
                    </button>
                    {/* ... (listening animation same as before) */}
                </div>

                {/* Search button */}
                <div className="pr-2">
                    <LiquidButton
                        variant="cta"
                        size="sm"
                        type="submit"
                        className="!py-2 !px-5"
                        onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                    >
                        Search
                    </LiquidButton>
                </div>
            </form>

            {/* Dropdown */}
            <AnimatePresence>
                {focused && query.length >= 2 && (
                    <motion.div
                        className="absolute top-full left-0 right-0 mt-4 glass-strong rounded-2xl overflow-hidden z-[50] shadow-2xl border border-white/10"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="py-2">
                            <div className="px-4 py-2 border-b border-white/5 mb-2 flex items-center justify-between">
                                <span className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold">
                                    {isAiLoading ? 'Searching...' : (searchType === 'users' ? 'User Results' : (aiIntent ? 'AI Recommendations' : 'Results'))}
                                </span>
                                {isAiLoading && <Loader2 className="w-3 h-3 animate-spin text-[#8B5CF6]" />}
                            </div>

                            {/* AI Intent only for rentals */}
                            {searchType === 'rentals' && aiIntent && !isAiLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="px-4 py-2 mb-2 mx-4 rounded-xl bg-[#8B5CF6]/5 border border-[#8B5CF6]/10"
                                >
                                    <p className="text-[11px] text-[#A5B4FC] italic">
                                        "{aiIntent.explanation}"
                                    </p>
                                </motion.div>
                            )}

                            {/* Results */}
                            {aiResults.length > 0 ? (
                                aiResults.map((result: any, i) => (
                                    <Link
                                        key={result.id}
                                        href={searchType === 'users' ? `/profile/${result.id}` : `/item/${result.id}`}
                                        className="w-full px-4 py-3 flex items-center gap-3 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all text-left group search-element"
                                        onMouseDown={(e: React.MouseEvent) => {
                                            e.preventDefault();
                                        }}
                                        onClick={() => {
                                            setSearchActive(false);
                                            setFocused(false);
                                        }}
                                    >
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 relative">
                                            {searchType === 'users' ? (
                                                result.avatar ? (
                                                    <img src={result.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#8B5CF6] to-[#A5B4FC] text-[#020305] font-bold rounded-full">
                                                        {result.firstName?.[0]}
                                                    </div>
                                                )
                                            ) : (
                                                (() => {
                                                    const mainImage = result.media?.find((m: any) => m.type === 'IMAGE' || m.type === 'image')?.url ||
                                                        (result.images && result.images.length > 0 ? result.images[0] : null);

                                                    if (mainImage) {
                                                        return <img src={mainImage} alt="" className="w-full h-full object-cover" />;
                                                    }
                                                    return (
                                                        <div className="w-full h-full flex items-center justify-center text-white/20">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="11" cy="11" r="8" />
                                                                <path d="m21 21-4.35-4.35" />
                                                            </svg>
                                                        </div>
                                                    );
                                                })()
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium truncate">
                                                    {searchType === 'users'
                                                        ? `${result.firstName} ${result.lastName}`
                                                        : result.title}
                                                </span>
                                                {searchType === 'users' && result.verified && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#34D399]/10 text-[#34D399] uppercase tracking-wider border border-[#34D399]/20">Verified</span>
                                                )}
                                                {searchType === 'rentals' && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 uppercase tracking-wider">{result.category}</span>
                                                )}
                                            </div>
                                            {searchType === 'users' ? (
                                                <p className="text-[10px] text-white/30 truncate mt-0.5">
                                                    {result.city || 'No location set'}
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-white/30 truncate mt-0.5">${result.price}/{result.priceUnit?.toLowerCase()}</p>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase">
                                            {searchType === 'users' ? 'VIEW PROFILE' : 'VIEW ITEM'}
                                        </span>
                                    </Link>
                                ))
                            ) : !isAiLoading && (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-sm text-white/20 italic">No matches found for your query.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );


    // If focused, we portal the entire experience to body to keep it sharp above the blurred content
    if (focused && typeof document !== 'undefined') {
        return createPortal(
            <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-[#020305]/60 cursor-pointer pointer-events-auto"
                    style={{
                        background: 'radial-gradient(circle at center, transparent 0%, rgba(2,3,5,0.95) 100%)'
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFocused(false);
                        setSearchActive(false);
                    }}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-2xl relative"
                >
                    {searchUI}
                </motion.div>
            </div>,
            document.body
        );
    }

    return searchUI;
}
