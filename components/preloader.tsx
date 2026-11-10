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
      if (seen === "1") {
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
      current += 14;
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
          setTimeout(() => setVisible(false), 450);
        }, 180);
      } else {
        setProgress(current);
      }
    }, 55);

    return () => clearInterval(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between px-8 py-10 transition-all duration-500 ${
        closing ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(circle at 50% 40%, #141624 0%, #050508 75%)",
        color: "#EDEAE2",
      }}
    >
      <div className="flex w-full items-center justify-between text-xs tracking-[0.25em] uppercase text-[#C5A059]">
        <span>CAIRO • EL GOUNA • PARIS • DUBAI</span>
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem("taqdom_preloader_done", "1");
            } catch {}
            setVisible(false);
          }}
          className="rounded-full border border-[#D4AF37]/40 px-3 py-1 text-[11px] text-[#EDEAE2] hover:border-[#D4AF37]"
        >
          تخطي / SKIP
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 text-center">
        <TaqdomLogo size={76} showWordmark={false} />
        <h2 className="arabic-diacritics text-4xl md:text-6xl font-bold tracking-tight gold-shimmer-text">
          تَقَدُّم • TAQDOM
        </h2>
        <p className="max-w-md text-sm md:text-base text-[#9E9A8E]">
          المنصة المصرية السيادية لمعارض أعمال المبدعين • Sovereign Portfolio Architecture
        </p>
      </div>

      <div className="w-full max-w-xl">
        <div className="flex items-baseline justify-between mb-2 font-mono">
          <span className="text-xs tracking-[0.2em] uppercase text-[#9E9A8E]">
            INITIALIZING 3D ATELIER
          </span>
          <span className="text-3xl md:text-5xl font-bold text-[#D4AF37]">
            {String(progress).padStart(2, "0")}%
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#1F2233]">
          <div
            className="h-full transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #C5A059, #D4AF37, #00F5D4)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
