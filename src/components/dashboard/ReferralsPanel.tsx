'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { Gift, Copy, Check, Users, DollarSign, Loader2, Trophy, Share2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ReferralsPanel() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => { fetch(); }, []);
    const fetch = async () => {
        setLoading(true);
        try { const res = await apiClient.get<any>('/referrals'); setData(res); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const copyCode = async () => {
        if (!data?.code) return;
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/register?ref=${data.code}`);
            setCopied(true); setTimeout(() => setCopied(false), 2000);
        } catch {}
    };

    if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-[#6c5ce7]" /></div>;
    if (!data) return <div className="text-center py-12"><Gift size={36} className="mx-auto text-white/10 mb-3" /><p className="text-sm text-white/30">No referral data</p></div>;

    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${data.code}`;

    return (
        <div className="space-y-6">
            {/* Header / Code */}
            <div className="glass-card rounded-2xl p-6 border border-[#6c5ce7]/20 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#6c5ce7]/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center mx-auto mb-4">
                    <Gift size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-2">Invite & Earn ${data.rewardAmount}</h3>
                <p className="text-xs text-white/40 max-w-sm mx-auto mb-6">Share your unique link. When friends sign up and complete a rental, you both earn rewards.</p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button onClick={copyCode} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl text-xs font-bold text-white shadow-lg shadow-[#6c5ce7]/20">
                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : data.code}
                    </button>
                    <button onClick={() => navigator.share?.({ title: 'Join Nexis', url: shareUrl })} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all">
                        <Share2 size={14} /> Share Link
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { l: 'Invited', v: data.stats.totalReferrals, i: Users, c: 'text-[#a29bfe]' },
                    { l: 'Joined', v: data.stats.completed, i: Check, c: 'text-emerald-400' },
                    { l: 'Earned', v: `$${data.stats.totalEarned}`, i: DollarSign, c: 'text-[#fdcb6e]' },
                ].map(s => (
                    <div key={s.l} className="glass-card rounded-xl p-4 border border-white/5 text-center">
                        <s.i size={16} className={`mx-auto mb-2 ${s.c}`} />
                        <p className="text-xl font-extrabold text-white">{s.v}</p>
                        <p className="text-[8px] text-white/20 font-bold uppercase tracking-wider">{s.l}</p>
                    </div>
                ))}
            </div>

            {/* History */}
            {data.referrals.filter((r: any) => r.referee).length > 0 && (
                <div className="glass-card rounded-xl p-5 border border-white/5">
                    <h4 className="text-xs font-bold text-white mb-4 flex items-center gap-1.5"><Trophy size={12} className="text-[#fdcb6e]" /> Recent Referrals</h4>
                    <div className="space-y-2">
                        {data.referrals.filter((r: any) => r.referee).map((r: any) => (
                            <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                                <div className="w-8 h-8 rounded-full bg-[#6c5ce7]/20 flex items-center justify-center text-[10px] font-bold text-[#a29bfe] flex-shrink-0 overflow-hidden">
                                    {r.referee?.avatar ? <img src={r.referee.avatar} alt="" className="w-full h-full object-cover" /> : (r.referee?.firstName[0] || '?')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-white/70">{r.referee?.firstName} {r.referee?.lastName}</p>
                                    <p className="text-[8px] text-white/30">Joined {format(new Date(r.createdAt), 'MMM d, yyyy')}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-[7px] font-bold uppercase ${
                                    r.status === 'REWARDED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>{r.status}</span>
                                {r.status === 'REWARDED' && <span className="text-[10px] font-bold text-emerald-400">+${r.rewardAmount}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
