'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import {
    Timer, Package, Clock, CheckCircle2, AlertTriangle, MapPin,
    Loader2, ChevronRight, MessageCircle, Calendar, DollarSign,
    ArrowLeft, Eye, Repeat, Star, Shield, Zap, TrendingUp
} from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast, isFuture } from 'date-fns';

interface TrackedRental {
    id: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: string;
    ownerNote: string | null;
    renterNote: string | null;
    createdAt: string;
    listing: {
        id: string;
        title: string;
        images: string[];
        price: number;
        priceUnit: string;
    };
    renter: {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string | null;
    };
}

function CountdownTimer({ targetDate, label }: { targetDate: string; label: string }) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const target = new Date(targetDate);
    const isOverdue = isPast(target);
    const days = Math.abs(differenceInDays(target, now));
    const hours = Math.abs(differenceInHours(target, now)) % 24;
    const minutes = Math.abs(differenceInMinutes(target, now)) % 60;

    return (
        <div className={`flex items-center gap-3 ${isOverdue ? 'text-red-400' : 'text-white'}`}>
            <Timer size={14} className={isOverdue ? 'text-red-400' : 'text-[#a29bfe]'} />
            <div>
                <p className="text-[9px] text-white/25 font-bold uppercase tracking-wider">{label}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {days > 0 && (
                        <span className="text-sm font-extrabold">{days}<span className="text-[9px] text-white/30 font-medium ml-0.5">d</span></span>
                    )}
                    <span className="text-sm font-extrabold">{hours}<span className="text-[9px] text-white/30 font-medium ml-0.5">h</span></span>
                    <span className="text-sm font-extrabold">{minutes}<span className="text-[9px] text-white/30 font-medium ml-0.5">m</span></span>
                    {isOverdue && <span className="text-[9px] text-red-400 font-bold ml-1">OVERDUE</span>}
                </div>
            </div>
        </div>
    );
}

