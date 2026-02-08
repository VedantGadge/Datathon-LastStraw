"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";

function SphereMesh({ level = 0 }) {
    const meshRef = useRef(null);

    useFrame((state, delta) => {
        const t = state.clock.getElapsedTime();

        // Idle breathing when level is ~0
        const idle = 0.03 * Math.sin(t * 2.2);
        const reactive = Math.min(1, Math.max(0, level));

        const scale = 1 + idle + reactive * 0.55;
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * (0.35 + reactive * 0.9);
            meshRef.current.rotation.x += delta * (0.15 + reactive * 0.6);
            meshRef.current.scale.setScalar(scale);
        }
    });

    // Keep these stable; only update distort/speed via props
    const materialProps = useMemo(() => {
        const clamped = Math.min(1, Math.max(0, level));
        return {
            distort: 0.25 + clamped * 0.75,
            speed: 1.1 + clamped * 2.2,
            roughness: 0.2,
            metalness: 0.1,
            color: "#f97316", // Tailwind orange-500
            emissive: "#f59e0b", // Tailwind amber-500
            emissiveIntensity: 0.35 + clamped * 1.1,
        };
    }, [level]);

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshDistortMaterial {...materialProps} />
        </mesh>
    );
}

export function VoiceSphere3D({ level = 0, className = "" }) {
    return (
        <div className={className}>
            <Canvas
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: true }}
                camera={{ position: [0, 0, 3.2], fov: 45 }}
            >
                <ambientLight intensity={0.7} />
                <directionalLight position={[3, 2, 4]} intensity={1.2} />
                <pointLight position={[-3, -2, 3]} intensity={0.8} />
                <SphereMesh level={level} />
            </Canvas>
        </div>
    );
}
