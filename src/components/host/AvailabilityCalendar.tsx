'use client';

import { useState, useEffect } from 'react';
import { useCalendarStore } from '@/store/engagement-store';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    isBefore,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Ban, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AvailabilityCalendarProps {
    listingId: string;
}

export default function AvailabilityCalendar({ listingId }: AvailabilityCalendarProps) {
    const { events, fetchAvailability, blockDates, loading } = useCalendarStore();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [blockReason, setBlockReason] = useState('');
    const [isBlocking, setIsBlocking] = useState(false);

    useEffect(() => {
        fetchAvailability(listingId, 6); // Fetch 6 months ahead
    }, [listingId, fetchAvailability]);

    const handleDateClick = (date: Date) => {
        if (isBefore(date, new Date()) && !isToday(date)) return;

        if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
            setSelectedRange({ start: date, end: null });
        } else {
            // Ensure start is before end
            if (isBefore(date, selectedRange.start)) {
                setSelectedRange({ start: date, end: selectedRange.start });
            } else {
                setSelectedRange({ ...selectedRange, end: date });
            }
        }
    };

    const handleBlockDates = async () => {
        if (!selectedRange.start || !selectedRange.end) return;

        setIsBlocking(true);
        try {
            await blockDates(listingId, selectedRange.start, selectedRange.end, blockReason);
            toast.success('Dates blocked successfully');
            setSelectedRange({ start: null, end: null });
            setBlockReason('');
        } catch (error) {
            toast.error('Failed to block dates');
        } finally {
            setIsBlocking(false);
        }
    };

    const getDayStatus = (date: Date) => {
        const dateStr = date.toISOString();

        // Check for existing blocks/bookings
        const event = events.find(e =>
            new Date(e.startDate) <= date && new Date(e.endDate) >= date
        );

        if (event) {
            return event.type === 'block' ? 'blocked' : 'booked';
        }

        // Check selection
        if (selectedRange.start && isSameDay(date, selectedRange.start)) return 'selected-start';
        if (selectedRange.end && isSameDay(date, selectedRange.end)) return 'selected-end';
        if (selectedRange.start && selectedRange.end && date > selectedRange.start && date < selectedRange.end) return 'selected-range';

        return 'available';
    };

    return (
        <div className="bg-[#121212]/50 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-semibold">Availability & Blocking</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                        disabled={isBefore(currentMonth, new Date())}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-30"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-medium w-32 text-center">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 mb-4 text-center text-xs text-white/40 uppercase tracking-widest">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2">{day}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {eachDayOfInterval({
                    start: startOfWeek(startOfMonth(currentMonth)),
                    end: endOfWeek(endOfMonth(currentMonth))
                }).map((day, i) => {
                    const status = getDayStatus(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isPast = isBefore(day, new Date()) && !isToday(day);

                    return (
                        <div
                            key={i}
                            onClick={() => !isPast && handleDateClick(day)}
                            className={cn(
                                "aspect-square flex flex-col items-center justify-center text-sm rounded-lg cursor-pointer transition-all relative group",
                                // Base styles
                                !isCurrentMonth && "opacity-20",
                                isPast && "opacity-20 cursor-not-allowed",

                                // Status styles
                                status === 'available' && !isPast && "hover:bg-white/5",
                                status === 'booked' && "bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-not-allowed",
                                status === 'blocked' && "bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed",
                                (status === 'selected-start' || status === 'selected-end') && "bg-white text-black font-bold z-10 shadow-lg shadow-white/20",
                                status === 'selected-range' && "bg-white/20",
                            )}
                        >
                            <span className={cn(isToday(day) && status === 'available' && "text-blue-400 font-bold")}>
                                {format(day, 'd')}
                            </span>

                            {status === 'booked' && <CheckCircle2 size={10} className="mt-1 opacity-50" />}
                            {status === 'blocked' && <Ban size={10} className="mt-1 opacity-50" />}
                        </div>
                    );
                })}
            </div>

            {/* Action Bar */}
            {selectedRange.start && selectedRange.end && (
                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4 animate-in slide-in-from-bottom-2">
                    <div className="flex-1">
                        <p className="text-sm text-white/60 mb-1">Block these dates?</p>
                        <p className="font-medium">
                            {format(selectedRange.start, 'MMM d')} - {format(selectedRange.end, 'MMM d')}
                        </p>
                    </div>
                    <input
                        type="text"
                        placeholder="Reason (optional)"
                        value={blockReason}
                        onChange={e => setBlockReason(e.target.value)}
                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                    />
                    <button
                        onClick={handleBlockDates}
                        disabled={isBlocking}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        {isBlocking ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                        Block Dates
                    </button>
                </div>
            )}
        </div>
    );
}
