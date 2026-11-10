"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Sparkles,
  ArrowUpLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Globe2,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { normalizeUsername, validateUsername, getSubdomainUrl } from "@/lib/types";
import { useTaqdomStore } from "@/lib/store";

const TaqdomHeroScene = dynamic(
  () =>
    import("@/components/three/taqdom-hero-scene").then((m) => m.TaqdomHeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center">
        <div className="h-40 w-40 rounded-3xl glass-panel flex items-center justify-center p-6 animate-pulse">
          <img src="/icon.svg" alt="Taqdom 3D Emblem" className="w-full h-full object-contain" />
        </div>
      </div>
    ),
  }
);

const ARCHITECTURAL_FRAMES = [
  {
    src: "/images/hero-side-1.png",
    titleAr: "أَثَر • عمارة متحفية",
    titleEn: "Athar • Museum Monolith",
    creator: "layla.taqdom.me",
  },
  {
    src: "/images/hero-side-2.png",
    titleAr: "سِيَادَة • حضور تنفيذي",
    titleEn: "Siyada • Executive Suite",
    creator: "karim.taqdom.me",
  },
  {
    src: "/images/hero-side-3.png",
    titleAr: "نُور • مجلة فنية",
    titleEn: "Noor • Alabaster Issue",
    creator: "farida.taqdom.me",
  },
  {
    src: "/images/hero-side-4.png",
    titleAr: "مَدَار • شريط سينمائي",
    titleEn: "Madar • Cinema 2.39:1",
    creator: "youssef.taqdom.me",
  },
];

