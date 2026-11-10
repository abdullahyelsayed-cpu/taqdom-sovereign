"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import Image from "next/image";
import Link from "next/link";
import { getSubdomainUrl } from "@/lib/types";

interface FloatingCreatorBadge {
  username: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  cityAr: string;
  cityEn: string;
  avatar: string;
  positionClass: string;
}

const ORBIT_CREATORS: FloatingCreatorBadge[] = [
  {
    username: "layla",
    nameAr: "ليلى منصور",
    nameEn: "Layla Mansour",
    roleAr: "مهندسة معمارية",
    roleEn: "Spatial Architect",
    cityAr: "القاهرة",
    cityEn: "Cairo",
    avatar: "/images/creators/layla.jpg",
    positionClass: "top-6 start-4 md:top-10 md:start-8",
  },
  {
    username: "youssef",
    nameAr: "يوسف الشاذلي",
    nameEn: "Youssef El-Shazly",
    roleAr: "مخرج سينمائي",
    roleEn: "Film Director",
    cityAr: "الجونة",
    cityEn: "El Gouna",
    avatar: "/images/creators/youssef.jpg",
    positionClass: "top-10 end-4 md:top-14 md:end-8",
  },
  {
    username: "farida",
    nameAr: "فريدة رفعت",
    nameEn: "Farida Refaat",
    roleAr: "مديرة فنية",
    roleEn: "Art Director",
    cityAr: "باريس",
    cityEn: "Paris",
    avatar: "/images/creators/farida.jpg",
    positionClass: "bottom-12 start-4 md:bottom-14 md:start-10",
  },
  {
    username: "karim",
    nameAr: "كريم عادل",
    nameEn: "Karim Adel",
    roleAr: "رائد أعمال",
    roleEn: "Venture Founder",
    cityAr: "دبي",
    cityEn: "Dubai",
    avatar: "/images/creators/karim.jpg",
    positionClass: "bottom-8 end-4 md:bottom-12 md:end-10",
  },
];

