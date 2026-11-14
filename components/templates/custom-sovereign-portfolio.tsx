"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ArrowUpLeft,
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  Globe2,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  CanvasSectionId,
  CustomPortfolioDesign,
  PortfolioData,
  PortfolioProject,
  safePortfolioUrl,
} from "@/lib/types";

interface CustomSovereignPortfolioProps {
  data: PortfolioData;
  design: CustomPortfolioDesign;
  lang: "ar" | "en";
  setLang: (next: "ar" | "en") => void;
  canvasSectionStyle: (id: CanvasSectionId) => React.CSSProperties;
  canvasEditMode?: boolean;
  selectedCanvasSection?: CanvasSectionId;
  onSelectProject: (project: PortfolioProject) => void;
}

function parseHexRgb(hex: string): [number, number, number] | null {
  const clean = String(hex || "").trim().replace(/^#/, "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ? null : [r, g, b];
  }
  if (clean.length === 6 || clean.length === 8) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ? null : [r, g, b];
  }
  return null;
}

function getRelativeLuminance(hex: string): number {
  const rgb = parseHexRgb(hex);
  if (!rgb) return 0.5;
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(rgb[0]) + 0.7152 * toLin(rgb[1]) + 0.0722 * toLin(rgb[2]);
}

function autoContrastText(bgHex: string): string {
  return getRelativeLuminance(bgHex) > 0.38 ? "#0B0D12" : "#FAF9F6";
}

function alphaColor(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const rgb = parseHexRgb(color);
  if (rgb) return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
  const clean = String(color || "").trim();
  if (!clean) return `rgba(128, 128, 128, ${a})`;
  const pct = Math.round(a * 1000) / 10;
  return `color-mix(in srgb, ${clean} ${pct}%, transparent)`;
}

function externalLinkProps(url?: string): { target?: "_blank"; rel?: "noreferrer" } {
  const u = String(url || "").trim().toLowerCase();
  if (u.startsWith("http://") || u.startsWith("https://")) {
    return { target: "_blank", rel: "noreferrer" };
  }
  return {};
}

