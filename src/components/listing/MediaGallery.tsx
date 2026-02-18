'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Maximize2, Play, Box, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface MediaItem {
    id: string;
    url: string;
    type: 'IMAGE' | 'VIDEO' | 'PANORAMA_360';
    caption?: string;
    thumbnail?: string;
}

interface MediaGalleryProps {
    media: MediaItem[];
    title: string;
    featured?: boolean;
}

export default function MediaGallery({ media, title, featured }: MediaGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [imgError, setImgError] = useState<Record<string, boolean>>({});
    const setCinemaMode = useAppStore((s) => s.setCinemaMode);

    const items = media.length > 0 ? media : [
        { id: 'placeholder', url: '', type: 'IMAGE' as const }
    ];

    const currentItem = items[selectedIndex];

    const handleMediaError = (id: string) => {
        setImgError(prev => ({ ...prev, [id]: true }));
    };

    return (
        <div className="w-full">
            {/* Main Stage */}
            <div className="relative glass-card rounded-3xl overflow-hidden aspect-[4/3] mb-4 flex items-center justify-center bg-gradient-to-br from-[#6c5ce7]/10 to-[#a29bfe]/10 group">
                <AnimatePresence mode="wait">
                    {currentItem.url && !imgError[currentItem.id] ? (
                        <motion.div
                            key={currentItem.id}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 w-full h-full"
                        >
                            {currentItem.type === 'IMAGE' && (
                                <img
                                    src={currentItem.url}
                                    alt={currentItem.caption || title}
                                    className="w-full h-full object-cover"
                                    onError={() => handleMediaError(currentItem.id)}
                                />
                            )}
                            {currentItem.type === 'VIDEO' && (
                                <div className="relative w-full h-full">
                                    <video
                                        src={currentItem.url}
                                        className="w-full h-full object-cover"
                                        controls
                                        poster={currentItem.thumbnail}
                                    />
                                </div>
                            )}
                            {currentItem.type === 'PANORAMA_360' && (
                                <div className="w-full h-full bg-black/40 flex flex-col items-center justify-center gap-4 text-white">
                                    <Box size={48} className="text-[#6c5ce7] animate-pulse" />
                                    <p className="font-bold tracking-widest uppercase text-xs">360° View Ready</p>
                                    <button className="px-6 py-2 rounded-full glass border border-white/10 hover:bg-[#6c5ce7] transition-all text-xs font-bold uppercase tracking-widest">
                                        Launch Viewer
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="placeholder"
                            className="text-9xl opacity-30 flex flex-col items-center gap-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <span>📦</span>
                            <p className="text-xs font-bold uppercase tracking-[0.2em]">No Media Ready</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Overlays */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <div className="flex gap-2">
                        {featured && (
                            <span className="px-3 py-1 rounded-full bg-[#6c5ce7] text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-[#6c5ce7]/40">
                                Featured
                            </span>
                        )}
                        <span className="px-3 py-1 rounded-full glass border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/90">
                            {currentItem.type.replace('_', ' ')}
                        </span>
                    </div>

                    <button
                        onClick={() => setCinemaMode(true)}
                        className="p-3 rounded-full glass border border-white/10 text-white/60 hover:text-white hover:scale-110 transition-all pointer-events-auto shadow-xl"
                    >
                        <Maximize2 size={18} />
                    </button>
                </div>

                {/* Type Indicator Icon (Corner) */}
                <div className="absolute top-6 right-6 z-20">
                    {currentItem.type === 'VIDEO' && <div className="p-2 rounded-lg bg-black/60 text-white"><Play size={16} fill="white" /></div>}
                    {currentItem.type === 'PANORAMA_360' && <div className="p-2 rounded-lg bg-[#6c5ce7] text-white"><Box size={16} /></div>}
                </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
                {items.map((item, i) => (
                    <motion.button
                        key={item.id}
                        className={`relative w-24 h-24 flex-shrink-0 rounded-2xl glass overflow-hidden border-2 transition-all group ${selectedIndex === i
                                ? 'border-[#6c5ce7] ring-4 ring-[#6c5ce7]/10'
                                : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                        onClick={() => setSelectedIndex(i)}
                        whileTap={{ scale: 0.95 }}
                    >
                        {item.url ? (
                            <>
                                <img
                                    src={item.thumbnail || item.url}
                                    className="w-full h-full object-cover"
                                    alt=""
                                />
                                {item.type !== 'IMAGE' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                                        {item.type === 'VIDEO' && <Play size={16} fill="white" className="text-white" />}
                                        {item.type === 'PANORAMA_360' && <Box size={16} className="text-white" />}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl bg-white/5">
                                <ImageIcon size={20} className="text-white/20" />
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
