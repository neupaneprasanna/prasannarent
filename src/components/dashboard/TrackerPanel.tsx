'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Timer, Package, Clock, CheckCircle2, Loader2, Calendar, DollarSign, MessageCircle, Eye, Zap } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast } from 'date-fns';

function Countdown({ targetDate, label }: { targetDate: string; label: string }) {
    const [now, setNow] = useState(new Date());
    useEffect(() => { const i = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(i); }, []);
    const target = new Date(targetDate);
    const overdue = isPast(target);
    const d = Math.abs(differenceInDays(target, now));
    const h = Math.abs(differenceInHours(target, now)) % 24;
    const m = Math.abs(differenceInMinutes(target, now)) % 60;

    return (
        <div className={`flex items-center gap-2 ${overdue ? 'text-red-400' : 'text-white'}`}>
            <Timer size={12} className={overdue ? 'text-red-400' : 'text-[#a29bfe]'} />
            <div>
                <p className="text-[8px] text-white/20 font-bold uppercase tracking-wider">{label}</p>
                <div className="flex items-center gap-1">
                    {d > 0 && <span className="text-xs font-extrabold">{d}<span className="text-[8px] text-white/25 ml-px">d</span></span>}
                    <span className="text-xs font-extrabold">{h}<span className="text-[8px] text-white/25 ml-px">h</span></span>
                    <span className="text-xs font-extrabold">{m}<span className="text-[8px] text-white/25 ml-px">m</span></span>
                    {overdue && <span className="text-[8px] text-red-400 font-bold ml-1">OVERDUE</span>}
                </div>
            </div>
        </div>
    );
}

function ProgressBar({ startDate, endDate, status }: { startDate: string; endDate: string; status: string }) {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const pct = status === 'COMPLETED' ? 100 : Math.max(0, Math.min(100, (elapsed / total) * 100));
    return (
        <div>
            <div className="flex justify-between text-[7px] text-white/15 mb-0.5">
                <span>{format(start, 'MMM d')}</span><span className="text-white/25 font-bold">{Math.round(pct)}%</span><span>{format(end, 'MMM d')}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-[#6c5ce7]'}`} />
            </div>
        </div>
    );
}

export default function TrackerPanel() {
    const [rentals, setRentals] = useState<any[]>([]);
    const [ownerRentals, setOwnerRentals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'renting' | 'hosting'>('renting');

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [r, o] = await Promise.all([
                apiClient.get<{ bookings: any[] }>('/bookings'),
                apiClient.get<{ bookings: any[] }>('/bookings/owner'),
            ]);
            setRentals(r.bookings || []);
            setOwnerRentals(o.bookings || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const list = view === 'renting' ? rentals : ownerRentals;
    const active = list.filter(r => ['ACTIVE', 'CONFIRMED'].includes(r.status));
    const pending = list.filter(r => r.status === 'PENDING');
    const past = list.filter(r => ['COMPLETED', 'CANCELLED'].includes(r.status));

    if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-[#6c5ce7]" /></div>;

    return (
        <div className="space-y-6">
            {/* Toggle */}
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                {(['renting', 'hosting'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${view === v ? 'bg-[#6c5ce7]/20 text-[#a29bfe]' : 'text-white/30'}`}>
                        {v === 'renting' ? '📦 Renting' : '🏠 Hosting'}
                    </button>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[{ l: 'Active', v: active.length, c: 'text-[#a29bfe]' }, { l: 'Pending', v: pending.length, c: 'text-amber-400' }, { l: 'Completed', v: past.filter(r => r.status === 'COMPLETED').length, c: 'text-emerald-400' }].map(s => (
                    <div key={s.l} className="glass-card rounded-xl p-3 border border-white/5 text-center">
                        <p className={`text-lg font-extrabold ${s.c}`}>{s.v}</p>
                        <p className="text-[8px] text-white/20 font-bold uppercase tracking-wider">{s.l}</p>
                    </div>
                ))}
            </div>

            {/* Active */}
            {active.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-white/40 mb-3 flex items-center gap-1.5"><Zap size={12} className="text-[#a29bfe]" /> Active</h4>
                    <div className="space-y-3">
                        {active.map((r: any) => (
                            <div key={r.id} className="glass-card rounded-xl border border-[#6c5ce7]/10 p-4">
                                <div className="flex gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                        {r.listing.images?.[0] ? <img src={r.listing.images[0]} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="text-white/10 m-auto" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{r.listing.title}</p>
                                        <ProgressBar startDate={r.startDate} endDate={r.endDate} status={r.status} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Countdown targetDate={r.endDate} label={r.status === 'CONFIRMED' ? 'Starts in' : 'Return in'} />
                                    <span className="text-[10px] text-white/30 flex items-center gap-1"><DollarSign size={10} />${r.totalPrice}</span>
                                    <Link href="/messages" className="ml-auto px-2 py-1 bg-white/5 rounded text-[9px] text-white/30 hover:text-white flex items-center gap-1"><MessageCircle size={9} />Chat</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending */}
            {pending.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-white/40 mb-3 flex items-center gap-1.5"><Clock size={12} className="text-amber-400" /> Pending</h4>
                    <div className="space-y-2">
                        {pending.map((r: any) => (
                            <div key={r.id} className="glass-card rounded-lg p-3 border border-amber-500/10 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                    {r.listing.images?.[0] ? <img src={r.listing.images[0]} alt="" className="w-full h-full object-cover" /> : <Package size={10} className="text-white/10 m-auto" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-white truncate">{r.listing.title}</p>
                                    <p className="text-[8px] text-white/20">{format(new Date(r.startDate), 'MMM d')} — {format(new Date(r.endDate), 'MMM d')} · ${r.totalPrice}</p>
                                </div>
                                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[7px] font-bold rounded uppercase">Pending</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Past */}
            {past.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-white/40 mb-3 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-400" /> History</h4>
                    <div className="space-y-1.5">
                        {past.slice(0, 8).map((r: any) => (
                            <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.02]">
                                <div className="w-6 h-6 rounded bg-white/5 overflow-hidden flex-shrink-0">
                                    {r.listing.images?.[0] ? <img src={r.listing.images[0]} alt="" className="w-full h-full object-cover" /> : null}
                                </div>
                                <p className="text-[10px] text-white/40 flex-1 truncate">{r.listing.title}</p>
                                <span className="text-[10px] text-white/20">${r.totalPrice}</span>
                                <span className={`text-[7px] font-bold uppercase ${r.status === 'COMPLETED' ? 'text-emerald-400' : 'text-red-400'}`}>{r.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {list.length === 0 && (
                <div className="text-center py-12"><Timer size={36} className="mx-auto text-white/10 mb-3" /><p className="text-sm text-white/30">No rentals yet</p></div>
            )}
        </div>
    );
}
