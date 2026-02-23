'use client';

import { useEffect, useRef, useCallback } from 'react';

// Time-of-day color palettes
function getTimeColors(hour: number): { r: number; g: number; b: number }[] {
    if (hour >= 5 && hour < 11) {
        // Morning → Soft Aurora Cyan
        return [
            { r: 0, g: 0.55, b: 0.65 },  // cyan teal
            { r: 0.02, b: 0.08, g: 0.04 }, // deep base
            { r: 0.0, g: 0.35, b: 0.45 },  // aurora
        ];
    } else if (hour >= 11 && hour < 17) {
        // Afternoon → Balanced neutral graphite
        return [
            { r: 0.12, g: 0.10, b: 0.18 },
            { r: 0.03, g: 0.03, b: 0.05 },
            { r: 0.08, g: 0.06, b: 0.14 },
        ];
    } else if (hour >= 17 && hour < 21) {
        // Evening → Quantum Violet undertone
        return [
            { r: 0.28, g: 0.18, b: 0.55 },
            { r: 0.04, g: 0.03, b: 0.07 },
            { r: 0.15, g: 0.08, b: 0.35 },
        ];
    } else {
        // Midnight → Deep void black with silver shimmer
        return [
            { r: 0.06, g: 0.06, b: 0.10 },
            { r: 0.02, g: 0.02, b: 0.035 },
            { r: 0.08, g: 0.08, b: 0.12 },
        ];
    }
}

// Simple noise function for nebula
function hash(x: number, y: number): number {
    const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return h - Math.floor(h);
}

function smoothNoise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);

    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);

    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, octaves: number): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < octaves; i++) {
        value += amplitude * smoothNoise(x * frequency, y * frequency);
        amplitude *= 0.5;
        frequency *= 2;
    }
    return value;
}

export default function NebulaShader() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const mouseRef = useRef({ x: 0.5, y: 0.5 });
    const timeRef = useRef(0);
    const reducedMotion = useRef(false);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // Low resolution for performance — we render at 1/6th then CSS scales up
        const w = canvas.width;
        const h = canvas.height;
        const hour = new Date().getHours();
        const colors = getTimeColors(hour);
        const t = timeRef.current;

        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;

        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const u = x / w;
                const v = y / h;

                // Nebula noise layers
                const n1 = fbm(u * 3 + t * 0.02, v * 3 + t * 0.015, 4);
                const n2 = fbm(u * 5 - t * 0.01 + 10, v * 5 + t * 0.008 + 10, 3);
                const n3 = fbm(u * 2 + t * 0.005 + n1 * 0.5, v * 2 - t * 0.01 + n2 * 0.5, 3);

                // Light bloom near mouse
                const dx = u - mx;
                const dy = v - my;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const bloom = Math.max(0, 1 - dist * 3) * 0.15;

                // Volumetric light ray (diagonal)
                const ray = Math.max(0, 1 - Math.abs(u - v - t * 0.01) * 4) * 0.06;

                // Color mixing
                const c0 = colors[0];
                const c1 = colors[1];
                const c2 = colors[2];

                let r = c1.r + (c0.r - c1.r) * n1 * 0.8 + (c2.r) * n3 * 0.4 + bloom * 0.3 + ray * 0.2;
                let g = c1.g + (c0.g - c1.g) * n1 * 0.8 + (c2.g) * n3 * 0.4 + bloom * 0.5 + ray * 0.15;
                let b = c1.b + (c0.b - c1.b) * n1 * 0.8 + (c2.b) * n3 * 0.4 + bloom * 0.7 + ray * 0.3;

                // Depth fog — darker at center-bottom
                const fogAmount = (1 - v) * 0.3 * (1 - Math.abs(u - 0.5) * 0.5);
                r = r * (1 - fogAmount * 0.5);
                g = g * (1 - fogAmount * 0.5);
                b = b * (1 - fogAmount * 0.5);

                const idx = (y * w + x) * 4;
                data[idx] = Math.min(255, Math.max(0, r * 255));
                data[idx + 1] = Math.min(255, Math.max(0, g * 255));
                data[idx + 2] = Math.min(255, Math.max(0, b * 255));
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }, []);

    useEffect(() => {
        reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Very low res for performance — upscaled by CSS
        const scale = reducedMotion.current ? 12 : 6;
        const resize = () => {
            canvas.width = Math.ceil(window.innerWidth / scale);
            canvas.height = Math.ceil(window.innerHeight / scale);
        };
        resize();
        window.addEventListener('resize', resize);

        const handleMouse = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX / window.innerWidth;
            mouseRef.current.y = e.clientY / window.innerHeight;
        };
        window.addEventListener('mousemove', handleMouse);

        // Animation loop — throttled for performance
        let lastFrame = 0;
        const fps = reducedMotion.current ? 5 : 15; // Low FPS is fine for nebula — it's slow-moving
        const interval = 1000 / fps;

        const loop = (timestamp: number) => {
            animRef.current = requestAnimationFrame(loop);
            if (timestamp - lastFrame < interval) return;
            lastFrame = timestamp;
            timeRef.current += 0.016;
            render();
        };

        animRef.current = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouse);
        };
    }, [render]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none"
            style={{
                zIndex: 0,
                imageRendering: 'auto',
                filter: 'blur(4px)',
            }}
            aria-hidden="true"
        />
    );
}
