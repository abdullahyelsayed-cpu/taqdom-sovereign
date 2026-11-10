"use client";

import React, { useEffect, useState } from "react";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem("taqdom_preloader_done");
      if (seen === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setVisible(false);
        return;
      }
      setVisible(true);
    } catch {
      setVisible(false);
      return;
    }

    let current = 0;
    const timer = setInterval(() => {
      current += 25;
      if (current >= 100) {
        setProgress(100);
        clearInterval(timer);
        setTimeout(() => {
          setClosing(true);
          try {
            sessionStorage.setItem("taqdom_preloader_done", "1");
          } catch {
            // ignore
          }
          setTimeout(() => setVisible(false), 250);
        }, 60);
      } else {
        setProgress(current);
      }
    }, 24);

    return () => clearInterval(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between px-8 py-10 transition-all duration-250 ${
        closing ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      }`}
      style={{
        background: "#10111B",
        color: "#F7F5FC",
      }}
    >
      <div className="flex w-full items-center justify-between font-mono text-xs tracking-[0.22em] uppercase text-[#A78BFA]">
        <span>CAIRO • MILAN • DUBAI • RIYADH</span>
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem("taqdom_preloader_done", "1");
            } catch {}
            setVisible(false);
          }}
          className="rounded-full border border-[#A78BFA]/40 px-3 py-1 text-[11px] text-[#F7F5FC] hover:border-[#A78BFA]"
        >
          تخطي / SKIP
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 text-center">
        <TaqdomLogo size={72} showWordmark={false} />
        <h2 className="arabic-diacritics text-4xl md:text-6xl font-bold tracking-tight text-[#F7F5FC]">
          تَقَدُّم • TAQDOM
        </h2>
        <p className="max-w-md text-sm md:text-base text-[#B7B8C8]">
          مساحة لأفكارك ومشاريعك • A home for what you make
        </p>
      </div>

      <div className="w-full max-w-xl">
        <div className="flex items-baseline justify-between mb-2 font-mono">
          <span className="text-xs tracking-[0.2em] uppercase text-[#B7B8C8]">
            SETTING UP YOUR CREATIVE SPACE
          </span>
          <span className="text-3xl md:text-5xl font-bold text-[#A78BFA]">
            {String(progress).padStart(2, "0")}%
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#22263A]">
          <div
            className="h-full transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #A78BFA, #FF8396, #7EE7C4)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
