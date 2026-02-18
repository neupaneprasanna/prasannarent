'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCompareStore } from '@/store/compare-store';
import Navbar from '@/components/nav/Navbar';
import { X, Star, MapPin, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ComparePage() {
    const router = useRouter();
    const { items, removeItem, clearItems } = useCompareStore();

    if (items.length === 0) {
        return (
            <main className="min-h-screen pt-24 flex flex-col items-center justify-center bg-[#030304]">
                <Navbar />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/10 mb-8">
                        <Plus size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Your comparison is empty</h1>
                    <p className="text-white/40 mb-8 max-w-md text-center">Add up to 4 items from the explore page to see them side-by-side and find the perfect rental.</p>
                    <Link href="/explore">
                        <button className="px-8 py-4 bg-[#6c5ce7] rounded-2xl font-bold text-white hover:bg-[#5f4dd0] transition-all shadow-xl shadow-[#6c5ce7]/20 border border-[#6c5ce7]/50">
                            Explore Listings
                        </button>
                    </Link>
                </motion.div>
            </main>
        );
    }

    // Extract all unique custom attribute keys across all items
    const allAttributeKeys = Array.from(new Set(
        items.flatMap(item => item.attributes?.map((attr) => attr.key) || [])
    ));

    return (
        <main className="min-h-screen bg-[#030304] pb-20">
            <Navbar />

            <div className="pt-32 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors mb-4 group"
                        >
                            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
                        </button>
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Compare Products</h1>
                            <span className="px-3 py-1 rounded-full bg-[#6c5ce7]/20 border border-[#6c5ce7]/30 text-[#a29bfe] text-xs font-bold">
                                {items.length} / 4
                            </span>
                        </div>
                        <p className="text-white/40">Find the perfect rental by comparing specifications side-by-side.</p>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={clearItems}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500/5 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all border border-red-500/10"
                    >
                        <Trash2 size={14} /> Clear All
                    </motion.button>
                </div>

                <div className="overflow-x-auto no-scrollbar -mx-6 px-6">
                    <div className={`grid gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden min-w-[900px]`}
                        style={{ gridTemplateColumns: `220px repeat(${items.length}, 1fr)` }}>

                        {/* Header Row: Images & Remove buttons */}
                        <div className="bg-black/40 p-8 flex flex-col justify-end">
                            <span className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em] mb-4">Comparison Matrix</span>
                            <div className="h-px w-12 bg-[#6c5ce7]" />
                        </div>

                        {items.map(item => (
                            <div key={item.id} className="bg-black/40 p-6 relative group">
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white/40 hover:text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 z-10"
                                >
                                    <X size={14} />
                                </button>
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 border border-white/10 group-hover:border-[#6c5ce7]/50 shadow-lg transition-all duration-500 group-hover:shadow-[#6c5ce7]/10">
                                    <img src={(item as any).media?.[0]?.url || item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight h-14 mb-2 group-hover:text-[#a29bfe] transition-colors">{item.title}</h3>
                                <div className="flex items-center gap-1 mb-6">
                                    <Star size={12} fill="#fdcb6e" className="text-[#fdcb6e] border-none" />
                                    <span className="text-xs font-bold text-white/80">{item.rating || 'New'}</span>
                                    <span className="text-[10px] text-white/20 ml-1">({item.reviewCount || 0} reviews)</span>
                                </div>
                                <Link href={`/item/${item.id}`} className="block">
                                    <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                        View Product
                                    </button>
                                </Link>
                            </div>
                        ))}

                        {/* Price Row */}
                        <div className="bg-black/20 p-8 flex items-center border-t border-white/5">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Base Rate</span>
                        </div>
                        {items.map(item => (
                            <div key={`price-${item.id}`} className="bg-black/20 p-8 border-t border-white/5">
                                <div className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-1">${item.price}</div>
                                <div className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">per {item.priceUnit?.toLowerCase()}</div>
                            </div>
                        ))}

                        {/* Category Row */}
                        <div className="bg-black/40 p-8 flex items-center border-t border-white/5">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Category</span>
                        </div>
                        {items.map(item => (
                            <div key={`cat-${item.id}`} className="bg-black/40 p-8 border-t border-white/5">
                                <span className="px-3 py-1.5 rounded-lg bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 text-[10px] text-[#a29bfe] font-bold uppercase tracking-[0.15em]">
                                    {item.category}
                                </span>
                            </div>
                        ))}

                        {/* Location Row */}
                        <div className="bg-black/20 p-8 flex items-center border-t border-white/5">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Location</span>
                        </div>
                        {items.map(item => (
                            <div key={`loc-${item.id}`} className="bg-black/20 p-8 border-t border-white/5">
                                <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                                    <MapPin size={12} className="text-[#00cec9]" />
                                    {item.location}
                                </div>
                            </div>
                        ))}

                        {/* Custom Attributes Rows */}
                        {allAttributeKeys.map((key, idx) => (
                            <React.Fragment key={key}>
                                <div className={`p-8 flex items-center border-t border-white/5 ${idx % 2 === 0 ? 'bg-black/40' : 'bg-black/20'}`}>
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{key}</span>
                                </div>
                                {items.map(item => {
                                    const attr = item.attributes?.find((a) => a.key === key);
                                    return (
                                        <div key={`attr-${item.id}-${key}`} className={`p-8 border-t border-white/5 ${idx % 2 === 0 ? 'bg-black/40' : 'bg-black/20'}`}>
                                            <div className="text-xs text-white/80 font-semibold tracking-wide">
                                                {attr ? attr.value : <span className="text-white/5">—</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}

                        {/* Availability Row */}
                        <div className="bg-black/60 p-8 flex items-center border-t border-white/5">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Status</span>
                        </div>
                        {items.map(item => (
                            <div key={`status-${item.id}`} className="bg-black/60 p-8 border-t border-white/5">
                                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${item.available ? 'text-[#00cec9]' : 'text-red-400'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-[#00cec9]' : 'bg-red-400'} ${item.available ? 'animate-pulse' : ''}`} />
                                    {item.available ? 'Available Now' : 'Currently Rented'}
                                </div>
                            </div>
                        ))}

                        {/* Final Action Row */}
                        <div className="bg-black/40 p-8 flex items-center border-t border-white/5">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Action</span>
                        </div>
                        {items.map(item => (
                            <div key={`action-${item.id}`} className="bg-black/40 p-8 border-t border-white/5">
                                <Link href={`/item/${item.id}`} className="block">
                                    <button
                                        disabled={!item.available}
                                        className={`w-full py-4 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-xl ${item.available
                                            ? 'bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white shadow-[#6c5ce7]/20 hover:scale-[1.05] hover:shadow-[#6c5ce7]/40 active:scale-95'
                                            : 'bg-white/5 border border-white/10 text-white/10 cursor-not-allowed'
                                            }`}
                                    >
                                        Select Rental
                                    </button>
                                </Link>
                            </div>
                        ))}

                    </div>
                </div>

                {/* Comparison Footer */}
                <div className="mt-20 p-12 glass-card rounded-[3rem] border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent text-center">
                    <div className="w-16 h-1 bg-[#6c5ce7] mx-auto mb-8 rounded-full" />
                    <h2 className="text-2xl font-bold text-white mb-4">Finding the right fit?</h2>
                    <p className="text-white/30 text-sm max-w-xl mx-auto mb-10 leading-relaxed">
                        Compare key features and rental terms to ensure you get exactly what you need.
                        Once you've made your choice, click "Select Rental" to proceed to checkout.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link href="/explore">
                            <button className="px-8 py-3 rounded-xl border border-white/10 text-white/60 text-xs font-bold hover:bg-white/5 transition-all">
                                Continue Selection
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
