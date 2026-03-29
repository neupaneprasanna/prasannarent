'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import {
    Search, Home, LayoutDashboard, User, Settings, Sparkles, Mic, Loader2,
    MapPin, Heart, Compass, ShoppingBag, MessageSquare, BarChart3, Trophy,
    HelpCircle, LogIn, UserPlus, Eye, ArrowLeftRight, Wrench, BookOpen,
    DollarSign, TrendingUp, FileText, PlusCircle, Clock
} from 'lucide-react';

interface SearchResult {
    listings: Array<{ id: string; title: string; price: number; category: string; owner: { firstName: string; avatar: string | null } }>;
    users: Array<{ id: string; firstName: string; lastName: string; email: string; avatar: string | null; role: string }>;
    collections: Array<{ id: string; name: string; emoji: string; user: { firstName: string } }>;
}

// All navigable pages in the application
const ALL_PAGES = [
    // Main Navigation
    { name: 'Home', href: '/', icon: Home, group: 'Navigation', keywords: ['home', 'landing', 'main', 'start', 'index'] },
    { name: 'Explore Rentals', href: '/explore', icon: Compass, group: 'Navigation', keywords: ['explore', 'browse', 'discover', 'find', 'search', 'rentals', 'listings'] },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Navigation', keywords: ['dashboard', 'overview', 'summary', 'stats', 'home'] },
    { name: 'Trending', href: '#trending', icon: TrendingUp, group: 'Navigation', keywords: ['trending', 'popular', 'hot', 'top'] },
    { name: 'How it Works', href: '#how-it-works', icon: HelpCircle, group: 'Navigation', keywords: ['how', 'works', 'guide', 'tutorial', 'help'] },

    // Account & Activity
    { name: 'My Profile', href: '/profile', icon: User, group: 'Account & Activity', keywords: ['profile', 'account', 'me', 'my', 'user'] },
    { name: 'My Rentals', href: '/rentals', icon: ShoppingBag, group: 'Account & Activity', keywords: ['rentals', 'my rentals', 'rented', 'orders', 'bookings'] },
    { name: 'Wishlist', href: '/wishlist', icon: Heart, group: 'Account & Activity', keywords: ['wishlist', 'saved', 'favorites', 'liked', 'collections', 'heart'] },
    { name: 'Messages', href: '/messages', icon: MessageSquare, group: 'Account & Activity', keywords: ['messages', 'chat', 'inbox', 'conversations', 'dm', 'messaging'] },
    { name: 'Bookings', href: '/booking', icon: BookOpen, group: 'Account & Activity', keywords: ['booking', 'bookings', 'reservations', 'schedule', 'appointments'] },
    { name: 'Recently Viewed', href: '/recently-viewed', icon: Clock, group: 'Account & Activity', keywords: ['recent', 'recently', 'viewed', 'history', 'visited'] },
    { name: 'Compare Items', href: '/compare', icon: ArrowLeftRight, group: 'Account & Activity', keywords: ['compare', 'comparison', 'versus', 'vs', 'side by side'] },
    { name: 'Referrals', href: '/referrals', icon: Trophy, group: 'Account & Activity', keywords: ['referrals', 'refer', 'invite', 'friends', 'rewards'] },

    // Host & Earnings
    { name: 'Host Dashboard', href: '/host', icon: BarChart3, group: 'Host & Earnings', keywords: ['host', 'hosting', 'host dashboard', 'lend', 'rent out'] },
    { name: 'My Listings', href: '/listings', icon: FileText, group: 'Host & Earnings', keywords: ['listings', 'my listings', 'my items', 'products', 'listed'] },
    { name: 'Earnings', href: '/earnings', icon: DollarSign, group: 'Host & Earnings', keywords: ['earnings', 'revenue', 'income', 'money', 'payout', 'payments'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, group: 'Host & Earnings', keywords: ['analytics', 'statistics', 'data', 'insights', 'performance'] },
    { name: 'Expense Tracker', href: '/tracker', icon: TrendingUp, group: 'Host & Earnings', keywords: ['tracker', 'expenses', 'spending', 'budget', 'finance'] },

    // Settings & Support
    { name: 'Settings', href: '/settings', icon: Settings, group: 'Settings & Support', keywords: ['settings', 'preferences', 'configuration', 'account settings', 'options'] },
    { name: 'Help Center', href: '/help', icon: HelpCircle, group: 'Settings & Support', keywords: ['help', 'support', 'faq', 'question', 'assistance', 'contact'] },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench, group: 'Settings & Support', keywords: ['maintenance', 'repair', 'fix', 'service'] },

    // Auth
    { name: 'Login', href: '/login', icon: LogIn, group: 'Auth', keywords: ['login', 'sign in', 'signin', 'log in'] },
    { name: 'Register', href: '/register', icon: UserPlus, group: 'Auth', keywords: ['register', 'sign up', 'signup', 'create account', 'join'] },

    // Admin
    { name: 'Admin Panel', href: '/admin', icon: Wrench, group: 'Admin', keywords: ['admin', 'administration', 'manage', 'panel', 'control'] },
];

