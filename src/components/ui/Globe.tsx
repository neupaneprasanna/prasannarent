'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture, Html, Float } from '@react-three/drei';
import * as THREE from 'three';

interface HotspotProps {
    city: string;
    lat: number;
    lng: number;
    count: string;
}

function Hotspot({ city, lat, lng, count }: HotspotProps) {
    // Convert lat/lng to 3D coordinates on a sphere of radius 2.5
    const position = useMemo(() => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        const radius = 2.5;

        return new THREE.Vector3(
            -radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }, [lat, lng]);

    return (
        <group position={position}>
            {/* Glowing point */}
            <mesh>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshBasicMaterial color="#6c5ce7" />
            </mesh>
            <mesh scale={[2, 2, 2]}>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshBasicMaterial color="#6c5ce7" transparent opacity={0.3} />
            </mesh>

            {/* Label */}
            <Html distanceFactor={8} position={[0, 0.1, 0]}>
                <div className="pointer-events-none group relative">
                    <div className="flex flex-col items-center">
                        <div className="glass-strong rounded-lg px-2 py-1 text-center whitespace-nowrap border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="text-[10px] font-bold text-white">{city}</div>
                            <div className="text-[8px] text-[#a29bfe] font-medium">{count} rentals</div>
                        </div>
                        {/* Always visible small dot or hint */}
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] shadow-[0_0_8px_#6c5ce7]" />
                    </div>
                </div>
            </Html>
        </group>
    );
}

export default function Globe() {
    const globeRef = useRef<THREE.Group>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);

    // Using high quality textures from standard map sources
    const [dayMap, nightMap, normalMap, specularMap, cloudsMap] = useTexture([
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
    ]);

    const hotspots = [
        { city: 'New York', lat: 40.7128, lng: -74.006, count: '5.2k' },
        { city: 'London', lat: 51.5074, lng: -0.1278, count: '4.1k' },
        { city: 'Tokyo', lat: 35.6762, lng: 139.6503, count: '3.8k' },
        { city: 'San Francisco', lat: 37.7749, lng: -122.4194, count: '2.9k' },
        { city: 'Dubai', lat: 25.2048, lng: 55.2708, count: '2.1k' },
        { city: 'Sydney', lat: -33.8688, lng: 151.2093, count: '1.8k' },
        { city: 'Stockholm', lat: 59.3293, lng: 18.0686, count: '1.5k' },
        { city: 'Singapore', lat: 1.3521, lng: 103.8198, count: '1.3k' },
        { city: 'São Paulo', lat: -23.5505, lng: -46.6333, count: '1.1k' },
        { city: 'Mumbai', lat: 19.076, lng: 72.8777, count: '900' },
    ];

    useFrame((state, delta) => {
        if (globeRef.current) {
            globeRef.current.rotation.y += delta * 0.05;
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += delta * 0.07;
            cloudsRef.current.rotation.x += delta * 0.01;
        }
    });

    return (
        <group ref={globeRef}>
            {/* The Earth */}
            <Sphere args={[2.5, 64, 64]}>
                <meshPhongMaterial
                    map={dayMap}
                    normalMap={normalMap}
                    specularMap={specularMap}
                    shininess={5}
                />
            </Sphere>

            {/* Clouds Layer */}
            <Sphere ref={cloudsRef} args={[2.52, 64, 64]}>
                <meshPhongMaterial
                    map={cloudsMap}
                    transparent
                    opacity={0.4}
                    depthWrite={false}
                />
            </Sphere>

            {/* Atmosphere Glow (Fake) */}
            <Sphere args={[2.7, 64, 64]}>
                <meshBasicMaterial
                    color="#4834d4"
                    transparent
                    opacity={0.05}
                    side={THREE.BackSide}
                />
            </Sphere>

            {/* Hotspots */}
            <group>
                {hotspots.map((spot) => (
                    <Hotspot key={spot.city} {...spot} />
                ))}
            </group>

            {/* Ambient light for general visibility */}
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4834d4" />
        </group>
    );
}
