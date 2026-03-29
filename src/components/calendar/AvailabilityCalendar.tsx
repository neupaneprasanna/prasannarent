'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
    DollarSign, Ban, Check, AlertTriangle, Loader2
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isWithinInterval, isBefore, isAfter, parseISO } from 'date-fns';

interface Booking {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    renter?: { firstName: string; lastName: string } | null;
}

interface BlockedDate {
    id: string;
    startDate: string;
    endDate: string;
    reason?: string;
}

interface AvailabilityCalendarProps {
    listingId: string;
    bookings?: Booking[];
    blockedDates?: BlockedDate[];
    pricePerDay?: number;
    priceUnit?: string;
    isOwner?: boolean;
    onDateRangeSelect?: (start: Date, end: Date) => void;
}

type DayStatus = 'available' | 'booked' | 'blocked' | 'selected' | 'range' | 'past';

export default function AvailabilityCalendar({
    listingId,
    bookings = [],
    blockedDates = [],
    pricePerDay = 0,
    priceUnit = 'DAY',
    isOwner = false,
    onDateRangeSelect,
}: AvailabilityCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [rangeStart, setRangeStart] = useState<Date | null>(null);
    const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    // Build day cells for the calendar grid
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

        const days: Date[] = [];
        let day = startDate;
        while (day <= endDate) {
            days.push(day);
            day = addDays(day, 1);
        }
        return days;
    }, [currentMonth]);

    // Determine status of each day
    const getDayStatus = (day: Date): DayStatus => {
        if (isBefore(day, today)) return 'past';

        // Check if booked
        for (const b of bookings) {
            const start = parseISO(b.startDate);
            const end = parseISO(b.endDate);
            if (isWithinInterval(day, { start, end }) && ['CONFIRMED', 'ACTIVE'].includes(b.status)) {
                return 'booked';
            }
        }

        // Check if blocked
        for (const bd of blockedDates) {
            const start = parseISO(bd.startDate);
            const end = parseISO(bd.endDate);
            if (isWithinInterval(day, { start, end })) {
                return 'blocked';
            }
        }

        // Check if in selected range
        if (rangeStart && rangeEnd) {
            if (isSameDay(day, rangeStart) || isSameDay(day, rangeEnd)) return 'selected';
            if (isWithinInterval(day, { start: rangeStart, end: rangeEnd })) return 'range';
        } else if (rangeStart && isSameDay(day, rangeStart)) {
            return 'selected';
        }

        // Hover range preview
        if (rangeStart && !rangeEnd && hoverDate && isAfter(hoverDate, rangeStart)) {
            if (isWithinInterval(day, { start: rangeStart, end: hoverDate }) || isSameDay(day, hoverDate)) {
                return 'range';
            }
        }

        return 'available';
    };

    const handleDayClick = (day: Date) => {
        const status = getDayStatus(day);
        if (status === 'past' || status === 'booked' || status === 'blocked') return;

        if (!rangeStart || (rangeStart && rangeEnd)) {
            // Start new selection
            setRangeStart(day);
            setRangeEnd(null);
        } else {
            // Complete selection
            if (isBefore(day, rangeStart)) {
                setRangeStart(day);
                setRangeEnd(rangeStart);
                onDateRangeSelect?.(day, rangeStart);
            } else {
                setRangeEnd(day);
                onDateRangeSelect?.(rangeStart, day);
            }
        }
    };

    // Calculate total price for selected range
    const selectedDays = useMemo(() => {
        if (!rangeStart || !rangeEnd) return 0;
        return Math.max(1, Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)));
    }, [rangeStart, rangeEnd]);

    const totalPrice = selectedDays * pricePerDay;

    // Get booking for a day
    const getBookingForDay = (day: Date): Booking | undefined => {
        return bookings.find(b => {
            const start = parseISO(b.startDate);
            const end = parseISO(b.endDate);
            return isWithinInterval(day, { start, end }) && ['CONFIRMED', 'ACTIVE'].includes(b.status);
        });
    };

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
                >
                    <ChevronLeft size={18} />
                </button>
                <h3 className="text-sm font-bold text-white tracking-wide">
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-1">
                {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-[9px] text-white/25 font-bold uppercase tracking-wider py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                    const status = getDayStatus(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, today);
                    const booking = getBookingForDay(day);

                    let cellBg = '';
                    let textColor = 'text-white/60';
                    let cursor = 'cursor-pointer hover:bg-white/5';

                    switch (status) {
                        case 'past':
                            textColor = 'text-white/10';
                            cursor = 'cursor-default';
                            break;
                        case 'booked':
                            cellBg = 'bg-red-500/8';
                            textColor = 'text-red-300/60';
                            cursor = 'cursor-not-allowed';
                            break;
                        case 'blocked':
                            cellBg = 'bg-white/3';
                            textColor = 'text-white/15';
                            cursor = 'cursor-not-allowed';
                            break;
                        case 'selected':
                            cellBg = 'bg-[#6c5ce7]';
                            textColor = 'text-white font-bold';
                            cursor = 'cursor-pointer';
                            break;
                        case 'range':
                            cellBg = 'bg-[#6c5ce7]/15';
                            textColor = 'text-[#a29bfe]';
                            cursor = 'cursor-pointer';
                            break;
                        case 'available':
                            cursor = 'cursor-pointer hover:bg-[#6c5ce7]/10';
                            break;
                    }

                    if (!isCurrentMonth) textColor = 'text-white/5';

                    return (
                        <div
                            key={i}
                            className={`relative aspect-square flex items-center justify-center rounded-lg text-xs transition-all ${cellBg} ${textColor} ${cursor} ${isToday ? 'ring-1 ring-[#00cec9]/30' : ''}`}
                            onClick={() => isCurrentMonth && handleDayClick(day)}
                            onMouseEnter={() => setHoverDate(day)}
                            onMouseLeave={() => setHoverDate(null)}
                            title={
                                status === 'booked' ? `Booked${booking?.renter ? ` by ${booking.renter.firstName}` : ''}`
                                    : status === 'blocked' ? 'Blocked by owner'
                                        : undefined
                            }
                        >
                            <span>{format(day, 'd')}</span>
                            {isToday && status !== 'selected' && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00cec9]" />
                            )}
                            {status === 'booked' && (
                                <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-red-400" />
                            )}
                            {status === 'blocked' && (
                                <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-white/20" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-3 text-[9px] text-white/25 font-bold uppercase tracking-wider justify-center">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#00cec9]" /> Today</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6c5ce7]" /> Selected</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400/60" /> Booked</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/15" /> Blocked</span>
            </div>

            {/* Price Preview */}
            <AnimatePresence>
                {rangeStart && rangeEnd && selectedDays > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 p-4 rounded-2xl bg-[#6c5ce7]/8 border border-[#6c5ce7]/15"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/50">Selected dates</span>
                            <button
                                onClick={() => { setRangeStart(null); setRangeEnd(null); }}
                                className="text-[9px] text-[#a29bfe] hover:text-white transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                        <p className="text-sm font-bold text-white mb-1">
                            {format(rangeStart, 'MMM d')} — {format(rangeEnd, 'MMM d, yyyy')}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-white/40">{selectedDays} {selectedDays === 1 ? 'day' : 'days'} × ${pricePerDay}/{priceUnit.toLowerCase()}</span>
                            <span className="text-lg font-extrabold text-white">${totalPrice.toLocaleString()}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
