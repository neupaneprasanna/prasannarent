'use client';

import { useEffect, useRef } from 'react';

/**
 * ParticleField — Scroll-velocity reactive particle system
 * 
 * Reacts to:
 * - Mouse position (particles scatter from cursor)
 * - Scroll velocity (particles trail lengthen, velocity increases)
 * - Idle state (particles slow to gentle float)
 * 
 * All rendering is GPU-friendly canvas, runs at 60fps.
 */

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    life: number;
    maxLife: number;
    hue: number; // color variation
    saturation: number;
    lightness: number;
    trail: { x: number; y: number }[]; // trail points for scroll velocity
}

export default function ParticleField({ count = 80 }: { count?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const mouseRef = useRef({ x: -1, y: -1, vx: 0, vy: 0, lastX: -1, lastY: -1 });
    const scrollRef = useRef({ velocity: 0, speed: 0 });
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio, 2);

        const resize = () => {
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        // Initialize particles
        const w = window.innerWidth;
        const h = window.innerHeight;
        particlesRef.current = Array.from({ length: count }, () => {
            const r = Math.random();
            const hue = r > 0.8 ? 190 : r > 0.6 ? 260 : r > 0.4 ? 320 : 220; // Cyan, Violet, Pink, Blue
            const isWhite = r > 0.9;

            return {
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3 - 0.1,
                size: Math.random() * 2.8 + 1.2,
                alpha: Math.random() * 0.5 + 0.3,
                life: Math.random() * 300,
                maxLife: 300 + Math.random() * 200,
                hue: isWhite ? 0 : hue,
                saturation: isWhite ? 0 : 70,
                lightness: isWhite ? 100 : 85,
                trail: [],
            };
        });

        // Mouse tracking
        let lastMoveTime = 0;
        const handleMouse = (e: MouseEvent) => {
            const now = Date.now();
            const dt = Math.max(1, now - lastMoveTime) / 16;
            lastMoveTime = now;
            const m = mouseRef.current;
            if (m.lastX >= 0) {
                m.vx = (e.clientX - m.lastX) / dt;
                m.vy = (e.clientY - m.lastY) / dt;
            }
            m.lastX = e.clientX;
            m.lastY = e.clientY;
            m.x = e.clientX;
            m.y = e.clientY;
        };
        window.addEventListener('mousemove', handleMouse, { passive: true });

        // Scroll velocity tracking
        let lastScrollY = window.scrollY;
        let scrollVelocitySmooth = 0;
        const handleScroll = () => {
            const currentY = window.scrollY;
            const rawV = currentY - lastScrollY;
            scrollVelocitySmooth = scrollVelocitySmooth * 0.8 + rawV * 0.2;
            scrollRef.current.velocity = scrollVelocitySmooth;
            scrollRef.current.speed = Math.abs(scrollVelocitySmooth);
            lastScrollY = currentY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        const loop = () => {
            animRef.current = requestAnimationFrame(loop);
            const cw = window.innerWidth;
            const ch = window.innerHeight;

            ctx.clearRect(0, 0, cw, ch);

            const m = mouseRef.current;
            const mouseSpeed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
            m.vx *= 0.92;
            m.vy *= 0.92;

            const scrollSpeed = scrollRef.current.speed;
            const scrollVel = scrollRef.current.velocity;
            // Decay scroll velocity
            scrollRef.current.velocity *= 0.95;
            scrollRef.current.speed = Math.abs(scrollRef.current.velocity);

            // Max trail length scales with scroll speed
            const maxTrailLen = Math.min(12, Math.floor(scrollSpeed * 0.5 + 2));

            particlesRef.current.forEach((p) => {
                // Mouse influence — particles scatter from cursor
                if (m.x >= 0) {
                    const dx = p.x - m.x;
                    const dy = p.y - m.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150 && dist > 0) {
                        const force = (1 - dist / 150) * mouseSpeed * 0.02;
                        p.vx += (dx / dist) * force;
                        p.vy += (dy / dist) * force;
                    }
                }

                // Scroll velocity influence — push particles
                if (scrollSpeed > 0.5) {
                    // Wind effect: push particles in scroll direction
                    p.vy -= scrollVel * 0.003;
                    // Slight horizontal turbulence
                    p.vx += (Math.random() - 0.5) * scrollSpeed * 0.01;
                }

                // Physics
                p.vx *= 0.98;
                p.vy *= 0.98;
                p.x += p.vx;
                p.y += p.vy;
                p.life++;

                // Record trail
                p.trail.unshift({ x: p.x, y: p.y });
                if (p.trail.length > maxTrailLen) p.trail.length = maxTrailLen;

                // Lifecycle — fade in/out
                const lifeRatio = p.life / p.maxLife;
                let opacity = p.alpha;
                if (lifeRatio < 0.1) opacity *= lifeRatio / 0.1;
                if (lifeRatio > 0.9) opacity *= (1 - lifeRatio) / 0.1;

                // Wrap around
                if (p.x < -10) p.x = cw + 10;
                if (p.x > cw + 10) p.x = -10;
                if (p.y < -10) p.y = ch + 10;
                if (p.y > ch + 10) p.y = -10;

                // Respawn
                if (p.life >= p.maxLife) {
                    const r = Math.random();
                    const hue = r > 0.8 ? 190 : r > 0.6 ? 260 : r > 0.4 ? 320 : 220;
                    const isWhite = r > 0.9;

                    p.x = Math.random() * cw;
                    p.y = Math.random() * ch;
                    p.vx = (Math.random() - 0.5) * 0.3;
                    p.vy = (Math.random() - 0.5) * 0.3 - 0.1;
                    p.life = 0;
                    p.maxLife = 300 + Math.random() * 200;
                    p.alpha = Math.random() * 0.5 + 0.3;
                    p.size = Math.random() * 2.8 + 1.2;
                    // @ts-ignore
                    p.hue = isWhite ? 0 : hue;
                    // @ts-ignore
                    p.saturation = isWhite ? 0 : 70;
                    // @ts-ignore
                    p.lightness = isWhite ? 100 : 85;
                    p.trail = [];
                }

                // Draw trail when scrolling fast
                if (scrollSpeed > 2 && p.trail.length > 2) {
                    ctx.beginPath();
                    ctx.moveTo(p.trail[0].x, p.trail[0].y);
                    for (let i = 1; i < p.trail.length; i++) {
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                    }
                    ctx.strokeStyle = `hsla(${p.hue}, 60%, 75%, ${opacity * 0.3})`;
                    ctx.lineWidth = p.size * 0.5;
                    ctx.stroke();
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                // @ts-ignore - added properties
                ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${opacity})`;
                ctx.fill();

                // Add a small inner glow for large particles
                if (p.size > 2) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
                    ctx.fill();
                }
            });
        };

        animRef.current = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouse);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [count]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 1 }}
            aria-hidden="true"
        />
    );
}
