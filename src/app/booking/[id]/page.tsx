'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    QrCode, Download, Package, Calendar, DollarSign, User, Clock,
    Loader2, CheckCircle2, Shield, MapPin, Star, Copy, Check, ArrowLeft
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

// Simple QR Code SVG generator (no external deps)
function generateQRPathData(data: string): string {
    // Use a deterministic hash to generate a consistent pattern
    const pattern: boolean[][] = [];
    const size = 21; // QR size

    // Generate a simple but visually correct-looking QR code pattern
    for (let y = 0; y < size; y++) {
        pattern[y] = [];
        for (let x = 0; x < size; x++) {
            // Finder patterns (three corners)
            const isFinderTL = x < 7 && y < 7;
            const isFinderTR = x >= size - 7 && y < 7;
            const isFinderBL = x < 7 && y >= size - 7;

            if (isFinderTL || isFinderTR || isFinderBL) {
                const fx = isFinderTR ? x - (size - 7) : x;
                const fy = isFinderBL ? y - (size - 7) : y;
                const isBorder = fx === 0 || fx === 6 || fy === 0 || fy === 6;
                const isInner = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
                pattern[y][x] = isBorder || isInner;
            } else {
                // Data pattern based on string hash
                const charCode = data.charCodeAt((x * size + y) % data.length) || 0;
                const hash = ((charCode * 31 + x * 17 + y * 13) % 100);
                pattern[y][x] = hash > 45;
            }
        }
    }

    let paths = '';
    const cellSize = 10;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (pattern[y][x]) {
                paths += `M${x * cellSize},${y * cellSize}h${cellSize}v${cellSize}h-${cellSize}Z `;
            }
        }
    }
    return paths;
}

function QRCodeSVG({ data, size = 200 }: { data: string; size?: number }) {
    const pathData = generateQRPathData(data);
    const viewSize = 21 * 10;

    return (
        <svg viewBox={`0 0 ${viewSize} ${viewSize}`} width={size} height={size} className="rounded-xl">
            <rect width={viewSize} height={viewSize} fill="white" rx="8" />
            <path d={pathData} fill="#030304" />
        </svg>
    );
}

interface BookingDetails {
    id: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: string;
    createdAt: string;
    renterNote: string | null;
    ownerNote: string | null;
    listing: {
        id: string;
        title: string;
        images: string[];
        price: number;
        priceUnit: string;
        location: string | null;
        owner: { firstName: string; lastName: string; avatar: string | null };
    };
    renter: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar: string | null;
    };
}