function RentalProgressBar({ startDate, endDate, status }: { startDate: string; endDate: string; status: string }) {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const progress = status === 'COMPLETED' ? 100 : Math.max(0, Math.min(100, (elapsed / total) * 100));

    const color = status === 'COMPLETED' ? 'bg-emerald-400' :
        status === 'ACTIVE' ? 'bg-[#6c5ce7]' :
            progress > 80 ? 'bg-amber-400' : 'bg-[#6c5ce7]';

    return (
        <div className="w-full">
            <div className="flex items-center justify-between text-[8px] text-white/20 mb-1">
                <span>{format(start, 'MMM d')}</span>
                <span className="text-white/30 font-bold">{Math.round(progress)}%</span>
                <span>{format(end, 'MMM d')}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${color}`}
                    style={{ boxShadow: status === 'ACTIVE' ? `0 0 8px rgba(108,92,231,0.4)` : undefined }}
                />
            </div>
        </div>
    );
}

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED'];

function StatusTimeline({ status }: { status: string }) {
    const currentIndex = STATUS_STEPS.indexOf(status);
    const isCancelled = status === 'CANCELLED';

    return (
        <div className="flex items-center gap-1">
            {STATUS_STEPS.map((step, i) => {
                const isComplete = i < currentIndex || status === 'COMPLETED';
                const isCurrent = i === currentIndex;

                return (
                    <div key={step} className="flex items-center gap-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold transition-all ${
                            isCancelled ? 'bg-red-500/10 text-red-400' :
                                isComplete ? 'bg-emerald-500/20 text-emerald-400' :
                                    isCurrent ? 'bg-[#6c5ce7]/20 text-[#a29bfe] ring-1 ring-[#6c5ce7]/30' :
                                        'bg-white/5 text-white/15'
                        }`}>
                            {isComplete ? '✓' : i + 1}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                            <div className={`w-4 h-[1px] ${isComplete ? 'bg-emerald-500/30' : 'bg-white/5'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function TrackerPage() {
    const { isAuthenticated, user } = useAuthStore();
    const [rentals, setRentals] = useState<TrackedRental[]>([]);
    const [ownerRentals, setOwnerRentals] = useState<TrackedRental[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'renting' | 'hosting'>('renting');

    useEffect(() => {
        if (isAuthenticated) fetchAllRentals();
    }, [isAuthenticated]);

    const fetchAllRentals = async () => {
        setLoading(true);
        try {
            const [renterRes, ownerRes] = await Promise.all([
                apiClient.get<{ bookings: TrackedRental[] }>('/bookings'),
                apiClient.get<{ bookings: TrackedRental[] }>('/bookings/owner'),
            ]);
            setRentals(renterRes.bookings || []);
            setOwnerRentals(ownerRes.bookings || []);
        } catch (err) {
            console.error('Failed to fetch rental data:', err);
        } finally {
            setLoading(false);
        }
    };

    const currentRentals = view === 'renting' ? rentals : ownerRentals;
    const activeRentals = currentRentals.filter(r => ['ACTIVE', 'CONFIRMED'].includes(r.status));
    const pendingRentals = currentRentals.filter(r => r.status === 'PENDING');
    const pastRentals = currentRentals.filter(r => ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(r.status));

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center bg-[#030304]">
                <Navbar />
                <div className="text-center px-6">
                    <Timer size={64} className="mx-auto text-white/10 mb-6" />
                    <h2 className="text-2xl font-bold mb-3 text-white">Rental Tracker</h2>
                    <p className="text-white/40 mb-6">Sign in to track your active rentals</p>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white">
                        Sign In
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen bg-[#030304]">
            <Navbar />

            <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 relative">
                    <div className="absolute -top-24 -left-20 w-64 h-64 bg-[#6c5ce7]/15 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center">
                                    <Timer size={22} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
                                        Rental Tracker
                                    </h1>
                                    <p className="text-sm text-white/40">Live status of all your rentals</p>
                                </div>
                            </div>
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                            {(['renting', 'hosting'] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                                        view === v ? 'bg-[#6c5ce7]/20 text-[#a29bfe]' : 'text-white/30 hover:text-white/50'
                                    }`}
                                >
                                    {v === 'renting' ? '📦 Renting' : '🏠 Hosting'}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" />
                    </div>
                ) : (
                    <>
                        {/* Stats Row */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4 mb-8">
                            {[
                                { label: 'Active', value: activeRentals.length, icon: Zap, color: 'text-[#a29bfe]' },
                                { label: 'Pending', value: pendingRentals.length, icon: Clock, color: 'text-amber-400' },
                                { label: 'Completed', value: pastRentals.filter(r => r.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-emerald-400' },
                            ].map((s, i) => (
                                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                                    className="glass-card rounded-2xl p-4 border border-white/5 text-center">
                                    <s.icon size={18} className={`mx-auto mb-2 ${s.color}`} />
                                    <p className="text-2xl font-extrabold text-white">{s.value}</p>
                                    <p className="text-[9px] text-white/25 font-bold uppercase tracking-wider">{s.label}</p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Active Rentals */}
                        {activeRentals.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                                    <Zap size={14} className="text-[#a29bfe]" /> Active Rentals
                                </h3>
                                <div className="space-y-4">
                                    {activeRentals.map((rental, idx) => (
                                        <motion.div key={rental.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                            className="glass-card rounded-2xl border border-[#6c5ce7]/15 hover:border-[#6c5ce7]/25 transition-all overflow-hidden">
                                            <div className="p-5">
                                                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                                    <div className="w-full sm:w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                                                        {rental.listing.images?.[0] ? (
                                                            <img src={rental.listing.images[0]} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-white/10" /></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <Link href={`/item/${rental.listing.id}`} className="text-sm font-bold text-white hover:text-[#a29bfe] transition-colors truncate">
                                                                {rental.listing.title}
                                                            </Link>
                                                            <StatusTimeline status={rental.status} />
                                                        </div>
                                                        <RentalProgressBar startDate={rental.startDate} endDate={rental.endDate} status={rental.status} />
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4">
                                                    <CountdownTimer targetDate={rental.endDate} label={rental.status === 'CONFIRMED' ? 'Starts in' : 'Return in'} />
                                                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                                                        <DollarSign size={12} />
                                                        <span className="font-bold text-white/60">${rental.totalPrice}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                                                        <Calendar size={12} />
                                                        <span>{format(new Date(rental.startDate), 'MMM d')} — {format(new Date(rental.endDate), 'MMM d')}</span>
                                                    </div>
                                                    <div className="ml-auto flex gap-2">
                                                        <Link href="/messages" className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1">
                                                            <MessageCircle size={10} /> Message
                                                        </Link>
                                                        <Link href={`/item/${rental.listing.id}`} className="px-3 py-1.5 bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 rounded-lg text-[10px] text-[#a29bfe] hover:bg-[#6c5ce7]/20 transition-all flex items-center gap-1">
                                                            <Eye size={10} /> View
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pending Rentals */}
                        {pendingRentals.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                                    <Clock size={14} className="text-amber-400" /> Pending
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {pendingRentals.map((rental, idx) => (
                                        <motion.div key={rental.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                                            className="glass-card rounded-xl p-4 border border-amber-500/10 hover:border-amber-500/20 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                                    {rental.listing.images?.[0] ? (
                                                        <img src={rental.listing.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : <Package size={14} className="text-white/10 m-auto" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">{rental.listing.title}</p>
                                                    <p className="text-[9px] text-white/25">{format(new Date(rental.startDate), 'MMM d')} — {format(new Date(rental.endDate), 'MMM d')} · ${rental.totalPrice}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[8px] font-bold rounded-md uppercase">Pending</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Past Rentals */}
                        {pastRentals.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-400" /> History
                                </h3>
                                <div className="space-y-2">
                                    {pastRentals.slice(0, 10).map((rental, idx) => (
                                        <motion.div key={rental.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                                            className="glass-card rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                                {rental.listing.images?.[0] ? (
                                                    <img src={rental.listing.images[0]} alt="" className="w-full h-full object-cover" />
                                                ) : <Package size={12} className="text-white/10 m-auto" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-white/60 truncate">{rental.listing.title}</p>
                                                <p className="text-[9px] text-white/20">{format(new Date(rental.startDate), 'MMM d')} — {format(new Date(rental.endDate), 'MMM d, yyyy')}</p>
                                            </div>
                                            <span className="text-xs font-bold text-white/30">${rental.totalPrice}</span>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                                rental.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                            }`}>{rental.status}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {currentRentals.length === 0 && (
                            <div className="glass-card rounded-2xl p-12 text-center">
                                <Timer size={48} className="mx-auto text-white/10 mb-4" />
                                <h3 className="text-lg font-bold text-white/60 mb-2">No rentals yet</h3>
                                <p className="text-sm text-white/30 mb-6">
                                    {view === 'renting' ? 'Browse listings and book your first rental!' : 'Create a listing and wait for booking requests.'}
                                </p>
                                <Link href={view === 'renting' ? '/explore' : '/listings/new'} className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white text-sm inline-block">
                                    {view === 'renting' ? 'Explore Listings' : 'Create Listing'}
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
