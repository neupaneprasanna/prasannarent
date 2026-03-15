'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, useMotionValue } from 'framer-motion';

export default function ScrollZigzagLine() {
    const { scrollYProgress } = useScroll();
    const pathRef = useRef<SVGPathElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const x = useMotionValue(-100);
    const y = useMotionValue(-100);

    const [pathString, setPathString] = useState('');
    const [pathReady, setPathReady] = useState(false);

    useEffect(() => {
        const calculatePath = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.offsetWidth;
            const height = containerRef.current.offsetHeight;

            if (height === 0 || width === 0) return;

            const segments = 12;
            const segmentHeight = height / segments;

            // Start at the center top
            let p = `M ${width / 2} 0 `;

            for (let i = 1; i <= segments; i++) {
                const isRight = i % 2 !== 0;
                // Alternate left and right
                const targetX = isRight ? width * 0.8 : width * 0.2;
                const targetY = i * segmentHeight;

                const prevY = (i - 1) * segmentHeight;
                const prevX = (i - 1) === 0 ? width / 2 : ((i - 1) % 2 !== 0 ? width * 0.8 : width * 0.2);

                // Use smooth cubic bezier curve
                const cp1X = prevX;
                const cp1Y = prevY + segmentHeight / 2;
                const cp2X = targetX;
                const cp2Y = targetY - segmentHeight / 2;

                p += `C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY} `;
            }

            setPathString(p);
            // reset orb position to top
            x.set(width / 2);
            y.set(0);
            
            // Allow a tiny delay for the path to render before we read length
            setTimeout(() => setPathReady(true), 50);
        };

        calculatePath();

        // Recalculate if resize
        window.addEventListener('resize', calculatePath);
        
        // Also observe height changes
        const observer = new ResizeObserver(() => calculatePath());
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', calculatePath);
            observer.disconnect();
        };
    }, [x, y]);

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (pathRef.current && pathReady) {
            const length = pathRef.current.getTotalLength();
            const point = pathRef.current.getPointAtLength(Math.max(0, Math.min(1, latest)) * length);
            x.set(point.x);
            y.set(point.y);
        }
    });

    // Morphing Styles
    const borderRadius = useTransform(scrollYProgress, 
        [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        ["50%", "20%", "50%", "0%", "50%", "20%", "50%", "0%", "50%", "20%", "50%"]
    );

    const rotate = useTransform(scrollYProgress,
        [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        [0, 45, 180, 225, 360, 405, 540, 585, 720, 765, 900]
    );

    const backgroundColor = useTransform(scrollYProgress,
        [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        [
            "#00f0ff", // cyan
            "#a18cff", // purple
            "#ff007f", // pink
            "#00ffb3", // mint
            "#ffea00", // yellow
            "#00f0ff",
            "#a18cff",
            "#ff007f",
            "#00ffb3",
            "#ffea00",
            "#00f0ff"
        ]
    );

    const boxShadow = useTransform(scrollYProgress,
        [0, 0.1, 0.2, 0.3],
        [
            "0 0 20px 5px rgba(0,240,255,0.6)",
            "0 0 30px 10px rgba(161,140,255,0.6)",
            "0 0 25px 8px rgba(255,0,127,0.6)",
            "0 0 35px 12px rgba(0,255,179,0.6)",
        ],
        { clamp: false } // We can loop or extend, simplified for brevity, let's explicitly map all 11 steps
    );
    
    const boxShadowFull = useTransform(scrollYProgress,
        [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        [
            "0 0 30px 10px rgba(0,240,255,0.6)",
            "0 0 30px 10px rgba(161,140,255,0.6)",
            "0 0 30px 10px rgba(255,0,127,0.6)",
            "0 0 30px 10px rgba(0,255,179,0.6)",
            "0 0 30px 10px rgba(255,234,0,0.6)",
            "0 0 30px 10px rgba(0,240,255,0.6)",
            "0 0 30px 10px rgba(161,140,255,0.6)",
            "0 0 30px 10px rgba(255,0,127,0.6)",
            "0 0 30px 10px rgba(0,255,179,0.6)",
            "0 0 30px 10px rgba(255,234,0,0.6)",
            "0 0 30px 10px rgba(0,240,255,0.6)",
        ]
    );

    const scale = useTransform(scrollYProgress,
        [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1],
        [1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1]
    );

    const particleScale = useTransform(scale, (s: number) => s * 1.5);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-50 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                {/* Background faint path */}
                {pathString && (
                    <path
                        d={pathString}
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="2"
                        strokeDasharray="10 10"
                    />
                )}
                {/* Active scrolling path */}
                {pathString && (
                    <motion.path
                        ref={pathRef}
                        d={pathString}
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="4"
                        style={{ pathLength: scrollYProgress as any }}
                    />
                )}
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00f0ff" />
                        <stop offset="25%" stopColor="#a18cff" />
                        <stop offset="50%" stopColor="#ff007f" />
                        <stop offset="75%" stopColor="#00ffb3" />
                        <stop offset="100%" stopColor="#ffea00" />
                    </linearGradient>
                </defs>
            </svg>

            {/* The morphing follower orb */}
            {pathReady && (
                <motion.div
                    className="absolute top-0 left-0 w-10 h-10 -ml-5 -mt-5 flex items-center justify-center mix-blend-screen"
                    style={{
                        x,
                        y,
                        borderRadius,
                        rotate,
                        backgroundColor,
                        boxShadow: boxShadowFull,
                        scale
                    }}
                >
                    {/* Inner core */}
                    <motion.div 
                        className="w-full h-full bg-white opacity-80"
                        style={{ borderRadius }}
                    />
                    
                    {/* Particle ejector (visual flavor) */}
                    <motion.div 
                        className="absolute inset-0 border-2 border-white opacity-50"
                        style={{ borderRadius, scale: particleScale }}
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                </motion.div>
            )}
        </div>
    );
}