function sanitizeSafeCssGradient(value?: string): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 400) return undefined;
  if (/url\s*\(|expression\s*\(|;|<|>|script|import/i.test(trimmed)) return undefined;
  if (/^(linear-gradient|radial-gradient|conic-gradient)\([a-z0-9#(),.%\s+-]+\)$/i.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

export function CustomSovereignPortfolio({
  data,
  design,
  lang,
  setLang,
  canvasSectionStyle,
  canvasEditMode = false,
  selectedCanvasSection,
  onSelectProject,
}: CustomSovereignPortfolioProps) {
  const [openFaqKey, setOpenFaqKey] = useState<string | null>(null);
  const t = (ar?: string, en?: string) => (lang === "ar" ? ar || en || "" : en || ar || "");
  const dir = lang === "ar" ? "rtl" : "ltr";
  const Arrow = lang === "ar" ? ArrowUpLeft : ArrowUpRight;

  const palette = design.palette || {
    background: "#0B0D14",
    surface: "#141824",
    surfaceAlt: "#1B2132",
    text: "#F5F2EB",
    muted: "#A6AFC2",
    accent: "#E3B76B",
  };
  const bg = palette.background || "#0B0D14";
  const surface = palette.surface || "#141824";
  const surfaceAlt = palette.surfaceAlt || surface;
  const text = palette.text || autoContrastText(bg);
  const muted = palette.muted || (getRelativeLuminance(bg) > 0.4 ? "#525C70" : "#A6AFC2");
  const accent = palette.accent || "#E3B76B";
  const accentText = palette.accentText || autoContrastText(accent);
  const isLightBg = getRelativeLuminance(bg) > 0.4;
  const border =
    palette.border || (isLightBg ? "rgba(18, 24, 38, 0.14)" : "rgba(244, 241, 234, 0.14)");
  const heroGradient = sanitizeSafeCssGradient(palette.heroGradient);

  const typo = design.typography || { headingStyle: "display", bodyStyle: "sans", scale: "balanced" };
  const layout = design.layout || {
    heroVariant: "split-showcase",
    projectGrid: "showcase-cards",
    cardRadius: "lg",
    maxWidth: "standard",
    showNav: true,
    navStyle: "floating-glass",
  };
  const effects = design.effects || {
    ambientGlow: true,
    glassBlur: true,
    gridPattern: "radial",
    hoverLift: "magnetic",
    borderStyle: "hairline",
  };

  const headingFont =
    typo.headingStyle === "editorial-serif"
      ? `var(--font-amiri), Georgia, "Times New Roman", serif`
      : typo.headingStyle === "technical-mono"
      ? `var(--font-jetbrains-mono), ui-monospace, monospace`
      : `var(--font-tajawal), var(--font-jakarta), system-ui, sans-serif`;

  const bodyFont =
    typo.bodyStyle === "serif"
      ? `var(--font-amiri), Georgia, serif`
      : typo.bodyStyle === "mono"
      ? `var(--font-jetbrains-mono), ui-monospace, monospace`
      : `var(--font-tajawal), var(--font-jakarta), system-ui, sans-serif`;

  const scaleHeroClass =
    typo.scale === "bold"
      ? "text-4xl sm:text-6xl lg:text-7xl"
      : typo.scale === "compact"
      ? "text-2xl sm:text-4xl lg:text-5xl"
      : "text-3xl sm:text-5xl lg:text-6xl";

  const radiusClass =
    layout.cardRadius === "none"
      ? "rounded-none"
      : layout.cardRadius === "sm"
      ? "rounded-lg"
      : layout.cardRadius === "md"
      ? "rounded-2xl"
      : layout.cardRadius === "full"
      ? "rounded-[2rem]"
      : "rounded-3xl";

  const maxWidthClass =
    layout.maxWidth === "narrow"
      ? "max-w-4xl"
      : layout.maxWidth === "wide"
      ? "max-w-[90rem]"
      : "max-w-7xl";

  const hoverClass =
    effects.hoverLift === "sharp"
      ? "transition-transform duration-200 ease-out hover:-translate-y-0.5"
      : effects.hoverLift === "subtle"
      ? "taqdom-lux-card"
      : "taqdom-lux-card taqdom-lux-magnetic";

  const patternStyle: React.CSSProperties = (() => {
    const patColor = isLightBg ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.06)";
    if (effects.gridPattern === "dots") {
      return {
        backgroundImage: `radial-gradient(${patColor} 1px, transparent 1px)`,
        backgroundSize: "22px 22px",
      };
    }
    if (effects.gridPattern === "lines") {
      return {
        backgroundImage: `linear-gradient(to right, ${patColor} 1px, transparent 1px), linear-gradient(to bottom, ${patColor} 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      };
    }
    if (effects.gridPattern === "radial") {
      return {
        backgroundImage: `radial-gradient(ellipse 65% 45% at 15% 0%, ${alphaColor(accent, 0.12)}, transparent 60%), radial-gradient(ellipse 55% 40% at 88% 12%, ${alphaColor(accent, 0.08)}, transparent 62%)`,
      };
    }
    return {};
  })();

  const cardSurfaceStyle: React.CSSProperties = {
    backgroundColor: effects.glassBlur ? alphaColor(surface, 0.85) : surface,
    borderColor: effects.borderStyle === "glow" ? alphaColor(accent, 0.4) : border,
    borderWidth: effects.borderStyle === "none" ? "0px" : effects.borderStyle === "brutalist" ? "2px" : "1px",
    boxShadow:
      effects.borderStyle === "brutalist"
        ? `6px 6px 0 0 ${accent}`
        : effects.borderStyle === "glow"
        ? `0 20px 55px -24px ${alphaColor(accent, 0.27)}`
        : isLightBg
        ? "0 18px 46px -26px rgba(15, 23, 42, 0.14)"
        : "0 22px 54px -28px rgba(0, 0, 0, 0.52)",
  };

  const primaryCtaLabel = design.heroCta?.primaryLabel
    ? t(design.heroCta.primaryLabel.ar, design.heroCta.primaryLabel.en)
    : t("استعرض الأعمال", "Explore Work");
  const primaryCtaUrl = design.heroCta?.primaryUrl ? safePortfolioUrl(design.heroCta.primaryUrl) : "#work";
  const secondaryCtaLabel = design.heroCta?.secondaryLabel
    ? t(design.heroCta.secondaryLabel.ar, design.heroCta.secondaryLabel.en)
    : t("تواصل معي", "Get in Touch");
  const secondaryCtaUrl = design.heroCta?.secondaryUrl ? safePortfolioUrl(design.heroCta.secondaryUrl) : "#contact";

  const skillsList =
    data.skills && data.skills.length > 0
      ? data.skills
      : Array.from(new Set(data.projects.flatMap((p) => p.tags))).slice(0, 10);

  const canvasAttrs = (id: CanvasSectionId) => ({
    "data-canvas-section": id,
    "data-canvas-selected": canvasEditMode && selectedCanvasSection === id ? "true" : undefined,
    className: "portfolio-canvas-section",
    style: canvasSectionStyle(id),
  });

  const canvasBg = data.canvas?.backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(8,10,16,${Math.max(0, Math.min(90, data.canvas?.backgroundOverlay ?? 24)) / 100}), rgba(8,10,16,${Math.max(0, Math.min(90, data.canvas?.backgroundOverlay ?? 24)) / 100})), url("${data.canvas.backgroundImage.replace(/["\\]/g, "")}")`,
        backgroundPosition: data.canvas.backgroundPosition || "center",
        backgroundSize: data.canvas.backgroundSize || "cover",
      }
    : {};

  const showNav = layout.showNav !== false;
  const heroVariant = layout.heroVariant || "split-showcase";
  const projectGrid = layout.projectGrid || "showcase-cards";
  const heroImageSrc = data.cover || data.projects[0]?.images?.[0] || "/images/ultra/haven-hero.webp";
  const avatarSrc = data.avatar || "/images/taqdom-avatar-placeholder.svg";

  const renderSectionContent = (sectionId: CanvasSectionId) => {
    if (sectionId === "metrics" && data.metrics && data.metrics.length > 0) {
      return (
        <section key="metrics" {...canvasAttrs("metrics")}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {data.metrics.map((metric, idx) => (
              <div
                key={idx}
                style={cardSurfaceStyle}
                className={`${radiusClass} ${hoverClass} p-6 ${effects.glassBlur ? "backdrop-blur-xl" : ""}`}
              >
                <p
                  className="text-3xl sm:text-4xl font-black tracking-tight"
                  style={{ color: accent, fontFamily: headingFont }}
                >
                  {metric.value}
                </p>
                <p className="mt-2 text-xs sm:text-sm font-semibold" style={{ color: muted }}>
                  {t(metric.label.ar, metric.label.en)}
                </p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (sectionId === "skills" && skillsList.length > 0) {
      return (
        <section id="skills" key="skills" {...canvasAttrs("skills")}>
          <div
            style={cardSurfaceStyle}
            className={`${radiusClass} p-6 sm:p-8 ${effects.glassBlur ? "backdrop-blur-xl" : ""}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: accent }}>
                  {t("القدرات والتخصصات", "CAPABILITIES & STACK")}
                </span>
                <h2 className="mt-1 text-xl sm:text-2xl font-extrabold" style={{ fontFamily: headingFont }}>
                  {t("مجالات الخبرة والتقنيات", "Core Disciplines & Craft")}
                </h2>
              </div>
              <span className="font-mono text-xs" style={{ color: muted }}>
                {skillsList.length} {t("تخصص", "disciplines")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {skillsList.map((skill) => (
                <span
                  key={skill}
                  style={{
                    backgroundColor: surfaceAlt,
                    borderColor: border,
                    color: text,
                  }}
                  className="taqdom-lux-pill inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs sm:text-sm font-semibold"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (sectionId === "projects" && data.projects.length > 0) {
      return (
        <section id="work" key="projects" {...canvasAttrs("projects")}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: accent }}>
                {t("الأعمال المختارة", "SELECTED ARCHIVE")}
              </span>
              <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold" style={{ fontFamily: headingFont }}>
                {t("مشاريع ودراسات حالة", "Projects & Case Studies")}
              </h2>
            </div>
            <span className="font-mono text-xs" style={{ color: muted }}>
              {String(data.projects.length).padStart(2, "0")} {t("أعمال موثقة", "WORKS")}
            </span>
          </div>

          {projectGrid === "minimal-list" ? (
            <div className="divide-y" style={{ borderColor: border }}>
              {data.projects.map((proj, idx) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => onSelectProject(proj)}
                  style={{ borderColor: border }}
                  className={`group w-full py-6 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-start transition-colors cursor-pointer ${
                    isLightBg ? "hover:bg-black/[0.04]" : "hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-5">
                    <span className="font-mono text-xs pt-1 sm:pt-0" style={{ color: accent }}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3
                        className="text-xl sm:text-2xl font-bold group-hover:translate-x-1 transition-transform"
                        style={{ fontFamily: headingFont }}
                      >
                        {t(proj.title.ar, proj.title.en)}
                      </h3>
                      <p className="mt-1 text-sm line-clamp-1" style={{ color: muted }}>
                        {t(proj.desc.ar, proj.desc.en)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {proj.year && (
                      <span className="font-mono text-xs" style={{ color: muted }}>
                        {proj.year}
                      </span>
                    )}
                    <Arrow className="h-4 w-4 transition-transform group-hover:scale-110" style={{ color: accent }} />
                  </div>
                </button>
              ))}
            </div>
          ) : projectGrid === "editorial-rows" ? (
            <div className="space-y-6">
              {data.projects.map((proj, idx) => (
                <article
                  key={proj.id}
                  style={cardSurfaceStyle}
                  onClick={() => onSelectProject(proj)}
                  className={`${radiusClass} ${hoverClass} overflow-hidden grid grid-cols-1 lg:grid-cols-12 cursor-pointer`}
                >
                  <div className="lg:col-span-5 relative min-h-[240px] sm:min-h-[290px] overflow-hidden">
                    <Image
                      src={proj.images?.[0] || heroImageSrc}
                      alt={t(proj.title.ar, proj.title.en)}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                  <div className="lg:col-span-7 p-6 sm:p-9 flex flex-col justify-between gap-6">
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="font-mono text-xs" style={{ color: accent }}>
                          {String(idx + 1).padStart(2, "0")} · {proj.year || "2026"}
                        </span>
                        {proj.metrics && (
                          <span
                            className="rounded-full px-3 py-1 text-[11px] font-bold"
                            style={{ backgroundColor: alphaColor(accent, 0.12), color: accent }}
                          >
                            {proj.metrics}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: headingFont }}>
                        {t(proj.title.ar, proj.title.en)}
                      </h3>
                      <p className="mt-3 text-sm sm:text-base leading-relaxed" style={{ color: muted }}>
                        {t(proj.desc.ar, proj.desc.en)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: border }}>
                      <div className="flex flex-wrap gap-2">
                        {proj.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full px-2.5 py-1 text-[11px] font-medium border"
                            style={{ borderColor: border, color: muted }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: accent }}>
                        <span>{t("استعرض الدراسة", "View Case Study")}</span>
                        <Arrow className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div
              className={
                projectGrid === "masonry"
                  ? "columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
                  : projectGrid === "bento"
                  ? "grid grid-cols-1 md:grid-cols-6 gap-6"
                  : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              }
            >
              {data.projects.map((proj, idx) => {
                const bentoSpan =
                  projectGrid === "bento"
                    ? idx === 0
                      ? "md:col-span-4"
                      : idx === 1
                      ? "md:col-span-2"
                      : "md:col-span-3"
                    : projectGrid === "masonry"
                    ? "break-inside-avoid mb-6"
                    : "";
                return (
                  <article
                    key={proj.id}
                    style={cardSurfaceStyle}
                    onClick={() => onSelectProject(proj)}
                    className={`group ${radiusClass} ${hoverClass} ${bentoSpan} overflow-hidden flex flex-col justify-between cursor-pointer ${
                      effects.glassBlur ? "backdrop-blur-xl" : ""
                    }`}
                  >
                    <div className="relative h-56 w-full overflow-hidden">
                      <Image
                        src={proj.images?.[0] || heroImageSrc}
                        alt={t(proj.title.ar, proj.title.en)}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div
                        className="absolute inset-0 opacity-60"
                        style={{
                          background: `linear-gradient(to top, ${surface} 4%, transparent 62%)`,
                        }}
                      />
                      {proj.year && (
                        <span
                          className="absolute top-3.5 end-3.5 rounded-full px-3 py-1 font-mono text-[10px] font-bold"
                          style={{ backgroundColor: bg, color: accent, border: `1px solid ${border}` }}
                        >
                          {proj.year}
                        </span>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-extrabold" style={{ fontFamily: headingFont }}>
                          {t(proj.title.ar, proj.title.en)}
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm leading-relaxed line-clamp-3" style={{ color: muted }}>
                          {t(proj.desc.ar, proj.desc.en)}
                        </p>
                      </div>
                      <div className="space-y-3 pt-2">
                        {proj.metrics && (
                          <div
                            className="rounded-xl px-3 py-2 text-xs font-semibold"
                            style={{ backgroundColor: alphaColor(accent, 0.1), color: accent }}
                          >
                            {proj.metrics}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: border }}>
                          <div className="flex flex-wrap gap-1.5">
                            {proj.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                                style={{ backgroundColor: surfaceAlt, color: muted }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          {proj.url && (
                            <a
                              href={safePortfolioUrl(proj.url)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={t("رابط المشروع", "Project link")}
                              className="inline-flex items-center gap-1 text-xs font-bold"
                              style={{ color: accent }}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      );
    }

    if (sectionId === "timeline" && data.timeline && data.timeline.length > 0) {
      return (
        <section id="timeline" key="timeline" {...canvasAttrs("timeline")}>
          <div className="mb-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: accent }}>
              {t("المسار والخبرات", "TRAJECTORY & MILESTONES")}
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: headingFont }}>
              {t("الخبرات والمحطات الرئيسية", "Career Journey")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.timeline.map((item, idx) => (
              <div
                key={idx}
                style={cardSurfaceStyle}
                className={`${radiusClass} ${hoverClass} p-6 ${effects.glassBlur ? "backdrop-blur-xl" : ""}`}
              >
                <span
                  className="inline-block rounded-full px-3 py-1 font-mono text-xs font-bold"
                  style={{ backgroundColor: alphaColor(accent, 0.12), color: accent }}
                >
                  {item.year}
                </span>
                <h3 className="mt-3 text-lg font-bold" style={{ fontFamily: headingFont }}>
                  {t(item.role.ar, item.role.en)}
                </h3>
                <p className="text-xs font-semibold mt-0.5" style={{ color: muted }}>
                  {t(item.org.ar, item.org.en)}
                </p>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: muted }}>
                  {t(item.summary.ar, item.summary.en)}
                </p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (sectionId === "contact") {
      return (
        <section id="contact" key="contact" {...canvasAttrs("contact")}>
          <div
            style={cardSurfaceStyle}
            className={`${radiusClass} p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 ${
              effects.glassBlur ? "backdrop-blur-xl" : ""
            }`}
          >
            <div className="max-w-2xl">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: accent }}>
                {t("تواصل مباشر", "DIRECT CONNECT")}
              </span>
              <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold" style={{ fontFamily: headingFont }}>
                {t("هل لديك مشروع أو فرصة تعاون؟", "Ready to collaborate on something remarkable?")}
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed" style={{ color: muted }}>
                {t(
                  `تواصل مع ${data.name.ar || data.username} عبر الروابط المباشرة أدناه.`,
                  `Reach ${data.name.en || data.username} directly through any channel below.`
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {(data.links || []).map((link, idx) => {
                const safeUrl = safePortfolioUrl(link.url);
                return (
                  <a
                    key={idx}
                    href={safeUrl}
                    {...externalLinkProps(safeUrl)}
                    style={
                      idx === 0
                        ? { backgroundColor: accent, color: accentText }
                        : { backgroundColor: surfaceAlt, borderColor: border, color: text }
                    }
                    className="taqdom-lux-btn inline-flex items-center gap-2 rounded-full border px-5 py-3 text-xs sm:text-sm font-bold"
                  >
                    <span>{link.label}</span>
                    <Arrow className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    return null;
  };

  const defaultOrder: CanvasSectionId[] = ["metrics", "skills", "projects", "timeline", "contact"];
  const configuredOrder = Array.isArray(layout.sectionOrder) && layout.sectionOrder.length > 0
    ? layout.sectionOrder.filter((id) => id !== "hero")
    : defaultOrder;
  const remainingSections = defaultOrder.filter((id) => !configuredOrder.includes(id));
  const orderedSections: CanvasSectionId[] = [...configuredOrder, ...remainingSections];

  return (
    <div
      dir={dir}
      data-testid="custom-sovereign-portfolio"
      data-custom-design="true"
      data-design-name={design.designName || "Bespoke Sovereign"}
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: bodyFont,
        ...patternStyle,
        ...canvasBg,
      }}
      className="portfolio-custom-sovereign relative min-h-screen w-full overflow-x-hidden selection:bg-current/15"
    >
      {/* Fast GPU Ambient Glow Layers */}
      {effects.ambientGlow !== false && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute -top-40 -end-32 h-[28rem] w-[28rem] rounded-full opacity-20"
            style={{
              background: heroGradient || `radial-gradient(circle, ${alphaColor(accent, 0.34)} 0%, transparent 70%)`,
              transform: "translateZ(0)",
            }}
          />
          <div
            className="absolute bottom-0 -start-32 h-[24rem] w-[24rem] rounded-full opacity-15"
            style={{
              background: `radial-gradient(circle, ${alphaColor(accent, 0.27)} 0%, transparent 70%)`,
              transform: "translateZ(0)",
            }}
          />
        </div>
      )}

      {/* Standalone Creator Navigation */}
      {showNav ? (
        <header
          className={`sticky top-0 z-40 w-full transition-colors ${
            layout.navStyle === "floating-glass" ? "pt-4 px-4 sm:px-8" : ""
          }`}
        >
          <div
            style={{
              backgroundColor:
                layout.navStyle === "minimal-top"
                  ? alphaColor(bg, 0.9)
                  : alphaColor(surface, 0.8),
              borderColor: border,
            }}
            className={`${maxWidthClass} mx-auto flex items-center justify-between gap-4 px-5 py-3.5 backdrop-blur-xl ${
              layout.navStyle === "floating-glass"
                ? `${radiusClass} border shadow-lg`
                : "border-b"
            }`}
          >
            <a href="#top" className="flex items-center gap-3 min-w-0">
              <div
                className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 border"
                style={{ borderColor: accent }}
              >
                <Image src={avatarSrc} alt={t(data.name.ar, data.name.en)} fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold" style={{ fontFamily: headingFont }}>
                  {t(data.name.ar, data.name.en)}
                </p>
                {layout.navStyle === "split-editorial" && (
                  <p className="truncate text-[11px]" style={{ color: muted }}>
                    {t(data.title.ar, data.title.en)}
                  </p>
                )}
              </div>
            </a>

            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold" style={{ color: muted }}>
              {data.projects.length > 0 && (
                <a href="#work" className="hover:opacity-100 transition-opacity" style={{ color: text }}>
                  {t("الأعمال", "Work")}
                </a>
              )}
              {skillsList.length > 0 && (
                <a href="#skills" className="hover:opacity-100 transition-opacity">
                  {t("التخصصات", "Capabilities")}
                </a>
              )}
              {data.timeline && data.timeline.length > 0 && (
                <a href="#timeline" className="hover:opacity-100 transition-opacity">
                  {t("المسار", "Journey")}
                </a>
              )}
              <a href="#contact" className="hover:opacity-100 transition-opacity">
                {t("تواصل", "Contact")}
              </a>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="portfolio-lang-switch"
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                style={{ borderColor: border, backgroundColor: surfaceAlt, color: text }}
                className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold cursor-pointer transition-transform hover:scale-[1.03]"
              >
                <Globe2 className="h-3.5 w-3.5" style={{ color: accent }} />
                <span>{lang === "ar" ? "EN" : "عربي"}</span>
              </button>
            </div>
          </div>
        </header>
      ) : (
        <div className="sticky top-4 z-40 h-0 overflow-visible flex justify-end px-4 sm:px-8 pointer-events-none">
          <button
            type="button"
            data-testid="portfolio-lang-switch"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            style={{ borderColor: border, backgroundColor: alphaColor(surface, 0.85), color: text }}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold backdrop-blur-xl shadow-lg cursor-pointer"
          >
            <Globe2 className="h-3.5 w-3.5" style={{ color: accent }} />
            <span>{lang === "ar" ? "EN" : "عربي"}</span>
          </button>
        </div>
      )}

      {/* Main Content Container */}
      <div id="top" className={`relative z-10 ${maxWidthClass} mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-16 sm:space-y-20`}>
        {/* HERO VARIANT ENGINE */}
        <section {...canvasAttrs("hero")}>
          {heroVariant === "centered-monolith" ? (
            <div className="text-center space-y-8 py-4">
              {data.badge && (
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold"
                  style={{ borderColor: alphaColor(accent, 0.34), backgroundColor: alphaColor(accent, 0.1), color: accent }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t(data.badge.ar, data.badge.en)}</span>
                </span>
              )}
              <h1
                className={`${scaleHeroClass} font-black leading-[1.08] tracking-tight max-w-4xl mx-auto`}
                style={{ fontFamily: headingFont }}
              >
                {t(data.name.ar, data.name.en)}
                <span className="block mt-3 text-xl sm:text-3xl font-bold" style={{ color: accent }}>
                  {t(data.title.ar, data.title.en)}
                </span>
              </h1>
              <p className="max-w-2xl mx-auto text-sm sm:text-lg leading-relaxed" style={{ color: muted }}>
                {t(data.bio.ar, data.bio.en)}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a
                  href={primaryCtaUrl}
                  {...externalLinkProps(primaryCtaUrl)}
                  style={{ backgroundColor: accent, color: accentText }}
                  className="taqdom-lux-btn inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-extrabold shadow-xl"
                >
                  <span>{primaryCtaLabel}</span>
                  <Arrow className="h-4 w-4" />
                </a>
                <a
                  href={secondaryCtaUrl}
                  {...externalLinkProps(secondaryCtaUrl)}
                  style={{ borderColor: border, backgroundColor: surface, color: text }}
                  className="taqdom-lux-btn inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-bold"
                >
                  <span>{secondaryCtaLabel}</span>
                </a>
              </div>
              <div
                style={cardSurfaceStyle}
                className={`relative h-[320px] sm:h-[460px] w-full overflow-hidden ${radiusClass}`}
              >
                <Image src={heroImageSrc} alt={t(data.name.ar, data.name.en)} fill priority className="object-cover" />
              </div>
            </div>
          ) : heroVariant === "full-bleed-poster" ? (
            <div
              style={cardSurfaceStyle}
              className={`relative min-h-[520px] sm:min-h-[600px] overflow-hidden flex items-end p-6 sm:p-12 ${radiusClass}`}
            >
              <Image src={heroImageSrc} alt={t(data.name.ar, data.name.en)} fill priority className="object-cover" />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${alphaColor(bg, 0.96)} 15%, ${alphaColor(bg, 0.78)} 60%, ${alphaColor(bg, 0.35)} 100%)`,
                }}
              />
              <div className="relative z-10 max-w-3xl space-y-5">
                {data.city && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold border backdrop-blur-md"
                    style={{ borderColor: alphaColor(accent, 0.4), backgroundColor: alphaColor(bg, 0.72), color: accent }}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{t(data.city.ar, data.city.en)}</span>
                  </span>
                )}
                <h1 className={`${scaleHeroClass} font-black leading-[1.08]`} style={{ fontFamily: headingFont }}>
                  {t(data.name.ar, data.name.en)}
                </h1>
                <p className="text-lg sm:text-2xl font-bold" style={{ color: accent }}>
                  {t(data.title.ar, data.title.en)}
                </p>
                <p className="text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: muted }}>
                  {t(data.bio.ar, data.bio.en)}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href={primaryCtaUrl}
                    {...externalLinkProps(primaryCtaUrl)}
                    style={{ backgroundColor: accent, color: accentText }}
                    className="taqdom-lux-btn inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold"
                  >
                    <span>{primaryCtaLabel}</span>
                    <Arrow className="h-4 w-4" />
                  </a>
                  <a
                    href={secondaryCtaUrl}
                    {...externalLinkProps(secondaryCtaUrl)}
                    style={{ borderColor: border, backgroundColor: alphaColor(surface, 0.85), color: text }}
                    className="taqdom-lux-btn inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-bold backdrop-blur-md"
                  >
                    <span>{secondaryCtaLabel}</span>
                  </a>
                </div>
              </div>
            </div>
          ) : heroVariant === "asymmetric-editorial" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  {data.badge && (
                    <span
                      className="rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider"
                      style={{ backgroundColor: alphaColor(accent, 0.14), color: accent }}
                    >
                      {t(data.badge.ar, data.badge.en)}
                    </span>
                  )}
                  <span className="font-mono text-xs" style={{ color: muted }}>
                    {t(data.city.ar, data.city.en)}
                  </span>
                </div>
                <h1 className={`${scaleHeroClass} font-black leading-[1.06]`} style={{ fontFamily: headingFont }}>
                  {t(data.title.ar, data.title.en)}
                </h1>
                <p className="text-base sm:text-xl leading-relaxed max-w-2xl" style={{ color: muted }}>
                  {t(data.bio.ar, data.bio.en)}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href={primaryCtaUrl}
                    {...externalLinkProps(primaryCtaUrl)}
                    style={{ backgroundColor: accent, color: accentText }}
                    className="taqdom-lux-btn inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold"
                  >
                    <span>{primaryCtaLabel}</span>
                    <Arrow className="h-4 w-4" />
                  </a>
                  <a
                    href={secondaryCtaUrl}
                    {...externalLinkProps(secondaryCtaUrl)}
                    style={{ borderColor: border, backgroundColor: surface, color: text }}
                    className="taqdom-lux-btn inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-bold"
                  >
                    <span>{secondaryCtaLabel}</span>
                  </a>
                </div>
              </div>
              <div
                style={cardSurfaceStyle}
                className={`lg:col-span-4 ${radiusClass} p-5 space-y-4 ${effects.glassBlur ? "backdrop-blur-xl" : ""}`}
              >
                <div className={`relative h-64 w-full overflow-hidden ${layout.cardRadius === "none" ? "" : "rounded-2xl"}`}>
                  <Image src={avatarSrc} alt={t(data.name.ar, data.name.en)} fill className="object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold" style={{ fontFamily: headingFont }}>
                    {t(data.name.ar, data.name.en)}
                  </h2>
                  <p className="text-xs mt-1" style={{ color: accent }}>
                    {t(data.city.ar, data.city.en)}
                  </p>
                </div>
              </div>
            </div>
          ) : heroVariant === "terminal-bento" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div
                style={cardSurfaceStyle}
                className={`lg:col-span-8 ${radiusClass} p-7 sm:p-10 flex flex-col justify-between gap-6 ${
                  effects.glassBlur ? "backdrop-blur-xl" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] font-bold"
                    style={{ backgroundColor: alphaColor(accent, 0.12), color: accent }}
                  >
                    <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
                    {design.designName || t("ملف شخصي مخصص", "CUSTOM EDITION")}
                  </span>
                  <span className="font-mono text-xs" style={{ color: muted }}>
                    {t(data.city.ar, data.city.en)}
                  </span>
                </div>
                <div>
                  <h1 className={`${scaleHeroClass} font-black leading-[1.1]`} style={{ fontFamily: headingFont }}>
                    {t(data.name.ar, data.name.en)}
                  </h1>
                  <p className="mt-2 text-lg sm:text-2xl font-bold" style={{ color: accent }}>
                    {t(data.title.ar, data.title.en)}
                  </p>
                  <p className="mt-4 text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: muted }}>
                    {t(data.bio.ar, data.bio.en)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={primaryCtaUrl}
                    {...externalLinkProps(primaryCtaUrl)}
                    style={{ backgroundColor: accent, color: accentText }}
                    className="taqdom-lux-btn inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs sm:text-sm font-extrabold"
                  >
                    <span>{primaryCtaLabel}</span>
                    <Arrow className="h-4 w-4" />
                  </a>
                  <a
                    href={secondaryCtaUrl}
                    {...externalLinkProps(secondaryCtaUrl)}
                    style={{ borderColor: border, backgroundColor: surfaceAlt, color: text }}
                    className="taqdom-lux-btn inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-xs sm:text-sm font-bold"
                  >
                    <span>{secondaryCtaLabel}</span>
                  </a>
                </div>
              </div>
              <div className="lg:col-span-4 grid grid-rows-2 gap-5">
                <div style={cardSurfaceStyle} className={`${radiusClass} relative min-h-[210px] overflow-hidden`}>
                  <Image src={heroImageSrc} alt={t(data.name.ar, data.name.en)} fill priority className="object-cover" />
                </div>
                <div
                  style={cardSurfaceStyle}
                  className={`${radiusClass} p-6 flex flex-col justify-between`}
                >
                  <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: accent }}>
                    {t("نبذة سريعة", "SNAPSHOT")}
                  </span>
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div>
                      <p className="text-2xl font-black" style={{ fontFamily: headingFont }}>
                        {data.projects.length}
                      </p>
                      <p className="text-[11px]" style={{ color: muted }}>
                        {t("مشروع", "Projects")}
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-black" style={{ fontFamily: headingFont, color: accent }}>
                        {skillsList.length}
                      </p>
                      <p className="text-[11px]" style={{ color: muted }}>
                        {t("تخصص", "Skills")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* split-showcase default */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  {data.badge && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold"
                      style={{ borderColor: alphaColor(accent, 0.34), backgroundColor: alphaColor(accent, 0.1), color: accent }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{t(data.badge.ar, data.badge.en)}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: muted }}>
                    <MapPin className="h-3.5 w-3.5" style={{ color: accent }} />
                    <span>{t(data.city.ar, data.city.en)}</span>
                  </span>
                </div>
                <h1 className={`${scaleHeroClass} font-black leading-[1.1]`} style={{ fontFamily: headingFont }}>
                  {t(data.name.ar, data.name.en)}
                </h1>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: accent }}>
                  {t(data.title.ar, data.title.en)}
                </p>
                <p className="text-sm sm:text-lg leading-relaxed max-w-2xl" style={{ color: muted }}>
                  {t(data.bio.ar, data.bio.en)}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href={primaryCtaUrl}
                    {...externalLinkProps(primaryCtaUrl)}
                    style={{ backgroundColor: accent, color: accentText }}
                    className="taqdom-lux-btn inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-extrabold shadow-xl"
                  >
                    <span>{primaryCtaLabel}</span>
                    <Arrow className="h-4 w-4" />
                  </a>
                  <a
                    href={secondaryCtaUrl}
                    {...externalLinkProps(secondaryCtaUrl)}
                    style={{ borderColor: border, backgroundColor: surface, color: text }}
                    className="taqdom-lux-btn inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-bold"
                  >
                    <span>{secondaryCtaLabel}</span>
                  </a>
                </div>
              </div>
              <div className="lg:col-span-5">
                <div
                  style={cardSurfaceStyle}
                  className={`relative h-[360px] sm:h-[440px] w-full overflow-hidden ${radiusClass}`}
                >
                  <Image src={heroImageSrc} alt={t(data.name.ar, data.name.en)} fill priority className="object-cover" />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to top, ${alphaColor(bg, 0.92)} 0%, ${alphaColor(bg, 0.45)} 50%, transparent 100%)`,
                    }}
                  />
                  <div className="absolute bottom-5 inset-x-5 flex items-center gap-3.5">
                    <div
                      className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 shrink-0"
                      style={{ borderColor: accent }}
                    >
                      <Image src={avatarSrc} alt={t(data.name.ar, data.name.en)} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-sm">{t(data.name.ar, data.name.en)}</p>
                      {design.designName && (
                        <p className="truncate font-mono text-[11px]" style={{ color: accent }}>
                          {design.designName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ORDERED BUILT-IN SECTIONS */}
        {orderedSections.map((id) => renderSectionContent(id))}

        {/* BESPOKE CUSTOM SECTIONS DESIGNED VIA MCP */}
        {Array.isArray(design.customSections) &&
          design.customSections.map((sec, sIdx) => (
            <section key={sec.id || `custom-${sIdx}`} id={`sec-${sec.id || sIdx}`} className="space-y-6">
              {sec.kind === "quote" ? (
                <blockquote
                  style={{ ...cardSurfaceStyle, borderInlineStartWidth: "4px", borderInlineStartColor: accent }}
                  className={`${radiusClass} p-8 sm:p-12 space-y-4 ${effects.glassBlur ? "backdrop-blur-xl" : ""}`}
                >
                  <span className="font-mono text-3xl leading-none" style={{ color: accent }}>
                    “
                  </span>
                  <p className="text-xl sm:text-3xl font-bold leading-relaxed" style={{ fontFamily: headingFont }}>
                    {t(sec.content?.ar || sec.title.ar, sec.content?.en || sec.title.en)}
                  </p>
                  {sec.subtitle && (
                    <footer className="text-xs sm:text-sm font-semibold" style={{ color: muted }}>
                      — {t(sec.subtitle.ar, sec.subtitle.en)}
                    </footer>
                  )}
                </blockquote>
              ) : sec.kind === "cta" ? (
                <div
                  style={{
                    background: heroGradient || `linear-gradient(135deg, ${surface} 0%, ${surfaceAlt} 100%)`,
                    borderColor: alphaColor(accent, 0.34),
                    borderWidth: "1px",
                  }}
                  className={`${radiusClass} p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6`}
                >
                  <div className="max-w-2xl space-y-2">
                    <h2 className="text-2xl sm:text-4xl font-black" style={{ fontFamily: headingFont }}>
                      {t(sec.title.ar, sec.title.en)}
                    </h2>
                    {sec.subtitle && (
                      <p className="text-sm sm:text-base" style={{ color: muted }}>
                        {t(sec.subtitle.ar, sec.subtitle.en)}
                      </p>
                    )}
                  </div>
                  {sec.items?.[0] && (() => {
                    const ctaUrl = safePortfolioUrl(sec.items[0].url);
                    return (
                      <a
                        href={ctaUrl}
                        {...externalLinkProps(ctaUrl)}
                        style={{ backgroundColor: accent, color: accentText }}
                        className="taqdom-lux-btn inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-extrabold shrink-0"
                      >
                        <span>{t(sec.items[0].title.ar, sec.items[0].title.en)}</span>
                        <Arrow className="h-4 w-4" />
                      </a>
                    );
                  })()}
                </div>
              ) : sec.kind === "faq" ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: headingFont }}>
                      {t(sec.title.ar, sec.title.en)}
                    </h2>
                    {sec.subtitle && (
                      <p className="mt-1 text-sm" style={{ color: muted }}>
                        {t(sec.subtitle.ar, sec.subtitle.en)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    {(sec.items || []).map((item, idx) => {
                      const k = `${sec.id}-${idx}`;
                      const isOpen = openFaqKey === k;
                      return (
                        <div
                          key={k}
                          style={cardSurfaceStyle}
                          className={`${radiusClass} overflow-hidden`}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqKey(isOpen ? null : k)}
                            className="w-full px-6 py-4 flex items-center justify-between gap-4 text-start font-bold text-sm sm:text-base cursor-pointer"
                          >
                            <span>{t(item.title.ar, item.title.en)}</span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                              style={{ color: accent }}
                            />
                          </button>
                          {isOpen && item.description && (
                            <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: muted }}>
                              {t(item.description.ar, item.description.en)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : sec.kind === "stats" ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: headingFont }}>
                      {t(sec.title.ar, sec.title.en)}
                    </h2>
                    {sec.subtitle && (
                      <p className="mt-1 text-sm" style={{ color: muted }}>
                        {t(sec.subtitle.ar, sec.subtitle.en)}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(sec.items || []).map((item, idx) => (
                      <div key={idx} style={cardSurfaceStyle} className={`${radiusClass} ${hoverClass} p-6`}>
                        <p className="text-3xl font-black" style={{ color: accent, fontFamily: headingFont }}>
                          {item.value || item.badge || "100%"}
                        </p>
                        <p className="mt-2 font-bold text-sm">{t(item.title.ar, item.title.en)}</p>
                        {item.description && (
                          <p className="mt-1 text-xs" style={{ color: muted }}>
                            {t(item.description.ar, item.description.en)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : sec.kind === "cards" ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: headingFont }}>
                      {t(sec.title.ar, sec.title.en)}
                    </h2>
                    {sec.subtitle && (
                      <p className="mt-1 text-sm" style={{ color: muted }}>
                        {t(sec.subtitle.ar, sec.subtitle.en)}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {(sec.items || []).map((item, idx) => (
                      <div
                        key={idx}
                        style={cardSurfaceStyle}
                        className={`${radiusClass} ${hoverClass} p-6 flex flex-col justify-between gap-4`}
                      >
                        <div>
                          {item.badge && (
                            <span
                              className="inline-block rounded-full px-3 py-0.5 text-[10px] font-mono font-bold mb-3"
                              style={{ backgroundColor: alphaColor(accent, 0.12), color: accent }}
                            >
                              {item.badge}
                            </span>
                          )}
                          <h3 className="text-lg font-extrabold" style={{ fontFamily: headingFont }}>
                            {t(item.title.ar, item.title.en)}
                          </h3>
                          {item.description && (
                            <p className="mt-2 text-sm leading-relaxed" style={{ color: muted }}>
                              {t(item.description.ar, item.description.en)}
                            </p>
                          )}
                        </div>
                        {item.url && (() => {
                          const itemUrl = safePortfolioUrl(item.url);
                          return (
                            <a
                              href={itemUrl}
                              {...externalLinkProps(itemUrl)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold"
                              style={{ color: accent }}
                            >
                              <span>{t("استكشف المزيد", "Learn more")}</span>
                              <Arrow className="h-3.5 w-3.5" />
                            </a>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* richtext */
                <div style={cardSurfaceStyle} className={`${radiusClass} p-7 sm:p-10 space-y-3`}>
                  <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: headingFont }}>
                    {t(sec.title.ar, sec.title.en)}
                  </h2>
                  {sec.subtitle && (
                    <p className="text-sm font-semibold" style={{ color: accent }}>
                      {t(sec.subtitle.ar, sec.subtitle.en)}
                    </p>
                  )}
                  {sec.content && (
                    <p className="text-sm sm:text-base leading-8 max-w-4xl" style={{ color: muted }}>
                      {t(sec.content.ar, sec.content.en)}
                    </p>
                  )}
                </div>
              )}
            </section>
          ))}
      </div>

      {/* Standalone Creator Footer (Zero Platform Chrome) */}
      <footer className="relative z-10 border-t py-8 px-6 text-xs" style={{ borderColor: border }}>
        <div className={`${maxWidthClass} mx-auto flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <span className="font-extrabold" style={{ fontFamily: headingFont }}>
              © {new Date().getFullYear()} {t(data.name.ar, data.name.en)}
            </span>
            {data.city && (
              <span style={{ color: muted }}>· {t(data.city.ar, data.city.en)}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {(data.links || []).slice(0, 4).map((lk, i) => {
              const linkUrl = safePortfolioUrl(lk.url);
              return (
                <a
                  key={i}
                  href={linkUrl}
                  {...externalLinkProps(linkUrl)}
                  className="font-semibold hover:underline"
                  style={{ color: accent }}
                >
                  {lk.label}
                </a>
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}
