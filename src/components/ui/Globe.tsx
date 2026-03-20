'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture, Html, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// ─── Global State ───────────────────────────────────────────────────────────
const GLOBAL_STATE = { hoveredPins: 0, openPins: 0 };




// ─── helpers ────────────────────────────────────────────────────────────────

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
    );
}

// ─── types ───────────────────────────────────────────────────────────────────

export interface CityData {
    city: string;
    lat: number;
    lng: number;
    count: string;
    region: string;
}

export const CITIES: CityData[] = [
    { city: 'New York',      lat:  40.71, lng:  -74.01, count: '5.2k', region: 'Americas' },
    { city: 'London',        lat:  51.51, lng:   -0.13, count: '4.1k', region: 'Europe' },
    { city: 'Tokyo',         lat:  35.68, lng:  139.65, count: '3.8k', region: 'Asia-Pacific' },
    { city: 'San Francisco', lat:  37.77, lng: -122.42, count: '2.9k', region: 'Americas' },
    { city: 'Dubai',         lat:  25.20, lng:   55.27, count: '2.6k', region: 'Middle East' },
    { city: 'Sydney',        lat: -33.87, lng:  151.21, count: '2.1k', region: 'Asia-Pacific' },
    { city: 'Stockholm',     lat:  59.33, lng:   18.07, count: '1.9k', region: 'Europe' },
    { city: 'Singapore',     lat:   1.35, lng:  103.82, count: '1.7k', region: 'Asia-Pacific' },
    { city: 'São Paulo',     lat: -23.55, lng:  -46.63, count: '1.4k', region: 'Americas' },
    { city: 'Mumbai',        lat:  19.08, lng:   72.88, count: '1.2k', region: 'Asia-Pacific' },
    { city: 'Berlin',        lat:  52.52, lng:   13.41, count: '1.1k', region: 'Europe' },
    { city: 'Lagos',         lat:   6.52, lng:    3.38, count: '0.8k', region: 'Africa' },
];

const ARC_ROUTES: Array<[number, number]> = [
    [0, 1],   // New York ↔ London
    [1, 4],   // London ↔ Dubai
    [4, 9],   // Dubai ↔ Mumbai
    [9, 7],   // Mumbai ↔ Singapore
    [7, 2],   // Singapore ↔ Tokyo
    [2, 5],   // Tokyo ↔ Sydney
    [5, 8],   // Sydney ↔ São Paulo
    [8, 0],   // São Paulo ↔ New York
    [3, 2],   // San Francisco ↔ Tokyo
    [1, 6],   // London ↔ Stockholm
    [4, 11],  // Dubai ↔ Lagos
    [0, 10],  // New York ↔ Berlin
];

const ARC_COLORS = ['#00FFB3', '#7A5CFF', '#00F0FF', '#00FFB3', '#7A5CFF', '#00F0FF', '#00FFB3', '#7A5CFF', '#00F0FF', '#00FFB3', '#7A5CFF', '#00F0FF'];

// ─── ConnectionArc ───────────────────────────────────────────────────────────

function ConnectionArc({ fromIdx, toIdx, color, speed }: { fromIdx: number; toIdx: number; color: string; speed: number }) {
    const particleRef = useRef<THREE.Mesh>(null);
    const progress = useRef(Math.random());

    const { arcPoints, curve } = useMemo(() => {
        const c1 = CITIES[fromIdx];
        const c2 = CITIES[toIdx];
        const p1 = latLngToVec3(c1.lat, c1.lng, 2.52);
        const p2 = latLngToVec3(c2.lat, c2.lng, 2.52);
        const mid = new THREE.Vector3().addVectors(p1, p2).normalize().multiplyScalar(4.0);
        const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
        return { arcPoints: curve.getPoints(64), curve };
    }, [fromIdx, toIdx]);

    useFrame((_, delta) => {
        progress.current = (progress.current + delta * speed) % 1;
        if (particleRef.current) {
            const pos = curve.getPoint(progress.current);
            particleRef.current.position.copy(pos);
        }
    });

    return (
        <group>
            <Line points={arcPoints} color={color} lineWidth={0.8} transparent opacity={0.22} />
            <mesh ref={particleRef}>
                <sphereGeometry args={[0.022, 8, 8]} />
                <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(4)} toneMapped={false} />
            </mesh>
            {/* Glow orb */}
            <mesh ref={particleRef} scale={3}>
                <sphereGeometry args={[0.022, 8, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} toneMapped={false} />
            </mesh>

        </group>
    );
}

// ─── Hotspot ────────────────────────────────────────────────────────────────

