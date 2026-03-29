'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import {
    DollarSign, TrendingUp, Target, Sparkles, Zap, ChevronDown,
    ChevronUp, Loader2, BarChart3, ArrowRight, Info
} from 'lucide-react';

interface PriceSuggestion {
    suggestion: {
        optimal: number;
        competitive: number;
        premium: number;
    } | null;
    stats: {
        count: number;
        min?: number;
        max?: number;
        avg?: number;
        median?: number;
    };
    distribution?: { range: string; from: number; to: number; count: number }[];
}

interface SmartPriceAdvisorProps {
    category: string;
    currentPrice: number;
    onPriceSelect: (price: number) => void;
}

export default function SmartPriceAdvisor({ category, currentPrice, onPriceSelect }: SmartPriceAdvisorProps) {
    const [data, setData] = useState<PriceSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [selectedTier, setSelectedTier] = useState<'competitive' | 'optimal' | 'premium' | null>(null);

    useEffect(() => {
        if (category) {
            fetchSuggestion();
        }
    }, [category]);

    const fetchSuggestion = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get<PriceSuggestion>(`/listings/price-suggestion?category=${encodeURIComponent(category)}`);
            setData(res);
        } catch (err) {
            console.error('Price suggestion error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!category) return null;

    if (loading) {
        return (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-[#6c5ce7]/5 border border-[#6c5ce7]/10">
                <Loader2 size={14} className="animate-spin text-[#a29bfe]" />
                <span className="text-xs text-white/40">Analyzing market prices...</span>
            </div>
        );
    }

    if (!data?.suggestion) return null;

    const { suggestion, stats, distribution } = data;
    const maxDistCount = distribution ? Math.max(...distribution.map(d => d.count), 1) : 1;

    // Calculate where current price sits
    const pricePosition = stats.min !== undefined && stats.max !== undefined && stats.max > stats.min
        ? ((currentPrice - stats.min) / (stats.max - stats.min)) * 100
        : 50;

    const tiers = [
        { key: 'competitive' as const, label: 'Competitive', price: suggestion.competitive, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', desc: 'Undercut the market for faster bookings' },
        { key: 'optimal' as const, label: 'Recommended', price: suggestion.optimal, icon: Target, color: 'text-[#a29bfe]', bg: 'bg-[#6c5ce7]/10', border: 'border-[#6c5ce7]/20', desc: 'Best price-to-booking ratio' },
        { key: 'premium' as const, label: 'Premium', price: suggestion.premium, icon: Sparkles, color: 'text-[#fdcb6e]', bg: 'bg-[#fdcb6e]/10', border: 'border-[#fdcb6e]/20', desc: 'Higher margin for quality listings' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-[#6c5ce7]/8 to-[#00cec9]/5 border border-[#6c5ce7]/15 overflow-hidden"
        >
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#6c5ce7]/15 flex items-center justify-center">
                        <TrendingUp size={16} className="text-[#a29bfe]" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold text-white">Smart Price Advisor</p>
                        <p className="text-[10px] text-white/30">Based on {stats.count} similar listings</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#a29bfe]">${suggestion.optimal}/day</span>
                    {expanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-4">
                            {/* Price Range Bar */}
                            <div>
                                <div className="flex items-center justify-between text-[9px] text-white/25 mb-1.5">
                                    <span>${stats.min}</span>
                                    <span className="text-white/40 font-bold">Market Range</span>
                                    <span>${stats.max}</span>
                                </div>
                                <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 via-[#6c5ce7]/30 to-[#fdcb6e]/30 rounded-full" />
                                    {currentPrice > 0 && (
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-white/20 border-2 border-[#6c5ce7] transition-all"
                                            style={{ left: `${Math.max(0, Math.min(100, pricePosition))}%`, transform: 'translate(-50%, -50%)' }}
                                            title={`Your price: $${currentPrice}`}
                                        />
                                    )}
                                </div>
                                {currentPrice > 0 && (
                                    <p className="text-[9px] text-white/20 mt-1 text-center">
                                        Your price: <span className="text-white/50 font-bold">${currentPrice}</span>
                                        {currentPrice < suggestion.competitive && ' — Below market'}
                                        {currentPrice > suggestion.premium && ' — Above market'}
                                        {currentPrice >= suggestion.competitive && currentPrice <= suggestion.premium && ' — In range ✓'}
                                    </p>
                                )}
                            </div>

                            {/* Price Tiers */}
                            <div className="grid grid-cols-3 gap-2">
                                {tiers.map(tier => (
                                    <button
                                        key={tier.key}
                                        onClick={() => {
                                            setSelectedTier(tier.key);
                                            onPriceSelect(tier.price);
                                        }}
                                        className={`relative p-3 rounded-xl border transition-all text-center group hover:scale-[1.02] active:scale-95 ${
                                            selectedTier === tier.key
                                                ? `${tier.bg} ${tier.border} ring-1 ring-current ${tier.color}`
                                                : `bg-white/[0.02] border-white/5 hover:${tier.bg} hover:${tier.border}`
                                        }`}
                                    >
                                        <tier.icon size={14} className={`mx-auto mb-1.5 ${selectedTier === tier.key ? tier.color : 'text-white/20'}`} />
                                        <p className={`text-lg font-extrabold mb-0.5 ${selectedTier === tier.key ? 'text-white' : 'text-white/70'}`}>
                                            ${tier.price}
                                        </p>
                                        <p className={`text-[8px] font-bold uppercase tracking-wider ${selectedTier === tier.key ? tier.color : 'text-white/20'}`}>
                                            {tier.label}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            {/* Distribution Chart */}
                            {distribution && distribution.length > 0 && (
                                <div>
                                    <p className="text-[9px] text-white/20 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <BarChart3 size={9} /> Price Distribution
                                    </p>
                                    <div className="flex items-end gap-1 h-12">
                                        {distribution.map((bucket, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(4, (bucket.count / maxDistCount) * 100)}%` }}
                                                    transition={{ delay: i * 0.05, duration: 0.3 }}
                                                    className={`w-full rounded-sm transition-colors ${
                                                        currentPrice >= bucket.from && currentPrice <= bucket.to
                                                            ? 'bg-[#6c5ce7]' : 'bg-white/10 hover:bg-white/15'
                                                    }`}
                                                    title={`${bucket.range}: ${bucket.count} listings`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-0.5">
                                        <span className="text-[7px] text-white/15">${stats.min}</span>
                                        <span className="text-[7px] text-white/15">${stats.max}</span>
                                    </div>
                                </div>
                            )}

                            {/* Insight */}
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <Info size={12} className="text-[#00cec9] mt-0.5 flex-shrink-0" />
                                <p className="text-[10px] text-white/35 leading-relaxed">
                                    {selectedTier === 'competitive' && 'Pricing 10% below average attracts more first-time renters and increases conversion rate by up to 25%.'}
                                    {selectedTier === 'premium' && 'Premium pricing works best with high-quality photos and 4+ star ratings. Highlight unique features in your description.'}
                                    {selectedTier === 'optimal' && 'This price point has the best booking-to-view ratio among similar listings in your category.'}
                                    {!selectedTier && `The average price in "${category}" is $${stats.avg}. Choose a tier above or set your own price.`}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
