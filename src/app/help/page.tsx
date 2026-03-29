'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import {
    HelpCircle, Search, ChevronDown,
    Mail, Phone, ArrowRight, Shield, CreditCard, Package,
    Calendar, Users, AlertTriangle, FileText
} from 'lucide-react';

const faqs = [
    {
        category: 'Renting',
        icon: <Package size={16} />,
        items: [
            { q: 'How do I rent an item?', a: 'Browse listings, select the item you want, choose your rental dates, and submit a booking request. The owner will approve or decline your request.' },
            { q: 'What if the item is damaged during my rental?', a: 'You should immediately notify the owner and document any damage with photos. Our dispute resolution team can mediate if needed.' },
            { q: 'Can I extend my rental period?', a: 'Yes! Contact the owner using the information provided in your booking details before your rental period ends to request an extension.' },
            { q: 'How do I cancel a booking?', a: 'Go to your Dashboard > Bookings, find the booking, and click Cancel. Cancellation policies vary by listing.' },
        ]
    },
    {
        category: 'Hosting',
        icon: <Users size={16} />,
        items: [
            { q: 'How do I list an item for rent?', a: 'Click the "+" button on any page, or go to "Create New Listing" from your dashboard. Fill in the details, add photos, set your pricing, and publish.' },
            { q: 'How do I manage my listings?', a: 'Go to Settings > My Listings to edit, pause, or delete your listings. You can also manage pricing and availability.' },
            { q: 'How do I set different pricing for different durations?', a: 'When creating or editing a listing, use the Pricing Manager to set hourly, daily, weekly, and monthly rates.' },
        ]
    },
    {
        category: 'Payments',
        icon: <CreditCard size={16} />,
        items: [
            { q: 'How do payments work?', a: 'Payments are handled securely through our platform. Renters pay when a booking is confirmed, and owners receive payment after the rental is completed.' },
            { q: 'When will I receive my payout?', a: 'Payouts are processed within 3-5 business days after the rental period ends and the item is returned.' },
        ]
    },
    {
        category: 'Safety',
        icon: <Shield size={16} />,
        items: [
            { q: 'Is my personal information secure?', a: 'Yes. We use industry-standard encryption and never share your personal information with third parties without your consent.' },
            { q: 'What if I have a dispute with another user?', a: 'Contact our support team through the Help Center. We have a dedicated dispute resolution process to help resolve issues fairly.' },
        ]
    },
];

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [openItems, setOpenItems] = useState<Set<string>>(new Set());
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const toggleItem = (id: string) => {
        const newOpen = new Set(openItems);
        if (newOpen.has(id)) newOpen.delete(id);
        else newOpen.add(id);
        setOpenItems(newOpen);
    };

    const filteredFaqs = faqs.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
            !searchQuery.trim() ||
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat =>
        (!activeCategory || cat.category === activeCategory) &&
        cat.items.length > 0
    );

    return (
        <main className="relative min-h-screen bg-[#030304]">
            <Navbar />

            <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-10 max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6c5ce7]/20 to-[#a29bfe]/20 flex items-center justify-center mx-auto mb-4 border border-[#6c5ce7]/20">
                        <HelpCircle size={28} className="text-[#a29bfe]" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">How can we help?</h1>
                    <p className="text-sm text-white/40 max-w-md mx-auto">Find answers to common questions or get in touch with our support team</p>
                </motion.div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="relative max-w-lg mx-auto">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for help..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#6c5ce7]/40 transition-colors"
                        />
                    </div>
                </motion.div>

                {/* Category chips */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-wrap justify-center gap-2 mb-8"
                >
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${!activeCategory
                            ? 'bg-[#6c5ce7]/20 text-[#a29bfe] border border-[#6c5ce7]/30'
                            : 'bg-white/5 text-white/40 hover:text-white/60 border border-white/10'
                            }`}
                    >
                        All Topics
                    </button>
                    {faqs.map(cat => (
                        <button
                            key={cat.category}
                            onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${activeCategory === cat.category
                                ? 'bg-[#6c5ce7]/20 text-[#a29bfe] border border-[#6c5ce7]/30'
                                : 'bg-white/5 text-white/40 hover:text-white/60 border border-white/10'
                                }`}
                        >
                            {cat.icon} {cat.category}
                        </button>
                    ))}
                </motion.div>

                {/* FAQ Sections */}
                <div className="space-y-6">
                    {filteredFaqs.map((cat, ci) => (
                        <motion.div
                            key={cat.category}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + ci * 0.05 }}
                        >
                            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="text-[#a29bfe]">{cat.icon}</span> {cat.category}
                            </h2>
                            <div className="space-y-2">
                                {cat.items.map((item, ii) => {
                                    const id = `${ci}-${ii}`;
                                    const isOpen = openItems.has(id);
                                    return (
                                        <div
                                            key={id}
                                            className="glass-card rounded-xl border border-white/5 overflow-hidden"
                                        >
                                            <button
                                                onClick={() => toggleItem(id)}
                                                className="w-full flex items-center justify-between p-4 text-left"
                                            >
                                                <span className="text-sm font-medium text-white/80 pr-4">{item.q}</span>
                                                <motion.div
                                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="flex-shrink-0"
                                                >
                                                    <ChevronDown size={16} className="text-white/30" />
                                                </motion.div>
                                            </button>
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: 'auto' }}
                                                        exit={{ height: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className="px-4 pb-4 text-xs text-white/40 leading-relaxed">{item.a}</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}

                    {filteredFaqs.length === 0 && (
                        <div className="glass-card rounded-2xl p-12 text-center">
                            <Search size={48} className="mx-auto text-white/10 mb-4" />
                            <h3 className="text-lg font-bold text-white/60 mb-2">No results found</h3>
                            <p className="text-sm text-white/30">Try different keywords or browse all topics</p>
                        </div>
                    )}
                </div>

                {/* Contact Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-12"
                >
                    <h2 className="text-xl font-bold text-white mb-4 text-center">Still need help?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <div className="glass-card rounded-2xl p-6 text-center group hover:border-[#6c5ce7]/20 transition-all cursor-pointer">
                            <div className="w-12 h-12 rounded-xl bg-[#00cec9]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#00cec9]/20 transition-colors">
                                <Mail size={20} className="text-[#00cec9]" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-1">Email Us</h3>
                            <p className="text-[10px] text-white/30">support@nexis.com</p>
                        </div>
                        <div className="glass-card rounded-2xl p-6 text-center group hover:border-[#6c5ce7]/20 transition-all cursor-pointer">
                            <div className="w-12 h-12 rounded-xl bg-[#fdcb6e]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#fdcb6e]/20 transition-colors">
                                <FileText size={20} className="text-[#fdcb6e]" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-1">Guidelines</h3>
                            <p className="text-[10px] text-white/30">Community standards</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