function HotspotPin({ city }: { city: CityData }) {
    const ringRef = useRef<THREE.Mesh>(null);
    const pos = useMemo(() => latLngToVec3(city.lat, city.lng, 2.54), [city.lat, city.lng]);

    const [hovered, setHovered] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        GLOBAL_STATE.hoveredPins += hovered ? 1 : -1;
        return () => { if (hovered) GLOBAL_STATE.hoveredPins--; };
    }, [hovered]);

    useEffect(() => {
        GLOBAL_STATE.openPins += open ? 1 : -1;
        return () => { if (open) GLOBAL_STATE.openPins--; };
    }, [open]);

    useFrame((state) => {
        if (ringRef.current) {
            const pulse = Math.sin(state.clock.elapsedTime * 2.5) * 0.5 + 0.5;
            const targetScale = (hovered || open) ? 2.5 : 1 + pulse * 1.8;
            ringRef.current.scale.x += (targetScale - ringRef.current.scale.x) * 0.1;
            ringRef.current.scale.y += (targetScale - ringRef.current.scale.y) * 0.1;
            ringRef.current.scale.z += (targetScale - ringRef.current.scale.z) * 0.1;
            (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (hovered || open) ? 0.8 : 0.25 - pulse * 0.22;
        }
    });

    return (
        <group position={pos}>
            {/* Massive Invisible 3D Hitbox for effortless clicking */}
            <mesh visible={false} 
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
            >
                <sphereGeometry args={[0.09, 16, 16]} />
            </mesh>

            {/* Core dot */}
            <mesh scale={(hovered || open) ? 1.5 : 1}>
                <sphereGeometry args={[0.028, 12, 12]} />
                <meshBasicMaterial color={[0, 4, 2]} toneMapped={false} />
            </mesh>

            {/* Pulse ring */}
            <mesh ref={ringRef}>
                <ringGeometry args={[0.03, 0.055, 24]} />
                <meshBasicMaterial color={[0, 4, 2]} transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>

            {/* HTML label and popups */}
            <Html distanceFactor={9} position={[0, 0.12, 0]} zIndexRange={[100, 0]}>
                {/* Clickable City Name DOM Label */}
                <div 
                    className="select-none transition-transform cursor-pointer" 
                    style={{ transform: `translateX(-50%) ${(hovered || open) ? 'scale(1.2)' : 'scale(1)'}`, pointerEvents: 'auto' }}
                    onPointerEnter={() => setHovered(true)}
                    onPointerLeave={() => setHovered(false)}
                    onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                >
                    <div className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest transition-colors hover:bg-black/90 hover:border-[#00FFB3]/80"
                         style={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,255,179,0.3)', color: '#00FFB3', backdropFilter: 'blur(4px)' }}>
                        {city.city}
                        <span className="ml-1 opacity-50">{city.count}</span>
                    </div>
                </div>

                {/* Expanded Detailed Hologram Card */}
                {open && (
                    <div 
                        className="absolute top-8 left-1/2 -translate-x-1/2 w-[240px] p-4 rounded-xl border border-[#00FFB3]/40 text-white select-none transition-all shadow-[0_0_50px_rgba(0,255,179,0.2)] overflow-hidden"
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{ pointerEvents: 'auto', background: 'linear-gradient(135deg, rgba(2,3,5,0.95), rgba(15,17,26,0.98))', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#00FFB3]">{city.city}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase text-white/50 bg-white/10 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(255,255,255,0.1)]">{city.region}</span>
                                <button className="w-5 h-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-400 transition-colors" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>✕</button>
                            </div>
                        </div>
                        <div className="text-[11.5px] text-white/70 mb-4 border-b border-white/10 pb-4 leading-relaxed">
                            A highly active metropolitan hub for <strong className="text-white">Camera Gear & VR Tech</strong> rentals. 
                        </div>
                        <div className="flex justify-between items-end mb-5">
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-widest text-[#00FFB3]/60 mb-1">Active Listings</span>
                                <span className="text-2xl font-black text-[#00FFB3]">{city.count}</span>
                            </div>
                            <div className="flex gap-1.5 mb-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#00FFB3] animate-pulse shadow-[0_0_8px_#00FFB3]" />
                                <div className="w-2 h-2 rounded-full bg-[#00FFB3] shadow-[0_0_8px_#00FFB3]" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 rounded-full bg-[#00F0FF]/30" />
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); alert(`Navigating to ${city.city} Vault...`); }}
                            className="w-full py-2.5 rounded bg-gradient-to-r from-[#00F0FF]/15 to-[#00FFB3]/15 hover:from-[#00F0FF]/30 hover:to-[#00FFB3]/30 text-[#00FFB3] text-[11px] uppercase font-black tracking-widest transition-all cursor-pointer border border-[#00FFB3]/30 hover:border-[#00FFB3]"
                        >
                            Access Vault ↗
                        </button>
                    </div>
                )}
            </Html>
        </group>
    );
}




// ─── Globe mesh ──────────────────────────────────────────────────────────────

interface GlobeProps {
    focusLng?: number | null;
}

export default function Globe({ focusLng }: GlobeProps) {
    const globeRef = useRef<THREE.Group>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);
    const targetY = useRef(0);
    const isAutoRotating = useRef(true);
    const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [dayMap, normalMap, specularMap, cloudsMap] = useTexture([
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
    ]);

    // Enhance normal map depth for realistic mountains
    useEffect(() => {
        if (normalMap) {
            normalMap.colorSpace = THREE.LinearSRGBColorSpace;
        }
    }, [normalMap]);


    useEffect(() => {
        if (focusLng == null) return;
        // Compute the Y rotation needed to center the city
        const desired = -(focusLng + 180) * (Math.PI / 180);
        targetY.current = desired;
        isAutoRotating.current = false;
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        resumeTimer.current = setTimeout(() => { isAutoRotating.current = true; }, 4000);
    }, [focusLng]);

    useFrame((_, delta) => {
        if (!globeRef.current) return;

        const isUserInteracting = GLOBAL_STATE.hoveredPins > 0 || GLOBAL_STATE.openPins > 0;

        if (isAutoRotating.current && !isUserInteracting) {
            globeRef.current.rotation.y += delta * 0.055;
            targetY.current = globeRef.current.rotation.y;
        } else if (!isUserInteracting) {
            globeRef.current.rotation.y += (targetY.current - globeRef.current.rotation.y) * 0.04;
        }

        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += delta * 0.075;
            cloudsRef.current.rotation.x += delta * 0.012;
        }
    });


    return (
        <group ref={globeRef}>
            {/* Lights — Cinematic real-space lighting setup */}
            <ambientLight intensity={0.05} color="#ffffff" />
            <directionalLight 
                position={[12, 5, 5]} 
                intensity={4.0} 
                color="#fff5e6" 
                castShadow 
                shadow-bias={-0.0001} 
                shadow-mapSize-width={2048} 
                shadow-mapSize-height={2048} 
            />
            {/* Physical glowing Sun mesh matching the directional light */}
            <mesh position={[60, 25, 25]}>
                <sphereGeometry args={[3, 32, 32]} />
                <meshBasicMaterial color={[15, 12, 8]} toneMapped={false} />
            </mesh>

            {/* Subtle blue fill light for the dark side of the earth */}
            <pointLight position={[-15, -5, -15]} intensity={0.6} color="#1e3a8a" />

            {/* Hyper-realistic Starfield */}
            <Stars radius={80} depth={50} count={4000} factor={6} saturation={0.8} fade speed={1.5} />

            {/* Post-Processing Effects Engine */}
            <EffectComposer>
                <Bloom mipmapBlur luminanceThreshold={0.7} luminanceSmoothing={0.5} intensity={1.5} />
            </EffectComposer>

            {/* Earth - using Standard Material for stable PBR */}
            <Sphere args={[2.5, 64, 64]} receiveShadow castShadow>

                <meshStandardMaterial 
                    map={dayMap} 
                    normalMap={normalMap} 
                    normalScale={new THREE.Vector2(2.5, 2.5)}
                    metalnessMap={specularMap}
                    roughness={0.6}
                    metalness={0.8}
                />
            </Sphere>

            {/* Clouds - casting drop shadows onto the Earth */}
            <Sphere ref={cloudsRef} args={[2.525, 64, 64]} receiveShadow castShadow>
                <meshStandardMaterial 
                    map={cloudsMap} 
                    transparent 
                    opacity={0.6} 
                    depthWrite={false} 
                    color="#ffffff" 
                    roughness={1}
                />
            </Sphere>

            {/* Atmosphere inner glow (Additive) */}
            <Sphere args={[2.6, 64, 64]}>
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
            </Sphere>

            {/* Atmosphere outer glow (Additive) */}
            <Sphere args={[2.8, 64, 64]}>
                <meshBasicMaterial color="#1e40af" transparent opacity={0.1} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
            </Sphere>

            {/* Connection arcs */}
            {ARC_ROUTES.map(([from, to], i) => (
                <ConnectionArc
                    key={i}
                    fromIdx={from}
                    toIdx={to}
                    color={ARC_COLORS[i % ARC_COLORS.length]}
                    speed={0.12 + (i % 5) * 0.03}
                />
            ))}

            {/* Hotspot pins */}
            {CITIES.map((c) => (
                <HotspotPin key={c.city} city={c} />
            ))}
        </group>
    );
}
