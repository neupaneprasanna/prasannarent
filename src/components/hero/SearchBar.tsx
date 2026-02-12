'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';

// Types for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: {
        [index: number]: {
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
    const recognitionRef = useRef<any>(null);

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
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                console.log('Voice recognition started');
            };

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

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
                    recognitionRef.current.stop();
                    inputRef.current?.focus();
                } else if (interimTranscript) {
                    setQuery(interimTranscript);
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                const error = event?.error;
                if (error === 'no-speech' || error === 'audio-capture' || error === 'not-allowed') {
                    setIsListening(false);
                    return;
                }
                // Use warn instead of error to avoid Next.js crash overlay in development
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

    const handleFocus = () => {
        setFocused(true);
        setSearchActive(true);
    };

    const handleBlur = () => {
        // We no longer close search on blur to allow interacting with suggestions/overlay
        setFocused(false);
    };

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        setSearchActive(false);
        router.push(`/explore?q=${encodeURIComponent(query)}`);
    };

    const filteredSuggestions = query
        ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
        : suggestions.slice(0, 5);

    return (
        <div className={`relative w-full ${focused ? 'z-[50]' : 'z-[1]'}`}>
            <form
                onSubmit={handleSearch}
                className={`relative flex items-center rounded-2xl overflow-hidden transition-all duration-500 ${focused ? 'glass-strong shadow-2xl shadow-[#6c5ce7]/20 border-[#6c5ce7]/30' : 'glass border-white/5'
                    }`}
            >
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={focused ? { scale: 1.02 } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
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
                        className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-2xl overflow-hidden z-50"
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="py-2">
                            <div className="px-4 py-2">
                                <span className="text-[10px] text-white/30 tracking-widest uppercase">
                                    {query ? 'Results' : 'Popular Searches'}
                                </span>
                            </div>
                            {filteredSuggestions.map((suggestion, i) => (
                                <motion.button
                                    key={suggestion}
                                    className="w-full px-4 py-3 flex items-center gap-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        setQuery(suggestion);
                                        inputRef.current?.focus();
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                    </svg>
                                    {suggestion}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Glow under search when focused */}
            <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse, rgba(108,92,231,0.15) 0%, transparent 70%)',
                }}
                animate={{ opacity: focused ? 1 : 0 }}
                transition={{ duration: 0.3 }}
            />
        </div>
    );
}