function HorusFalconTEmblem({
  intensity = 1.2,
  speed = 1.0,
}: {
  intensity?: number;
  speed?: number;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const ringOuterRef = useRef<THREE.Mesh>(null);
  const ringInnerRef = useRef<THREE.Mesh>(null);

  const { pillarGeo, wingPrimaryGeo, wingSecondaryGeo, crestGeo } = useMemo(() => {
    const extrudeOpts: THREE.ExtrudeGeometryOptions = {
      depth: 0.34,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    };

    // Architectural 'T' Vertical Obelisk Pillar
    const pillarShape = new THREE.Shape();
    pillarShape.moveTo(-0.34, 0.75);
    pillarShape.lineTo(0.34, 0.75);
    pillarShape.lineTo(0.22, -1.65);
    pillarShape.lineTo(0, -2.15);
    pillarShape.lineTo(-0.22, -1.65);
    pillarShape.closePath();

    // Swept Falcon Wing Primary Feather Blade (Horizontal bar of 'T')
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0.25);
    wingShape.lineTo(2.35, 0.42);
    wingShape.lineTo(2.05, -0.05);
    wingShape.lineTo(0.15, -0.22);
    wingShape.closePath();

    // Secondary Feather Tier
    const wingSecShape = new THREE.Shape();
    wingSecShape.moveTo(0.1, -0.15);
    wingSecShape.lineTo(1.85, -0.02);
    wingSecShape.lineTo(1.5, -0.42);
    wingSecShape.lineTo(0.2, -0.48);
    wingSecShape.closePath();

    // Royal Horus Falcon Head Crown
    const crestShape = new THREE.Shape();
    crestShape.moveTo(0, 1.55);
    crestShape.lineTo(0.45, 0.92);
    crestShape.lineTo(0, 0.72);
    crestShape.lineTo(-0.45, 0.92);
    crestShape.closePath();

    return {
      pillarGeo: new THREE.ExtrudeGeometry(pillarShape, extrudeOpts),
      wingPrimaryGeo: new THREE.ExtrudeGeometry(wingShape, {
        ...extrudeOpts,
        depth: 0.22,
      }),
      wingSecondaryGeo: new THREE.ExtrudeGeometry(wingSecShape, {
        ...extrudeOpts,
        depth: 0.16,
      }),
      crestGeo: new THREE.ExtrudeGeometry(crestShape, {
        ...extrudeOpts,
        depth: 0.28,
      }),
    };
  }, []);

  const goldMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#D4AF37"),
        emissive: new THREE.Color("#3A2A08"),
        emissiveIntensity: 0.25 * intensity,
        metalness: 0.92,
        roughness: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        reflectivity: 1,
      }),
    [intensity]
  );

  const glassCoreMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#00F5D4"),
        emissive: new THREE.Color("#00F5D4"),
        emissiveIntensity: 0.35,
        metalness: 0.1,
        roughness: 0.08,
        transmission: 0.82,
        transparent: true,
        opacity: 0.88,
        ior: 1.5,
        thickness: 0.8,
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    const pointerX = state.pointer.x;
    const pointerY = state.pointer.y;

    if (rootRef.current) {
      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y,
        pointerX * 0.55 + Math.sin(t * 0.5) * 0.18,
        0.06
      );
      rootRef.current.rotation.x = THREE.MathUtils.lerp(
        rootRef.current.rotation.x,
        -pointerY * 0.32 + Math.cos(t * 0.4) * 0.08,
        0.06
      );
    }

    const wingBreath = Math.sin(t * 2.2) * 0.09;
    const wingSweep = Math.cos(t * 2.2) * 0.05;

    if (leftWingRef.current) {
      leftWingRef.current.rotation.z = -wingBreath;
      leftWingRef.current.rotation.y = wingSweep;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.z = wingBreath;
      rightWingRef.current.rotation.y = -wingSweep;
    }

    if (ringOuterRef.current) {
      ringOuterRef.current.rotation.z = t * 0.25;
      ringOuterRef.current.rotation.x = Math.PI / 2.6 + Math.sin(t * 0.4) * 0.12;
    }
    if (ringInnerRef.current) {
      ringInnerRef.current.rotation.y = -t * 0.35;
      ringInnerRef.current.rotation.x = Math.PI / 3.2;
    }
  });

  return (
    <Float speed={1.6 * speed} rotationIntensity={0.2} floatIntensity={0.45}>
      <group ref={rootRef} scale={0.92} position={[0, 0.15, 0]}>
        {/* Central Architectural 'T' Pillar */}
        <mesh
          geometry={pillarGeo}
          material={goldMaterial}
          position={[0, 0, -0.17]}
          castShadow
          receiveShadow
        />

        {/* Refractive Glass Spine Core */}
        <mesh position={[0, -0.45, 0.06]} material={glassCoreMaterial}>
          <boxGeometry args={[0.16, 2.2, 0.44]} />
        </mesh>

        {/* Horus Falcon Royal Crown Crest */}
        <mesh
          geometry={crestGeo}
          material={goldMaterial}
          position={[0, 0.12, -0.14]}
          castShadow
        />

        {/* Eye of Horus Cyan-Gold Core */}
        <mesh position={[0, 1.18, 0.2]} material={glassCoreMaterial}>
          <octahedronGeometry args={[0.16, 0]} />
        </mesh>

        {/* Articulated Right Falcon Wing */}
        <group ref={rightWingRef} position={[0.26, 0.55, 0]}>
          <mesh
            geometry={wingPrimaryGeo}
            material={goldMaterial}
            position={[0, 0, -0.11]}
          />
          <mesh
            geometry={wingSecondaryGeo}
            material={goldMaterial}
            position={[0, -0.08, -0.05]}
          />
          <mesh position={[1.05, -0.36, 0.06]} material={glassCoreMaterial}>
            <boxGeometry args={[1.25, 0.09, 0.12]} />
          </mesh>
        </group>

        {/* Articulated Left Falcon Wing (Mirrored) */}
        <group ref={leftWingRef} position={[-0.26, 0.55, 0]} scale={[-1, 1, 1]}>
          <mesh
            geometry={wingPrimaryGeo}
            material={goldMaterial}
            position={[0, 0, -0.11]}
          />
          <mesh
            geometry={wingSecondaryGeo}
            material={goldMaterial}
            position={[0, -0.08, -0.05]}
          />
          <mesh position={[1.05, -0.36, 0.06]} material={glassCoreMaterial}>
            <boxGeometry args={[1.25, 0.09, 0.12]} />
          </mesh>
        </group>

        {/* Sovereign Orbital Halo Rings */}
        <mesh ref={ringOuterRef} material={goldMaterial}>
          <torusGeometry args={[2.55, 0.025, 16, 100]} />
        </mesh>
        <mesh ref={ringInnerRef} material={glassCoreMaterial}>
          <torusGeometry args={[1.95, 0.02, 16, 80]} />
        </mesh>
      </group>
    </Float>
  );
}

