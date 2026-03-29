'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import {
    Gift, Copy, Check, Share2, Users, DollarSign, Loader2,
    ChevronRight, Sparkles, Trophy, Heart, ArrowRight, Send
} from 'lucide-react';
import { format } from 'date-fns';

interface ReferralData {
    code: string;
    rewardAmount: number;
    stats: { totalReferrals: number; completed: number; pending: number; totalEarned: number };
    referrals: { id: string; status: string; rewardAmount: number; referee: { firstName: string; lastName: string; avatar: string | null; createdAt: string } | null; redeemedAt: string | null; createdAt: string }[];
}

export default function ReferralPage() {
    const { isAuthenticated, user } = useAuthStore();
    const [data, setData] = useState<ReferralData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated) fetchReferralData();
    }, [isAuthenticated]);

    const fetchReferralData = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get<ReferralData>('/referrals');
            setData(res);
        } catch (err) {
            console.error('Failed to fetch referral data:', err);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = async () => {
        if (!data?.code) return;
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/register?ref=${data.code}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = `${window.location.origin}/register?ref=${data.code}`;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareUrl = data ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${data.code}` : '';

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center bg-[#030304]">
                <Navbar />
                <div className="text-center px-6">
                    <Gift size={64} className="mx-auto text-white/10 mb-6" />
                    <h2 className="text-2xl font-bold mb-3 text-white">Invite & Earn</h2>
                    <p className="text-white/40 mb-6">Sign in to get your referral link</p>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white">Sign In</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen bg-[#030304]">
            <Navbar />
            <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-10 max-w-4xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#6c5ce7]/10 rounded-full blur-[120px] -mt-24 pointer-events-none" />
                    <div className="relative">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.1 }}
                            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center mx-auto mb-6"
                        >
                            <Gift size={36} className="text-white" />
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight mb-3">
                            Invite & Earn
                        </h1>
                        <p className="text-white/40 text-sm max-w-md mx-auto">
                            Share Nexis with friends and earn <span className="text-emerald-400 font-bold">${data?.rewardAmount || 10}</span> in rewards for every friend who joins
                        </p>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" /></div>
                ) : data ? (
                    <>
                        {/* Referral Code Card */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="glass-card rounded-3xl p-8 border border-[#6c5ce7]/15 mb-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#6c5ce7]/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3">Your Referral Code</p>
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <span className="text-3xl md:text-4xl font-extrabold tracking-[0.15em] text-white font-mono">{data.code}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={copyCode}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl text-sm font-bold text-white shadow-lg shadow-[#6c5ce7]/20"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({ title: 'Join Nexis', text: `Use my code ${data.code} to get started on Nexis!`, url: shareUrl });
                                        } else {
                                            setShareMenuOpen(!shareMenuOpen);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <Share2 size={16} /> Share
                                </motion.button>
                            </div>

                            {/* Share options (fallback) */}
                            {shareMenuOpen && (
                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    {[
                                        { label: 'Twitter', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join Nexis and start renting! ${shareUrl}`)}`},
                                        { label: 'WhatsApp', url: `https://wa.me/?text=${encodeURIComponent(`Check out Nexis! ${shareUrl}`)}`},
                                        { label: 'Email', url: `mailto:?subject=${encodeURIComponent('Join Nexis')}&body=${encodeURIComponent(`I'm inviting you to Nexis! Sign up here: ${shareUrl}`)}`},
                                    ].map(opt => (
                                        <a key={opt.label} href={opt.url} target="_blank" rel="noopener noreferrer"
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all">
                                            {opt.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* How It Works */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            {[
                                { step: 1, icon: Send, title: 'Share Your Link', desc: 'Send your unique referral link to friends' },
                                { step: 2, icon: Users, title: 'They Sign Up', desc: 'Your friend creates a Nexis account' },
                                { step: 3, icon: DollarSign, title: 'You Both Earn', desc: `Get $${data.rewardAmount} when they complete their first rental` },
                            ].map((item, i) => (
                                <motion.div key={item.step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                                    className="glass-card rounded-2xl p-5 border border-white/5 text-center relative">
                                    <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-[#6c5ce7]/10 flex items-center justify-center text-[9px] font-extrabold text-[#a29bfe]">{item.step}</div>
                                    <item.icon size={24} className="mx-auto mb-3 text-[#a29bfe]" />
                                    <h4 className="text-xs font-bold text-white mb-1">{item.title}</h4>
                                    <p className="text-[10px] text-white/30">{item.desc}</p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Stats */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                            className="grid grid-cols-3 gap-4 mb-8">
                            {[
                                { label: 'Invited', value: data.stats.totalReferrals, icon: Users, color: 'text-[#a29bfe]' },
                                { label: 'Joined', value: data.stats.completed, icon: Check, color: 'text-emerald-400' },
                                { label: 'Earned', value: `$${data.stats.totalEarned}`, icon: DollarSign, color: 'text-[#fdcb6e]' },
                            ].map(stat => (
                                <div key={stat.label} className="glass-card rounded-2xl p-5 border border-white/5 text-center">
                                    <stat.icon size={18} className={`mx-auto mb-2 ${stat.color}`} />
                                    <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                                    <p className="text-[9px] text-white/25 font-bold uppercase tracking-wider">{stat.label}</p>
                                </div>
                            ))}
                        </motion.div>

                        {/* Referral History */}
                        {data.referrals.length > 0 && data.referrals.some(r => r.referee) && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                                className="glass-card rounded-2xl p-6 border border-white/5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Trophy size={14} className="text-[#fdcb6e]" /> Your Referrals
                                </h3>
                                <div className="space-y-2">
                                    {data.referrals.filter(r => r.referee).map(ref => (
                                        <div key={ref.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-[#6c5ce7]/20 flex items-center justify-center text-[10px] font-bold text-[#a29bfe] flex-shrink-0 overflow-hidden">
                                                {ref.referee?.avatar ? <img src={ref.referee.avatar} alt="" className="w-full h-full object-cover" /> : (ref.referee?.firstName[0] || '?')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-white/60">{ref.referee?.firstName} {ref.referee?.lastName}</p>
                                                <p className="text-[9px] text-white/20">Joined {format(new Date(ref.createdAt), 'MMM d, yyyy')}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase ${
                                                ref.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                            }`}>{ref.status}</span>
                                            {ref.status === 'COMPLETED' && (
                                                <span className="text-xs font-bold text-emerald-400">+${ref.rewardAmount}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </>
                ) : null}
            </div>
        </main>
    );
}
