"use client";

import React from "react";

interface TaqdomLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  lang?: "ar" | "en";
}

/**
 * Taqdom identity mark: a forward-looking falcon, architectural pillar,
 * and balanced circuit traces. Kept as inline SVG for sharp rendering
 * at every size and for crisp favicons / high-density displays.
 */
export function TaqdomLogo({
  size = 40,
  className = "",
  showWordmark = true,
  lang = "ar",
}: TaqdomLogoProps) {
  const gradientId = React.useId().replace(/:/g, "");

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <span
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[1.05rem] border border-[#A78BFA]/35 bg-[#10111B] text-[#A78BFA] shadow-[0_8px_28px_rgba(0,0,0,.22)]"
        style={{ width: size, height: size }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(167,139,250,.20),transparent_62%)]"
        />
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative h-[82%] w-[82%]"
          role="img"
          aria-label="Taqdom falcon and digital pillar emblem"
        >
          <defs>
            <linearGradient id={`taqdom-mark-spectrum-${gradientId}`} x1="20" y1="12" x2="92" y2="108" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C8B8FF" />
              <stop offset=".48" stopColor="#A78BFA" />
              <stop offset="1" stopColor="#FF8396" />
            </linearGradient>
          </defs>
          <path
            d="M60 10C47 10 38 19 35 34C24 31 16 24 9 16C13 39 26 53 45 60L45 94L60 110L75 94V60C94 53 107 39 111 16C104 24 96 31 85 34C82 19 73 10 60 10Z"
            fill={`url(#taqdom-mark-spectrum-${gradientId})`}
          />
          <path
            d="M60 23C54 29 50 36 49 45L60 39L71 45C70 36 66 29 60 23Z"
            fill="#10111B"
          />
          <path d="M52 52L60 44L68 52V92L60 101L52 92V52Z" fill="#10111B" />
          <path
            d="M17 29C27 43 37 48 48 53M103 29C93 43 83 48 72 53"
            stroke="#F7F5FC"
            strokeOpacity=".78"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M34 68V79L45 89M86 68V79L75 89M27 62V74L39 85M93 62V74L81 85"
            stroke="#C8B8FF"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="27" cy="59" r="3" fill="#C8B8FF" />
          <circle cx="93" cy="59" r="3" fill="#C8B8FF" />
          <circle cx="39" cy="87" r="2.4" fill="#A78BFA" />
          <circle cx="81" cy="87" r="2.4" fill="#A78BFA" />
          <path d="M60 56V91" stroke="#A78BFA" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>

      {showWordmark && (
        <span className="flex flex-col leading-none">
          {lang === "ar" ? (
            <>
              <span className="arabic-diacritics text-xl font-bold tracking-tight text-foreground">
                تَقَدُّم
              </span>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.26em] text-[#6047B7] dark:text-[#A78BFA]">
                BUILT FOR WHAT'S NEXT
              </span>
            </>
          ) : (
            <>
              <span className="font-serif text-xl font-normal uppercase tracking-[0.13em] text-foreground">
                TAQDOM
              </span>
              <span className="mt-1 arabic-diacritics text-[10px] font-medium text-[#6047B7] dark:text-[#A78BFA]">
                تَقَدُّم • اصنع مساحتك
              </span>
            </>
          )}
        </span>
      )}
    </div>
  );
}
