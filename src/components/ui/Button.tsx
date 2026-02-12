'use client';

import { useRef, type MouseEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

interface ButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    icon?: ReactNode;
}

const variants = {
    primary: 'bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white hover:shadow-lg hover:shadow-[#6c5ce7]/25',
    secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20',
    ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
    outline: 'bg-transparent border border-[#6c5ce7]/50 text-[#a29bfe] hover:bg-[#6c5ce7]/10 hover:border-[#6c5ce7]',
};

const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    onClick,
    disabled = false,
    icon,
}: ButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);

    const handleRipple = (e: MouseEvent<HTMLButtonElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ref.current.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);

        onClick?.();
    };

    return (
        <motion.button
            ref={ref}
            className={`
        relative overflow-hidden rounded-xl font-medium transition-all duration-300
        ripple-container inline-flex items-center gap-2 cursor-none
        ${variants[variant]} ${sizes[size]} ${className}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleRipple}
            onMouseEnter={() => setCursorVariant('hover')}
            onMouseLeave={() => setCursorVariant('default')}
            disabled={disabled}
            suppressHydrationWarning
        >
            {icon && <span className="w-5 h-5 flex items-center justify-center">{icon}</span>}
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
}
