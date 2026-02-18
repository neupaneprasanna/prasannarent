'use client';

import Skeleton from './Skeleton';

export default function ProductPageSkeleton() {
    return (
        <div className="min-h-screen pt-24 pb-20 bg-[#030304] animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto px-6">
                {/* Back button placeholder */}
                <Skeleton className="h-4 w-20 mb-8" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Media Gallery Placeholder */}
                    <div className="lg:col-span-8 space-y-6">
                        <Skeleton className="aspect-video w-full rounded-[2.5rem]" />
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="aspect-square rounded-2xl" />
                            ))}
                        </div>
                    </div>

                    {/* Details Sidebar Placeholder */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-6">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                            <div className="flex gap-4">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <Skeleton className="h-12 w-full rounded-2xl" />
                                <Skeleton className="h-12 w-full rounded-2xl" />
                            </div>
                        </div>

                        {/* Owner card placeholder */}
                        <div className="glass-card p-6 rounded-2xl border-white/5 flex items-center gap-4">
                            <Skeleton variant="circle" className="h-12 w-12" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description Placeholder */}
                <div className="lg:col-span-8 mt-12 space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            </div>
        </div>
    );
}