export function HeroSection() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const setDraft = useTaqdomStore((s) => s.setDraft);

  const [claimedInput, setClaimedInput] = useState("");
  const [availability, setAvailability] = useState<{
    checking: boolean;
    available: boolean;
    isDemoAccount: boolean;
    messageAr: string;
    messageEn: string;
  }>({
    checking: false,
    available: true,
    isDemoAccount: false,
    messageAr: "النطاق الفرعي متاح للحجز الفوري!",
    messageEn: "Subdomain is available for instant claim!",
  });
  const [host, setHost] = useState("taqdom.me");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  const previewUsername = normalizeUsername(claimedInput) || "ahmed";
  const fullSubdomainPreview = `https://${previewUsername}.taqdom.me`;

  useEffect(() => {
    const clean = normalizeUsername(claimedInput);
    if (!clean) {
      setAvailability({
        checking: false,
        available: true,
        isDemoAccount: false,
        messageAr: "اكتب اسمك لمعاينة وحجز نطاقك السيادي المستقل",
        messageEn: "Type your name to preview & claim your sovereign subdomain",
      });
      return;
    }

    const localCheck = validateUsername(clean);
    if (!localCheck.valid) {
      setAvailability({
        checking: false,
        available: false,
        isDemoAccount: false,
        messageAr: localCheck.reasonAr || "اسم غير صالح",
        messageEn: localCheck.reasonEn || "Invalid username",
      });
      return;
    }

    let cancelled = false;
    setAvailability((prev) => ({ ...prev, checking: true }));

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check?u=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (!cancelled) {
          setAvailability({
            checking: false,
            available: Boolean(data.available),
            isDemoAccount: Boolean(data.isDemoAccount),
            messageAr: data.reasonAr || "",
            messageEn: data.reasonEn || "",
          });
        }
      } catch {
        if (!cancelled) {
          setAvailability({
            checking: false,
            available: true,
            isDemoAccount: false,
            messageAr: "النطاق الفرعي متاح للحجز الفوري!",
            messageEn: "Subdomain is available for instant claim!",
          });
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [claimedInput]);

  const handleLaunchStudio = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUsername = normalizeUsername(claimedInput) || "ahmed";
    setDraft((prev) => ({
      ...prev,
      username: targetUsername,
    }));
    router.push(`/studio?u=${encodeURIComponent(targetUsername)}`);
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen pt-28 pb-20 md:pt-32 md:pb-28 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Royal Eyebrow Badge */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/45 bg-[#C5A059]/10 px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>
              {t(
                "المنصة المصرية الفاخرة والأرقى عالمياً لمعارض أعمال المبدعين • الجيل الخامس WebGL",
                "Egypt's Sovereign Luxury Portfolio Architecture • WebGL Spatial Atelier"
              )}
            </span>
          </div>

          {/* Monumental Bilingual Headline */}
          <h1 className="arabic-diacritics mt-6 max-w-5xl text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground">
            {lang === "ar" ? (
              <>
                تَقَدُّم — اصنع <span className="gold-shimmer-text">أَثَرَك السيادي</span>{" "}
                على نطاقك المستقل
              </>
            ) : (
              <>
                TAQDOM — Architect Your{" "}
                <span className="gold-shimmer-text">Sovereign Legacy</span>
              </>
            )}
          </h1>

          <p className="mt-5 max-w-3xl text-base sm:text-lg md:text-xl leading-relaxed text-muted-foreground">
            {t(
              "حيث تلتقي فخامة المرمر المصري وجماليات صقر حورس المعماري بفيزياء الفضاء ثلاثي الأبعاد. صمّم وانشر معرض أعمالك المتحفي فوراً على نطاقك الفرعي المستقل قبل .taqdom.me.",
              "Where Egyptian architectural monumentalism and the sculptural Horus Falcon meet real-time 3D WebGL physics. Curate and publish your museum-grade portfolio on your dedicated .taqdom.me subdomain."
            )}
          </p>
        </div>

        {/* Live Subdomain Reservation Bar in Hero */}
        <div className="mx-auto max-w-3xl mb-10">
          <form
            onSubmit={handleLaunchStudio}
            className="glass-panel rounded-2xl p-3 sm:p-4 shadow-2xl border border-[#C5A059]/45"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div
                dir="ltr"
                className="flex-1 flex items-center gap-2 rounded-xl bg-background/90 border border-border px-4 py-3"
              >
                <Globe2 className="h-5 w-5 text-[#C5A059] shrink-0" />
                <input
                  type="text"
                  data-testid="hero-username-input"
                  value={claimedInput}
                  onChange={(e) => setClaimedInput(e.target.value)}
                  placeholder={t(
                    "ahmed (اكتب اسمك بالإنجليزية)",
                    "Enter your username (e.g. ahmed)..."
                  )}
                  dir="ltr"
                  className="w-full bg-transparent font-mono text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none text-left"
                />
                <span
                  dir="ltr"
                  className="shrink-0 font-mono text-xs sm:text-sm font-bold text-[#C5A059]"
                >
                  .taqdom.me
                </span>
              </div>

              <button
                type="submit"
                data-testid="hero-claim-btn"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] px-6 py-3.5 text-sm font-bold text-[#111113] transition shadow-lg shrink-0 cursor-pointer"
              >
                <span>{t("انطلق للاستوديو", "Launch Studio")}</span>
                {lang === "ar" ? (
                  <ArrowUpLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Live Subdomain Preview Row */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {t("معاينة نطاقك المستقل الحي:", "Your live sovereign subdomain:")}
                </span>
                <span
                  dir="ltr"
                  data-testid="hero-subdomain-preview"
                  className="rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/40 px-2.5 py-1 font-mono font-bold text-foreground"
                >
                  {fullSubdomainPreview}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {availability.available ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-[#00F5D4]" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-[#D4AF37]" />
                )}
                <span className="font-medium text-muted-foreground">
                  {t(availability.messageAr, availability.messageEn)}
                </span>
              </div>
            </div>
          </form>

          {/* Live Subdomain Quick Showcase Links */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">
              {t("نطاقات حية لمبدعي تَقَدُّم:", "Live Creator Subdomains:")}
            </span>
            {(["layla", "youssef", "farida", "karim", "test"] as const).map((uname) => (
              <Link
                key={uname}
                href={getSubdomainUrl(uname, host)}
                dir="ltr"
                className="rounded-full border border-border bg-secondary/70 px-3 py-1 font-mono text-[11px] font-semibold text-foreground transition hover:border-[#C5A059] hover:bg-[#C5A059]/15"
              >
                {uname}.taqdom.me ↗
              </Link>
            ))}
          </div>
        </div>

        {/* Centerpiece: 3D Interactive Horus Falcon + 'T' Scene & Architectural Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Architectural Frames */}
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-4">
            {ARCHITECTURAL_FRAMES.slice(0, 2).map((frame) => {
              const uname = frame.creator.split(".")[0];
              return (
                <Link
                  key={frame.src}
                  href={getSubdomainUrl(uname, host)}
                  className="group relative min-h-[200px] overflow-hidden rounded-2xl border border-border shadow-lg"
                >
                  <Image
                    src={frame.src}
                    alt={t(frame.titleAr, frame.titleEn)}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/85 via-[#050508]/20 to-transparent" />
                  <div className="absolute bottom-3 inset-x-3 flex flex-col">
                    <span className="text-xs font-bold text-[#EDEAE2]">
                      {t(frame.titleAr, frame.titleEn)}
                    </span>
                    <span dir="ltr" className="font-mono text-[11px] text-[#D4AF37]">
                      {frame.creator}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Center 3D WebGL Sculpture Stage */}
          <div className="lg:col-span-6 relative min-h-[440px] rounded-3xl overflow-hidden border border-[#C5A059]/40 shadow-2xl glass-panel">
            <Image
              src="/images/hero-mono.png"
              alt="Taqdom Architectural Sanctuary Backdrop"
              fill
              priority
              className="object-cover opacity-25 dark:opacity-30 mix-blend-luminosity"
            />
            <div className="relative z-10 h-full w-full">
              <TaqdomHeroScene lang={lang} showCreatorCards />
            </div>
            <div className="pointer-events-none absolute bottom-3 inset-x-4 z-20 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>3D HORUS FALCON × ARCHITECTURAL &apos;T&apos;</span>
              <span>INTERACTIVE WEBGL • DRAG / HOVER</span>
            </div>
          </div>

          {/* Right Architectural Frames */}
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-4">
            {ARCHITECTURAL_FRAMES.slice(2, 4).map((frame) => {
              const uname = frame.creator.split(".")[0];
              return (
                <Link
                  key={frame.src}
                  href={getSubdomainUrl(uname, host)}
                  className="group relative min-h-[200px] overflow-hidden rounded-2xl border border-border shadow-lg"
                >
                  <Image
                    src={frame.src}
                    alt={t(frame.titleAr, frame.titleEn)}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/85 via-[#050508]/20 to-transparent" />
                  <div className="absolute bottom-3 inset-x-3 flex flex-col">
                    <span className="text-xs font-bold text-[#EDEAE2]">
                      {t(frame.titleAr, frame.titleEn)}
                    </span>
                    <span dir="ltr" className="font-mono text-[11px] text-[#D4AF37]">
                      {frame.creator}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 rounded-xl border border-[#C5A059]/50 bg-secondary/80 px-6 py-3 text-sm font-bold text-foreground transition hover:border-[#C5A059] hover:bg-[#C5A059]/15"
          >
            <Layers className="h-4 w-4 text-[#C5A059]" />
            <span>{t("استكشف القوالب الأربعة المستقلة", "Explore the 4 Sovereign Templates")}</span>
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition hover:border-[#00F5D4]"
          >
            <ShieldCheck className="h-4 w-4 text-[#00F5D4]" />
            <span>{t("دخول فوري بحساب الاختبار (test.taqdom.me)", "1-Click Test Account (test.taqdom.me)")}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
