"use client";

import React from "react";

interface TaqdomLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  lang?: "ar" | "en";
}

export function TaqdomLogo({
  size = 40,
  className = "",
  showWordmark = true,
  lang = "ar",
}: TaqdomLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl p-1.5 transition-transform duration-500 group-hover:scale-105"
        style={{
          width: size,
          height: size,
          background:
            "linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(11,12,20,0.92) 100%)",
          boxShadow:
            "0 0 24px rgba(197, 160, 89, 0.25), inset 0 0 0 1px rgba(212, 175, 55, 0.45)",
        }}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          className="w-full h-full overflow-visible"
          aria-label="Taqdom Royal Horus Falcon T Emblem"
        >
          <defs>
            <linearGradient id="taqdomGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5E6B3" />
              <stop offset="45%" stopColor="#D4AF37" />
              <stop offset="80%" stopColor="#A67C27" />
              <stop offset="100%" stopColor="#E5C158" />
            </linearGradient>
            <linearGradient id="taqdomCyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F5D4" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#00F5D4" />
            </linearGradient>
          </defs>

          {/* Left Falcon Wing (Horizontal Bar of 'T') */}
          <g className="origin-[55px_40px] transition-transform duration-700 group-hover:-rotate-6">
            <path
              d="M8 34 L52 34 L56 43 L20 48 Z"
              fill="url(#taqdomGoldGrad)"
            />
            <path
              d="M16 46 L52 42 L54 49 L27 54 Z"
              fill="url(#taqdomGoldGrad)"
              opacity="0.82"
            />
            <path
              d="M26 56 L53 50 L54 55 L35 60 Z"
              fill="url(#taqdomCyanGrad)"
              opacity="0.7"
            />
          </g>

          {/* Right Falcon Wing (Horizontal Bar of 'T') */}
          <g className="origin-[65px_40px] transition-transform duration-700 group-hover:rotate-6">
            <path
              d="M112 34 L68 34 L64 43 L100 48 Z"
              fill="url(#taqdomGoldGrad)"
            />
            <path
              d="M104 46 L68 42 L66 49 L93 54 Z"
              fill="url(#taqdomGoldGrad)"
              opacity="0.82"
            />
            <path
              d="M94 56 L67 50 L66 55 L85 60 Z"
              fill="url(#taqdomCyanGrad)"
              opacity="0.7"
            />
          </g>

          {/* Royal Falcon Head & Eye of Horus Crown */}
          <polygon
            points="60,12 71,28 60,35 49,28"
            fill="url(#taqdomGoldGrad)"
          />
          <circle cx="60" cy="24.5" r="2.8" fill="#00F5D4" />

          {/* Architectural 'T' Vertical Obelisk Pillar & Tail */}
          <polygon
            points="51,34 69,34 65,91 60,106 55,91"
            fill="url(#taqdomGoldGrad)"
          />
          <line
            x1="60"
            y1="35"
            x2="60"
            y2="100"
            stroke="#050508"
            strokeWidth="1.8"
            opacity="0.55"
          />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          {lang === "ar" ? (
            <>
              <span className="arabic-diacritics text-xl font-bold tracking-tight text-foreground">
                تَقَدُّم
              </span>
              <span className="text-[10px] uppercase tracking-[0.26em] text-[#C5A059] dark:text-[#D4AF37]">
                TAQDOM.ME
              </span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold tracking-[0.14em] uppercase text-foreground">
                TAQDOM
              </span>
              <span className="arabic-diacritics text-[11px] text-[#C5A059] dark:text-[#D4AF37]">
                تَقَدُّم • SOVEREIGN
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
