"use client";

import React from "react";

interface TaqdomLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  lang?: "ar" | "en";
}

/** Taqdom wordmark and champagne monogram for day/night surfaces. */
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
        style={{ width: size, height: size, borderRadius: Math.max(9, size * 0.28) }}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Taqdom logo"
          className="taqdom-step-mark"
          style={{ width: size * 0.86, height: size * 0.86 }}
        >
          <path d="M4 7H36L28 15H23V34H13V15H4V7Z" fill="currentColor" />
          <path d="M4 7H36" stroke="rgba(255,255,255,.72)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>
      {showWordmark && (
        <span className="neo-logo-word">
          <strong>Taqdom</strong>
          <small>{lang === "ar" ? "بورتفوليو مجاني دائمًا" : "YOUR PORTFOLIO. ALWAYS FREE."}</small>
        </span>
      )}
    </span>
  );
}
