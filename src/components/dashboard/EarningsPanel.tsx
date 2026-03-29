'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { DollarSign, TrendingUp, Package, Loader2, CheckCircle2, Clock, BarChart3, Wallet, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_C: Record<string, string> = { CONFIRMED: 'text-blue-400', ACTIVE: 'text-[#a29bfe]', COMPLETED: 'text-emerald-400' };

export default function EarningsPanel() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetch(); }, []);
    const fetch = async () => {
        setLoading(true);
        try { const res = await apiClient.get<any>('/earnings'); setData(res); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-[#6c5ce7]" /></div>;
    if (!data) return <div className="text-center py-12"><Wallet size={36} className="mx-auto text-white/10 mb-3" /><p className="text-sm text-white/30">No earnings data</p></div>;

    const maxM = Math.max(...data.monthlyChart.map((m: any) => m.amount), 1);

    return (
        <div className="space-y-6">
            {/* Revenue Cards */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { l: 'Total', v: data.totalEarnings, c: 'text-emerald-400' },
                    { l: 'Completed', v: data.completedEarnings, c: 'text-[#00cec9]' },
                    { l: 'In Progress', v: data.pendingEarnings, c: 'text-amber-400' },
                ].map(s => (
                    <div key={s.l} className="glass-card rounded-xl p-4 border border-white/5">
                        <p className={`text-lg font-extrabold ${s.c}`}>${s.v.toLocaleString()}</p>
                        <p className="text-[8px] text-white/20 font-bold uppercase tracking-wider">{s.l}</p>
                    </div>
                ))}
            </div>

            {/* Monthly Chart */}
            <div className="glass-card rounded-xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5"><BarChart3 size={12} className="text-[#a29bfe]" /> Monthly Revenue</h4>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><ArrowUpRight size={10} />${data.totalEarnings.toLocaleString()}</span>
                </div>
                <div className="flex items-end gap-1.5 h-28">
                    {data.monthlyChart.map((m: any, i: number) => (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5 group">
                            <span className="text-[7px] text-white/0 group-hover:text-white/30 transition-colors font-bold">{m.amount > 0 ? `$${m.amount}` : ''}</span>
                            <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(2, (m.amount / maxM) * 100)}%` }}
                                transition={{ delay: i * 0.03, duration: 0.3 }}
                                className={`w-full rounded-t-sm ${m.amount > 0 ? 'bg-gradient-to-t from-emerald-600/40 to-emerald-400/60 group-hover:from-emerald-500 group-hover:to-emerald-300' : 'bg-white/5'}`} />
                            <span className="text-[7px] text-white/15">{m.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* By Listing & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-5 border border-white/5">
                    <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5"><Package size={12} className="text-[#a29bfe]" /> By Listing</h4>
                    {data.listingBreakdown.length === 0 ? <p className="text-[10px] text-white/20 text-center py-4">No data</p> : (
                        <div className="space-y-2.5">
                            {data.listingBreakdown.map((l: any, i: number) => {
                                const pct = data.totalEarnings > 0 ? (l.total / data.totalEarnings) * 100 : 0;
                                return (
                                    <div key={l.id} className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded bg-white/5 overflow-hidden flex-shrink-0">
                                            {l.image ? <img src={l.image} alt="" className="w-full h-full object-cover" /> : <Package size={10} className="text-white/10 m-auto" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-white/50 truncate">{l.title}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.05, duration: 0.4 }}
                                                        className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-full" />
                                                </div>
                                                <span className="text-[7px] text-white/15 w-6 text-right">{Math.round(pct)}%</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-white/50 flex-shrink-0">${l.total.toLocaleString()}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="glass-card rounded-xl p-5 border border-white/5">
                    <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5"><TrendingUp size={12} className="text-emerald-400" /> Recent</h4>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {data.recentTransactions.map((tx: any) => (
                            <div key={tx.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.02]">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><DollarSign size={10} className="text-emerald-400" /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-white/50 truncate">{tx.listingTitle}</p>
                                    <p className="text-[8px] text-white/15">{tx.renterName} · {format(new Date(tx.date), 'MMM d')}</p>
                                </div>
                                <p className="text-[10px] font-bold text-emerald-400">+${tx.amount}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
