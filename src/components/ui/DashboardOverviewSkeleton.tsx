'use client';

import Skeleton from './Skeleton';

export default function DashboardOverviewSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton variant="circle" className="h-10 w-10" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart Placeholder */}
                <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-20 rounded-lg" />
                            <Skeleton className="h-8 w-20 rounded-lg" />
                        </div>
                    </div>
                    <Skeleton className="h-64 w-full rounded-2xl" />
                </div>

                {/* Activity Placeholder */}
                <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-6">
                    <Skeleton className="h-6 w-24" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton variant="circle" className="h-10 w-10" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-2 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
