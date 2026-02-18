'use client';

import Skeleton from './Skeleton';

export default function ListingCardSkeleton() {
    return (
        <div className="glass-card rounded-2xl overflow-hidden h-full border border-white/5">
            {/* Image area */}
            <Skeleton className="h-48 md:h-56 w-full rounded-none" />

            {/* Content area */}
            <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-12" />
                </div>

                <Skeleton className="h-3 w-1/3" />

                <div className="flex justify-between items-end pt-2">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-3 w-12" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton variant="circle" className="h-5 w-5" />
                        <Skeleton variant="circle" className="h-6 w-6" />
                    </div>
                </div>
            </div>
        </div>
    );
}
