'use client';

import { Toaster as Sonner } from 'sonner';

export default function Toaster() {
    return (
        <Sonner
            theme="dark"
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        'group toast group-[.toaster]:bg-[#0a0a0a] group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-lg',
                    description: 'group-[.toast]:text-white/40',
                    actionButton:
                        'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                    cancelButton:
                        'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                },
            }}
        />
    );
}