export function TaqdomHeroScene({
  lang = "ar",
  intensity = 1.2,
  speed = 1.0,
  lightAngle = 42,
  showCreatorCards = true,
  className = "",
}: {
  lang?: "ar" | "en";
  intensity?: number;
  speed?: number;
  lightAngle?: number;
  showCreatorCards?: boolean;
  className?: string;
}) {
  const [webglReady, setWebglReady] = useState(true);
  const [host, setHost] = useState<string>("taqdom.me");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
      try {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl2") ||
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl");
        if (!gl) setWebglReady(false);
      } catch {
        setWebglReady(false);
      }
    }
  }, []);

  const rad = (lightAngle * Math.PI) / 180;
  const lightX = Math.cos(rad) * 6;
  const lightY = Math.sin(rad) * 6 + 2;

  return (
    <div className={`relative w-full h-full min-h-[420px] select-none ${className}`}>
      {/* Ambient Sovereign Halo Behind 3D Emblem */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div
          className="w-72 h-72 md:w-[440px] md:h-[440px] rounded-full blur-3xl opacity-50 transition-all duration-700"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.42) 0%, rgba(0,245,212,0.18) 52%, transparent 75%)",
          }}
        />
      </div>

      {/* WebGL 3D Canvas or Sculptural Fallback */}
      {webglReady ? (
        <div className="relative z-10 w-full h-full min-h-[420px]">
          <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [0, 0.2, 6.2], fov: 42 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.25;
            }}
          >
            <ambientLight intensity={0.9 * intensity} color="#F6F4EE" />
            <directionalLight
              position={[lightX, lightY, 5]}
              intensity={2.8 * intensity}
              color="#F5E6B3"
            />
            <directionalLight
              position={[-5, -2, 3]}
              intensity={1.4 * intensity}
              color="#00F5D4"
            />
            <pointLight position={[0, 3, 2]} intensity={2.0 * intensity} color="#D4AF37" />
            <Sparkles
              count={42}
              scale={6}
              size={2.2}
              speed={0.4 * speed}
              color="#D4AF37"
            />
            <HorusFalconTEmblem intensity={intensity} speed={speed} />
            <ContactShadows
              position={[0, -2.35, 0]}
              opacity={0.35}
              scale={8}
              blur={2.4}
              far={4}
            />
          </Canvas>
        </div>
      ) : (
        <div className="relative z-10 flex items-center justify-center w-full h-full min-h-[420px]">
          <div className="w-48 h-48 rounded-3xl glass-panel flex items-center justify-center p-6 animate-pulse">
            <img
              src="/icon.svg"
              alt="Taqdom 3D Horus Falcon Emblem"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Orbiting 3D-Space Glass Creator Cards */}
      {showCreatorCards && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {ORBIT_CREATORS.map((creator, idx) => {
            const subUrl = getSubdomainUrl(creator.username, host);
            return (
              <Link
                key={creator.username}
                href={subUrl}
                className={`pointer-events-auto absolute ${creator.positionClass} group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 glass-panel shadow-xl transition-all duration-500 hover:scale-105 hover:border-[#D4AF37]`}
                style={{
                  animation: `wingPulse ${5 + idx * 0.8}s ease-in-out infinite`,
                }}
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#D4AF37]/60">
                  <Image
                    src={creator.avatar}
                    alt={lang === "ar" ? creator.nameAr : creator.nameEn}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">
                      {lang === "ar" ? creator.nameAr : creator.nameEn}
                    </span>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00F5D4]" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {lang === "ar"
                      ? `${creator.roleAr} • ${creator.cityAr}`
                      : `${creator.roleEn} • ${creator.cityEn}`}
                  </span>
                  <span
                    dir="ltr"
                    className="text-[10px] font-mono font-semibold text-[#C5A059] dark:text-[#D4AF37] group-hover:underline"
                  >
                    {creator.username}.taqdom.me ↗
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