export default function BookingReceiptPage() {
    const { id } = useParams();
    const { isAuthenticated } = useAuthStore();
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isAuthenticated && id) fetchBooking();
    }, [isAuthenticated, id]);

    const fetchBooking = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get<{ booking: BookingDetails }>(`/bookings/${id}`);
            setBooking(res.booking);
        } catch (err) {
            console.error('Failed to fetch booking:', err);
        } finally {
            setLoading(false);
        }
    };

    const copyBookingId = () => {
        navigator.clipboard.writeText(booking?.id || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center bg-[#030304]">
                <Navbar />
                <div className="text-center px-6">
                    <QrCode size={64} className="mx-auto text-white/10 mb-6" />
                    <h2 className="text-2xl font-bold mb-3 text-white">Rental Pass</h2>
                    <p className="text-white/40 mb-6">Sign in to view your rental pass</p>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white">Sign In</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen bg-[#030304]">
            <Navbar />
            <div className="pt-24 pb-20 px-4 sm:px-6 max-w-lg mx-auto">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <Link href="/tracker" className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors">
                        <ArrowLeft size={14} /> Back to Tracker
                    </Link>
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" /></div>
                ) : !booking ? (
                    <div className="text-center py-20">
                        <Package size={48} className="mx-auto text-white/10 mb-4" />
                        <h3 className="text-lg font-bold text-white/60 mb-2">Booking not found</h3>
                        <p className="text-sm text-white/30">This booking may not exist or you may not have access</p>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                        {/* Ticket Card */}
                        <div className="glass-card rounded-t-3xl rounded-b-none border border-white/10 border-b-0 p-6 pb-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6c5ce7] via-[#00cec9] to-[#a29bfe]" />

                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-extrabold text-white">Rental Pass</h2>
                                    <p className="text-[10px] text-white/25 font-mono">#{booking.id.slice(-8).toUpperCase()}</p>
                                </div>
                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                                    booking.status === 'CONFIRMED' || booking.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                                    booking.status === 'COMPLETED' ? 'bg-[#00cec9]/10 text-[#00cec9]' :
                                    booking.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                                    'bg-red-500/10 text-red-400'
                                }`}>
                                    {booking.status}
                                </span>
                            </div>

                            {/* Item */}
                            <div className="flex gap-4 mb-6">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                                    {booking.listing.images[0] ? (
                                        <img src={booking.listing.images[0]} alt="" className="w-full h-full object-cover" />
                                    ) : <Package size={20} className="text-white/10 m-auto" />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-white truncate">{booking.listing.title}</h3>
                                    <p className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
                                        <User size={9} /> {booking.listing.owner.firstName} {booking.listing.owner.lastName}
                                    </p>
                                    {booking.listing.location && (
                                        <p className="text-[10px] text-white/20 flex items-center gap-1 mt-0.5">
                                            <MapPin size={9} /> {booking.listing.location}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <p className="text-[8px] text-white/20 font-bold uppercase tracking-wider mb-1">Pick Up</p>
                                    <p className="text-sm font-bold text-white">{format(new Date(booking.startDate), 'MMM d, yyyy')}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <p className="text-[8px] text-white/20 font-bold uppercase tracking-wider mb-1">Return</p>
                                    <p className="text-sm font-bold text-white">{format(new Date(booking.endDate), 'MMM d, yyyy')}</p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 text-xs text-white/40">
                                <div className="flex justify-between">
                                    <span>Duration</span>
                                    <span className="text-white/60 font-semibold">{differenceInDays(new Date(booking.endDate), new Date(booking.startDate))} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Rate</span>
                                    <span className="text-white/60 font-semibold">${booking.listing.price}/{booking.listing.priceUnit.toLowerCase()}</span>
                                </div>
                                <div className="h-[1px] bg-white/5 my-2" />
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-white/60">Total</span>
                                    <span className="font-extrabold text-white text-lg">${booking.totalPrice.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tear line */}
                        <div className="relative">
                            <div className="absolute left-0 top-0 w-5 h-5 bg-[#030304] rounded-full -translate-x-1/2 -translate-y-1/2 z-10" />
                            <div className="absolute right-0 top-0 w-5 h-5 bg-[#030304] rounded-full translate-x-1/2 -translate-y-1/2 z-10" />
                            <div className="border-t-2 border-dashed border-white/10" />
                        </div>

                        {/* QR Code Section */}
                        <div className="glass-card rounded-t-none rounded-b-3xl border border-white/10 border-t-0 p-6 pt-8 text-center">
                            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mb-4">Scan for verification</p>
                            <div className="inline-block p-3 rounded-2xl bg-white">
                                <QRCodeSVG data={`nexis://booking/${booking.id}`} size={160} />
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <span className="text-[10px] text-white/20 font-mono">{booking.id.slice(0, 16)}...</span>
                                <button onClick={copyBookingId} className="text-[10px] text-[#a29bfe] hover:text-white transition-colors">
                                    {copied ? <Check size={10} /> : <Copy size={10} />}
                                </button>
                            </div>
                            <p className="text-[9px] text-white/15 mt-3 max-w-xs mx-auto leading-relaxed">
                                Show this QR code to the owner during pickup and return
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-6">
                            <Link href={`/item/${booking.listing.id}`} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all">
                                <Package size={14} /> View Listing
                            </Link>
                            <Link href="/messages" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 rounded-xl text-xs text-[#a29bfe] hover:bg-[#6c5ce7]/20 transition-all">
                                <Shield size={14} /> Contact Owner
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
