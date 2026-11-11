"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Globe2,
  ExternalLink,
  Sparkles,
  Award,
  MapPin,
  ArrowUpRight,
  ArrowUpLeft,
  Film,
  Compass,
  Briefcase,
  BookOpen,
  Eye,
  X,
  Command,
  Search,
  Terminal,
  Cpu,
  CheckCircle2,
  Printer,
  QrCode,
  Copy,
  Check,
  PhoneCall,
  Play,
  Pause,
  Volume2,
  TrendingUp,
  Workflow,
  SlidersHorizontal,
  Users,
  HeartHandshake,
  CalendarCheck,
  Send,
  GraduationCap,
  Layers,
  Code2,
  BarChart3,
  MessageCircle,
} from "lucide-react";
import { CanvasSectionId, PortfolioData, PortfolioProject, getSubdomainUrl } from "@/lib/types";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";

interface PortfolioRendererProps {
  data: PortfolioData;
  previewLang?: "ar" | "en";
  isStudioPreview?: boolean;
  isLiveSubdomain?: boolean;
  canvasEditMode?: boolean;
  selectedCanvasSection?: CanvasSectionId;
}

export function PortfolioRenderer({
  data,
  previewLang,
  isStudioPreview = false,
  isLiveSubdomain = false,
  canvasEditMode = false,
  selectedCanvasSection,
}: PortfolioRendererProps) {
  const [lang, setLang] = useState<"ar" | "en">(previewLang || data.defaultLang || "ar");
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [host, setHost] = useState("taqdom.me");

  // Madar Cmd+K state
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>("ALL");

  // Athar Cinema state & Horizontal Showcase Rail ref
  const [cinemaAspect, setCinemaAspect] = useState<"2.39:1" | "16:9">("2.39:1");
  const [cinemaLut, setCinemaLut] = useState<"warm" | "noir">("warm");
  const atharRailRef = useRef<HTMLDivElement | null>(null);

  // Siyada QR & CV Modal state
  const [qrOpen, setQrOpen] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Wameed Tele-Sales Audio Pitch state
  const [isPlayingPitch, setIsPlayingPitch] = useState(false);
  const [pitchSeconds, setPitchSeconds] = useState(0);
  const [activePitchStage, setActivePitchStage] = useState<0 | 1 | 2>(0);

  // Salam MarTech Pipeline & CRO Before/After state
  const [activePipelineNode, setActivePipelineNode] = useState<number>(2);
  const [croMode, setCroMode] = useState<"before" | "after" | "split">("split");

  // Meshwar HR Consultation Form state
  const [hrBookingMode, setHrBookingMode] = useState<"advisory" | "hiring">("advisory");
  const [hrVisitorName, setHrVisitorName] = useState("");
  const [hrVisitorRole, setHrVisitorRole] = useState("");
  const [hrSubmitted, setHrSubmitted] = useState(false);

  useEffect(() => {
    if (previewLang) {
      setLang(previewLang);
    }
  }, [previewLang]);

  useEffect(() => {
    setSelectedSkillFilter("ALL");
  }, [data.username, data.template]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  // Keyboard shortcut Cmd+K / Ctrl+K for Madar template
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Wameed 30s Pitch timer & WebAudio API voice/telemetry synthesis
  useEffect(() => {
    if (!isPlayingPitch) return;

    const triggerPitchAudioPulse = (sec: number) => {
      try {
        if (typeof window === "undefined") return;
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const freqs = [220, 261.63, 293.66, 329.63, 246.94, 277.18];
        osc.type = "sine";
        osc.frequency.setValueAtTime(freqs[sec % freqs.length], ctx.currentTime);
        gain.gain.setValueAtTime(0.018, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.19);
        setTimeout(() => {
          ctx.close().catch(() => {});
        }, 250);
      } catch {
        // Ignore audio restrictions in headless browsers
      }
    };

    triggerPitchAudioPulse(pitchSeconds);

    const interval = setInterval(() => {
      setPitchSeconds((prev) => {
        if (prev >= 30) {
          setIsPlayingPitch(false);
          return 0;
        }
        const next = prev + 1;
        triggerPitchAudioPulse(next);
        if (next < 10) setActivePitchStage(0);
        else if (next < 21) setActivePitchStage(1);
        else setActivePitchStage(2);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlayingPitch]);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const dir = lang === "ar" ? "rtl" : "ltr";

  // Normalize legacy 'noor' template to 'haven'
  const activeTemplate =
    (data.template as string) === "noor" ? "haven" : data.template || "madar";

  const defaultDarkTemplates = ["madar", "athar", "wameed"];
  const themeMode: "light" | "dark" =
    data.theme?.mode === "dark" || data.theme?.mode === "light"
      ? data.theme.mode
      : defaultDarkTemplates.includes(activeTemplate)
      ? "dark"
      : "light";
  const legacyAccentMap: Record<string, string> = {
    "#C7F36B": "#D8FF52",
    "#8B7CFF": "#315BFF",
    "#E9C991": "#315BFF",
    "#7AB7FF": "#315BFF",
    "#FF8BB6": "#F36D5D",
    "#53D8E8": "#315BFF",
    "#B7A8FF": "#315BFF",
    "#C89D66": "#315BFF",
    "#9A7B4F": "#315BFF",
    "#1E3A2F": "#087D66",
  };
  const savedAccent = data.theme?.accent || "";
  const accent =
    legacyAccentMap[savedAccent.toUpperCase()] ||
    savedAccent ||
    (themeMode === "dark" ? "#91A7FF" : "#315BFF");
  const canvas = data.canvas || {};
  const canvasBackground = canvas.backgroundColor || (themeMode === "dark" ? "#11192D" : "#F7F8F3");
  const canvasOverlay = Math.max(0, Math.min(90, canvas.backgroundOverlay ?? 18)) / 100;
  const safeBackgroundImage = (canvas.backgroundImage || "").replace(/["\\]/g, "");
  const canvasBackgroundImage = safeBackgroundImage
    ? `linear-gradient(rgba(${themeMode === "dark" ? "16,17,27" : "244,242,250"}, ${canvasOverlay}), rgba(${themeMode === "dark" ? "16,17,27" : "244,242,250"}, ${canvasOverlay})), url("${safeBackgroundImage}")`
    : themeMode === "dark"
      ? "radial-gradient(ellipse at 12% 0%, rgba(167,139,250,.18), transparent 55%), radial-gradient(ellipse at 92% 22%, rgba(255,131,150,.08), transparent 58%)"
      : "radial-gradient(ellipse at 12% 0%, rgba(96,71,183,.08), transparent 55%), radial-gradient(ellipse at 92% 22%, rgba(184,55,85,.05), transparent 58%)";
  const canvasSectionStyle = (id: CanvasSectionId): React.CSSProperties => {
    const layout = canvas.sections?.[id];
    return {
      "--canvas-x": `${layout?.x ?? 0}px`,
      "--canvas-y": `${layout?.y ?? 0}px`,
      "--canvas-width": `${layout?.width ?? 100}%`,
      "--canvas-scale": String(layout?.scale ?? 1),
      display: layout?.hidden ? "none" : undefined,
    } as React.CSSProperties;
  };

  const subdomainDisplay = `${data.username}.taqdom.me`;
  const subdomainHref = getSubdomainUrl(data.username, host);

  const skillsList =
    data.skills && data.skills.length > 0
      ? data.skills
      : Array.from(new Set(data.projects.flatMap((p) => p.tags))).slice(0, 8);

  const filteredMadarProjects =
    selectedSkillFilter === "ALL"
      ? data.projects
      : data.projects.filter((proj) => {
          const needle = selectedSkillFilter.toLowerCase();
          const tokens = needle
            .split(/[^a-z0-9.+]+/i)
            .map((s) => s.trim())
            .filter((s) => s.length >= 2);
          return (
            proj.tags.some((tag) => {
              const tLow = tag.toLowerCase();
              return (
                tLow === needle ||
                tLow.includes(needle) ||
                needle.includes(tLow) ||
                tokens.some((tok) => tLow.includes(tok))
              );
            }) ||
            tokens.some(
              (tok) =>
                proj.title.en.toLowerCase().includes(tok) ||
                proj.desc.en.toLowerCase().includes(tok)
            )
          );
        });

  const handleCopySubdomain = () => {
    navigator.clipboard?.writeText(`https://${subdomainDisplay}`);
    setCopiedUrl(true);
    toast.success(t("تم نسخ رابط النطاق الفرعي!", "Subdomain URL copied!"));
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div
      dir={dir}
      data-testid={`portfolio-template-${activeTemplate}`}
      data-theme-mode={themeMode}
      data-theme-accent={accent}
      data-canvas-editable={canvasEditMode ? "true" : "false"}
      style={
        {
          "--portfolio-accent": accent,
          borderTop: `3px solid ${accent}`,
          backgroundColor: canvasBackground,
          backgroundImage: canvasBackgroundImage,
          backgroundPosition: canvas.backgroundPosition || "center",
          backgroundSize: canvas.backgroundSize || "cover",
          backgroundRepeat: "no-repeat",
        } as React.CSSProperties
      }
      className={`min-h-screen w-full transition-colors duration-500 relative overflow-x-hidden ${
        themeMode === "dark"
          ? "portfolio-mode-dark bg-[#0A0A09] text-[#F4F1EA]"
          : "portfolio-mode-light bg-[#F7F5F0] text-[#141413]"
      }`}
    >
      {/* Dynamic Theme Mode & Custom Accent Override Styles */}
      <style>{`
        [data-testid="portfolio-template-${activeTemplate}"] .portfolio-accent-bg {
          background-color: ${accent} !important;
        }
        [data-testid="portfolio-template-${activeTemplate}"] .portfolio-accent-text {
          color: ${accent} !important;
        }
        [data-testid="portfolio-template-${activeTemplate}"] .portfolio-accent-border {
          border-color: ${accent} !important;
        }
      `}</style>

      {/* Top Sovereign Identity Bar */}
      <div
        className={`sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-3 backdrop-blur-xl border-b transition-colors ${
          themeMode === "dark"
            ? "bg-[#0A0A09]/92 text-[#F4F1EA] border-[#F4F1EA]/10"
            : "bg-[#F7F5F0]/92 text-[#141413] border-[#141413]/12"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link href="https://taqdom.me" className="inline-flex items-center gap-2">
            <TaqdomLogo size={28} showWordmark={false} />
            <span
              className="arabic-diacritics text-xs font-bold portfolio-accent-text"
              style={{ color: accent }}
            >
              تَقَدُّم
            </span>
          </Link>
          <span className="text-xs opacity-30">|</span>
          <a
            href={subdomainHref}
            dir="ltr"
            data-testid="renderer-subdomain-badge"
            style={{ borderColor: `${accent}66`, color: accent, backgroundColor: `${accent}1A` }}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-mono text-xs transition"
          >
            <Globe2 className="h-3 w-3" />
            <span>https://{subdomainDisplay}</span>
          </a>
          <span className="hidden md:inline-flex items-center rounded-md bg-current/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest opacity-75">
            {activeTemplate} • {themeMode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeTemplate === "madar" && (
            <button
              type="button"
              data-testid="madar-cmdk-trigger"
              onClick={() => setCmdOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 bg-current/5 px-2.5 py-1 font-mono text-xs hover:opacity-90"
            >
              <Command className="h-3 w-3" style={{ color: accent }} />
              <span>Cmd+K</span>
            </button>
          )}
          <button
            type="button"
            data-testid="portfolio-lang-switch"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            style={{ borderColor: `${accent}66` }}
            className="rounded-lg border px-3 py-1 text-xs font-bold cursor-pointer"
          >
            {lang === "ar" ? "English" : "العربية"}
          </button>
          {!isStudioPreview && (
            <Link
              href={`/studio?u=${data.username}&template=${activeTemplate}`}
              style={{ backgroundColor: accent }}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold text-[#0A0A09] hover:opacity-90"
            >
              <Sparkles className="h-3 w-3" />
              <span>{t("تخصيص في الاستوديو", "Customize in Studio")}</span>
            </Link>
          )}
        </div>
      </div>

      {/* =====================================================================
          TEMPLATE 1: MADAR (مَدَار) — Bento Tech & AI Grad Identity
         ===================================================================== */}
      {activeTemplate === "madar" && (
        <div data-canvas-template-root className="bg-[#0A0A09] text-[#F4F1EA] min-h-screen py-10 px-4 sm:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Top Status & Command Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#F4F1EA]/10 bg-[#121210] px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="font-mono text-xs font-semibold text-emerald-400">
                  {data.badge
                    ? t(data.badge.ar, data.badge.en)
                    : t(
                        "متاح للتدريب والفرص الوظيفية • Available for Internships & Roles",
                        "Available for Internships & Roles • Open to Offers"
                      )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCmdOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#F4F1EA]/12 bg-[#181815] px-3.5 py-1.5 text-xs text-[#A09C94] hover:border-[#C89D66] hover:text-[#F4F1EA] transition cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5 text-[#C89D66]" />
                  <span>{t("لوحة الأوامر السريعة...", "Quick Command Palette...")}</span>
                  <kbd className="rounded bg-[#0A0A09] px-1.5 py-0.5 font-mono text-[10px] text-[#C89D66] border border-[#F4F1EA]/10">
                    ⌘K
                  </kbd>
                </button>
              </div>
            </div>

            {/* Interactive Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Bento Cell 1: Engineer Identity & Terminal Bio (8 cols) */}
              <div data-canvas-section="hero" className="portfolio-canvas-section md:col-span-8 rounded-3xl border border-[#F4F1EA]/10 bg-[#121210] p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden group hover:border-[#C89D66]/50 transition" style={canvasSectionStyle("hero")} data-canvas-selected={selectedCanvasSection === "hero" ? "true" : "false"}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-[#C89D66]/60 shrink-0">
                      <Image
                        src={data.avatar}
                        alt={t(data.name.ar, data.name.en)}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#C89D66] mb-1">
                        <Terminal className="h-3.5 w-3.5" />
                        <span>~/builders/{data.username}</span>
                      </div>
                      <h1 className="arabic-diacritics text-3xl sm:text-4xl font-extrabold tracking-tight">
                        {t(data.name.ar, data.name.en)}
                      </h1>
                      <p className="text-sm text-[#A09C94] mt-0.5">
                        {t(data.title.ar, data.title.en)}
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#181815] border border-[#F4F1EA]/10 px-3 py-1.5 text-xs text-[#A09C94]">
                    <MapPin className="h-3.5 w-3.5 text-[#C89D66]" />
                    <span>{t(data.city.ar, data.city.en)}</span>
                  </div>
                </div>

                <p className="text-base sm:text-lg text-[#F4F1EA]/90 leading-relaxed max-w-3xl">
                  {t(data.bio.ar, data.bio.en)}
                </p>

                <div className="mt-7 pt-5 border-t border-[#F4F1EA]/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {data.links.map((lk, idx) => (
                      <a
                        key={idx}
                        href={lk.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#F4F1EA]/12 bg-[#181815] px-3.5 py-2 font-mono text-xs font-medium text-[#F4F1EA] hover:border-[#C89D66] hover:text-[#C89D66] transition"
                      >
                        <span>{lk.label}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                  <span className="font-mono text-xs text-emerald-400">
                    STATUS: COMPILING IMPACT • 0 ERRORS
                  </span>
                </div>
              </div>

              {/* Bento Cell 2: Hackathon & Engineering Telemetry (4 cols) */}
              <div data-canvas-section="metrics" className="portfolio-canvas-section md:col-span-4 rounded-3xl border border-[#F4F1EA]/10 bg-[#121210] p-7 flex flex-col justify-between" style={canvasSectionStyle("metrics")} data-canvas-selected={selectedCanvasSection === "metrics" ? "true" : "false"}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs uppercase tracking-widest text-[#C89D66]">
                    {t("إحصائيات البرمجة والهاكاثونات", "BUILD & HACKATHON TELEMETRY")}
                  </span>
                  <Cpu className="h-4 w-4 text-[#C89D66]" />
                </div>
                <div className="grid grid-cols-2 gap-3.5 my-auto">
                  {(data.metrics || []).map((m, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-[#F4F1EA]/8 bg-[#181815] p-4"
                    >
                      <p className="font-mono text-2xl sm:text-3xl font-extrabold text-[#F4F1EA]">
                        {m.value}
                      </p>
                      <p className="mt-1 text-[11px] text-[#A09C94]">
                        {t(m.label.ar, m.label.en)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-[#F4F1EA]/10 flex items-center justify-between font-mono text-[11px] text-[#A09C94]">
                  <span>GITHUB COMMITS PULSE</span>
                  <span className="text-emerald-400">99.4% VERIFIED</span>
                </div>
              </div>

              {/* Bento Cell 3: Interactive Tech Stack & Skill Filter (12 cols) */}
              <div data-canvas-section="skills" className="portfolio-canvas-section md:col-span-12 rounded-3xl border border-[#F4F1EA]/10 bg-[#121210] p-6 sm:p-7" style={canvasSectionStyle("skills")} data-canvas-selected={selectedCanvasSection === "skills" ? "true" : "false"}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-[#C89D66]" />
                    <h2 className="arabic-diacritics text-lg font-bold">
                      {t("مصفوفة المهارات والتقنيات التفاعلية", "Interactive Tech Stack & Skill Matrix")}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-[#A09C94]">
                    {t("اضغط لتصفية المشاريع حسب التقنية", "Click a tag to highlight matching builds")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSkillFilter("ALL")}
                    className={`rounded-xl px-3.5 py-2 font-mono text-xs font-bold transition cursor-pointer ${
                      selectedSkillFilter === "ALL"
                        ? "bg-[#C89D66] text-[#0A0A09]"
                        : "border border-[#F4F1EA]/10 bg-[#181815] text-[#A09C94] hover:text-[#F4F1EA]"
                    }`}
                  >
                    ALL STACK ({data.projects.length})
                  </button>
                  {skillsList.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() =>
                        setSelectedSkillFilter(selectedSkillFilter === skill ? "ALL" : skill)
                      }
                      className={`rounded-xl px-3.5 py-2 font-mono text-xs font-medium transition cursor-pointer ${
                        selectedSkillFilter === skill
                          ? "bg-[#C89D66] text-[#0A0A09] font-bold"
                          : "border border-[#F4F1EA]/10 bg-[#181815] text-[#F4F1EA] hover:border-[#C89D66]/60"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bento Projects Grid */}
            <div data-canvas-section="projects" className="portfolio-canvas-section pt-4" style={canvasSectionStyle("projects")} data-canvas-selected={selectedCanvasSection === "projects" ? "true" : "false"}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <h2 className="arabic-diacritics text-2xl sm:text-3xl font-bold">
                  {t("المشاريع البرمجية وأنظمة الذكاء الاصطناعي", "Engineered Systems & AI Repositories")}
                </h2>
                <div className="flex items-center gap-2">
                  {selectedSkillFilter !== "ALL" && (
                    <button
                      type="button"
                      onClick={() => setSelectedSkillFilter("ALL")}
                      className="rounded-lg border border-[#C89D66]/40 bg-[#C89D66]/15 px-2.5 py-1 font-mono text-[11px] text-[#C89D66] cursor-pointer"
                    >
                      FILTER: {selectedSkillFilter} ✕
                    </button>
                  )}
                  <span data-testid="madar-deployments-count" className="font-mono text-xs text-[#C89D66]">
                    {filteredMadarProjects.length} DEPLOYMENTS
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {filteredMadarProjects.map((proj, idx) => (
                  <article
                    key={proj.id}
                    data-testid={`madar-project-${proj.id}`}
                    onClick={() => {
                      setActiveProject(proj);
                      setActiveImageIdx(0);
                    }}
                    className="group cursor-pointer rounded-3xl border border-[#F4F1EA]/10 bg-[#121210] overflow-hidden flex flex-col justify-between hover:border-[#C89D66] transition-all duration-500"
                  >
                    <div>
                      <div className="relative h-56 w-full overflow-hidden bg-[#181815]">
                        <Image
                          src={proj.images[0] || data.cover}
                          alt={t(proj.title.ar, proj.title.en)}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121210] via-transparent to-transparent" />
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                          <span className="rounded-lg bg-[#0A0A09]/85 border border-[#F4F1EA]/15 px-2.5 py-1 font-mono text-[11px] text-[#C89D66]">
                            REPO 0{idx + 1} • {proj.year}
                          </span>
                          {proj.metrics && (
                            <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-300">
                              {proj.metrics}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="arabic-diacritics text-xl font-bold group-hover:text-[#C89D66] transition">
                          {t(proj.title.ar, proj.title.en)}
                        </h3>
                        <p className="mt-2 text-sm text-[#A09C94] leading-relaxed line-clamp-3">
                          {t(proj.desc.ar, proj.desc.en)}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-3 border-t border-[#F4F1EA]/8 flex flex-wrap gap-1.5">
                      {proj.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-[#181815] border border-[#F4F1EA]/10 px-2.5 py-0.5 font-mono text-[11px] text-[#A09C94]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Education & Internships Timeline */}
            {data.timeline && data.timeline.length > 0 && (
              <div data-canvas-section="timeline" className="portfolio-canvas-section rounded-3xl border border-[#F4F1EA]/10 bg-[#121210] p-7 sm:p-9 mt-6" style={canvasSectionStyle("timeline")} data-canvas-selected={selectedCanvasSection === "timeline" ? "true" : "false"}>
                <div className="flex items-center gap-2 mb-6">
                  <GraduationCap className="h-5 w-5 text-[#C89D66]" />
                  <h2 className="arabic-diacritics text-xl sm:text-2xl font-bold">
                    {t("المسار الأكاديمي والخبرات الهندسية", "Academic Honors & Engineering Experience")}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {data.timeline.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-[#F4F1EA]/8 bg-[#181815] p-5 space-y-2"
                    >
                      <span className="font-mono text-xs text-[#C89D66]">{item.year}</span>
                      <h3 className="arabic-diacritics text-lg font-bold">
                        {t(item.role.ar, item.role.en)}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-400">
                        {t(item.org.ar, item.org.en)}
                      </p>
                      <p className="text-sm text-[#A09C94] leading-relaxed">
                        {t(item.summary.ar, item.summary.en)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Cmd+K Modal for Madar */}
          {cmdOpen && (
            <div
              className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md pt-24 px-4"
              onClick={() => setCmdOpen(false)}
            >
              <div
                className="w-full max-w-xl rounded-2xl border border-[#C89D66]/40 bg-[#121210] text-[#F4F1EA] shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 border-b border-[#F4F1EA]/10 px-4 py-3.5">
                  <Command className="h-4 w-4 text-[#C89D66]" />
                  <input
                    type="text"
                    autoFocus
                    value={cmdQuery}
                    onChange={(e) => setCmdQuery(e.target.value)}
                    placeholder={t(
                      "ابحث في المشاريع، المهارات، أو الأوامر السريعة...",
                      "Type a command or search projects..."
                    )}
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCmdOpen(false)}
                    className="rounded-lg bg-[#181815] px-2 py-1 font-mono text-[10px] text-[#A09C94]"
                  >
                    ESC
                  </button>
                </div>
                <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                  <p className="px-2 font-mono text-[10px] uppercase tracking-widest text-[#A09C94]">
                    {t("أوامر سريعة", "QUICK ACTIONS")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleCopySubdomain();
                      setCmdOpen(false);
                    }}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs hover:bg-[#181815] transition cursor-pointer"
                  >
                    <span>{t("نسخ رابط النطاق الفرعي", "Copy Subdomain URL")}</span>
                    <span className="font-mono text-[#C89D66]">https://{subdomainDisplay}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLang(lang === "ar" ? "en" : "ar");
                      setCmdOpen(false);
                    }}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs hover:bg-[#181815] transition cursor-pointer"
                  >
                    <span>{t("تبديل لغة العرض (AR / EN)", "Toggle Language (AR / EN)")}</span>
                    <span className="font-mono text-[#C89D66]">⌘L</span>
                  </button>
                  <p className="px-2 pt-2 font-mono text-[10px] uppercase tracking-widest text-[#A09C94]">
                    {t("المشاريع البرمجية", "PROJECTS")}
                  </p>
                  {data.projects
                    .filter(
                      (p) =>
                        !cmdQuery ||
                        p.title.ar.toLowerCase().includes(cmdQuery.toLowerCase()) ||
                        p.title.en.toLowerCase().includes(cmdQuery.toLowerCase())
                    )
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setActiveProject(p);
                          setActiveImageIdx(0);
                          setCmdOpen(false);
                        }}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs hover:bg-[#181815] transition cursor-pointer"
                      >
                        <span className="font-bold">{t(p.title.ar, p.title.en)}</span>
                        <span className="font-mono text-[11px] text-[#A09C94]">{p.year}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TEMPLATE 2: ATHAR (أَثَر) — Cinema Scrollytelling & Creative Director
         ===================================================================== */}
      {activeTemplate === "athar" && (
        <div data-canvas-template-root className="bg-[#080807] text-[#F4F1EA] min-h-screen">
          {/* Pinned Scrollytelling Cinema Stage */}
          <section data-canvas-section="hero" className="portfolio-canvas-section relative min-h-[82vh] flex flex-col justify-between p-6 sm:p-12 border-b border-[#F4F1EA]/10 overflow-hidden" style={canvasSectionStyle("hero")} data-canvas-selected={selectedCanvasSection === "hero" ? "true" : "false"}>
            <Image
              src={data.projects[0]?.images[0] || data.cover}
              alt={t(data.name.ar, data.name.en)}
              fill
              className={`object-cover transition-all duration-700 ${
                cinemaLut === "noir"
                  ? "grayscale contrast-125 opacity-40"
                  : "opacity-45 saturate-110"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080807] via-[#080807]/50 to-[#080807]/70" />

            {/* Top Camera Viewfinder HUD */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/50 px-3 py-1 text-red-300 font-bold">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  REC • 24.000 FPS
                </span>
                <span className="text-[#C89D66]">ASPECT {cinemaAspect}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCinemaAspect(cinemaAspect === "2.39:1" ? "16:9" : "2.39:1")
                  }
                  className="rounded-lg border border-[#F4F1EA]/15 bg-[#121210]/80 px-3 py-1 text-[11px] hover:border-[#C89D66] cursor-pointer"
                >
                  {t("نسبة الكادر:", "Aspect:")} {cinemaAspect}
                </button>
                <button
                  type="button"
                  onClick={() => setCinemaLut(cinemaLut === "warm" ? "noir" : "warm")}
                  className="rounded-lg border border-[#F4F1EA]/15 bg-[#121210]/80 px-3 py-1 text-[11px] hover:border-[#C89D66] cursor-pointer"
                >
                  LUT: {cinemaLut === "warm" ? "Kodak 2383 Warm" : "Silver Noir"}
                </button>
              </div>
            </div>

            {/* Center Director Title */}
            <div className="relative z-10 my-auto max-w-4xl py-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-[#C89D66]">
                  <Image
                    src={data.avatar}
                    alt={t(data.name.ar, data.name.en)}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#C89D66]">
                    {t("إخراج بصري وسرد سينمائي", "DIRECTOR'S VISUAL ANTHOLOGY")}
                  </span>
                  <p className="text-xs text-[#A09C94] mt-0.5">
                    {t(data.city.ar, data.city.en)}
                  </p>
                </div>
              </div>

              <h1 className="arabic-diacritics text-4xl sm:text-7xl font-black tracking-tight leading-none">
                {t(data.name.ar, data.name.en)}
              </h1>
              <p className="mt-3 text-lg sm:text-2xl text-[#C89D66] font-medium">
                {t(data.title.ar, data.title.en)}
              </p>
              <p className="mt-5 max-w-2xl text-sm sm:text-base text-[#F4F1EA]/80 leading-relaxed">
                {t(data.bio.ar, data.bio.en)}
              </p>

              {data.links && data.links.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {data.links.map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#F4F1EA]/20 bg-black/60 px-4 py-1.5 text-xs font-semibold text-[#F4F1EA] hover:border-[#C89D66] transition"
                    >
                      <span>{l.label}</span>
                      <ExternalLink className="h-3 w-3 text-[#C89D66]" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Reel Metrics */}
            <div data-canvas-section="metrics" className="portfolio-canvas-section relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#F4F1EA]/12" style={canvasSectionStyle("metrics")} data-canvas-selected={selectedCanvasSection === "metrics" ? "true" : "false"}>
              {(data.metrics || []).map((m, i) => (
                <div key={i}>
                  <p className="font-mono text-2xl sm:text-3xl font-black text-[#C89D66]">
                    {m.value}
                  </p>
                  <p className="text-xs text-[#A09C94]">{t(m.label.ar, m.label.en)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* True Horizontal Scroll Showcase Rail (Pinned / Snap Cinema Track) */}
          <section data-canvas-section="projects" className="portfolio-canvas-section py-16 px-4 sm:px-10" style={canvasSectionStyle("projects")} data-canvas-selected={selectedCanvasSection === "projects" ? "true" : "false"}>
            <div className="mx-auto max-w-7xl space-y-12">
              <div className="sticky top-16 z-20 rounded-2xl bg-[#080807]/90 backdrop-blur-md border border-[#F4F1EA]/10 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#C89D66]">
                    PINNED HORIZONTAL REEL SHOWCASE • 35MM & DIGITAL
                  </span>
                  <h2 className="arabic-diacritics text-2xl sm:text-3xl font-extrabold mt-0.5">
                    {t("معرض التمرير الأفقي للمشاهد والأعمال البصرية", "Horizontal Scroll Showcase & Visual Reels")}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="athar-rail-prev"
                    onClick={() =>
                      atharRailRef.current?.scrollBy({
                        left: lang === "ar" ? 640 : -640,
                        behavior: "smooth",
                      })
                    }
                    className="rounded-xl border border-[#F4F1EA]/20 bg-[#121210] px-3.5 py-2 font-mono text-xs text-[#F4F1EA] hover:border-[#C89D66] cursor-pointer"
                  >
                    {t("◀ المشهد السابق", "◀ PREV REEL")}
                  </button>
                  <button
                    type="button"
                    data-testid="athar-rail-next"
                    onClick={() =>
                      atharRailRef.current?.scrollBy({
                        left: lang === "ar" ? -640 : 640,
                        behavior: "smooth",
                      })
                    }
                    className="rounded-xl bg-[#C89D66] px-3.5 py-2 font-mono text-xs font-bold text-[#080807] hover:opacity-90 cursor-pointer"
                  >
                    {t("المشهد التالي ▶", "NEXT REEL ▶")}
                  </button>
                </div>
              </div>

              <div
                ref={atharRailRef}
                data-testid="athar-horizontal-rail"
                className="flex gap-8 overflow-x-auto snap-x snap-mandatory pb-6 scroll-smooth"
              >
                {data.projects.map((proj, index) => (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setActiveProject(proj);
                      setActiveImageIdx(0);
                    }}
                    className="snap-center shrink-0 w-[86vw] sm:w-[680px] lg:w-[820px] group cursor-pointer rounded-3xl border border-[#F4F1EA]/12 bg-[#121210] overflow-hidden hover:border-[#C89D66] transition-all duration-500"
                  >
                    <div
                      className={`relative w-full overflow-hidden ${
                        cinemaAspect === "2.39:1" ? "aspect-[21/9]" : "aspect-video"
                      } min-h-[300px] sm:min-h-[380px]`}
                    >
                      <Image
                        src={proj.images[0] || data.cover}
                        alt={t(proj.title.ar, proj.title.en)}
                        fill
                        className={`object-cover transition-transform duration-700 group-hover:scale-105 ${
                          cinemaLut === "noir" ? "grayscale contrast-125" : ""
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080807] via-transparent to-black/40" />
                      <div className="absolute top-4 inset-x-5 flex items-center justify-between font-mono text-xs">
                        <span className="rounded-md bg-black/75 border border-[#C89D66]/40 px-3 py-1 text-[#C89D66]">
                          REEL 0{index + 1} OF 0{data.projects.length} • {proj.year}
                        </span>
                        <span className="rounded-md bg-black/75 px-3 py-1 text-[#F4F1EA]">
                          {proj.metrics || "2.39:1 ANAMORPHIC"}
                        </span>
                      </div>
                      <div className="absolute bottom-5 inset-x-6 flex flex-wrap items-end justify-between gap-4">
                        <div className="max-w-xl">
                          <h3 className="arabic-diacritics text-2xl sm:text-4xl font-black text-[#F4F1EA]">
                            {t(proj.title.ar, proj.title.en)}
                          </h3>
                          <p className="mt-2 text-sm text-[#F4F1EA]/80 line-clamp-2">
                            {t(proj.desc.ar, proj.desc.en)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {proj.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-black/70 border border-[#F4F1EA]/15 px-2.5 py-0.5 font-mono text-[10px] text-[#C89D66]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#C89D66] px-4 py-2 text-xs font-bold text-[#080807]">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{t("مشاهدة الكادر", "Inspect Reel")}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Creative Direction Craft & Post-Production Suite */}
              {skillsList.length > 0 && (
                <div data-canvas-section="skills" className="portfolio-canvas-section rounded-3xl border border-[#F4F1EA]/12 bg-[#121210] p-7" style={canvasSectionStyle("skills")} data-canvas-selected={selectedCanvasSection === "skills" ? "true" : "false"}>
                  <p className="font-mono text-xs uppercase tracking-widest text-[#C89D66] mb-3">
                    {t("أدوات الإخراج، المونتاج، والتلوين السينمائي", "DIRECTING, COLOR GRADING & VFX SUITE")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-xl border border-[#F4F1EA]/15 bg-[#181815] px-3.5 py-1.5 font-mono text-xs text-[#F4F1EA]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Directing & Festival Timeline */}
              {data.timeline && data.timeline.length > 0 && (
                <div data-canvas-section="timeline" className="portfolio-canvas-section grid grid-cols-1 md:grid-cols-2 gap-6" style={canvasSectionStyle("timeline")} data-canvas-selected={selectedCanvasSection === "timeline" ? "true" : "false"}>
                  {data.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-3xl border border-[#F4F1EA]/12 bg-[#121210] p-6 space-y-2"
                    >
                      <span className="font-mono text-xs text-[#C89D66]">{item.year}</span>
                      <h3 className="arabic-diacritics text-lg font-bold">
                        {t(item.role.ar, item.role.en)}
                      </h3>
                      <p className="text-xs font-semibold text-[#C89D66]">
                        {t(item.org.ar, item.org.en)}
                      </p>
                      <p className="text-sm text-[#A09C94]">{t(item.summary.ar, item.summary.en)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          TEMPLATE 3: HAVEN (مَلاذ) — Quiet Luxury Architecture & Engineering
         ===================================================================== */}
      {activeTemplate === "haven" && (
        <div data-canvas-template-root className="bg-[#F7F5F0] text-[#141413] min-h-screen py-14 px-4 sm:px-10">
          <div className="mx-auto max-w-6xl space-y-16">
            {/* Quiet Luxury Architectural Monograph Header */}
            <header data-canvas-section="hero" className="portfolio-canvas-section grid grid-cols-1 lg:grid-cols-12 gap-10 items-center border-b border-[#141413]/12 pb-14" style={canvasSectionStyle("hero")} data-canvas-selected={selectedCanvasSection === "hero" ? "true" : "false"}>
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#9A7B4F]/40 bg-[#EFECE6] px-4 py-1.5 text-xs font-semibold text-[#9A7B4F]">
                  <Compass className="h-3.5 w-3.5" />
                  <span>
                    {data.badge
                      ? t(data.badge.ar, data.badge.en)
                      : t("مَلاذ • سجل العمارة والهندسة", "HAVEN • SPATIAL & ENGINEERING MONOGRAPH")}
                  </span>
                </div>
                <h1 className="arabic-diacritics text-4xl sm:text-6xl font-extrabold tracking-tight text-[#141413]">
                  {t(data.name.ar, data.name.en)}
                </h1>
                <p className="text-lg sm:text-xl font-medium text-[#9A7B4F]">
                  {t(data.title.ar, data.title.en)}
                </p>
                <p className="text-base text-[#5E5B55] leading-relaxed max-w-2xl">
                  {t(data.bio.ar, data.bio.en)}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#EFECE6] border border-[#141413]/10 px-3.5 py-2 text-xs font-semibold text-[#141413]">
                    <MapPin className="h-3.5 w-3.5 text-[#9A7B4F]" />
                    <span>{t(data.city.ar, data.city.en)}</span>
                  </span>
                  {data.links.map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#141413]/15 bg-[#F7F5F0] px-3.5 py-2 text-xs font-bold text-[#141413] hover:border-[#9A7B4F] transition"
                    >
                      <span>{l.label}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-[#9A7B4F]" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative aspect-[4/5] w-full max-w-sm mx-auto rounded-3xl overflow-hidden border border-[#141413]/15 shadow-2xl bg-[#EFECE6]">
                  <Image
                    src={data.avatar}
                    alt={t(data.name.ar, data.name.en)}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-4 inset-x-4 rounded-2xl bg-[#F7F5F0]/90 backdrop-blur-md p-4 border border-[#141413]/10">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#9A7B4F]">
                      ARCHITECTURAL PRACTICE
                    </p>
                    <p className="font-bold text-sm text-[#141413] mt-0.5">
                      {t(data.name.ar, data.name.en)}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* Spatial Engineering Metrics */}
            {data.metrics && (
              <div data-canvas-section="metrics" className="portfolio-canvas-section grid grid-cols-2 lg:grid-cols-4 gap-5" style={canvasSectionStyle("metrics")} data-canvas-selected={selectedCanvasSection === "metrics" ? "true" : "false"}>
                {data.metrics.map((m, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#EFECE6] border border-[#141413]/10 p-6"
                  >
                    <p className="font-mono text-3xl sm:text-4xl font-extrabold text-[#1E3A2F]">
                      {m.value}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-[#5E5B55]">
                      {t(m.label.ar, m.label.en)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* True Sticky Layered Parallax Architectural Plates */}
            <div data-canvas-section="projects" className="portfolio-canvas-section space-y-12" style={canvasSectionStyle("projects")} data-canvas-selected={selectedCanvasSection === "projects" ? "true" : "false"}>
              <div className="flex items-center justify-between">
                <h2 className="arabic-diacritics text-2xl sm:text-4xl font-extrabold">
                  {t("الأعمال الهندسية والمعمارية المختارة (الشرائح المتراكبة)", "Layered Parallax Architectural & Engineering Plates")}
                </h2>
                <span className="font-mono text-xs uppercase tracking-widest text-[#9A7B4F]">
                  LAYERED PLATES 01 — 0{data.projects.length}
                </span>
              </div>

              <div data-testid="haven-layered-parallax-stack" className="relative space-y-12 pb-8">
                {data.projects.map((proj, idx) => (
                  <div
                    key={proj.id}
                    style={{
                      top: `${5.25 + idx * 1.75}rem`,
                      zIndex: idx + 1,
                    }}
                    onClick={() => {
                      setActiveProject(proj);
                      setActiveImageIdx(0);
                    }}
                    className="sticky group cursor-pointer rounded-3xl bg-[#EFECE6] border border-[#141413]/15 overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-[0_-10px_35px_rgba(20,20,19,0.08)] hover:border-[#9A7B4F] transition-all duration-500"
                  >
                    <div className="lg:col-span-7 relative min-h-[340px] overflow-hidden">
                      <Image
                        src={proj.images[0] || data.cover}
                        alt={t(proj.title.ar, proj.title.en)}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="absolute top-4 start-4 rounded-full bg-[#F7F5F0]/90 px-3.5 py-1 font-mono text-xs font-bold text-[#141413]">
                        LAYERED PLATE 0{idx + 1} • {proj.year}
                      </span>
                    </div>

                    <div className="lg:col-span-5 p-8 flex flex-col justify-between bg-[#EFECE6]">
                      <div className="space-y-4">
                        <span className="font-mono text-xs uppercase tracking-widest text-[#9A7B4F]">
                          {proj.metrics || "ARCHITECTURAL MONOGRAPH"}
                        </span>
                        <h3 className="arabic-diacritics text-2xl sm:text-3xl font-bold text-[#141413]">
                          {t(proj.title.ar, proj.title.en)}
                        </h3>
                        <p className="text-sm sm:text-base text-[#5E5B55] leading-relaxed">
                          {t(proj.desc.ar, proj.desc.en)}
                        </p>
                      </div>

                      <div className="pt-6 mt-6 border-t border-[#141413]/10 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {proj.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-lg bg-[#F7F5F0] border border-[#141413]/10 px-3 py-1 font-mono text-xs text-[#141413]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E3A2F]">
                          <span>{t("استعراض المخططات والصور عالية الدقة", "Inspect Spatial Plates")}</span>
                          {lang === "ar" ? (
                            <ArrowUpLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architectural Software & Structural Engineering Matrix */}
            {skillsList.length > 0 && (
              <div data-canvas-section="skills" className="portfolio-canvas-section rounded-3xl bg-[#EFECE6] border border-[#141413]/12 p-7" style={canvasSectionStyle("skills")} data-canvas-selected={selectedCanvasSection === "skills" ? "true" : "false"}>
                <p className="font-mono text-xs uppercase tracking-widest text-[#9A7B4F] mb-3">
                  {t("البرمجيات الهندسية والمعمارية المعتمدة", "COMPUTATIONAL DESIGN & BIM TOOLS")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl bg-[#F7F5F0] border border-[#141413]/12 px-3.5 py-1.5 font-mono text-xs font-semibold text-[#141413]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Academic & Graduation Thesis Timeline */}
            {data.timeline && data.timeline.length > 0 && (
              <div data-canvas-section="timeline" className="portfolio-canvas-section rounded-3xl bg-[#EFECE6] border border-[#141413]/12 p-8 sm:p-10" style={canvasSectionStyle("timeline")} data-canvas-selected={selectedCanvasSection === "timeline" ? "true" : "false"}>
                <div className="flex items-center gap-2.5 mb-8">
                  <GraduationCap className="h-6 w-6 text-[#9A7B4F]" />
                  <h2 className="arabic-diacritics text-2xl sm:text-3xl font-extrabold">
                    {t(
                      "الشهادات الأكاديمية، مشاريع التخرج، والمسيرة المهنية",
                      "Academic Credentials, Graduation Thesis & Practice Timeline"
                    )}
                  </h2>
                </div>
                <div className="space-y-6 border-s-2 border-[#9A7B4F]/40 ps-6">
                  {data.timeline.map((item, i) => (
                    <div key={i} className="relative space-y-1">
                      <span className="font-mono text-xs font-bold text-[#9A7B4F]">
                        {item.year}
                      </span>
                      <h3 className="arabic-diacritics text-lg font-bold text-[#141413]">
                        {t(item.role.ar, item.role.en)} —{" "}
                        <span className="text-[#1E3A2F]">{t(item.org.ar, item.org.en)}</span>
                      </h3>
                      <p className="text-sm text-[#5E5B55] max-w-3xl">
                        {t(item.summary.ar, item.summary.en)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TEMPLATE 4: SIYADA (سِيَادَة) — Swiss Editorial Grid & Executive Grad
         ===================================================================== */}
      {activeTemplate === "siyada" && (
        <div data-canvas-template-root className="bg-[#F7F5F0] text-[#141413] min-h-screen py-12 px-4 sm:px-8">
          <div className="mx-auto max-w-6xl border border-[#141413]/20 bg-[#F7F5F0]">
            {/* Top Swiss 1px Solid Editorial Masthead */}
            <div data-canvas-section="hero" className="portfolio-canvas-section grid grid-cols-1 lg:grid-cols-12 border-b border-[#141413]/20" style={canvasSectionStyle("hero")} data-canvas-selected={selectedCanvasSection === "hero" ? "true" : "false"}>
              <div className="lg:col-span-8 p-8 sm:p-10 border-b lg:border-b-0 lg:border-e border-[#141413]/20 space-y-4">
                <div className="flex items-center justify-between font-mono text-xs text-[#9A7B4F]">
                  <span>SWISS EDITORIAL DOSSIER • REF #{data.username.toUpperCase()}</span>
                  <span>{t(data.city.ar, data.city.en)}</span>
                </div>
                <h1 className="arabic-diacritics text-4xl sm:text-6xl font-black tracking-tight text-[#141413]">
                  {t(data.name.ar, data.name.en)}
                </h1>
                <p className="text-lg font-semibold text-[#9A7B4F]">
                  {t(data.title.ar, data.title.en)}
                </p>
                <p className="text-sm sm:text-base text-[#5E5B55] leading-relaxed">
                  {t(data.bio.ar, data.bio.en)}
                </p>

                {/* Interactive Executive Actions: Export CV + Subdomain QR */}
                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    data-testid="siyada-export-cv-btn"
                    onClick={() => setCvModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-none bg-[#141413] text-[#F7F5F0] px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#9A7B4F] transition cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>{t("تصدير وطباعة السيرة الذاتية (Export CV)", "Export & Print CV / Resume")}</span>
                  </button>

                  <button
                    type="button"
                    data-testid="siyada-qr-btn"
                    onClick={() => setQrOpen(true)}
                    className="inline-flex items-center gap-2 rounded-none border border-[#141413] bg-[#EFECE6] px-5 py-3 text-xs font-bold text-[#141413] hover:bg-[#141413] hover:text-[#F7F5F0] transition cursor-pointer"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>{t("بطاقة QR للنطاق الفرعي", "Subdomain QR Card")}</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4 p-8 flex flex-col items-center justify-center bg-[#EFECE6]">
                <div className="relative h-40 w-40 overflow-hidden border border-[#141413]/30 mb-4">
                  <Image
                    src={data.avatar}
                    alt={t(data.name.ar, data.name.en)}
                    fill
                    className="object-cover"
                  />
                </div>
                <p dir="ltr" className="font-mono text-xs font-bold text-[#141413]">
                  https://{subdomainDisplay}
                </p>
                <p className="text-[11px] text-[#5E5B55] mt-1 text-center">
                  {data.badge ? t(data.badge.ar, data.badge.en) : "Executive & Legal Profile"}
                </p>
              </div>
            </div>

            {/* 1px Swiss Metrics Row */}
            {data.metrics && (
              <div data-canvas-section="metrics" className="portfolio-canvas-section grid grid-cols-2 lg:grid-cols-4 border-b border-[#141413]/20" style={canvasSectionStyle("metrics")} data-canvas-selected={selectedCanvasSection === "metrics" ? "true" : "false"}>
                {data.metrics.map((m, i) => (
                  <div
                    key={i}
                    className="p-6 border-b lg:border-b-0 border-e border-[#141413]/20 last:border-e-0"
                  >
                    <p className="font-mono text-3xl font-black text-[#141413]">{m.value}</p>
                    <p className="mt-1 text-xs font-semibold text-[#5E5B55]">
                      {t(m.label.ar, m.label.en)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Case Studies Grid */}
            <div data-canvas-section="projects" className="portfolio-canvas-section p-8 sm:p-10 border-b border-[#141413]/20" style={canvasSectionStyle("projects")} data-canvas-selected={selectedCanvasSection === "projects" ? "true" : "false"}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="arabic-diacritics text-2xl sm:text-3xl font-black">
                  {t("دراسات الحالة والأبحاث الاستراتيجية", "Executive Case Studies & Published Research")}
                </h2>
                <BookOpen className="h-5 w-5 text-[#9A7B4F]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {data.projects.map((proj, idx) => (
                  <article
                    key={proj.id}
                    onClick={() => {
                      setActiveProject(proj);
                      setActiveImageIdx(0);
                    }}
                    className="cursor-pointer border border-[#141413]/20 bg-[#EFECE6] hover:border-[#9A7B4F] transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-56 w-full overflow-hidden border-b border-[#141413]/20">
                        <Image
                          src={proj.images[0] || data.cover}
                          alt={t(proj.title.ar, proj.title.en)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between font-mono text-xs text-[#9A7B4F]">
                          <span>CASE STUDY 0{idx + 1}</span>
                          <span>{proj.year}</span>
                        </div>
                        <h3 className="arabic-diacritics text-xl font-bold text-[#141413]">
                          {t(proj.title.ar, proj.title.en)}
                        </h3>
                        <p className="text-sm text-[#5E5B55] leading-relaxed">
                          {t(proj.desc.ar, proj.desc.en)}
                        </p>
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#141413]/15 flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-[#1E3A2F]">{proj.metrics}</span>
                      <span className="underline">{t("قراءة الدراسة", "Read Dossier")}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Executive Timeline */}
            {data.timeline && (
              <div data-canvas-section="timeline" className="portfolio-canvas-section p-8 sm:p-10" style={canvasSectionStyle("timeline")} data-canvas-selected={selectedCanvasSection === "timeline" ? "true" : "false"}>
                <h2 className="arabic-diacritics text-xl font-black mb-6">
                  {t("السجل المهني والأكاديمي", "Executive & Academic Curriculum")}
                </h2>
                <div className="divide-y divide-[#141413]/15">
                  {data.timeline.map((item, i) => (
                    <div key={i} className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-3 font-mono text-xs font-bold text-[#9A7B4F]">
                        {item.year}
                      </div>
                      <div className="md:col-span-9">
                        <h3 className="font-bold text-base">
                          {t(item.role.ar, item.role.en)} • {t(item.org.ar, item.org.en)}
                        </h3>
                        <p className="text-sm text-[#5E5B55] mt-1">
                          {t(item.summary.ar, item.summary.en)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Siyada QR Business Card Modal */}
          {qrOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
              onClick={() => setQrOpen(false)}
            >
              <div
                className="w-full max-w-sm bg-[#F7F5F0] text-[#141413] border-2 border-[#141413] p-6 space-y-5 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[#141413]/20 pb-3">
                  <span className="font-mono text-xs font-bold">SOVEREIGN QR PASS</span>
                  <button type="button" onClick={() => setQrOpen(false)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mx-auto h-44 w-44 border border-[#141413] bg-[#EFECE6] p-4 flex items-center justify-center">
                  {/* Deterministic SVG QR Code Representation */}
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-[#141413]">
                    <rect x="5" y="5" width="28" height="28" fill="none" stroke="#141413" strokeWidth="6" />
                    <rect x="13" y="13" width="12" height="12" />
                    <rect x="67" y="5" width="28" height="28" fill="none" stroke="#141413" strokeWidth="6" />
                    <rect x="75" y="13" width="12" height="12" />
                    <rect x="5" y="67" width="28" height="28" fill="none" stroke="#141413" strokeWidth="6" />
                    <rect x="13" y="75" width="12" height="12" />
                    <rect x="42" y="12" width="8" height="8" />
                    <rect x="52" y="22" width="8" height="16" />
                    <rect x="42" y="42" width="16" height="16" fill="#9A7B4F" />
                    <rect x="12" y="44" width="18" height="8" />
                    <rect x="66" y="44" width="22" height="8" />
                    <rect x="42" y="68" width="10" height="22" />
                    <rect x="62" y="64" width="14" height="14" />
                    <rect x="80" y="78" width="12" height="12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t(data.name.ar, data.name.en)}</h3>
                  <p dir="ltr" className="font-mono text-xs text-[#9A7B4F] mt-1">
                    https://{subdomainDisplay}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySubdomain}
                  className="w-full flex items-center justify-center gap-2 bg-[#141413] text-[#F7F5F0] py-2.5 text-xs font-bold cursor-pointer"
                >
                  {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{t("نسخ رابط البطاقة", "Copy Subdomain Link")}</span>
                </button>
              </div>
            </div>
          )}

          {/* Siyada Export / Print CV Modal */}
          {cvModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
              onClick={() => setCvModalOpen(false)}
            >
              <div
                className="w-full max-w-2xl bg-[#F7F5F0] text-[#141413] border-2 border-[#141413] p-8 space-y-6 max-h-[88vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[#141413]/20 pb-4">
                  <div>
                    <h3 className="font-bold text-xl">{t(data.name.ar, data.name.en)}</h3>
                    <p className="text-xs text-[#5E5B55]">{t(data.title.ar, data.title.en)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 bg-[#141413] text-[#F7F5F0] px-4 py-2 text-xs font-bold cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>{t("طباعة / حفظ PDF", "Print / Save PDF")}</span>
                    </button>
                    <button type="button" onClick={() => setCvModalOpen(false)}>
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{t(data.bio.ar, data.bio.en)}</p>
                <div className="space-y-3">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-[#9A7B4F]">
                    {t("الخبرات ودراسات الحالة", "EXPERIENCE & CASE STUDIES")}
                  </h4>
                  {data.projects.map((p) => (
                    <div key={p.id} className="border-s-2 border-[#141413] ps-3 py-1">
                      <p className="font-bold text-sm">
                        {t(p.title.ar, p.title.en)} ({p.year})
                      </p>
                      <p className="text-xs text-[#5E5B55]">{t(p.desc.ar, p.desc.en)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TEMPLATE 5: WAMEED (وَمِيض) — High-Velocity Tele-Sales & Revenue Closer
         ===================================================================== */}
      {activeTemplate === "wameed" && (
        <div data-canvas-template-root className="bg-[#0A0A09] text-[#F4F1EA] min-h-screen py-12 px-4 sm:px-8">
          <div className="mx-auto max-w-7xl space-y-10">
            {/* Hero Deal Desk Banner */}
            <div data-canvas-section="hero" className="portfolio-canvas-section rounded-3xl border border-[#C89D66]/35 bg-[#121210] p-7 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center" style={canvasSectionStyle("hero")} data-canvas-selected={selectedCanvasSection === "hero" ? "true" : "false"}>
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-4 py-1 text-xs font-bold text-emerald-400">
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>
                    {data.badge
                      ? t(data.badge.ar, data.badge.en)
                      : t("خبير إغلاق مبيعات هاتفية • 148% Quota Closer", "Top 1% Tele-Sales Closer • 148% Quota")}
                  </span>
                </div>
                <h1 className="arabic-diacritics text-3xl sm:text-5xl font-black tracking-tight">
                  {t(data.name.ar, data.name.en)}
                </h1>
                <p className="text-base sm:text-xl font-semibold text-[#C89D66]">
                  {t(data.title.ar, data.title.en)}
                </p>
                <p className="text-sm sm:text-base text-[#A09C94] leading-relaxed">
                  {t(data.bio.ar, data.bio.en)}
                </p>

                {/* Instant WhatsApp & Discovery Call Booking CTA */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href="https://wa.me/201000000000"
                    target="_blank"
                    rel="noreferrer"
                    data-testid="wameed-whatsapp-cta"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3.5 text-xs sm:text-sm font-extrabold text-[#0A0A09] shadow-lg transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{t("تواصل فوري عبر واتساب", "Instant WhatsApp Deal Desk")}</span>
                  </a>
                  <a
                    href="#wameed-pitch-player"
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#C89D66]/50 bg-[#181815] px-5 py-3.5 text-xs sm:text-sm font-bold text-[#F4F1EA] hover:border-[#C89D66] transition"
                  >
                    <Volume2 className="h-4 w-4 text-[#C89D66]" />
                    <span>{t("استمع لعينة مكالمة بيعية (30s)", "Play 30s Winning Pitch")}</span>
                  </a>
                </div>
              </div>

              {/* Quota Attainment Rings */}
              <div data-canvas-section="metrics" className="portfolio-canvas-section lg:col-span-5 grid grid-cols-2 gap-4" style={canvasSectionStyle("metrics")} data-canvas-selected={selectedCanvasSection === "metrics" ? "true" : "false"}>
                {[
                  { pct: "148%", labelAr: "تحقيق التارجت السنوي", labelEn: "Annual Quota Attainment", stroke: 92 },
                  { pct: "31.5%", labelAr: "تحويل المكالمات لإغلاق", labelEn: "Call-to-Close Ratio", stroke: 78 },
                  { pct: "$2.4M", labelAr: "مبيعات مغلقة موثّقة", labelEn: "Verified Closed Revenue", stroke: 88 },
                  { pct: "94%", labelAr: "نسبة حضور العروض", labelEn: "Demo Show-Up Rate", stroke: 94 },
                ].map((ring, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#F4F1EA]/10 bg-[#181815] p-4 flex flex-col items-center text-center"
                  >
                    <div className="relative h-20 w-20 flex items-center justify-center mb-2">
                      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="rgba(244,241,234,0.1)"
                          strokeWidth="3.2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#C89D66"
                          strokeWidth="3.2"
                          strokeDasharray={`${ring.stroke}, 100`}
                        />
                      </svg>
                      <span className="absolute font-mono text-sm font-black text-[#F4F1EA]">
                        {ring.pct}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-[#A09C94]">
                      {t(ring.labelAr, ring.labelEn)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive 30s Winning Pitch Audio Player & Call-to-Close Funnel */}
            <div
              id="wameed-pitch-player"
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left: 30s Winning Pitch Audio Preview */}
              <div className="lg:col-span-6 rounded-3xl border border-[#F4F1EA]/10 bg-[#121210] p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-[#C89D66]">
                      WINNING TELE-SALES PITCH PREVIEW
                    </span>
                    <h2 className="arabic-diacritics text-xl font-bold mt-1">
                      {t("مشغل عينة المكالمة البيعية الناجحة (30 ثانية)", "30s High-Ticket Call & Objection Breakdown")}
                    </h2>
                  </div>
                  <button
                    type="button"
                    data-testid="wameed-play-pitch-btn"
                    onClick={() => setIsPlayingPitch(!isPlayingPitch)}
                    className="h-12 w-12 rounded-2xl bg-[#C89D66] text-[#0A0A09] flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    {isPlayingPitch ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                </div>

                {/* Waveform Bars */}
                <div className="flex items-end gap-1 h-14 px-3 py-2 rounded-2xl bg-[#181815] border border-[#F4F1EA]/8">
                  {Array.from({ length: 32 }).map((_, idx) => {
                    const active = (idx / 32) * 30 <= pitchSeconds;
                    const barHeight = 25 + ((idx * 17) % 70);
                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          active ? "bg-[#C89D66]" : "bg-[#F4F1EA]/20"
                        }`}
                        style={{ height: `${barHeight}%` }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between font-mono text-xs text-[#A09C94]">
                  <span>00:{String(pitchSeconds).padStart(2, "0")}</span>
                  <div className="flex gap-2">
                    {[
                      { idx: 0 as const, labelAr: "١. افتتاحية الجذب", labelEn: "1. Pattern Interrupt" },
                      { idx: 1 as const, labelAr: "٢. تأطير العائد", labelEn: "2. ROI Value Frame" },
                      { idx: 2 as const, labelAr: "٣. تحويل الاعتراض وإغلاق", labelEn: "3. Objection Flip" },
                    ].map((st) => (
                      <button
                        key={st.idx}
                        type="button"
                        onClick={() => {
                          setActivePitchStage(st.idx);
                          setPitchSeconds(st.idx * 10);
                        }}
                        className={`rounded-lg px-2.5 py-1 text-[11px] cursor-pointer ${
                          activePitchStage === st.idx
                            ? "bg-[#C89D66] text-[#0A0A09] font-bold"
                            : "bg-[#181815] text-[#A09C94]"
                        }`}
                      >
                        {t(st.labelAr, st.labelEn)}
                      </button>
                    ))}
                  </div>
                  <span>00:30</span>
                </div>

                <div className="rounded-2xl bg-[#181815] border border-[#C89D66]/30 p-4 text-xs sm:text-sm leading-relaxed text-[#F4F1EA]">
                  {activePitchStage === 0 &&
                    t(
                      "«أهلاً أستاذ خالد، معك طارق — أعلم أن جدولك مزدحم، خلال ٢٥ ثانية سأوضح لك كيف قلصنا تكلفة اكتساب العملاء لشركتين في نفس قطاعك بنسبة ٤٠٪ هذا الربع...»",
                      "“Hi Khaled, Tariq here — I know I'm calling out of the blue. Give me 25 seconds to share how we cut acquisition burn by 40% for two GCC peers this quarter...”"
                    )}
                  {activePitchStage === 1 &&
                    t(
                      "«بدلاً من إرسال ملف PDF تقليدي يضيع في البريد، نحن نربط فريق مبيعاتك بنظام تتبع لحظي يرفع معدل تحويل المكالمات من ١٢٪ إلى ٣١٪ خلال أول ٢١ يوماً...»",
                      "“Instead of another generic PDF deck, we deploy a pre-qualified outbound cadence that lifted demo-to-close from 12% to 31.5% in 21 days...”"
                    )}
                  {activePitchStage === 2 &&
                    t(
                      "«أفهم تماماً أن الميزانية محددة حالياً — ولهذا بالضبط نبدأ بتجربة ميدانية محكومة الأثر لمدة ١٤ يوماً. هل يناسبك غداً الساعة ١١ صباحاً أم ٣ عصراً لعرض الأرقام الحية؟»",
                      "“I completely understand budget is locked for Q3 — which is why we validate via a 14-day revenue sprint. Does Tuesday at 11 AM or 3 PM work for a 10-minute walkthrough?”"
                    )}
                </div>
              </div>

              {/* Right: Call-to-Close Conversion Funnel */}
              <div className="lg:col-span-6 rounded-3xl border border-[#F4F1EA]/10 bg-[#121210] p-7 space-y-4">
                <span className="font-mono text-xs uppercase tracking-widest text-[#C89D66]">
                  CALL-TO-CLOSE CONVERSION FUNNEL
                </span>
                <h2 className="arabic-diacritics text-xl font-bold">
                  {t("مخطط قمع التحويل وإغلاق الصفقات", "Outbound Pipeline & Conversion Velocity")}
                </h2>
                <div className="space-y-3 pt-2">
                  {[
                    {
                      stageAr: "١. مكالمات صادرة مستهدفة (Cold & Warm Outbound Dials)",
                      stageEn: "1. Targeted Outbound Dials (85/day)",
                      pct: "100%",
                      width: "100%",
                    },
                    {
                      stageAr: "٢. وصول مباشر لصانع القرار (Decision-Maker Connect)",
                      stageEn: "2. Decision-Maker Connected",
                      pct: "48%",
                      width: "76%",
                    },
                    {
                      stageAr: "٣. تأهيل وحجز اجتماع عرض حي (Qualified Discovery & Demo)",
                      stageEn: "3. Qualified Discovery & Live Demo",
                      pct: "36%",
                      width: "60%",
                    },
                    {
                      stageAr: "٤. إغلاق الصفقة وتوقيع العقد (Closed-Won Contract)",
                      stageEn: "4. Closed-Won Annual Contract",
                      pct: "31.5%",
                      width: "48%",
                    },
                  ].map((f, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{t(f.stageAr, f.stageEn)}</span>
                        <span className="font-mono font-bold text-[#C89D66]">{f.pct}</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-[#181815] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#C89D66] to-emerald-500"
                          style={{ width: f.width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* CRM Mastery Badges */}
                <div data-canvas-section="skills" className="portfolio-canvas-section pt-4 border-t border-[#F4F1EA]/10" style={canvasSectionStyle("skills")} data-canvas-selected={selectedCanvasSection === "skills" ? "true" : "false"}>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-[#A09C94] mb-2.5">
                    {t("أنظمة الـ CRM والاتصال المعتمدة:", "CERTIFIED CRM & VOIP STACK:")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((crm) => (
                      <span
                        key={crm}
                        className="rounded-lg border border-[#C89D66]/35 bg-[#181815] px-3 py-1 font-mono text-xs text-[#F4F1EA]"
                      >
                        ✓ {crm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Wameed Closed Deals & Campaigns */}
            <div data-canvas-section="projects" className="portfolio-canvas-section grid grid-cols-1 md:grid-cols-2 gap-6" style={canvasSectionStyle("projects")} data-canvas-selected={selectedCanvasSection === "projects" ? "true" : "false"}>
              {data.projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveProject(proj);
                    setActiveImageIdx(0);
                  }}
                  className="cursor-pointer rounded-3xl border border-[#F4F1EA]/10 bg-[#121210] overflow-hidden hover:border-[#C89D66] transition"
                >
                  <div className="relative h-52 w-full">
                    <Image
                      src={proj.images[0] || data.cover}
                      alt={t(proj.title.ar, proj.title.en)}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute top-3 end-3 rounded-lg bg-emerald-500 px-3 py-1 font-mono text-xs font-extrabold text-[#0A0A09]">
                      {proj.metrics}
                    </span>
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="arabic-diacritics text-xl font-bold">
                      {t(proj.title.ar, proj.title.en)}
                    </h3>
                    <p className="text-sm text-[#A09C94]">{t(proj.desc.ar, proj.desc.en)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Wameed Sales Leadership Timeline & External Links */}
            {data.timeline && data.timeline.length > 0 && (
              <div data-canvas-section="timeline" className="portfolio-canvas-section rounded-3xl border border-[#F4F1EA]/10 bg-[#121210] p-7 space-y-5" style={canvasSectionStyle("timeline")} data-canvas-selected={selectedCanvasSection === "timeline" ? "true" : "false"}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="arabic-diacritics text-xl sm:text-2xl font-bold">
                    {t("سجل الإنجازات البيعية وقيادة فرق الإيرادات", "Revenue Leadership & Quota Attainment Record")}
                  </h2>
                  {data.links && data.links.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {data.links.map((l, i) => (
                        <a
                          key={i}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#C89D66]/40 bg-[#181815] px-3.5 py-1.5 text-xs font-bold text-[#C89D66]"
                        >
                          <span>{l.label}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {data.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[#F4F1EA]/8 bg-[#181815] p-5 space-y-1.5"
                    >
                      <span className="font-mono text-xs text-[#C89D66]">{item.year}</span>
                      <h3 className="arabic-diacritics text-lg font-bold">
                        {t(item.role.ar, item.role.en)}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-400">
                        {t(item.org.ar, item.org.en)}
                      </p>
                      <p className="text-sm text-[#A09C94]">{t(item.summary.ar, item.summary.en)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TEMPLATE 6: SALAM (سَلَام) — MarTech, Digital Marketing Tech & Growth
         ===================================================================== */}
      {activeTemplate === "salam" && (
        <div data-canvas-template-root className="bg-[#F7F5F0] text-[#141413] min-h-screen py-12 px-4 sm:px-8">
          <div className="mx-auto max-w-7xl space-y-10">
            {/* MarTech Hero Header */}
            <div data-canvas-section="hero" className="portfolio-canvas-section rounded-3xl bg-[#141413] text-[#F4F1EA] p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center" style={canvasSectionStyle("hero")} data-canvas-selected={selectedCanvasSection === "hero" ? "true" : "false"}>
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#C89D66]/20 border border-[#C89D66]/40 px-3.5 py-1 font-mono text-xs text-[#C89D66]">
                  <Workflow className="h-3.5 w-3.5" />
                  <span>MARTECH • GROWTH ENGINEERING • DATA SCRAPING</span>
                </div>
                <h1 className="arabic-diacritics text-3xl sm:text-5xl font-extrabold">
                  {t(data.name.ar, data.name.en)}
                </h1>
                <p className="text-lg text-[#C89D66] font-medium">
                  {t(data.title.ar, data.title.en)}
                </p>
                <p className="text-sm sm:text-base text-[#A09C94] max-w-2xl leading-relaxed">
                  {t(data.bio.ar, data.bio.en)}
                </p>
                {data.links && data.links.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {data.links.map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#F4F1EA]/15 bg-[#1C1C19] px-3.5 py-2 text-xs font-bold text-[#F4F1EA] hover:border-[#C89D66]"
                      >
                        <span>{l.label}</span>
                        <ExternalLink className="h-3 w-3 text-[#C89D66]" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div data-canvas-section="metrics" className="portfolio-canvas-section lg:col-span-4 grid grid-cols-2 gap-3" style={canvasSectionStyle("metrics")} data-canvas-selected={selectedCanvasSection === "metrics" ? "true" : "false"}>
                {(data.metrics || []).map((m, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[#F4F1EA]/12 bg-[#1C1C19] p-4"
                  >
                    <p className="font-mono text-2xl sm:text-3xl font-black text-[#C89D66]">
                      {m.value}
                    </p>
                    <p className="text-[11px] text-[#A09C94] mt-1">
                      {t(m.label.ar, m.label.en)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Automation & Data Scraping Pipeline Nodes */}
            <div data-canvas-section="projects" className="portfolio-canvas-section rounded-3xl border border-[#141413]/15 bg-[#EFECE6] p-7 sm:p-9 space-y-6" style={canvasSectionStyle("projects")} data-canvas-selected={selectedCanvasSection === "projects" ? "true" : "false"}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-[#1E3A2F] font-bold">
                    INTERACTIVE AUTOMATION & DATA PIPELINE NODES
                  </span>
                  <h2 className="arabic-diacritics text-2xl font-extrabold mt-1">
                    {t(
                      "خريطة مسارات الأتمتة واستخراج البيانات والتتبع السحابي",
                      "Live MarTech Scraping, Enrichment & Server-Side Attribution Graph"
                    )}
                  </h2>
                </div>
                <span className="font-mono text-xs text-[#5E5B55]">
                  {t("اضغط على أي عقدة لمعاينة البيانات", "Click any node to inspect payload")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  {
                    id: 0,
                    titleAr: "١. استخراج البيانات",
                    titleEn: "1. Web Scraper",
                    tool: "Playwright + Apify",
                    payload: '{ "scraped_domains": 12400, "verified_b2b": "98.4%" }',
                  },
                  {
                    id: 1,
                    titleAr: "٢. إثراء الذكاء الاصطناعي",
                    titleEn: "2. AI Enrichment",
                    tool: "Clay.com + n8n",
                    payload: '{ "intent_score": 92, "decision_maker": "CMO / VP Growth" }',
                  },
                  {
                    id: 2,
                    titleAr: "٣. التتبع السحابي",
                    titleEn: "3. Server-Side GTM",
                    tool: "Cloudflare + sGTM",
                    payload: '{ "event": "Purchase", "emq_score": 9.3, "cookie_lifetime": "400d" }',
                  },
                  {
                    id: 3,
                    titleAr: "٤. مزامنة الإعلانات والـ CRM",
                    titleEn: "4. CAPI & CRM Sync",
                    tool: "Meta/TikTok CAPI + HubSpot",
                    payload: '{ "capi_match": "99.2%", "roas_lift": "+134%" }',
                  },
                  {
                    id: 4,
                    titleAr: "٥. تحليل العائد المالي",
                    titleEn: "5. SQL Attribution",
                    tool: "BigQuery + Looker",
                    payload: '{ "blended_roas": "6.8x", "cac_delta": "-44%" }',
                  },
                ].map((node) => {
                  const selected = activePipelineNode === node.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      data-testid={`salam-node-${node.id}`}
                      onClick={() => setActivePipelineNode(node.id)}
                      className={`text-start rounded-2xl p-4 border transition cursor-pointer ${
                        selected
                          ? "bg-[#1E3A2F] text-[#F4F1EA] border-[#1E3A2F] shadow-lg"
                          : "bg-[#F7F5F0] text-[#141413] border-[#141413]/15 hover:border-[#9A7B4F]"
                      }`}
                    >
                      <p className="font-mono text-[11px] opacity-75">{node.tool}</p>
                      <p className="arabic-diacritics font-bold text-sm mt-1">
                        {t(node.titleAr, node.titleEn)}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div
                dir="ltr"
                className="rounded-2xl bg-[#141413] text-emerald-400 p-4 font-mono text-xs overflow-x-auto"
              >
                <span className="text-[#C89D66]">NODE_INSPECTOR[{activePipelineNode}] $ </span>
                {
                  [
                    '{ "stage": "Playwright Cluster", "scraped_profiles": "250,000/mo", "proxy_rotation": "healthy" }',
                    '{ "stage": "Clay + n8n Webhook", "waterfall_enrichment": "96.8% valid emails", "ai_personalization": "active" }',
                    '{ "stage": "Server-Side GTM", "first_party_cookie": "taqdom_fp_id", "meta_capi_emq": "9.4/10" }',
                    '{ "stage": "HubSpot + Ad Networks", "offline_conversion_sync": "real-time (<120ms)", "cpa_reduction": "-44%" }',
                    '{ "stage": "BigQuery Multi-Touch Attribution", "blended_roas": "6.8x", "incremental_revenue": "$1.85M" }',
                  ][activePipelineNode]
                }
              </div>
            </div>

            {/* Interactive CRO Before / After Comparator */}
            <div className="rounded-3xl border border-[#141413]/15 bg-[#EFECE6] p-7 sm:p-9 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-[#9A7B4F] font-bold">
                    CONVERSION RATE OPTIMIZATION (CRO BEFORE / AFTER)
                  </span>
                  <h2 className="arabic-diacritics text-2xl font-extrabold mt-1">
                    {t(
                      "مقارنة تفاعلية قبل/بعد لهندسة التحويل والتتبع",
                      "Interactive CRO & Attribution Before / After Comparison"
                    )}
                  </h2>
                </div>
                <div className="flex rounded-xl bg-[#F7F5F0] p-1 border border-[#141413]/15">
                  {(["before", "split", "after"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCroMode(m)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase cursor-pointer ${
                        croMode === m
                          ? "bg-[#141413] text-[#F7F5F0]"
                          : "text-[#5E5B55]"
                      }`}
                    >
                      {m === "before"
                        ? t("قبل (Before)", "Before")
                        : m === "after"
                        ? t("بعد (After)", "After")
                        : t("مقارنة جنباً لجنب", "Split View")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(croMode === "before" || croMode === "split") && (
                  <div className="rounded-2xl border border-red-800/25 bg-[#F7F5F0] p-6 space-y-3">
                    <span className="inline-block rounded-md bg-red-500/15 px-2.5 py-1 font-mono text-xs font-bold text-red-700">
                      {t("قبل: تتبع تقليدي ومسار بطيء", "BEFORE: LEGACY PIXEL & SLOW FUNNEL")}
                    </span>
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div>
                        <p className="font-mono text-2xl font-bold text-red-700">1.4%</p>
                        <p className="text-[11px] text-[#5E5B55]">Conversion Rate</p>
                      </div>
                      <div>
                        <p className="font-mono text-2xl font-bold text-red-700">2.4x</p>
                        <p className="text-[11px] text-[#5E5B55]">Reported ROAS</p>
                      </div>
                      <div>
                        <p className="font-mono text-2xl font-bold text-red-700">42%</p>
                        <p className="text-[11px] text-[#5E5B55]">Lost iOS Signals</p>
                      </div>
                    </div>
                  </div>
                )}

                {(croMode === "after" || croMode === "split") && (
                  <div className="rounded-2xl border-2 border-[#1E3A2F] bg-[#F7F5F0] p-6 space-y-3">
                    <span className="inline-block rounded-md bg-[#1E3A2F] px-2.5 py-1 font-mono text-xs font-bold text-[#F4F1EA]">
                      {t(
                        "بعد: هندسة MarTech وتتبع Server-Side",
                        "AFTER: SERVER-SIDE CAPI + ENGINEERED CRO"
                      )}
                    </span>
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div>
                        <p className="font-mono text-2xl font-extrabold text-[#1E3A2F]">3.98%</p>
                        <p className="text-[11px] text-[#5E5B55]">Conversion (+184%)</p>
                      </div>
                      <div>
                        <p className="font-mono text-2xl font-extrabold text-[#1E3A2F]">6.8x</p>
                        <p className="text-[11px] text-[#5E5B55]">Verified ROAS</p>
                      </div>
                      <div>
                        <p className="font-mono text-2xl font-extrabold text-[#1E3A2F]">99.2%</p>
                        <p className="text-[11px] text-[#5E5B55]">Signal Recovery</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* MarTech & Marketing Engineering Tool Matrix (مصفوفة أدوات الـ MarTech والبرمجة التسويقية) */}
            {skillsList.length > 0 && (
              <div
                data-testid="salam-martech-matrix"
                className="portfolio-canvas-section rounded-3xl border border-[#141413]/15 bg-[#EFECE6] p-7 sm:p-9 space-y-4" data-canvas-section="skills" style={canvasSectionStyle("skills")} data-canvas-selected={selectedCanvasSection === "skills" ? "true" : "false"}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-[#1E3A2F] font-bold">
                      MARTECH & MARKETING ENGINEERING TOOL MATRIX
                    </span>
                    <h2 className="arabic-diacritics text-2xl font-extrabold mt-1">
                      {t(
                        "مصفوفة أدوات الـ MarTech والبرمجة التسويقية واستخراج البيانات",
                        "MarTech Stack, Scraping Engines & Attribution Infrastructure"
                      )}
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#1E3A2F] px-3 py-1 font-mono text-xs font-bold text-[#F4F1EA]">
                    {skillsList.length} VERIFIED TOOLS
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {skillsList.map((tool, i) => (
                    <div
                      key={tool}
                      className="rounded-2xl bg-[#F7F5F0] border border-[#141413]/12 p-4 flex flex-col justify-between gap-2 hover:border-[#1E3A2F] transition"
                    >
                      <span className="font-mono text-[10px] text-[#9A7B4F]">
                        STACK 0{i + 1}
                      </span>
                      <p className="font-mono text-xs font-bold text-[#141413]">{tool}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MarTech Projects */}
            <div data-canvas-section="projects" className="portfolio-canvas-section grid grid-cols-1 md:grid-cols-2 gap-6" style={canvasSectionStyle("projects")} data-canvas-selected={selectedCanvasSection === "projects" ? "true" : "false"}>
              {data.projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveProject(proj);
                    setActiveImageIdx(0);
                  }}
                  className="cursor-pointer rounded-3xl border border-[#141413]/15 bg-[#EFECE6] overflow-hidden hover:border-[#1E3A2F] transition"
                >
                  <div className="relative h-56 w-full">
                    <Image
                      src={proj.images[0] || data.cover}
                      alt={t(proj.title.ar, proj.title.en)}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <span className="font-mono text-xs font-bold text-[#1E3A2F]">
                      {proj.metrics}
                    </span>
                    <h3 className="arabic-diacritics text-xl font-bold">
                      {t(proj.title.ar, proj.title.en)}
                    </h3>
                    <p className="text-sm text-[#5E5B55]">{t(proj.desc.ar, proj.desc.en)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* MarTech Growth Engineering Timeline */}
            {data.timeline && data.timeline.length > 0 && (
              <div data-canvas-section="timeline" className="portfolio-canvas-section rounded-3xl border border-[#141413]/15 bg-[#EFECE6] p-7 sm:p-9 space-y-5" style={canvasSectionStyle("timeline")} data-canvas-selected={selectedCanvasSection === "timeline" ? "true" : "false"}>
                <h2 className="arabic-diacritics text-2xl font-extrabold">
                  {t("المسيرة المهنية في هندسة النمو وتكنولوجيا التسويق", "MarTech & Growth Engineering Track Record")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {data.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-[#F7F5F0] border border-[#141413]/12 p-5 space-y-1.5"
                    >
                      <span className="font-mono text-xs font-bold text-[#9A7B4F]">{item.year}</span>
                      <h3 className="arabic-diacritics text-lg font-bold">
                        {t(item.role.ar, item.role.en)}
                      </h3>
                      <p className="text-xs font-semibold text-[#1E3A2F]">
                        {t(item.org.ar, item.org.en)}
                      </p>
                      <p className="text-sm text-[#5E5B55]">{t(item.summary.ar, item.summary.en)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TEMPLATE 7: MESHWAR (مِشْوَار) — Human-Centric HR & Talent Acquisition
         ===================================================================== */}
      {activeTemplate === "meshwar" && (
        <div data-canvas-template-root className="bg-[#F7F5F0] text-[#141413] min-h-screen py-12 px-4 sm:px-8">
          <div className="mx-auto max-w-6xl space-y-12">
            {/* Warm Human-Centric HR Hero */}
            <div data-canvas-section="hero" className="portfolio-canvas-section rounded-3xl bg-[#EFECE6] border border-[#141413]/12 p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center" style={canvasSectionStyle("hero")} data-canvas-selected={selectedCanvasSection === "hero" ? "true" : "false"}>
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#9A7B4F]/15 border border-[#9A7B4F]/40 px-4 py-1 text-xs font-bold text-[#9A7B4F]">
                  <HeartHandshake className="h-4 w-4" />
                  <span>
                    {data.badge
                      ? t(data.badge.ar, data.badge.en)
                      : t("مِشْوَار بناء الفرق واستقطاب المواهب", "Human-Centric People & Talent Architecture")}
                  </span>
                </div>
                <h1 className="arabic-diacritics text-3xl sm:text-5xl font-extrabold text-[#141413]">
                  {t(data.name.ar, data.name.en)}
                </h1>
                <p className="text-lg font-semibold text-[#1E3A2F]">
                  {t(data.title.ar, data.title.en)}
                </p>
                <p className="text-sm sm:text-base text-[#5E5B55] leading-relaxed">
                  {t(data.bio.ar, data.bio.en)}
                </p>
                {data.links && data.links.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {data.links.map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#141413]/15 bg-[#F7F5F0] px-3.5 py-2 text-xs font-bold text-[#141413] hover:border-[#9A7B4F]"
                      >
                        <span>{l.label}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#9A7B4F]" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="lg:col-span-4 flex flex-col items-center">
                <div className="relative h-44 w-44 rounded-full overflow-hidden border-4 border-[#9A7B4F] shadow-xl">
                  <Image
                    src={data.avatar}
                    alt={t(data.name.ar, data.name.en)}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Hiring Impact Scorecards */}
            {data.metrics && (
              <div data-canvas-section="metrics" className="portfolio-canvas-section grid grid-cols-2 lg:grid-cols-4 gap-5" style={canvasSectionStyle("metrics")} data-canvas-selected={selectedCanvasSection === "metrics" ? "true" : "false"}>
                {data.metrics.map((m, i) => (
                  <div
                    key={i}
                    className="rounded-3xl bg-[#EFECE6] border border-[#141413]/10 p-6 text-center"
                  >
                    <p className="font-mono text-3xl sm:text-4xl font-extrabold text-[#9A7B4F]">
                      {m.value}
                    </p>
                    <p className="mt-1.5 text-xs font-bold text-[#141413]">
                      {t(m.label.ar, m.label.en)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Talent & Culture Journey Timeline ("مِشْوَار") */}
            {data.timeline && (
              <div data-canvas-section="timeline" className="portfolio-canvas-section rounded-3xl bg-[#EFECE6] border border-[#141413]/12 p-8 sm:p-10 space-y-6" style={canvasSectionStyle("timeline")} data-canvas-selected={selectedCanvasSection === "timeline" ? "true" : "false"}>
                <div className="flex items-center gap-2.5">
                  <Users className="h-5 w-5 text-[#9A7B4F]" />
                  <h2 className="arabic-diacritics text-2xl sm:text-3xl font-extrabold">
                    {t("خط زمني لـ «مِشْوَار» بناء الفرق وثقافة الشركات", "Talent & Culture Journey Timeline")}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-[#F7F5F0] border border-[#141413]/10 p-6 space-y-2"
                    >
                      <span className="font-mono text-xs font-bold text-[#9A7B4F]">
                        {item.year}
                      </span>
                      <h3 className="arabic-diacritics text-lg font-bold">
                        {t(item.role.ar, item.role.en)}
                      </h3>
                      <p className="text-xs font-semibold text-[#1E3A2F]">
                        {t(item.org.ar, item.org.en)}
                      </p>
                      <p className="text-sm text-[#5E5B55] leading-relaxed">
                        {t(item.summary.ar, item.summary.en)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HR Tech & People Ops Competency Matrix */}
            {skillsList.length > 0 && (
              <div data-canvas-section="skills" className="portfolio-canvas-section rounded-3xl bg-[#EFECE6] border border-[#141413]/12 p-7" style={canvasSectionStyle("skills")} data-canvas-selected={selectedCanvasSection === "skills" ? "true" : "false"}>
                <p className="font-mono text-xs uppercase tracking-widest text-[#9A7B4F] mb-3">
                  {t("منظومات الموارد البشرية واستقطاب الكفاءات المعتمدة", "PEOPLE OPS, ATS & TALENT ARCHITECTURE MATRIX")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl bg-[#F7F5F0] border border-[#141413]/12 px-3.5 py-1.5 font-mono text-xs font-semibold text-[#141413]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* HR Programs & Case Studies */}
            <div data-canvas-section="projects" className="portfolio-canvas-section grid grid-cols-1 md:grid-cols-2 gap-6" style={canvasSectionStyle("projects")} data-canvas-selected={selectedCanvasSection === "projects" ? "true" : "false"}>
              {data.projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveProject(proj);
                    setActiveImageIdx(0);
                  }}
                  className="cursor-pointer rounded-3xl bg-[#EFECE6] border border-[#141413]/12 overflow-hidden hover:border-[#9A7B4F] transition"
                >
                  <div className="relative h-52 w-full">
                    <Image
                      src={proj.images[0] || data.cover}
                      alt={t(proj.title.ar, proj.title.en)}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <span className="font-mono text-xs font-bold text-[#9A7B4F]">
                      {proj.metrics}
                    </span>
                    <h3 className="arabic-diacritics text-xl font-bold">
                      {t(proj.title.ar, proj.title.en)}
                    </h3>
                    <p className="text-sm text-[#5E5B55]">{t(proj.desc.ar, proj.desc.en)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Embedded Interactive Career Consultation & Talent Nomination Form */}
            <div data-canvas-section="contact" className="portfolio-canvas-section rounded-3xl bg-[#141413] text-[#F4F1EA] p-8 sm:p-10" style={canvasSectionStyle("contact")} data-canvas-selected={selectedCanvasSection === "contact" ? "true" : "false"}>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <CalendarCheck className="h-7 w-7 text-[#C89D66] mx-auto" />
                  <h2 className="arabic-diacritics text-2xl sm:text-3xl font-extrabold">
                    {t(
                      "احجز جلسة استشارة مهنية أو رشّح موهبة لفريقك",
                      "Book a Career Advisory Session or Nominate Tech Talent"
                    )}
                  </h2>
                </div>

                <div className="flex rounded-2xl bg-[#1C1C19] p-1">
                  <button
                    type="button"
                    onClick={() => setHrBookingMode("advisory")}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold cursor-pointer ${
                      hrBookingMode === "advisory"
                        ? "bg-[#C89D66] text-[#0A0A09]"
                        : "text-[#A09C94]"
                    }`}
                  >
                    {t("مراجعة المسار المهني والسيرة الذاتية", "1:1 Career & CV Advisory")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHrBookingMode("hiring")}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold cursor-pointer ${
                      hrBookingMode === "hiring"
                        ? "bg-[#C89D66] text-[#0A0A09]"
                        : "text-[#A09C94]"
                    }`}
                  >
                    {t("طلب توظيف أو ترشيح كفاءات", "Request / Nominate Talent")}
                  </button>
                </div>

                {hrSubmitted ? (
                  <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/40 p-5 text-center space-y-2">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
                    <p className="font-bold text-sm">
                      {t(
                        "تم استلام طلبك بنجاح! ستتواصل معك نورا خلال ٢٤ ساعة.",
                        "Your request has been scheduled! We will reach out within 24 hours."
                      )}
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setHrSubmitted(true);
                      toast.success(
                        t("تم تأكيد حجز جلسة الاستشارة المهنية!", "Consultation request confirmed!")
                      );
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <input
                      type="text"
                      required
                      value={hrVisitorName}
                      onChange={(e) => setHrVisitorName(e.target.value)}
                      placeholder={t("الاسم الكامل", "Your Full Name")}
                      className="rounded-xl border border-[#F4F1EA]/15 bg-[#1C1C19] px-4 py-3 text-sm text-[#F4F1EA]"
                    />
                    <input
                      type="text"
                      required
                      value={hrVisitorRole}
                      onChange={(e) => setHrVisitorRole(e.target.value)}
                      placeholder={
                        hrBookingMode === "advisory"
                          ? t("التخصص / المسمى الوظيفي", "Target Role / Specialty")
                          : t("اسم الشركة والوظيفة المطلوبة", "Company & Open Role")
                      }
                      className="rounded-xl border border-[#F4F1EA]/15 bg-[#1C1C19] px-4 py-3 text-sm text-[#F4F1EA]"
                    />
                    <button
                      type="submit"
                      data-testid="meshwar-book-btn"
                      className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#C89D66] py-3.5 text-sm font-extrabold text-[#0A0A09] cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      <span>
                        {hrBookingMode === "advisory"
                          ? t("تأكيد حجز جلسة الاستشارة", "Confirm Advisory Session")
                          : t("إرسال طلب استقطاب الكفاءات", "Submit Talent Mandate")}
                      </span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared High-Resolution Project Lightbox Modal */}
      {activeProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-8"
          onClick={() => setActiveProject(null)}
        >
          <div
            className="relative max-w-5xl w-full rounded-3xl overflow-hidden bg-[#121210] border border-[#C89D66]/40 text-[#F4F1EA] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F4F1EA]/10">
              <div>
                <h3 className="arabic-diacritics text-lg sm:text-xl font-bold">
                  {t(activeProject.title.ar, activeProject.title.en)}
                </h3>
                <p className="text-xs text-[#C89D66] font-mono">
                  {activeProject.year} {activeProject.metrics ? `• ${activeProject.metrics}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveProject(null)}
                className="rounded-xl bg-[#181815] p-2 text-[#F4F1EA] hover:bg-[#C89D66] hover:text-[#0A0A09] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative h-[340px] sm:h-[480px] w-full bg-[#0A0A09]">
              <Image
                src={
                  activeProject.images[activeImageIdx] ||
                  activeProject.images[0] ||
                  data.cover
                }
                alt={t(activeProject.title.ar, activeProject.title.en)}
                fill
                className="object-cover"
              />
            </div>

            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-[#A09C94] max-w-2xl">
                {t(activeProject.desc.ar, activeProject.desc.en)}
              </p>
              {activeProject.images.length > 1 && (
                <div className="flex gap-2 shrink-0">
                  {activeProject.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative h-14 w-20 rounded-xl overflow-hidden border-2 ${
                        idx === activeImageIdx ? "border-[#C89D66]" : "border-transparent opacity-60"
                      }`}
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sovereign Subdomain Footer Stamp */}
      <footer className="royal-portfolio-credit py-5 px-6 border-t border-current/10 text-center text-[10px] opacity-70">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TaqdomLogo size={24} showWordmark={false} />
            <span className="arabic-diacritics font-bold">
              {t("مدعوم بواسطة تقدّم", "Powered by Taqdom")}
            </span>
          </div>
          <span dir="ltr" className="font-mono text-[#9A7B4F] dark:text-[#C89D66]">
            https://{subdomainDisplay}
          </span>
        </div>
      </footer>
    </div>
  );
}
