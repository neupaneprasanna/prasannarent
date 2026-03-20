'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, useMotionValue } from 'framer-motion';

export default function ScrollZigzagLine() {
    const { scrollYProgress } = useScroll();
    const pathRef = useRef<SVGPathElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [pathString, setPathString] = useState('');
    const [pathReady, setPathReady] = useState(false);


    const pathLengthRef = useRef<number>(0);

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

                const cp1X = prevX;
                const cp1Y = prevY + segmentHeight / 2;
                const cp2X = targetX;
                const cp2Y = targetY - segmentHeight / 2;

                p += `C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY} `;
            }

            setPathString(p);
            
            setPathString(p);
            setTimeout(() => {
                setPathReady(true);
            }, 50);
        };



        calculatePath();

        window.addEventListener('resize', calculatePath);
        
        const observer = new ResizeObserver(() => calculatePath());
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', calculatePath);
            observer.disconnect();
        };
    }, []);

    // Utilizing hardware-accelerated offset-distance instead of CPU DOM calculations!
    const offsetDistance = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

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
            "#00f0ff", "#a18cff", "#ff007f", "#00ffb3", "#ffea00",
            "#00f0ff", "#a18cff", "#ff007f", "#00ffb3", "#ffea00", "#00f0ff"
        ]
    );

    const scale = useTransform(scrollYProgress,
        [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1],
        [1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1, 1.5, 1]
    );

    const particleScale = useTransform(scale, (s: number) => s * 1.5);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-100">


            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                {pathString && (
                    <path
                        d={pathString}
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="4"
                        strokeDasharray="15 15"
                    />
                )}
                {pathString && (
                    <motion.path
                        ref={pathRef}
                        d={pathString}
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="8"
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

            {/* Render the tracking dot using pure CSS Motion Paths for buttery performance */}
            {pathReady && pathString && (
                <motion.div
                    className="absolute top-0 left-0 w-12 h-12 flex items-center justify-center mix-blend-screen will-change-transform drop-shadow-[0_0_20px_rgba(0,255,179,0.8)]"
                    style={{
                        offsetPath: `path('${pathString}')`,
                        offsetDistance,
                        offsetRotate: "0deg",
                        borderRadius,
                        rotate,
                        backgroundColor,
                        scale,
                    }}
                >
                    <div className="absolute inset-0 -m-4 bg-inherit rounded-full blur-xl opacity-80 will-change-transform" />

                    <motion.div 
                        className="w-full h-full bg-white opacity-100 z-10"
                        style={{ borderRadius }}
                    />
                    
                    <motion.div 
                        className="absolute inset-0 border-[3px] border-white opacity-80 z-20"
                        style={{ borderRadius, scale: particleScale }}
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                </motion.div>
            )}
        </div>


    );
}
