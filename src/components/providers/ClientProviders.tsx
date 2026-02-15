'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import SmoothScroll from '@/components/providers/SmoothScroll';
import CustomCursor from '@/components/cursor/CustomCursor';
import CinematicLoader from '@/components/loading/CinematicLoader';
import CommandMenu from '@/components/ui/CommandMenu';
import Toaster from '@/components/ui/Toaster';
import { SocketProvider } from './SocketProvider';
import { toast } from 'sonner';

export default function ClientProviders({ children }: { children: ReactNode }) {
    const isSearchActive = useAppStore((s) => s.isSearchActive);
    const isCinemaMode = useAppStore((s) => s.isCinemaMode);

    return (
        <SmoothScroll>
            <SocketProvider>
                <CinematicLoader />
                <CustomCursor />
                <CommandMenu />
                <Toaster />
                <motion.div
                    animate={{
                        filter: (isSearchActive || isCinemaMode) ? 'blur(12px) brightness(0.5)' : 'blur(0px) brightness(1)',
                        scale: (isSearchActive || isCinemaMode) ? 0.96 : 1,
                    }}
                    transition={{
                        duration: 0.5,
                        ease: [0.23, 1, 0.32, 1]
                    }}
                    className="origin-center"
                >
                    {children}
                </motion.div>
            </SocketProvider>
        </SmoothScroll>
    );
}
