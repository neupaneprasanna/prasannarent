'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { BarChart3, Eye, DollarSign, Package, Star, Heart, TrendingUp, Loader2, Lightbulb, ChevronRight, Search, Sparkles, Target } from 'lucide-react';

function HealthGauge({ score }: { score: number }) {
    const color = score >= 80 ? '#00cec9' : score >= 60 ? '#fdcb6e' : '#e17055';
    const circ = 2 * Math.PI * 30;
    const filled = (score / 100) * circ;
    return (
        <div className="relative w-16 h-16">
            <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,0.05)" strokeWidth="3" fill="none" />
                <motion.circle cx="32" cy="32" r="30" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${circ}` }} animate={{ strokeDasharray: `${filled} ${circ - filled}` }} transition={{ duration: 1 }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-extrabold" style={{ color }}>{score}</span>
            </div>
        </div>
    );
}

function MiniChart({ data }: { data: Record<string, number> }) {
    const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
    if (!entries.length) return <span className="text-[8px] text-white/10">No data</span>;
    const max = Math.max(...entries.map(([_, v]) => v), 1);
    return (
        <div className="flex items-end gap-[2px] h-5">
            {entries.map(([d, v], i) => (
                <motion.div key={d} initial={{ height: 0 }} animate={{ height: `${Math.max(2, (v / max) * 100)}%` }}
                    transition={{ delay: i * 0.02 }} className="flex-1 min-w-[2px] rounded-full bg-[#6c5ce7]/50 hover:bg-[#a29bfe]" />
            ))}
        </div>
    );
}

export default function AnalyticsPanel() {
    const [listings, setListings] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'revenue' | 'views' | 'score'>('revenue');

    useEffect(() => { fetch(); }, []);
    const fetch = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<any>('/analytics/listings');
            setListings(data.listings || []);
            setSummary(data.summary || null);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const sorted = [...listings].sort((a, b) => sortBy === 'revenue' ? b.revenue - a.revenue : sortBy === 'views' ? b.totalViews - a.totalViews : b.healthScore - a.healthScore);

    if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-[#6c5ce7]" /></div>;

    return (
        <div className="space-y-6">
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { l: 'Revenue', v: `$${summary.totalRevenue.toLocaleString()}`, c: 'text-emerald-400' },
                        { l: 'Views', v: summary.totalViews, c: 'text-[#a29bfe]' },
                        { l: 'Bookings', v: summary.totalBookings, c: 'text-[#00cec9]' },
                        { l: 'Avg Health', v: `${summary.avgHealthScore}/100`, c: summary.avgHealthScore >= 70 ? 'text-[#00cec9]' : 'text-amber-400' },
                    ].map(s => (
                        <div key={s.l} className="glass-card rounded-xl p-4 border border-white/5">
                            <p className={`text-lg font-extrabold ${s.c}`}>{s.v}</p>
                            <p className="text-[8px] text-white/20 font-bold uppercase tracking-wider">{s.l}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-2">
                {(['revenue', 'views', 'score'] as const).map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-medium capitalize transition-all ${sortBy === s ? 'bg-[#6c5ce7]/15 text-[#a29bfe] border border-[#6c5ce7]/25' : 'bg-white/5 text-white/25 border border-white/5'}`}>{s}</button>
                ))}
            </div>

            {sorted.length === 0 ? (
                <div className="text-center py-12"><BarChart3 size={36} className="mx-auto text-white/10 mb-3" /><p className="text-sm text-white/30">No listings to analyze</p></div>
            ) : (
                <div className="space-y-3">
                    {sorted.map((l: any) => (
                        <div key={l.id} className="glass-card rounded-xl border border-white/5 p-4">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                    {l.image ? <img src={l.image} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="text-white/10 m-auto" />}
                                </div>
                                <HealthGauge score={l.healthScore} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div><p className="text-xs font-bold text-white truncate">{l.title}</p><p className="text-[8px] text-white/20">${l.price}/{l.priceUnit.toLowerCase()}</p></div>
                                        <Link href={`/item/${l.id}`} className="text-[9px] text-[#a29bfe] flex items-center gap-0.5">View<ChevronRight size={10} /></Link>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                                        {[{l:'Views',v:l.totalViews,c:'text-[#a29bfe]'},{l:'Bookings',v:l.confirmedBookings,c:'text-[#00cec9]'},{l:'Revenue',v:`$${l.revenue}`,c:'text-emerald-400'},{l:'Rating',v:l.avgRating||'—',c:'text-[#fdcb6e]'},{l:'Saved',v:l.wishlistSaves,c:'text-pink-400'},{l:'Conv.',v:`${l.conversionRate}%`,c:'text-emerald-400'}].map(s => (
                                            <div key={s.l} className="text-center"><p className={`text-[10px] font-bold ${s.c}`}>{s.v}</p><p className="text-[7px] text-white/15 uppercase">{s.l}</p></div>
                                        ))}
                                    </div>
                                    <MiniChart data={l.viewsByDay} />
                                    {l.tips.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {l.tips.slice(0, 2).map((t: string, i: number) => (
                                                <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/8 text-[8px] text-amber-300/60"><Lightbulb size={8} />{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
