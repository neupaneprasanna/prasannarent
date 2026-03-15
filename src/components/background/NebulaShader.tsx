'use client';

import { useEffect, useRef, useCallback } from 'react';

// Section-based color palettes across the page scroll
const SCROLL_PALETTES = [
    // 0% - Top Hero (Aurora Teal/Violet)
    [
        { r: 0, g: 0.55, b: 0.65 },  // cyan teal
        { r: 0.02, b: 0.08, g: 0.04 }, // deep base
        { r: 0.28, g: 0.18, b: 0.55 }, // Violet aura
    ],
    // 25% - Quarter down (Mint Matrix)
    [
        { r: 0.0, g: 0.85, b: 0.55 },  // Bright emerald
        { r: 0.01, g: 0.05, b: 0.03 }, // Dark forest void
        { r: 0.0, g: 0.45, b: 0.65 },  // Deep teal
    ],
    // 50% - Half down (Quantum Pink/Magenta/Cyan)
    [
        { r: 0.9, g: 0.2, b: 0.6 },    // Bright Pink
        { r: 0.05, g: 0.01, b: 0.1 },  // Deep Space
        { r: 0.1, g: 0.8, b: 0.9 },    // Electric Cyan
    ],
    // 75% - 3/4 down (Deep Ocean Blue/Emerald)
    [
        { r: 0.0, g: 0.4, b: 1.0 },    // Power Blue
        { r: 0.01, g: 0.08, b: 0.05 }, // Dark Emerald Void
        { r: 0.0, g: 0.9, b: 0.45 },   // Neon Green
    ],
    // 100% - Bottom Footer (Rich Violet Gold)
    [
        { r: 0.5, g: 0.3, b: 0.8 },     // Royal Purple
        { r: 0.03, g: 0.02, b: 0.05 },  // Void
        { r: 0.8, g: 0.4, b: 0.2 },     // Sunset Gold
    ]
];

// Helper to linearly interpolate between two colors
function lerpColor(c1: {r:number, g:number, b:number}, c2: {r:number, g:number, b:number}, t: number) {
    return {
        r: c1.r + (c2.r - c1.r) * t,
        g: c1.g + (c2.g - c1.g) * t,
        b: c1.b + (c2.b - c1.b) * t,
    };
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
        const t = timeRef.current;

        // Calculate scroll progress for color transitions
        const scrollY = window.scrollY || 0;
        const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
        const progress = Math.max(0, Math.min(1, scrollY / maxScroll));

        // Determine which palettes to interpolate between
        const segments = SCROLL_PALETTES.length - 1;
        const rawIndex = progress * segments;
        const idx1 = Math.floor(rawIndex);
        const idx2 = Math.min(segments, idx1 + 1);
        const blend = rawIndex - idx1;

        const colors = [
            lerpColor(SCROLL_PALETTES[idx1][0], SCROLL_PALETTES[idx2][0], blend),
            lerpColor(SCROLL_PALETTES[idx1][1], SCROLL_PALETTES[idx2][1], blend),
            lerpColor(SCROLL_PALETTES[idx1][2], SCROLL_PALETTES[idx2][2], blend),
        ];

        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;

        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const u = x / w;
                const v = y / h;

                // Nebula noise layers
                const n1 = fbm(u * 4 + t * 0.02, v * 4 + t * 0.015, 2);
                const n2 = fbm(u * 6 - t * 0.01 + 10, v * 6 + t * 0.008 + 10, 2);
                const n3 = fbm(u * 3 + t * 0.005 + n1 * 0.5, v * 3 - t * 0.01 + n2 * 0.5, 2);
                const n4 = fbm(u * 8 + t * 0.03, v * 2 - t * 0.02, 1);

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

                let r = c1.r + (c0.r - c1.r) * n1 * 0.95 + (c2.r) * n3 * 0.55 + (c0.r * n4 * 0.25) + bloom * 0.3 + ray * 0.2;
                let g = c1.g + (c0.g - c1.g) * n1 * 0.95 + (c2.g) * n3 * 0.55 + (c1.g * n4 * 0.25) + bloom * 0.5 + ray * 0.15;
                let b = c1.b + (c0.b - c1.b) * n1 * 0.95 + (c2.b) * n3 * 0.55 + (c2.b * n4 * 0.25) + bloom * 0.7 + ray * 0.3;

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
        const scale = reducedMotion.current ? 16 : 10;
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
        const fps = reducedMotion.current ? 3 : 8; // Low FPS is fine for nebula — it's slow-moving
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
