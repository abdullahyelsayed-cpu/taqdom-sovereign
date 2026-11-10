"use client";

import React from "react";

interface TaqdomLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  lang?: "ar" | "en";
}

/**
 * Taqdom's new identity: three ascending steps and one forward-moving line.
 * A simple, legible mark that reads clearly at navigation and favicon sizes.
 */
export function TaqdomLogo({
  size = 40,
  className = "",
  showWordmark = true,
  lang = "ar",
}: TaqdomLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <span
        className="neo-logo-mark shrink-0"
        style={{ width: size, height: size, borderRadius: Math.max(11, size * 0.32) }}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Taqdom ascending steps logo"
          className="taqdom-step-mark"
          style={{ width: size * 0.76, height: size * 0.76 }}
        >
          <path d="M5 31V20h7v11H5Z" fill="currentColor" />
          <path d="M16 31V12h7v19h-7Z" fill="currentColor" />
          <path d="M27 31V5h7v26h-7Z" fill="currentColor" />
          <path d="m7.5 14 10-7 7 2 8-5" stroke="#D8FF52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {showWordmark && (
        <span className="neo-logo-word">
          <strong>{lang === "ar" ? "تَقَدُّم" : "TAQDOM"}</strong>
          <small>{lang === "ar" ? "MAKE YOUR WORK MATTER" : "مساحتك لكل اللي بتصنعه"}</small>
        </span>
      )}
    </span>
  );
}
