'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Point {
    x: number;
    y: number;
}

interface Strike {
    id: string;
    targetX: number;
    targetY: number;
    paths: string[];
}

export default function ThunderEffect() {
    const [strikes, setStrikes] = useState<Strike[]>([]);
    const [flashActive, setFlashActive] = useState(false);
    const [currentScroll, setCurrentScroll] = useState(0);

    useEffect(() => {
        // Add shake animation style to document
        const styleId = 'thunder-shake-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes thunder-shake {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    5% { transform: translate(-4px, -5px) rotate(-0.2deg); filter: brightness(1.2) contrast(1.1); }
                    10% { transform: translate(5px, 4px) rotate(0.2deg); filter: brightness(1.1); }
                    15% { transform: translate(-3px, 6px) rotate(0deg); }
                    25% { transform: translate(4px, -3px) rotate(0.1deg); }
                    35% { transform: translate(-2px, -2px) rotate(-0.1deg); }
                    50% { transform: translate(1px, 1px) rotate(0.05deg); }
                    100% { transform: translate(0, 0) rotate(0deg); filter: brightness(1) contrast(1); }
                }
                .thunder-shake-active {
                    animation: thunder-shake 0.5s cubic-bezier(.17,.84,.44,1);
                }
            `;
            document.head.appendChild(style);
        }

        let lastTap = 0;
        const handleDoubleTouch = (e: TouchEvent) => {
            const now = Date.now();
            if (now - lastTap < 300) {
                const touch = e.touches[0];
                triggerThunder(touch.clientX, touch.clientY);
            }
            lastTap = now;
        };

        const handleDoubleClick = (e: MouseEvent) => {
            triggerThunder(e.clientX, e.clientY);
        };

        window.addEventListener('dblclick', handleDoubleClick);
        window.addEventListener('touchstart', handleDoubleTouch, { passive: true });

        return () => {
            window.removeEventListener('dblclick', handleDoubleClick);
            window.removeEventListener('touchstart', handleDoubleTouch);
        };
    }, []);

    const playThunderSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            const bufferSize = ctx.sampleRate * 4; // 4 seconds duration
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generate white noise
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            // Lowpass filter for the rumble
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            // Start bright (crack) then muffle (rumble)
            filter.frequency.setValueAtTime(2000, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
            filter.frequency.linearRampToValueAtTime(50, ctx.currentTime + 3.5);

            const gainObj = ctx.createGain();
            gainObj.gain.setValueAtTime(0, ctx.currentTime);
            gainObj.gain.linearRampToValueAtTime(2, ctx.currentTime + 0.05); // Initial loud crack
            gainObj.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.3); // Drop to rumble level
            gainObj.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 3.5); // Fade out completely

            noise.connect(filter);
            filter.connect(gainObj);
            gainObj.connect(ctx.destination);

            noise.start();
            noise.stop(ctx.currentTime + 4);
        } catch (e) {
            console.warn("Audio generation not supported or blocked");
        }
    };

    const triggerThunder = (clientX: number, clientY: number) => {
        // Essential for working while scrolling: Get document-relative Y
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const docY = clientY + scrollY;
        const docX = clientX; // X remains same as viewport-relative for body-relative container

        // Generate SVG paths relative to document
        const paths = generateLightningPaths(docX, docY, scrollY);
        
        const newStrike: Strike = {
            id: Date.now().toString() + Math.random().toString(),
            targetX: docX,
            targetY: docY,
            paths
        };

        setStrikes(prev => [...prev, newStrike]);
        setCurrentScroll(scrollY);
        setFlashActive(true);
        playThunderSound();

        // Screen shake - apply to body for global effect
        // Note: transforming body makes fixed children absolute, 
        // which is why we now use absolute positioning for the lightning container.
        document.body.classList.remove('thunder-shake-active');
        void document.body.offsetWidth; // trigger reflow
        document.body.classList.add('thunder-shake-active');

        // Remove flash quickly
        setTimeout(() => {
            setFlashActive(false);
        }, 150);

        // Remove strike and shake after animation
        setTimeout(() => {
            setStrikes(prev => prev.filter(s => s.id !== newStrike.id));
        }, 800);
    };

    const generateLightningPaths = (targetX: number, targetY: number, currentScrollY: number): string[] => {
        const paths: string[] = [];
        
        const createBolt = (x1: number, y1: number, x2: number, y2: number, offsetStart: number, maxIterations: number, isMain: boolean) => {
            let points: Point[] = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
            let offset = offsetStart;
            
            for (let i = 0; i < maxIterations; i++) {
                const newPoints: Point[] = [];
                for (let j = 0; j < points.length - 1; j++) {
                    const p1 = points[j];
                    const p2 = points[j + 1];
                    newPoints.push(p1);
                    
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    
                    const dirX = p2.x - p1.x;
                    const dirY = p2.y - p1.y;
                    const len = Math.sqrt(dirX * dirX + dirY * dirY);
                    
                    // Normal vector to the line
                    const nxNorm = -dirY / len;
                    const nyNorm = dirX / len;
                    
                    const dispX = nxNorm * (Math.random() - 0.5) * offset;
                    const dispY = nyNorm * (Math.random() - 0.5) * offset;
                    
                    const splitPoint = { x: midX + dispX, y: midY + dispY };
                    newPoints.push(splitPoint);
                    
                    // Add branches
                    if (isMain && Math.random() < 0.35 && maxIterations > 2) {
                        const branchAngle = (Math.random() - 0.5) * Math.PI / 1.5; // Spread angle
                        const branchLen = len * (0.4 + Math.random() * 0.5);
                        
                        const cosA = Math.cos(branchAngle);
                        const sinA = Math.sin(branchAngle);
                        const bDirX = (dirX * cosA - dirY * sinA) / len;
                        const bDirY = (dirX * sinA + dirY * cosA) / len;
                        
                        const bx = splitPoint.x + bDirX * branchLen;
                        const by = splitPoint.y + bDirY * branchLen;
                        
                        createBolt(splitPoint.x, splitPoint.y, bx, by, offset * 0.7, maxIterations - 1, false);
                    }
                }
                newPoints.push(points[points.length - 1]);
                points = newPoints;
                offset *= 0.55; // Roughness
            }
            
            const pathData = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
            paths.push(pathData);
        };
        
        // Start from just above the current viewport
        const startX = targetX + (Math.random() - 0.5) * window.innerWidth * 1.5;
        const startY = currentScrollY - 200; // Above screen
        
        createBolt(startX, startY, targetX, targetY, 400, 8, true);
        
        return paths;
    };

    if (strikes.length === 0 && !flashActive) return <></>;

    return (
        <div className="absolute inset-x-0 top-0 pointer-events-none z-[9999] overflow-visible" style={{ height: '100%' }}>
            {/* Screen Flash - Needs to be fixed to viewport */}
            <AnimatePresence>
                {flashActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="absolute inset-x-0 bg-white mix-blend-screen pointer-events-none"
                        style={{ top: currentScroll, height: '100vh' }}
                    />
                )}
            </AnimatePresence>

            {/* Lightning SVG */}
            <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
                style={{ filter: 'drop-shadow(0 0 20px rgba(0, 240, 255, 0.8)) drop-shadow(0 0 40px rgba(122, 92, 255, 0.6))' }}
            >
                <AnimatePresence>
                    {strikes.map((strike) => (
                        <motion.g
                            key={strike.id}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: [1, 0.2, 1, 0] }}
                            transition={{ duration: 0.6, times: [0, 0.1, 0.2, 1], ease: "easeOut" }}
                        >
                            {strike.paths.map((path, index) => (
                                <g key={index}>
                                    {/* Outer blue glow */}
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth={index === 0 ? 12 : 6}
                                        strokeLinecap="round"
                                        strokeLinejoin="miter"
                                        opacity={0.4}
                                        style={{ filter: 'blur(8px)' }}
                                    />
                                    {/* Inner white glow */}
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke="#2dd4bf"
                                        strokeWidth={index === 0 ? 6 : 3}
                                        strokeLinecap="round"
                                        strokeLinejoin="miter"
                                        opacity={0.8}
                                        style={{ filter: 'blur(2px)' }}
                                    />
                                    {/* Core white bolt */}
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth={index === 0 ? 3 : 1.5}
                                        strokeLinecap="round"
                                        strokeLinejoin="miter"
                                    />
                                </g>
                            ))}
                            
                            {/* Impact explosion ellipse at target */}
                            <ellipse
                                cx={strike.targetX}
                                cy={strike.targetY}
                                rx={40}
                                ry={15}
                                fill="#ffffff"
                                style={{ filter: 'blur(10px)' }}
                                opacity={0.8}
                            />
                            <ellipse
                                cx={strike.targetX}
                                cy={strike.targetY}
                                rx={80}
                                ry={30}
                                fill="#2dd4bf"
                                style={{ filter: 'blur(20px)' }}
                                opacity={0.6}
                            />
                        </motion.g>
                    ))}
                </AnimatePresence>
            </svg>
        </div>
    );
}
