'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, DollarSign, X, Loader2, Save, Sparkles, TrendingUp, Info } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Listing } from '@/types/rental';
import Button from '@/components/ui/Button';

interface PricingManagerProps {
    listing: Listing;
    onClose: () => void;
}

export default function PricingManager({ listing, onClose }: PricingManagerProps) {
    const [loading, setLoading] = useState(false);
    const [overrides, setOverrides] = useState<any[]>([]);
    const [newOverride, setNewOverride] = useState({
        date: new Date().toISOString().split('T')[0],
        price: '',
        reason: ''
    });

    useEffect(() => {
        fetchOverrides();
    }, [listing.id]);

    const fetchOverrides = async () => {
        try {
            const res = await apiClient.get<any>(`/listings/${listing.id}/pricing/overrides`);
            setOverrides(res.overrides || []);
        } catch (error) {
            console.error('Failed to fetch overrides:', error);
        }
    };

    const handleSaveOverride = async () => {
        if (!newOverride.date || !newOverride.price) return;
        setLoading(true);
        try {
            await apiClient.post(`/listings/${listing.id}/pricing/overrides`, newOverride);
            await fetchOverrides();
            setNewOverride({ date: new Date().toISOString().split('T')[0], price: '', reason: '' });
        } catch (error) {
            console.error('Failed to save override:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md"
        >
            <div className="bg-[#0a0a0b] border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-[#6c5ce7]/20">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#6c5ce7]/20 flex items-center justify-center text-[#a29bfe]">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white leading-none mb-1">Manage Pricing</h2>
                            <p className="text-xs text-white/40 uppercase tracking-[0.2em] font-bold">{listing.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left: Base Rates */}
                        <div className="space-y-8">
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-1 h-4 bg-[#6c5ce7] rounded-full" />
                                    <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">Global Base Rates</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="glass-card rounded-2xl p-4 border border-white/5">
                                        <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-1">Daily Rate</p>
                                        <p className="text-xl font-bold text-white">${listing.price}</p>
                                    </div>
                                    <div className="glass-card rounded-2xl p-4 border border-white/5">
                                        <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-1">Hourly</p>
                                        <p className="text-xl font-bold text-white">{listing.pricing?.hourlyPrice ? `$${listing.pricing.hourlyPrice}` : 'Not set'}</p>
                                    </div>
                                    <div className="glass-card rounded-2xl p-4 border border-white/5">
                                        <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-1">Weekly</p>
                                        <p className="text-xl font-bold text-white">{listing.pricing?.weeklyPrice ? `$${listing.pricing.weeklyPrice}` : 'Not set'}</p>
                                    </div>
                                    <div className="glass-card rounded-2xl p-4 border border-white/5">
                                        <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-1">Monthly</p>
                                        <p className="text-xl font-bold text-white">{listing.pricing?.monthlyPrice ? `$${listing.pricing.monthlyPrice}` : 'Not set'}</p>
                                    </div>
                                </div>
                                <div className="mt-4 p-4 rounded-xl bg-[#6c5ce7]/5 border border-[#6c5ce7]/10 flex items-start gap-3">
                                    <Info size={16} className="text-[#a29bfe] mt-0.5" />
                                    <p className="text-[10px] text-white/40 leading-relaxed">
                                        Base rates are used unless a date-specific override is defined. Weekly and monthly rates are automatically applied for long bookings.
                                    </p>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-1 h-4 bg-[#00cec9] rounded-full" />
                                    <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">Active Overrides</h3>
                                </div>
                                <div className="space-y-3">
                                    {overrides.length === 0 ? (
                                        <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                            <p className="text-[10px] text-white/20 italic">No price overrides defined</p>
                                        </div>
                                    ) : (
                                        overrides.map((ov) => (
                                            <div key={ov.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                                                <div>
                                                    <p className="text-xs font-bold text-white">{new Date(ov.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    <p className="text-[10px] text-white/30">{ov.reason || 'Peak Price'}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-bold text-[#00cec9]">${ov.price}</span>
                                                    <button className="text-white/10 group-hover:text-red-400 transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right: Add Override */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-1 h-4 bg-[#fdcb6e] rounded-full" />
                                <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">New Price Override</h3>
                            </div>

                            <div className="glass-card rounded-[2rem] p-8 border border-white/10 space-y-6">
                                <div>
                                    <label className="block text-[10px] text-white/30 mb-2 font-bold uppercase tracking-wider">Select Date</label>
                                    <input
                                        type="date"
                                        value={newOverride.date}
                                        onChange={(e) => setNewOverride(p => ({ ...p, date: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#6c5ce7] transition-all outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] text-white/30 mb-2 font-bold uppercase tracking-wider">New Price ($)</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                                        <input
                                            type="number"
                                            value={newOverride.price}
                                            onChange={(e) => setNewOverride(p => ({ ...p, price: e.target.value }))}
                                            placeholder="0.00"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-[#6c5ce7] transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-white/30 mb-2 font-bold uppercase tracking-wider">Reason (Optional)</label>
                                    <input
                                        type="text"
                                        value={newOverride.reason}
                                        onChange={(e) => setNewOverride(p => ({ ...p, reason: e.target.value }))}
                                        placeholder="e.g. Holiday Season / Peak Demand"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#6c5ce7] transition-all outline-none"
                                    />
                                </div>

                                <Button
                                    className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] shadow-xl shadow-[#6c5ce7]/20"
                                    onClick={handleSaveOverride}
                                    disabled={loading || !newOverride.price}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                    Apply Price Override
                                </Button>

                                <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 flex items-start gap-3">
                                    <TrendingUp size={16} className="text-[#fdcb6e] mt-0.5" />
                                    <p className="text-[10px] text-white/40 leading-relaxed">
                                        This price will override your daily rate specifically for the selected date. This is great for managing revenue during holidays.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
