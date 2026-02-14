'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';

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
    const recognitionRef = useRef<SpeechRecognition | null>(null);

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

    const toggleVoiceSearch = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

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
        router.push(`/explore?search=${encodeURIComponent(query)}`);
    };

    const filteredSuggestions = query
        ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
        : suggestions.slice(0, 5);

    const searchUI = (
        <div className={`relative w-full ${focused ? 'z-[1000]' : 'z-[1]'} search-element`}>
            <form
                onSubmit={handleSearch}
                className={`relative flex items-center rounded-2xl overflow-hidden transition-all duration-500 ${focused
                    ? 'glass-strong shadow-[0_0_50px_rgba(108,92,231,0.3)] border-[#6c5ce7]/50 scale-[1.02] bg-[#0a0a14]/90'
                    : 'glass border-white/5'
                    } z-10`}
            >
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={focused ? {
                        boxShadow: ['0 0 20px rgba(108,92,231,0.2)', '0 0 40px rgba(108,92,231,0.4)', '0 0 20px rgba(108,92,231,0.2)']
                    } : { boxShadow: '0 0 0px rgba(108,92,231,0)' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Search icon */}
                <div className="pl-5 pr-2 text-white/30">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search anything to rent..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="flex-1 px-3 py-4 md:py-5 bg-transparent text-white/90 placeholder:text-white/25 outline-none text-sm md:text-base cursor-text"
                    suppressHydrationWarning
                />

                {/* AI badge */}
                <div className="hidden sm:flex items-center gap-2 px-3">
                    <span className="px-2.5 py-1 rounded-lg bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 text-[10px] text-[#a29bfe] font-medium tracking-wider">
                        AI
                    </span>
                </div>

                {/* Voice */}
                <div className="relative flex items-center">
                    <button
                        onClick={toggleVoiceSearch}
                        className={`px-4 transition-all duration-300 relative z-10 ${isListening ? 'text-[#ff4757]' : 'text-white/30 hover:text-white/60'
                            }`}
                        suppressHydrationWarning
                        title="Voice Search"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" x2="12" y1="19" y2="22" />
                        </svg>

                        {/* Listening pulse effect */}
                        {isListening && (
                            <motion.span
                                className="absolute inset-0 bg-[#ff4757]/20 rounded-full"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 2, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            />
                        )}
                    </button>

                    <AnimatePresence>
                        {isListening && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="absolute right-full mr-2 whitespace-nowrap text-[10px] text-[#ff4757] font-bold tracking-[0.2em] uppercase"
                            >
                                Listening...
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Search button */}
                <div className="pr-2">
                    <button
                        type="submit"
                        onMouseDown={(e) => e.preventDefault()}
                        className="px-5 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#6c5ce7]/20 transition-all relative z-10"
                        suppressHydrationWarning
                    >
                        Search
                    </button>
                </div>
            </form>

            {/* Dropdown */}
            <AnimatePresence>
                {focused && (
                    <motion.div
                        className="absolute top-full left-0 right-0 mt-4 glass-strong rounded-2xl overflow-hidden z-[50] shadow-2xl border border-white/10"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="py-2">
                            <div className="px-4 py-2 border-b border-white/5 mb-2">
                                <span className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold">
                                    {query ? 'Search Results' : 'Trending Now'}
                                </span>
                            </div>
                            {filteredSuggestions.map((suggestion, i) => (
                                <motion.button
                                    key={suggestion}
                                    className="w-full px-4 py-3 flex items-center gap-3 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all text-left group"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        setQuery(suggestion);
                                        inputRef.current?.focus();
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 group-hover:bg-[#6c5ce7]/20 group-hover:text-[#a29bfe] transition-colors">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="m21 21-4.35-4.35" />
                                        </svg>
                                    </div>
                                    <span className="flex-1">{suggestion}</span>
                                    <span className="text-[10px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">Press Enter</span>
                                </motion.button>
                            ))}
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
                    className="absolute inset-0 bg-[#050508]/60 cursor-pointer pointer-events-auto"
                    style={{
                        background: 'radial-gradient(circle at center, transparent 0%, rgba(5,5,8,0.9) 100%)'
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
