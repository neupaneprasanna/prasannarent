'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Bell, User as UserIcon, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import MagneticButton from '@/components/cursor/MagneticButton';
import SearchBar from '@/components/hero/SearchBar';

const navLinks = [
    { name: 'Explore', href: '/explore' },
    { name: 'Trending', href: '#trending' },
    { name: 'How it Works', href: '#how-it-works' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const isMobileMenuOpen = useAppStore((s) => s.isMobileMenuOpen);
    const setMobileMenuOpen = useAppStore((s) => s.setMobileMenuOpen);
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);

    const isSearchActive = useAppStore((s) => s.isSearchActive);
    const { user, isAuthenticated, logout } = useAuthStore();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Sync navbar search with global search state
    useEffect(() => {
        if (!isSearchActive && showSearch) {
            setShowSearch(false);
        }
    }, [isSearchActive, showSearch]);

    const handleLogout = () => {
        logout();
        setShowProfileMenu(false);
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-6'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6">
                <div className={`relative glass rounded-2xl border border-white/10 px-6 py-3 flex items-center justify-between transition-all duration-500 ${scrolled ? 'bg-black/40 backdrop-blur-xl' : 'bg-white/5 backdrop-blur-md'
                    }`}>

                    {/* Logo */}
                    <motion.a
                        href="/"
                        className="flex items-center gap-2"
                        onMouseEnter={() => setCursorVariant('hover')}
                        onMouseLeave={() => setCursorVariant('default')}
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center">
                            <span className="text-white font-bold">R</span>
                        </div>
                        <span className="text-xl font-bold hidden sm:block">
                            <span className="gradient-text">Rent</span>
                            <span className="text-white/90">Verse</span>
                        </span>
                    </motion.a>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium text-white/60 hover:text-white transition-colors"
                                onMouseEnter={() => setCursorVariant('hover')}
                                onMouseLeave={() => setCursorVariant('default')}
                            >
                                {link.name}
                            </a>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                const nextState = !showSearch;
                                setShowSearch(nextState);
                                useAppStore.getState().setSearchActive(nextState);
                            }}
                            className="p-2 text-white/60 hover:text-white transition-colors"
                            onMouseEnter={() => setCursorVariant('hover')}
                            onMouseLeave={() => setCursorVariant('default')}
                            suppressHydrationWarning
                        >
                            <Search size={20} />
                        </button>

                        <button
                            className="p-2 text-white/60 hover:text-white transition-colors relative"
                            onMouseEnter={() => setCursorVariant('hover')}
                            onMouseLeave={() => setCursorVariant('default')}
                            suppressHydrationWarning
                        >
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff7675] rounded-full border-2 border-black" />
                        </button>

                        <div className="h-4 w-px bg-white/10 hidden sm:block" />

                        {isAuthenticated ? (
                            <div className="relative">
                                <motion.button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-2 p-1 pl-3 rounded-full glass hover:bg-white/10 transition-all border border-white/5"
                                    onMouseEnter={() => setCursorVariant('hover')}
                                    onMouseLeave={() => setCursorVariant('default')}
                                    whileTap={{ scale: 0.95 }}
                                    suppressHydrationWarning
                                >
                                    <span className="text-xs font-medium text-white/80 hidden lg:block">
                                        {user?.firstName}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c5ce7]/50 to-[#a29bfe]/50 flex items-center justify-center text-white text-xs border border-white/10 overflow-hidden">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon size={16} />
                                        )}
                                    </div>
                                </motion.button>

                                <AnimatePresence>
                                    {showProfileMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full right-0 mt-3 w-48 glass rounded-2xl border border-white/10 p-2 shadow-2xl backdrop-blur-2xl"
                                        >
                                            <div className="px-3 py-2 mb-2">
                                                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Account</p>
                                                <p className="text-sm font-medium text-white/90 truncate">{user?.email}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-sm text-white/60 hover:text-white transition-all">
                                                    <LayoutDashboard size={16} /> Dashboard
                                                </a>
                                                <a href="/settings" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-sm text-white/60 hover:text-white transition-all">
                                                    <Settings size={16} /> Settings
                                                </a>
                                                <div className="h-px bg-white/5 my-1" />
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/10 text-sm text-red-400 hover:text-red-300 transition-all font-medium"
                                                >
                                                    <LogOut size={16} /> Logout
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <MagneticButton strength={0.1}>
                                <a
                                    href="/login"
                                    className="hidden sm:flex px-6 py-2 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl text-sm font-medium text-white hover:shadow-lg hover:shadow-[#6c5ce7]/20 transition-all"
                                    onMouseEnter={() => setCursorVariant('hover')}
                                    onMouseLeave={() => setCursorVariant('default')}
                                    suppressHydrationWarning
                                >
                                    Get Started
                                </a>
                            </MagneticButton>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            className="md:hidden p-2 text-white/60"
                            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                            suppressHydrationWarning
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 z-40 md:hidden bg-[#050508]/98 backdrop-blur-3xl p-8 pt-32 flex flex-col"
                    >
                        <div className="flex flex-col gap-6 mb-12">
                            {navLinks.map((link, i) => (
                                <motion.a
                                    key={link.name}
                                    href={link.href}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="text-4xl font-bold hover:text-[#6c5ce7] transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </motion.a>
                            ))}
                        </div>

                        {isAuthenticated ? (
                            <div className="mt-auto space-y-4">
                                <p className="text-white/40 text-sm">Logged in as {user?.firstName}</p>
                                <a href="/dashboard" className="block text-2xl font-semibold" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
                                <button onClick={handleLogout} className="text-2xl font-semibold text-red-400">Logout</button>
                            </div>
                        ) : (
                            <motion.a
                                href="/login"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-auto text-4xl font-bold text-[#6c5ce7]"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Get Started
                            </motion.a>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Float Search Overlay */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-0 right-0 px-6 py-4 pointer-events-none z-[501]"
                    >
                        <div className="max-w-2xl mx-auto pointer-events-auto">
                            <SearchBar autoFocus={showSearch} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
