"use client";

import React from "react";

interface TaqdomLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  lang?: "ar" | "en";
}

/**
 * Taqdom Static Negative-Space Architectural SVG Emblem
 * Combines the monumental architectural 'T' pillar and crossbar with a sharp
 * negative-space Falcon silhouette. Completely static, crisp vector geometry,
 * adapting seamlessly to Warm Alabaster Day Mode and Cinema Noir Night Mode.
 */
export function TaqdomLogo({
  size = 40,
  className = "",
  showWordmark = true,
  lang = "ar",
}: TaqdomLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl border border-[#141413]/15 dark:border-[#F4F1EA]/12 bg-[#141413] dark:bg-[#F4F1EA] text-[#F7F5F0] dark:text-[#0A0A09] shrink-0"
        style={{
          width: size,
          height: size,
        }}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[78%] h-[78%]"
          aria-label="Taqdom Negative-Space Architectural T & Falcon Emblem"
        >
          {/* Outer Architectural Monolith Frame with Negative-Space Falcon Cutouts */}
          {/* Top Crossbar of 'T' sculpted as Horizontal Falcon Wings */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 22H108L98 42H70V102L60 110L50 102V42H22L12 22ZM60 27L71 37H63L60 33L57 37H49L60 27Z"
            fill="currentColor"
          />
          {/* Negative-Space Secondary Wing Step Bars Forming Architectural Depth */}
          <path
            d="M25 48H44V58H31L25 48Z"
            fill="#9A7B4F"
            className="dark:fill-[#C89D66]"
          />
          <path
            d="M95 48H76V58H89L95 48Z"
            fill="#9A7B4F"
            className="dark:fill-[#C89D66]"
          />
          {/* Negative-Space Central Obelisk Precision Slit */}
          <rect
            x="58.5"
            y="44"
            width="3"
            height="48"
            fill="#9A7B4F"
            className="dark:fill-[#C89D66]"
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
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#9A7B4F] dark:text-[#C89D66]">
                TAQDOM.ME
              </span>
            </>
          ) : (
            <>
              <span className="font-serif text-xl font-normal tracking-[0.12em] uppercase text-foreground">
                TAQDOM
              </span>
              <span className="arabic-diacritics text-[10px] font-medium text-[#9A7B4F] dark:text-[#C89D66]">
                تَقَدُّم • IDENTITY
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
