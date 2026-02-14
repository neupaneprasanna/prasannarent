'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { useRouter } from 'next/navigation';
import { Search, Home, LayoutDashboard, User, Settings, Sparkles, Mic } from 'lucide-react';

export default function CommandMenu() {
    const router = useRouter();
    const isOpen = useAppStore((state) => state.isCommandMenuOpen);
    const setOpen = useAppStore((state) => state.setCommandMenuOpen);
    const [listening, setListening] = React.useState(false);
    const [transcript, setTranscript] = React.useState('');

    const toggleListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Voice search is not supported in this browser.');
            return;
        }

        if (listening) {
            setListening(false);
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setListening(true);
        };

        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            setListening(false);
        };

        recognition.onerror = () => {
            setListening(false);
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognition.start();
    };

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(!isOpen);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [isOpen, setOpen]);

    const runCommand = (command: () => void) => {
        command();
        setOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/90 shadow-2xl backdrop-blur-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Command className="w-full bg-transparent">
                            <div className="flex items-center border-b border-white/5 px-4" cmdk-input-wrapper="">
                                <Search className="mr-2 h-5 w-5 shrink-0 text-white/50" />
                                <Command.Input
                                    placeholder={listening ? "Listening..." : "Type a command or search..."}
                                    className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none text-white placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                                    autoFocus
                                    value={transcript}
                                    onValueChange={setTranscript}
                                />
                                <button
                                    onClick={toggleListening}
                                    className={`p-2 rounded-full transition-colors ${listening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-white/40 hover:text-white'}`}
                                >
                                    <Mic size={16} />
                                </button>
                            </div>

                            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                                <Command.Empty className="py-6 text-center text-sm text-white/30">
                                    No results found.
                                </Command.Empty>

                                <Command.Group heading="Navigation" className="mb-2 text-xs font-medium text-white/30 px-2 py-1.5 uppercase tracking-wider">
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/'))}
                                        className="relative flex cursor-default select-none items-center rounded-lg px-2 py-2 text-sm outline-none text-white/70 data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
                                    >
                                        <Home className="mr-2 h-4 w-4" />
                                        <span>Home</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/dashboard'))}
                                        className="relative flex cursor-default select-none items-center rounded-lg px-2 py-2 text-sm outline-none text-white/70 data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
                                    >
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        <span>Dashboard</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/explore'))}
                                        className="relative flex cursor-default select-none items-center rounded-lg px-2 py-2 text-sm outline-none text-white/70 data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
                                    >
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        <span>Explore Rentals</span>
                                    </Command.Item>
                                </Command.Group>

                                <Command.Group heading="Settings" className="mb-2 text-xs font-medium text-white/30 px-2 py-1.5 uppercase tracking-wider">
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/profile'))}
                                        className="relative flex cursor-default select-none items-center rounded-lg px-2 py-2 text-sm outline-none text-white/70 data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
                                    >
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </Command.Item>
                                    <Command.Item
                                        className="relative flex cursor-default select-none items-center rounded-lg px-2 py-2 text-sm outline-none text-white/70 data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                        <span className="ml-auto text-xs text-white/30">COMING SOON</span>
                                    </Command.Item>
                                </Command.Group>

                                <div className="mt-2 border-t border-white/5 py-2 px-2 text-[10px] text-white/30 flex justify-between">
                                    <span>Search powered by AI</span>
                                    <div className="flex gap-1">
                                        <kbd className="bg-white/10 px-1 rounded">↑</kbd>
                                        <kbd className="bg-white/10 px-1 rounded">↓</kbd>
                                        <span>to navigate</span>
                                        <kbd className="bg-white/10 px-1 rounded ml-2">↵</kbd>
                                        <span>to select</span>
                                    </div>
                                </div>
                            </Command.List>
                        </Command>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
