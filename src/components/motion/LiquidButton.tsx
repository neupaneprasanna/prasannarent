'use client';

import { useRef, useState, useCallback, type ReactNode, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * LiquidButton — Physics-driven button with:
 * - Frosted glass base with chrome metallic edge
 * - Hover: rises, glow intensifies, light sweep, liquid ripple
 * - Click: compresses, ripple from click origin, spring bounce
 * - All spring-based, zero linear transitions
 */

interface LiquidButtonProps {
    children: ReactNode;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'cta';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    type?: 'button' | 'submit';
    onMouseDown?: (e: MouseEvent<HTMLButtonElement>) => void;
    onMouseUp?: (e: MouseEvent<HTMLButtonElement>) => void;
    /** Glow color for hover state */
    glowColor?: string;
}

interface RippleState {
    x: number;
    y: number;
    id: number;
}

export default function LiquidButton({
    children,
    onClick,
    className = '',
    variant = 'primary',
    size = 'md',
    disabled = false,
    type = 'button',
    onMouseDown,
    onMouseUp,
    glowColor,
}: LiquidButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);
    const [ripples, setRipples] = useState<RippleState[]>([]);
    const [isPressed, setIsPressed] = useState(false);
    const rippleId = useRef(0);

    // Cursor position relative to button center (for liquid distortion)
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Spring-smoothed transforms for liquid distortion (more elastic for "water" feel)
    const distortX = useSpring(useTransform(mouseX, [-150, 150], [-6, 6]), { stiffness: 500, damping: 15, mass: 0.8 });
    const distortY = useSpring(useTransform(mouseY, [-150, 150], [-6, 6]), { stiffness: 500, damping: 15, mass: 0.8 });

    // Scale responds to proximity (bulge effect)
    const proximityScale = useSpring(useTransform([mouseX, mouseY], ([x, y]: number[]) => {
        const d = Math.sqrt(x * x + y * y);
        return 1 + Math.max(0, (1 - d / 150) * 0.03);
    }), { stiffness: 400, damping: 20 });

    // Light sweep and specular highlight position
    const lightSweep = useTransform(mouseX, [-150, 150], [-20, 120]);
    const specularX = useTransform(mouseX, [-100, 100], [20, 80]);
    const specularY = useTransform(mouseY, [-100, 100], [20, 80]);

    const handleMouseMove = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    }, [mouseX, mouseY]);

    const handleMouseLeave = useCallback(() => {
        mouseX.set(0);
        mouseY.set(0);
    }, [mouseX, mouseY]);

    const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;

        // Create ripple from click origin
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const id = rippleId.current++;
            setRipples((prev) => [...prev, { x, y, id }]);
            setTimeout(() => {
                setRipples((prev) => prev.filter((r) => r.id !== id));
            }, 800);
        }

        onClick?.(e);
    }, [disabled, onClick]);

    // Variant styles
    const defaultGlow = variant === 'primary' ? '#8B5CF6' : variant === 'cta' ? '#22D3EE' : '#F8FAFC';
    const glow = glowColor || defaultGlow;

    const variantStyles = {
        primary: {
            bg: 'linear-gradient(135deg, rgba(139,92,246,0.95) 0%, rgba(165,180,252,0.85) 100%)',
            border: '1px solid rgba(165,180,252,0.4)',
            shadow: `0 4px 25px ${glow}20, inset 0 0 15px rgba(255,255,255,0.15)`,
            hoverShadow: `0 15px 50px ${glow}40, 0 0 70px ${glow}20, inset 0 1px 0 rgba(255,255,255,0.35)`,
            color: '#fff',
        },
        secondary: {
            bg: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.25)',
            shadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            hoverShadow: `0 10px 35px ${glow}25, inset 0 1px 0 rgba(255,255,255,0.25)`,
            color: 'rgba(248,250,252,0.9)',
        },
        ghost: {
            bg: 'rgba(248,250,252,0.05)',
            border: '1px solid rgba(248,250,252,0.15)',
            shadow: 'none',
            hoverShadow: '0 10px 30px rgba(248,250,252,0.12), inset 0 0 15px rgba(248,250,252,0.05)',
            color: 'rgba(248,250,252,0.7)',
        },
        cta: {
            bg: 'linear-gradient(135deg, #8B5CF6 0%, #22D3EE 50%, #FDE68A 100%)',
            border: '1px solid rgba(255,255,255,0.35)',
            shadow: `0 8px 40px ${glow}45, 0 0 60px ${glow}20`,
            hoverShadow: `0 20px 80px ${glow}60, 0 0 120px ${glow}40, inset 0 1px 0 rgba(255,255,255,0.45)`,
            color: '#020305', // High contrast on bright CTA
        },
    };

    const sizes = {
        sm: 'px-5 py-2 text-xs',
        md: 'px-7 py-3.5 text-sm',
        lg: 'px-9 py-4 text-base',
    };

    const style = variantStyles[variant];

    return (
        <motion.button
            ref={ref}
            type={type}
            disabled={disabled}
            className={`
        relative overflow-hidden rounded-2xl font-medium tracking-wide
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
            style={{
                background: style.bg,
                border: style.border,
                color: style.color,
                backdropFilter: 'blur(24px)',
                willChange: 'transform, box-shadow',
                x: distortX,
                y: distortY,
                scale: proximityScale,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onMouseDown={(e) => {
                setIsPressed(true);
                onMouseDown?.(e);
            }}
            onMouseUp={(e) => {
                setIsPressed(false);
                onMouseUp?.(e);
            }}
            whileHover={{
                y: -6,
                scale: 1.02,
                boxShadow: style.hoverShadow,
            }}
            whileTap={{
                scale: 0.94,
                y: 0,
            }}
            animate={{
                boxShadow: style.shadow,
            }}
            transition={{
                type: 'spring',
                stiffness: 500,
                damping: 18,
                mass: 0.6,
            }}
            suppressHydrationWarning
        >
            {/* Dynamic specular highlight — water droplet gloss */}
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: useTransform(
                        [specularX, specularY],
                        ([sx, sy]: number[]) =>
                            `radial-gradient(circle at ${sx}% ${sy}%, rgba(255,255,255,0.4) 0%, transparent 40%)`
                    ),
                }}
                aria-hidden
            />

            {/* Light sweep effect — a diagonal light beam that follows cursor */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: useTransform(
                        lightSweep,
                        (v) => `linear-gradient(105deg, transparent ${v - 25}%, rgba(255,255,255,0.15) ${v}%, transparent ${v + 25}%)`
                    ),
                }}
                aria-hidden
            />

            {/* Water surface tension (concave highlight) */}
            <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                    background: 'radial-gradient(circle at center top, rgba(255,255,255,0.15) 0%, transparent 60%)',
                }}
                aria-hidden
            />

            {/* Chrome metallic top edge */}
            <div
                className="absolute top-0 left-[10%] right-[10%] h-[1px] pointer-events-none"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                }}
                aria-hidden
            />

            {/* Ripple effects (Water droplets splashing) */}
            {ripples.map((ripple) => (
                <motion.span
                    key={ripple.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        translateX: '-50%',
                        translateY: '-50%',
                        background: `radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)`,
                        boxShadow: '0 0 20px rgba(255,255,255,0.2)',
                    }}
                    initial={{ width: 0, height: 0, opacity: 0.8 }}
                    animate={{ width: 400, height: 400, opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            ))}

            {/* CTA variant: rotating outer ring on hover */}
            {variant === 'cta' && (
                <motion.div
                    className="absolute -inset-[3px] rounded-2xl pointer-events-none"
                    style={{
                        border: '1px solid transparent',
                        background: 'linear-gradient(var(--angle, 0deg), transparent 60%, rgba(122,92,255,0.6) 80%, rgba(255,77,157,0.5) 100%)',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                        padding: '1.5px',
                    }}
                    animate={{ '--angle': ['0deg', '360deg'] } as any}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    aria-hidden
                />
            )}

            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2 group-hover:scale-105 transition-transform duration-300">
                {children}
            </span>
        </motion.button>
    );
}
