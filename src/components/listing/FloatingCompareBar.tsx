'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCompareStore } from '@/store/compare-store';
import { X, Columns, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FloatingCompareBar() {
    const { items, removeItem, clearItems } = useCompareStore();

    return (
        <AnimatePresence>
            {items.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="glass-card rounded-2xl p-4 flex items-center justify-between border-[#6c5ce7]/30 shadow-2xl shadow-[#6c5ce7]/20 overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#6c5ce7]" />

                        <div className="flex items-center gap-4 flex-1 overflow-x-auto no-scrollbar">
                            <div className="flex items-center gap-2 mr-4">
                                <div className="w-8 h-8 rounded-lg bg-[#6c5ce7]/20 flex items-center justify-center text-[#a29bfe]">
                                    <Columns size={16} />
                                </div>
                                <span className="text-xs font-bold text-white whitespace-nowrap">Compare <span className="text-[#a29bfe]">{items.length}</span></span>
                            </div>

                            <div className="flex items-center gap-2">
                                {items.map((item) => (
                                    <div key={item.id} className="relative group flex-shrink-0">
                                        <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden bg-white/5">
                                            <img src={(item as any).media?.[0]?.url || item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                                {items.length < 4 && (
                                    <div className="w-12 h-12 rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center text-white/5">
                                        <span className="text-[10px] font-bold">+{4 - items.length}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 ml-6">
                            <button
                                onClick={clearItems}
                                className="text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest whitespace-nowrap"
                            >
                                Clear
                            </button>
                            <Link href="/compare">
                                <button className="flex items-center gap-2 px-6 py-3 bg-[#6c5ce7] rounded-xl text-xs font-bold text-white hover:bg-[#5f4dd0] transition-all shadow-lg shadow-[#6c5ce7]/20 whitespace-nowrap group">
                                    Compare Now
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
