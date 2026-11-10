"use client";

import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";

function SculpturalObject() {
  return (
    <group>
      <Float speed={1.1} rotationIntensity={0.28} floatIntensity={0.7}>
        <mesh scale={1.1}>
          <icosahedronGeometry args={[1.28, 5]} />
          <MeshDistortMaterial
            color="#315BFF"
            roughness={0.18}
            metalness={0.16}
            distort={0.28}
            speed={1.65}
          />
        </mesh>
        <mesh rotation={[0.48, 0.2, 0.24]} scale={1.62}>
          <torusGeometry args={[1.22, 0.018, 10, 120]} />
          <meshStandardMaterial color="#D8FF52" metalness={0.55} roughness={0.24} />
        </mesh>
        <mesh rotation={[1.02, -0.35, -0.2]} scale={1.85}>
          <torusGeometry args={[1.12, 0.012, 8, 120]} />
          <meshStandardMaterial color="#FF806B" metalness={0.35} roughness={0.32} />
        </mesh>
      </Float>
      <Sparkles count={52} scale={4.8} size={2.2} speed={0.28} color="#315BFF" />
    </group>
  );
}

export default function HeroOrbitScene() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const update = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (reducedMotion) {
    return <div className="neo-orbit-static" role="img" aria-label="Abstract cobalt and lime sculptural shape" />;
  }

  return (
    <div className="neo-three-scene" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5.4], fov: 43 }}
        dpr={[1, 1.35]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={1.25} />
        <directionalLight position={[4, 5, 5]} intensity={2.1} color="#FFFFFF" />
        <pointLight position={[-4, -2, 2]} intensity={1.4} color="#FF806B" />
        <SculpturalObject />
      </Canvas>
    </div>
  );
}
