'use client';

import { ReactNode } from 'react';
import SmoothScroll from '@/lib/animations/smooth-scroll';
import CustomCursor from '@/components/cursor/CustomCursor';
import CinematicLoader from '@/components/loading/CinematicLoader';

export default function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <SmoothScroll>
            <CinematicLoader />
            <CustomCursor />
            {children}
        </SmoothScroll>
    );
}
