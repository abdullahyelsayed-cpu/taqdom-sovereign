"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  ExternalLink,
  Sparkles,
  Film,
  Compass,
  Award,
  BookOpen,
  Globe,
  Mail,
  Share2,
  Check,
  Sliders,
  Eye,
} from "lucide-react";
import { PortfolioData } from "@/lib/types";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";

const TaqdomHeroScene = dynamic(
  () =>
    import("@/components/three/taqdom-hero-scene").then((m) => m.TaqdomHeroScene),
  { ssr: false }
);

interface PortfolioRendererProps {
  data: PortfolioData;
  previewLang?: "ar" | "en";
  isStudioPreview?: boolean;
  isLiveSubdomain?: boolean;
}

export function PortfolioRenderer({
  data,
  previewLang,
  isStudioPreview = false,
  isLiveSubdomain = false,
}: PortfolioRendererProps) {
  const [lang, setLang] = useState<"ar" | "en">(previewLang || data.defaultLang || "ar");
  const [copied, setCopied] = useState(false);
  const [timecodeFrame, setTimecodeFrame] = useState(12);
  const [activeProjectModal, setActiveProjectModal] = useState<string | null>(null);

  useEffect(() => {
    if (previewLang) {
      setLang(previewLang);
    }
  }, [previewLang]);

  useEffect(() => {
    if (data.template !== "madar") return;
    const interval = setInterval(() => {
      setTimecodeFrame((prev) => (prev + 1) % 24);
    }, 120);
    return () => clearInterval(interval);
  }, [data.template]);

  const t = (ar: string, en: string) => (lang === "ar" ? ar || en : en || ar);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const accent = data.theme?.accent || "#D4AF37";
  const subdomainDisplay = `${data.username}.taqdom.me`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`https://${subdomainDisplay}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedProject = data.projects.find((p) => p.id === activeProjectModal);

  // Determine theme surface styles per template & theme mode
  const isLightSurface =
    data.template === "noor" ||
    (data.theme?.mode === "light" && data.template !== "madar");

  const surfaceBg = isLightSurface ? "#F6F4EE" : "#050508";
  const surfaceCard = isLightSurface ? "#EFECE4" : "#0B0C14";
  const surfaceText = isLightSurface ? "#111113" : "#EDEAE2";
  const surfaceMuted = isLightSurface ? "#57534A" : "#9E9A8E";
  const surfaceBorder = isLightSurface ? "#DCD5C5" : "#1F2233";

  return (
    <div
      dir={dir}
      lang={lang}
      data-testid="portfolio-renderer"
      data-template={data.template}
      style={{
        backgroundColor: surfaceBg,
        color: surfaceText,
      }}
      className="min-h-screen w-full transition-colors duration-500 relative overflow-x-hidden"
    >
      {/* Top Sovereign Portfolio Bar */}
      <header
        style={{
          borderColor: surfaceBorder,
          backgroundColor: isLightSurface
            ? "rgba(246, 244, 238, 0.86)"
            : "rgba(5, 5, 8, 0.86)",
        }}
        className="sticky top-0 z-40 backdrop-blur-xl border-b px-4 sm:px-8 py-3.5"
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="relative h-10 w-10 rounded-full overflow-hidden border-2 shrink-0"
              style={{ borderColor: accent }}
            >
              <Image
                src={data.avatar || "/images/creators/test.jpg"}
                alt={t(data.name.ar, data.name.en)}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="arabic-diacritics font-bold text-sm sm:text-base">
                  {t(data.name.ar, data.name.en)}
                </span>
                <span
                  style={{ backgroundColor: `${accent}25`, color: accent, borderColor: `${accent}55` }}
                  className="rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase font-bold"
                >
                  {data.template}
                </span>
              </div>
              <span dir="ltr" className="block font-mono text-[11px]" style={{ color: accent }}>
                https://{subdomainDisplay}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data.isDemoShowcase && (
              <span
                style={{ borderColor: surfaceBorder, color: surfaceMuted }}
                className="hidden md:inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px]"
              >
                <Sparkles className="h-3 w-3" style={{ color: accent }} />
                <span>{t("حساب عرض تَقَدُّم", "Taqdom Showcase")}</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              style={{ borderColor: surfaceBorder }}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition hover:opacity-80"
            >
              <Globe className="h-3.5 w-3.5" style={{ color: accent }} />
              <span>{lang === "ar" ? "EN" : "عربي"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              style={{ borderColor: surfaceBorder }}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition hover:opacity-80"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{t("تم النسخ", "Copied")}</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" style={{ color: accent }} />
                  <span className="hidden sm:inline">{t("نسخ الرابط", "Copy Link")}</span>
                </>
              )}
            </button>

            {!isStudioPreview && (
              <Link
                href={isLiveSubdomain ? `https://taqdom.me/studio?u=${data.username}` : `/studio?u=${data.username}`}
                style={{ backgroundColor: accent, color: "#111113" }}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-md transition hover:opacity-90"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>{t("تعديل في الاستوديو", "Edit in Studio")}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          TEMPLATE 1: ATHAR (أَثَر — 3D Architectural & Museum Monolith)
      ===================================================================== */}
      {data.template === "athar" && (
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-12 md:py-16 space-y-20">
          {/* Hero Split with 3D Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold" style={{ borderColor: `${accent}60`, color: accent }}>
                <Compass className="h-3.5 w-3.5" />
                <span>
                  {data.badge
                    ? t(data.badge.ar, data.badge.en)
                    : t("قالب أَثَر المعماري ثلاثي الأبعاد", "ATHAR • 3D ARCHITECTURAL MONOLITH")}
                </span>
              </div>

              <h1 className="arabic-diacritics text-4xl sm:text-6xl font-extrabold tracking-tight">
                {t(data.name.ar, data.name.en)}
              </h1>

              <p className="text-xl sm:text-2xl font-medium" style={{ color: accent }}>
                {t(data.title.ar, data.title.en)}
              </p>

              <p className="text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: surfaceMuted }}>
                {t(data.bio.ar, data.bio.en)}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="inline-flex items-center gap-1.5 text-sm" style={{ color: surfaceMuted }}>
                  <MapPin className="h-4 w-4" style={{ color: accent }} />
                  <span>{t(data.city.ar, data.city.en)}</span>
                </div>
                {data.links.map((lnk, i) => (
                  <a
                    key={i}
                    href={lnk.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ borderColor: surfaceBorder }}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition hover:opacity-80"
                  >
                    <span>{lnk.label}</span>
                    <ExternalLink className="h-3 w-3" style={{ color: accent }} />
                  </a>
                ))}
              </div>
            </div>

            {/* 3D Monolith or Architectural Cover */}
            <div
              style={{ borderColor: `${accent}50`, backgroundColor: surfaceCard }}
              className="lg:col-span-5 relative min-h-[380px] rounded-3xl overflow-hidden border shadow-2xl"
            >
              <Image
                src={data.cover || "/images/hero-mono.png"}
                alt={t(data.name.ar, data.name.en)}
                fill
                className="object-cover opacity-35"
              />
              {data.theme?.scene3d?.enabled !== false ? (
                <div className="relative z-10 h-[380px] w-full">
                  <TaqdomHeroScene
                    lang={lang}
                    intensity={data.theme?.scene3d?.intensity ?? 1.2}
                    speed={data.theme?.scene3d?.speed ?? 1.0}
                    lightAngle={data.theme?.scene3d?.lightAngle ?? 42}
                    showCreatorCards={false}
                  />
                </div>
              ) : (
                <div className="relative z-10 flex h-[380px] items-end p-6">
                  <span className="font-mono text-xs uppercase tracking-widest" style={{ color: accent }}>
                    ARCHITECTURAL PLATE • {subdomainDisplay}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Metrics Row */}
          {data.metrics && data.metrics.length > 0 && (
            <div
              style={{ borderColor: surfaceBorder, backgroundColor: surfaceCard }}
              className="grid grid-cols-2 md:grid-cols-4 rounded-3xl border overflow-hidden"
            >
              {data.metrics.map((m, idx) => (
                <div
                  key={idx}
                  style={{ borderColor: surfaceBorder }}
                  className="p-6 sm:p-8 text-center border-b md:border-b-0 border-e last:border-e-0"
                >
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: surfaceMuted }}>
                    {t(m.label.ar, m.label.en)}
                  </p>
                  <p className="font-mono text-3xl sm:text-4xl font-extrabold" style={{ color: accent }}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Museum Plates (Projects) */}
          <div className="space-y-10">
            <div className="flex items-end justify-between border-b pb-4" style={{ borderColor: surfaceBorder }}>
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: accent }}>
                  MUSEUM EXHIBITION PLATES
                </span>
                <h2 className="arabic-diacritics text-2xl sm:text-4xl font-bold mt-1">
                  {t("الأعمال والمشاريع المختارة", "Selected Architectural & Spatial Works")}
                </h2>
              </div>
              <span className="font-mono text-sm" style={{ color: surfaceMuted }}>
                01 — 0{data.projects.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {data.projects.map((proj, idx) => (
                <div
                  key={proj.id}
                  style={{ borderColor: surfaceBorder, backgroundColor: surfaceCard }}
                  className="group rounded-3xl overflow-hidden border flex flex-col justify-between transition-all duration-500 hover:shadow-2xl"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                      src={proj.images[0] || "/images/hero-mono.png"}
                      alt={t(proj.title.ar, proj.title.en)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/80 via-transparent to-transparent" />
                    <div className="absolute top-4 inset-x-4 flex items-center justify-between">
                      <span className="rounded-lg bg-[#050508]/80 px-3 py-1 font-mono text-xs font-bold text-[#D4AF37]">
                        PLATE 0{idx + 1} • {proj.year}
                      </span>
                      {proj.metrics && (
                        <span className="rounded-lg bg-[#050508]/80 px-3 py-1 font-mono text-xs text-[#00F5D4]">
                          {proj.metrics}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-7 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="arabic-diacritics text-xl sm:text-2xl font-bold mb-2">
                        {t(proj.title.ar, proj.title.en)}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: surfaceMuted }}>
                        {t(proj.desc.ar, proj.desc.en)}
                      </p>
                    </div>

                    <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: surfaceBorder }}>
                      <div className="flex flex-wrap gap-1.5">
                        {proj.tags.map((tag, i) => (
                          <span
                            key={i}
                            style={{ borderColor: surfaceBorder }}
                            className="rounded-md border px-2.5 py-0.5 font-mono text-[11px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveProjectModal(proj.id)}
                        style={{ color: accent }}
                        className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{t("تفاصيل اللوحة", "Inspect Plate")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TEMPLATE 2: MADAR (مَدَار — Anamorphic 2.39:1 Cinema Reel)
      ===================================================================== */}
      {data.template === "madar" && (
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-10 space-y-16">
          {/* Anamorphic 2.39:1 Cinema Frame Hero */}
          <div className="relative rounded-3xl overflow-hidden border border-[#00F5D4]/40 bg-[#050508] shadow-2xl">
            <div className="relative aspect-[21/9] min-h-[340px] w-full overflow-hidden">
              <Image
                src={data.cover || "/images/mono-4.png"}
                alt={t(data.name.ar, data.name.en)}
                fill
                className="object-cover scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/45 to-[#050508]/60" />

              {/* Top HUD Timecode Overlay */}
              <div className="absolute top-4 inset-x-6 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[#00F5D4]">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span>REC • ANAMORPHIC 2.39:1 RAW</span>
                </div>
                <span>
                  TC 01:14:28:{String(timecodeFrame).padStart(2, "0")} • 24FPS
                </span>
              </div>

              {/* Center Director Identity */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/50 px-4 py-1 text-xs font-mono text-[#00F5D4] mb-4">
                  <Film className="h-3.5 w-3.5" />
                  <span>MADAR CINEMA REEL • {subdomainDisplay}</span>
                </span>
                <h1 className="arabic-diacritics text-4xl sm:text-6xl lg:text-7xl font-black text-[#EDEAE2]">
                  {t(data.name.ar, data.name.en)}
                </h1>
                <p className="mt-2 text-lg sm:text-xl text-[#D4AF37] font-medium">
                  {t(data.title.ar, data.title.en)}
                </p>
                <p className="mt-4 max-w-2xl text-sm sm:text-base text-[#EDEAE2]/80">
                  {t(data.bio.ar, data.bio.en)}
                </p>
              </div>
            </div>
          </div>

          {/* Filmstrip Reel Projects */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="arabic-diacritics text-2xl sm:text-4xl font-bold">
                {t("الشريط السينمائي المختار (Showreel)", "Director's Cut & Anamorphic Reel")}
              </h2>
              <span className="font-mono text-xs text-[#00F5D4]">35MM • DOLBY VISION</span>
            </div>

            <div className="space-y-10">
              {data.projects.map((proj, idx) => (
                <div
                  key={proj.id}
                  className="group relative rounded-3xl overflow-hidden border border-[#1F2233] bg-[#0B0C14] grid grid-cols-1 lg:grid-cols-12"
                >
                  <div className="lg:col-span-7 relative aspect-[21/10] min-h-[260px] overflow-hidden">
                    <Image
                      src={proj.images[0] || "/images/mono-4.png"}
                      alt={t(proj.title.ar, proj.title.en)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 start-4 font-mono text-xs text-[#00F5D4] bg-[#050508]/80 px-3 py-1 rounded-md">
                      SCENE 0{idx + 1} • {proj.metrics || proj.year}
                    </div>
                  </div>
                  <div className="lg:col-span-5 p-8 flex flex-col justify-between">
                    <div className="space-y-3">
                      <span className="font-mono text-xs text-[#D4AF37]">
                        REEL {idx + 1} // {proj.year}
                      </span>
                      <h3 className="arabic-diacritics text-2xl font-bold text-[#EDEAE2]">
                        {t(proj.title.ar, proj.title.en)}
                      </h3>
                      <p className="text-sm text-[#9E9A8E] leading-relaxed">
                        {t(proj.desc.ar, proj.desc.en)}
                      </p>
                    </div>
                    <div className="pt-6 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        {proj.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="rounded-lg bg-[#161826] border border-[#1F2233] px-2.5 py-1 font-mono text-xs text-[#00F5D4]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveProjectModal(proj.id)}
                        className="text-xs font-bold text-[#D4AF37] hover:underline"
                      >
                        {t("مشاهدة الكادرات", "View Stills")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TEMPLATE 3: SIYADA (سِيَادَة — Executive & Venture Sovereign)
      ===================================================================== */}
      {data.template === "siyada" && (
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-14 space-y-16">
          {/* Executive Mandate Header */}
          <div
            style={{ borderColor: `${accent}50`, backgroundColor: surfaceCard }}
            className="rounded-3xl border p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl"
          >
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 px-4 py-1 text-xs font-bold text-[#D4AF37]">
                <Award className="h-3.5 w-3.5" />
                <span>{t("سِيَادَة • الملف التنفيذي السيادي", "SIYADA • EXECUTIVE SOVEREIGN MANDATE")}</span>
              </div>
              <h1 className="arabic-diacritics text-4xl sm:text-6xl font-extrabold">
                {t(data.name.ar, data.name.en)}
              </h1>
              <p className="text-xl font-semibold" style={{ color: accent }}>
                {t(data.title.ar, data.title.en)}
              </p>
              <p className="text-base leading-relaxed max-w-2xl" style={{ color: surfaceMuted }}>
                {t(data.bio.ar, data.bio.en)}
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col items-center lg:items-end gap-4">
              <div className="relative h-44 w-44 rounded-3xl overflow-hidden border-2 shadow-2xl" style={{ borderColor: accent }}>
                <Image
                  src={data.avatar || "/images/creators/karim.jpg"}
                  alt={t(data.name.ar, data.name.en)}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-mono text-xs" style={{ color: surfaceMuted }}>
                {t(data.city.ar, data.city.en)} • {subdomainDisplay}
              </span>
            </div>
          </div>

          {/* Executive KPI Board */}
          {data.metrics && data.metrics.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {data.metrics.map((m, i) => (
                <div
                  key={i}
                  style={{ borderColor: `${accent}40`, backgroundColor: surfaceCard }}
                  className="rounded-3xl border p-7"
                >
                  <p className="font-mono text-3xl sm:text-4xl font-black mb-2" style={{ color: accent }}>
                    {m.value}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: surfaceMuted }}>
                    {t(m.label.ar, m.label.en)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Leadership Timeline & Strategic Ventures */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {data.timeline && data.timeline.length > 0 && (
              <div className="lg:col-span-5 space-y-6">
                <h2 className="arabic-diacritics text-2xl font-bold">
                  {t("السجل القيادي والتنفيذي", "Executive Track Record")}
                </h2>
                <div className="space-y-4">
                  {data.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      style={{ borderColor: surfaceBorder, backgroundColor: surfaceCard }}
                      className="rounded-2xl border p-6 space-y-2"
                    >
                      <span className="font-mono text-xs font-bold" style={{ color: accent }}>
                        {item.year}
                      </span>
                      <h3 className="arabic-diacritics text-lg font-bold">
                        {t(item.role.ar, item.role.en)}
                      </h3>
                      <p className="text-xs font-semibold" style={{ color: accent }}>
                        {t(item.org.ar, item.org.en)}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: surfaceMuted }}>
                        {t(item.summary.ar, item.summary.en)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={data.timeline?.length ? "lg:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
              <h2 className="arabic-diacritics text-2xl font-bold">
                {t("المحفظة الاستثمارية والمشاريع الاستراتيجية", "Key Ventures & Strategic Mandates")}
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {data.projects.map((proj) => (
                  <div
                    key={proj.id}
                    style={{ borderColor: surfaceBorder, backgroundColor: surfaceCard }}
                    className="rounded-3xl border overflow-hidden grid grid-cols-1 sm:grid-cols-12"
                  >
                    <div className="sm:col-span-5 relative min-h-[200px]">
                      <Image
                        src={proj.images[0] || "/images/rusted-metal.png"}
                        alt={t(proj.title.ar, proj.title.en)}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="sm:col-span-7 p-6 flex flex-col justify-between gap-4">
                      <div>
                        <span className="font-mono text-xs font-bold" style={{ color: accent }}>
                          {proj.year} {proj.metrics ? `• ${proj.metrics}` : ""}
                        </span>
                        <h3 className="arabic-diacritics text-xl font-bold mt-1 mb-2">
                          {t(proj.title.ar, proj.title.en)}
                        </h3>
                        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: surfaceMuted }}>
                          {t(proj.desc.ar, proj.desc.en)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {proj.tags.map((tg, i) => (
                          <span
                            key={i}
                            style={{ borderColor: surfaceBorder }}
                            className="rounded-md border px-2 py-0.5 font-mono text-[10px]"
                          >
                            {tg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TEMPLATE 4: NOOR (نُور — Living Alabaster Editorial Monograph)
      ===================================================================== */}
      {data.template === "noor" && (
        <div className="mx-auto max-w-6xl px-4 sm:px-8 py-14 space-y-16">
          {/* Editorial Issue Masthead */}
          <div className="border-b-2 border-[#111113]/20 pb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono uppercase tracking-[0.25em] text-[#8C6D23] mb-6">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                <span>NOOR ALABASTER MONOGRAPH • ISSUE NO. 01</span>
              </span>
              <span>{t(data.city.ar, data.city.en)} • {subdomainDisplay}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-8 space-y-5">
                <h1 className="arabic-diacritics text-5xl sm:text-7xl font-black tracking-tight text-[#111113]">
                  {t(data.name.ar, data.name.en)}
                </h1>
                <p className="text-xl sm:text-2xl font-serif italic text-[#8C6D23]">
                  {t(data.title.ar, data.title.en)}
                </p>
                <p className="text-base sm:text-lg leading-relaxed text-[#38352E] max-w-2xl">
                  {t(data.bio.ar, data.bio.en)}
                </p>
              </div>
              <div className="lg:col-span-4">
                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-[#C5A059] shadow-xl">
                  <Image
                    src={data.avatar || "/images/creators/farida.jpg"}
                    alt={t(data.name.ar, data.name.en)}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Asymmetric Editorial Chapters */}
          <div className="space-y-14">
            {data.projects.map((proj, idx) => (
              <article
                key={proj.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-14 border-b border-[#DCD5C5]"
              >
                <div className={`lg:col-span-5 space-y-4 ${idx % 2 === 1 ? "lg:order-2" : ""}`}>
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#8C6D23]">
                    CHAPTER 0{idx + 1} — {proj.year}
                  </span>
                  <h2 className="arabic-diacritics text-3xl sm:text-4xl font-bold text-[#111113]">
                    {t(proj.title.ar, proj.title.en)}
                  </h2>
                  <p className="text-base leading-relaxed text-[#4A463D]">
                    {t(proj.desc.ar, proj.desc.en)}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {proj.tags.map((tg, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-[#EAE5D9] border border-[#C5A059]/40 px-3 py-1 text-xs font-medium text-[#111113]"
                      >
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`lg:col-span-7 grid grid-cols-2 gap-4 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className="col-span-2 relative aspect-[16/10] rounded-2xl overflow-hidden border border-[#DCD5C5]">
                    <Image
                      src={proj.images[0] || "/images/mono-2.png"}
                      alt={t(proj.title.ar, proj.title.en)}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508]/80 backdrop-blur-md p-4"
          onClick={() => setActiveProjectModal(null)}
        >
          <div
            style={{ backgroundColor: surfaceCard, borderColor: accent }}
            className="max-w-3xl w-full rounded-3xl border p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="arabic-diacritics text-2xl font-bold">
                {t(selectedProject.title.ar, selectedProject.title.en)}
              </h3>
              <button
                type="button"
                onClick={() => setActiveProjectModal(null)}
                className="rounded-lg border px-3 py-1 text-xs font-bold"
              >
                {t("إغلاق", "Close")}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedProject.images.map((img, i) => (
                <div key={i} className="relative aspect-[16/10] rounded-2xl overflow-hidden">
                  <Image
                    src={img}
                    alt={`${selectedProject.title.en} ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: surfaceMuted }}>
              {t(selectedProject.desc.ar, selectedProject.desc.en)}
            </p>
          </div>
        </div>
      )}

      {/* Sovereign Footer Inside Portfolio */}
      <footer
        style={{ borderColor: surfaceBorder }}
        className="mt-16 border-t px-4 sm:px-8 py-10"
      >
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TaqdomLogo size={32} showWordmark={false} />
            <span className="text-xs" style={{ color: surfaceMuted }}>
              {t(
                `معرض سيادي منشور على ${subdomainDisplay} عبر منصة تَقَدُّم`,
                `Sovereign portfolio published at ${subdomainDisplay} via Taqdom`
              )}
            </span>
          </div>
          {data.email && (
            <a
              href={`mailto:${data.email}`}
              style={{ color: accent }}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>{data.email}</span>
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
