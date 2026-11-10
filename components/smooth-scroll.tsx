"use client";

import React, { useEffect } from "react";

export function SmoothScrollAndAura({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let observer: IntersectionObserver | null = null;
    let lenis: { raf: (time: number) => void; destroy: () => void; on: (name: string, cb: () => void) => void } | null = null;
    let ticker: { add: (fn: (time: number) => void) => void; remove: (fn: (time: number) => void) => void; lagSmoothing: (threshold?: number, adjustedLag?: number) => void } | null = null;
    let rafCallback: ((time: number) => void) | null = null;
    let disposed = false;

    const revealNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!reduced && "IntersectionObserver" in window && revealNodes.length) {
      document.documentElement.classList.add("taq-motion-ready");
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          }
        }
      }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });
      revealNodes.forEach((node) => observer?.observe(node));
    }

    // Lenis is loaded only on the public homepage. Studio and account pages
    // keep native scrolling and do not pay the smooth-scroll JavaScript cost.
    if (!reduced && document.querySelector(".home-experience")) {
      void Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]).then(([lenisModule, gsapModule, triggerModule]) => {
        if (disposed) return;
        const LenisConstructor = lenisModule.default;
        const gsap = gsapModule.default;
        const ScrollTrigger = triggerModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
        const instance = new LenisConstructor({
          duration: 0.78,
          smoothWheel: true,
          wheelMultiplier: 0.92,
          touchMultiplier: 1.05,
          anchors: true,
        });
        lenis = instance;
        instance.on("scroll", () => ScrollTrigger.update());
        const raf = (time: number) => instance.raf(time * 1000);
        rafCallback = raf;
        ticker = gsap.ticker;
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(500, 33);
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }).catch(() => {
        // Native browser scrolling is the reliable fallback.
      });
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      document.documentElement.classList.remove("taq-motion-ready");
      if (ticker && rafCallback) ticker.remove(rafCallback);
      lenis?.destroy();
    };
  }, []);

  return (
    <>
      <div className="taqdom-scroll-progress" aria-hidden="true" />
      <div className="taqdom-grain" aria-hidden="true" />
      {children}
    </>
  );
}