// Group colors for visual distinction
const GROUP_COLORS: Record<string, string> = {
    'Navigation': '#8B5CF6',
    'Account & Activity': '#A5B4FC',
    'Host & Earnings': '#cdf876',
    'Settings & Support': '#94A3B8',
    'Auth': '#F472B6',
    'Admin': '#F59E0B',
};

export default function CommandMenu() {
    const router = useRouter();
    const isOpen = useAppStore((state) => state.isCommandMenuOpen);
    const setOpen = useAppStore((state) => state.setCommandMenuOpen);
    const { isAuthenticated, user } = useAuthStore();
    
    const [listening, setListening] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [debouncedQuery, setDebouncedQuery] = React.useState('');
    
    // Remote search state
    const [isLoading, setIsLoading] = React.useState(false);
    const [results, setResults] = React.useState<SearchResult>({ listings: [], users: [], collections: [] });

    // Debounce the typed query
    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Fetch from the API
    React.useEffect(() => {
        const fetchResults = async () => {
            if (debouncedQuery.trim().length < 2) {
                setResults({ listings: [], users: [], collections: [] });
                return;
            }
            setIsLoading(true);
            try {
                const res = await fetch(`/api/global-search?q=${encodeURIComponent(debouncedQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    // Filter pages based on search query
    const filteredPages = React.useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return ALL_PAGES;

        return ALL_PAGES.filter(page => {
            // Match against name
            if (page.name.toLowerCase().includes(q)) return true;
            // Match against keywords
            if (page.keywords.some(kw => kw.includes(q))) return true;
            // Match against href
            if (page.href.toLowerCase().includes(q)) return true;
            return false;
        });
    }, [searchQuery]);

    // Group filtered pages
    const groupedPages = React.useMemo(() => {
        const groups: Record<string, typeof ALL_PAGES> = {};
        
        // Filter out auth pages if authenticated, and vice-versa for account pages
        const relevantPages = filteredPages.filter(page => {
            if (page.group === 'Auth' && isAuthenticated) return false;
            if (['Account & Activity', 'Host & Earnings'].includes(page.group) && !isAuthenticated && !searchQuery) return false;
            if (page.group === 'Admin' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' && !searchQuery) return false;
            return true;
        });

        for (const page of relevantPages) {
            if (!groups[page.group]) groups[page.group] = [];
            groups[page.group].push(page);
        }
        return groups;
    }, [filteredPages, isAuthenticated, user?.role, searchQuery]);

    const hasRemoteResults = results.listings.length > 0 || results.users.length > 0 || results.collections.length > 0;
    const hasPageResults = Object.keys(groupedPages).length > 0;
    const isSearching = debouncedQuery.trim().length >= 2;

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
            setSearchQuery(text);
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

    // Reset when closed
    React.useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setResults({ listings: [], users: [], collections: [] });
        }
    }, [isOpen]);

    const runCommand = (command: () => void) => {
        command();
        setOpen(false);
    };

    // Shared command item styles
    const itemClass = "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none text-white/70 data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors gap-3";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[12vh] sm:pt-[15vh] p-3 sm:p-4"
                    onClick={() => setOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: -10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: -10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Command 
                            className="w-full bg-transparent flex flex-col" 
                            shouldFilter={false}
                        >
                            <div className="flex items-center border-b border-white/5 px-4 h-14" cmdk-input-wrapper="">
                                <Search className="mr-3 h-5 w-5 shrink-0 text-white/50" />
                                <Command.Input
                                    placeholder={listening ? "Listening..." : "Search pages, listings, users, anything..."}
                                    className="flex w-full rounded-md bg-transparent text-[15px] outline-none text-white placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                                    autoFocus
                                    value={searchQuery}
                                    onValueChange={setSearchQuery}
                                />
                                {isLoading && <Loader2 className="animate-spin text-white/30 mr-2 h-4 w-4" />}
                                <button
                                    onClick={toggleListening}
                                    className={`p-1.5 rounded-full transition-colors ${listening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-white/40 hover:text-white'}`}
                                >
                                    <Mic size={16} />
                                </button>
                            </div>

                            <Command.List className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
                                <Command.Empty className="py-8 text-center text-sm text-white/40 flex flex-col items-center justify-center gap-2">
                                    <Search className="h-8 w-8 text-white/10" />
                                    {isLoading ? 'Searching everything...' : 'No matching results found.'}
                                </Command.Empty>

                                {/* ─── Pages & Navigation ─── */}
                                {hasPageResults && Object.entries(groupedPages).map(([group, pages]) => (
                                    <Command.Group
                                        key={group}
                                        heading={group}
                                        className="mb-1 text-xs font-semibold text-white/30 px-2 py-2 tracking-wider"
                                    >
                                        {pages.map(page => {
                                            const Icon = page.icon;
                                            const color = GROUP_COLORS[page.group] || '#8B5CF6';
                                            return (
                                                <Command.Item
                                                    key={`page-${page.href}`}
                                                    value={`page-${page.name}`}
                                                    onSelect={() => runCommand(() => router.push(page.href))}
                                                    className={itemClass}
                                                >
                                                    <div
                                                        className="p-1.5 rounded-md shrink-0"
                                                        style={{ background: `${color}15` }}
                                                    >
                                                        <Icon className="h-4 w-4" style={{ color }} />
                                                    </div>
                                                    <span className="flex-1 truncate">{page.name}</span>
                                                    <span className="text-[10px] text-white/20 font-mono hidden sm:inline">{page.href}</span>
                                                </Command.Item>
                                            );
                                        })}
                                    </Command.Group>
                                ))}

                                {/* ─── Separator between pages and remote results ─── */}
                                {isSearching && hasPageResults && hasRemoteResults && (
                                    <div className="h-px mx-2 my-2 bg-white/5" />
                                )}

                                {/* ─── Remote: Listings ─── */}
                                {isSearching && results.listings.length > 0 && (
                                    <Command.Group heading="Rentals" className="mb-1 text-xs font-semibold text-white/30 px-2 py-2 tracking-wider">
                                        {results.listings.map(listing => (
                                            <Command.Item
                                                key={`listing-${listing.id}`}
                                                value={`listing-${listing.id}`}
                                                onSelect={() => runCommand(() => router.push(`/item/${listing.id}`))}
                                                className={itemClass}
                                            >
                                                <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                    {listing.owner.avatar ? <img src={listing.owner.avatar} alt="host" className="w-full h-full object-cover" /> : <MapPin className="h-4 w-4 text-white/30" />}
                                                </div>
                                                <div className="flex flex-col flex-1 truncate">
                                                    <span className="font-medium text-white/90 truncate">{listing.title}</span>
                                                    <span className="text-xs text-white/40 truncate">{listing.category}</span>
                                                </div>
                                                <div className="text-xs font-medium text-[#cdf876] bg-[#cdf876]/10 px-2 py-1 rounded">
                                                    ${listing.price}
                                                </div>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {/* ─── Remote: Users ─── */}
                                {isSearching && results.users.length > 0 && (
                                    <Command.Group heading="Users" className="mb-1 text-xs font-semibold text-white/30 px-2 py-2 tracking-wider">
                                        {results.users.map(u => (
                                            <Command.Item
                                                key={`user-${u.id}`}
                                                value={`user-${u.id}`}
                                                onSelect={() => runCommand(() => router.push(`/profile/${u.id}`))}
                                                className={itemClass}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6]/40 to-[#A5B4FC]/40 flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                                                    {u.avatar ? <img src={u.avatar} alt="avatar" className="w-full h-full object-cover" /> : <User className="h-3 w-3 text-white" />}
                                                </div>
                                                <div className="flex flex-col flex-1 truncate">
                                                    <span className="font-medium text-white/90">{u.firstName} {u.lastName}</span>
                                                    <span className="text-xs text-white/40">{u.role}</span>
                                                </div>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}
                                
                                {/* ─── Remote: Collections ─── */}
                                {isSearching && results.collections.length > 0 && (
                                    <Command.Group heading="Wishlist Collections" className="mb-1 text-xs font-semibold text-white/30 px-2 py-2 tracking-wider">
                                        {results.collections.map(collection => (
                                            <Command.Item
                                                key={`collection-${collection.id}`}
                                                value={`collection-${collection.id}`}
                                                onSelect={() => runCommand(() => router.push(`/wishlist?collection=${collection.id}`))}
                                                className={itemClass}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-[#F472B6]/10 text-[#F472B6] flex items-center justify-center border border-[#F472B6]/20 shrink-0">
                                                   {collection.emoji || <Heart className="h-4 w-4" />}
                                                </div>
                                                <div className="flex flex-col flex-1 truncate">
                                                    <span className="font-medium text-white/90">{collection.name}</span>
                                                    <span className="text-xs text-white/40">By {collection.user.firstName}</span>
                                                </div>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {/* ─── Footer ─── */}
                                <div className="mt-2 border-t border-white/5 py-3 px-3 text-[10px] text-white/30 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5"><Search size={10} /> Global Search Active</span>
                                    <div className="flex gap-1.5 items-center">
                                        <kbd className="bg-white/10 px-1.5 py-0.5 rounded shadow-sm border border-white/5 text-white/50">↑</kbd>
                                        <kbd className="bg-white/10 px-1.5 py-0.5 rounded shadow-sm border border-white/5 text-white/50">↓</kbd>
                                        <span className="mx-1">navigate</span>
                                        <kbd className="bg-white/10 px-1.5 py-0.5 rounded shadow-sm border border-white/5 text-white/50 ml-1">↵</kbd>
                                        <span>select</span>
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
