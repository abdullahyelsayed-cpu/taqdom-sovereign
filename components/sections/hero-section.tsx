"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sparkles,
  ArrowUpLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Globe2,
  Layers,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { normalizeUsername, validateUsername, getSubdomainUrl } from "@/lib/types";
import { useTaqdomStore } from "@/lib/store";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";

const PORTAL_SHOWCASE_PLATES = [
  {
    src: "/images/ultra/madar-hero.webp",
    titleAr: "مَدَار • علوم الحاسب والذكاء الاصطناعي",
    titleEn: "Orbit • Tech & AI",
    creator: "youssef.taqdom.me",
    tag: "BENTO + CMD+K",
  },
  {
    src: "/images/ultra/athar-hero.webp",
    titleAr: "أَثَر • إخراج بصري وسينمائي",
    titleEn: "Frame • Visual stories",
    creator: "farida.taqdom.me",
    tag: "2.39:1 REEL",
  },
  {
    src: "/images/ultra/haven-hero.webp",
    titleAr: "مَلاذ • عمارة وهندسة تطبيقية",
    titleEn: "Forma • Space & design",
    creator: "layla.taqdom.me",
    tag: "SPATIAL PLATES",
  },
  {
    src: "/images/ultra/siyada-hero.webp",
    titleAr: "سِيَادَة • القانون وإدارة الأعمال",
    titleEn: "Index • Research & strategy",
    creator: "karim.taqdom.me",
    tag: "CASE STUDIES",
  },
  {
    src: "/images/ultra/wameed-hero.webp",
    titleAr: "وَمِيض • التلي سيلز وإغلاق الصفقات",
    titleEn: "Pulse • Sales & outcomes",
    creator: "tariq.taqdom.me",
    tag: "SALES CASE STUDY",
  },
  {
    src: "/images/ultra/salam-hero.webp",
    titleAr: "سَلَام • تكنولوجيا التسويق والنمو",
    titleEn: "Flux • Growth & systems",
    creator: "salma.taqdom.me",
    tag: "GROWTH SYSTEMS",
  },
  {
    src: "/images/ultra/meshwar-hero.webp",
    titleAr: "مِشْوَار • الموارد البشرية والمواهب",
    titleEn: "Kin • People & culture",
    creator: "nora.taqdom.me",
    tag: "PEOPLE & CULTURE",
  },
];

export function HeroSection() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const setDraft = useTaqdomStore((s) => s.setDraft);

  const portalSectionRef = useRef<HTMLDivElement | null>(null);
  const portalPinWrapRef = useRef<HTMLDivElement | null>(null);
  const portalFrameRef = useRef<HTMLDivElement | null>(null);
  const portalImageWrapRef = useRef<HTMLDivElement | null>(null);

  const [claimedInput, setClaimedInput] = useState("");
  const [activePortalSlide, setActivePortalSlide] = useState(2); // Default to Haven (layla)
  const [portalProgress, setPortalProgress] = useState(0);
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

  // GSAP ScrollTrigger Pinned Camera Portal animation
  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    const pinWrap = portalPinWrapRef.current;
    const frame = portalFrameRef.current;
    const imgWrap = portalImageWrapRef.current;
    const section = portalSectionRef.current;
    if (!pinWrap || !frame || !section) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinWrap,
          start: "top 12%",
          end: "+=420",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          onUpdate: (self) => {
            setPortalProgress(Math.round(self.progress * 100));
          },
        },
      });

      tl.fromTo(
        frame,
        { scale: 0.92, borderRadius: "28px" },
        {
          scale: 1,
          borderRadius: "20px",
          ease: "power2.out",
          duration: 1,
        },
        0
      );

      if (imgWrap) {
        tl.fromTo(
          imgWrap,
          { scale: 1.1 },
          { scale: 1, ease: "power2.out", duration: 1 },
          0
        );
      }
    }, section);

    return () => ctx.revert();
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
        messageAr: "اكتب اسمًا لرابطك الشخصي على Taqdom",
        messageEn: "Choose a username for your personal Taqdom address",
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

  const currentPortal = PORTAL_SHOWCASE_PLATES[activePortalSlide] || PORTAL_SHOWCASE_PLATES[0];

  return (
    <section
      id="hero"
      ref={portalSectionRef}
      className="relative min-h-screen pt-28 pb-20 md:pt-32 md:pb-28 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top creator-first eyebrow */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#9A7B4F]/40 bg-[#9A7B4F]/10 px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#9A7B4F] dark:text-[#C89D66]" />
            <span>
              {t(
                "مساحة لأفكارك ومشاريعك • ٧ ستايلات تختار منها",
                "A creative home for what you make • 7 distinct portfolio styles"
              )}
            </span>
          </div>

          {/* Monumental Bilingual Headline */}
          <h1 className="arabic-diacritics mt-6 max-w-5xl text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground">
            {lang === "ar" ? (
              <>
                تَقَدُّم — خلّي شغلك يتكلم <span className="gold-shimmer-text">عنّك</span>
              </>
            ) : (
              <>
                TAQDOM — A home for{" "}
                <span className="gold-shimmer-text editorial-serif italic">
                  what you make.
                </span>
              </>
            )}
          </h1>

          <p className="mt-5 max-w-3xl text-base sm:text-lg md:text-xl leading-relaxed text-muted-foreground">
            {t(
              "مساحة شخصية تعرض فيها مشاريعك وأفكارك ومهاراتك بطريقتك. اختَر ستايل يناسبك، عدّل كل تفصيلة، وشارك رابطك الخاص وقت ما تكون جاهز.",
              "A personal space for your projects, ideas, and skills. Pick a style, make it yours, and share your own link when you are ready."
            )}
          </p>
        </div>

        {/* Personal address preview */}
        <div className="mx-auto max-w-3xl mb-10">
          <form
            onSubmit={handleLaunchStudio}
            className="glass-panel rounded-2xl p-3 sm:p-4 shadow-2xl border border-[#9A7B4F]/35"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div
                dir="ltr"
                className="flex-1 flex items-center gap-2 rounded-xl bg-background/95 border border-border px-4 py-3"
              >
                <Globe2 className="h-5 w-5 text-[#9A7B4F] dark:text-[#C89D66] shrink-0" />
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
                  className="shrink-0 font-mono text-xs sm:text-sm font-bold text-[#9A7B4F] dark:text-[#C89D66]"
                >
                  .taqdom.me
                </span>
              </div>

              <button
                type="submit"
                data-testid="hero-claim-btn"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#141413] dark:bg-[#C89D66] hover:opacity-90 px-6 py-3.5 text-sm font-bold text-[#F7F5F0] dark:text-[#0A0A09] transition shadow-lg shrink-0 cursor-pointer"
              >
                <span>{t("انطلق للاستوديو", "Launch Studio")}</span>
                {lang === "ar" ? (
                  <ArrowUpLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Address preview row */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {t("معاينة رابطك:", "Your address preview:")}
                </span>
                <span
                  dir="ltr"
                  data-testid="hero-subdomain-preview"
                  className="rounded-lg bg-[#9A7B4F]/15 border border-[#9A7B4F]/40 px-2.5 py-1 font-mono font-bold text-foreground"
                >
                  {fullSubdomainPreview}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {availability.available ? (
                  <CheckCircle2 className="h-4 w-4 text-[#1E3A2F] dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-[#9A7B4F] dark:text-[#C89D66]" />
                )}
                <span className="font-medium text-muted-foreground">
                  {t(availability.messageAr, availability.messageEn)}
                </span>
              </div>
            </div>
          </form>

          {/* Sample portfolio links */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">
              {t("أمثلة لاستكشاف القوالب:", "Sample portfolios:")}
            </span>
            {(["layla", "youssef", "farida", "karim", "tariq", "salma", "nora"] as const).map(
              (uname) => (
                <Link
                  key={uname}
                  href={getSubdomainUrl(uname, host)}
                  dir="ltr"
                  className="rounded-full border border-border bg-secondary/70 px-3 py-1 font-mono text-[11px] font-semibold text-foreground transition hover:border-[#9A7B4F] hover:bg-[#9A7B4F]/15"
                >
                  {uname}.taqdom.me ↗
                </Link>
              )
            )}
          </div>
        </div>

        {/* Centerpiece: GSAP ScrollTrigger Pinned Architectural Camera Portal */}
        <div ref={portalPinWrapRef} data-testid="pinned-camera-portal" className="relative pt-2">
          <div
            ref={portalFrameRef}
            className="relative rounded-3xl overflow-hidden border border-[#141413]/15 dark:border-[#F4F1EA]/12 bg-[#0A0A09] text-[#F4F1EA] shadow-2xl"
          >
            {/* Portal Top Architectural Frame Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[#F4F1EA]/10 bg-[#121210]">
              <div className="flex items-center gap-3">
                <TaqdomLogo size={30} showWordmark={false} />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C89D66]">
                  TAQDOM SHOWCASE • PICK A WORLD
                </span>
                <span className="hidden md:inline-block rounded-full bg-[#C89D66]/15 border border-[#C89D66]/40 px-2.5 py-0.5 font-mono text-[10px] text-[#C89D66]">
                  PINNED SCROLL {portalProgress}%
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PORTAL_SHOWCASE_PLATES.map((plate, idx) => (
                  <button
                    key={plate.creator}
                    type="button"
                    onClick={() => setActivePortalSlide(idx)}
                    className={`rounded-lg px-2.5 py-1 font-mono text-[11px] transition cursor-pointer ${
                      activePortalSlide === idx
                        ? "bg-[#C89D66] text-[#0A0A09] font-bold"
                        : "bg-[#181815] text-[#A09C94] hover:text-[#F4F1EA]"
                    }`}
                  >
                    0{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Portal Scrub Progress Line */}
            <div className="h-0.5 w-full bg-[#181815]">
              <div
                className="h-full bg-[#C89D66] transition-all duration-150"
                style={{ width: `${Math.max(12, portalProgress)}%` }}
              />
            </div>

            {/* Showcase viewport */}
            <div className="relative min-h-[440px] sm:min-h-[540px] w-full flex flex-col justify-between p-6 sm:p-12 overflow-hidden">
              <div ref={portalImageWrapRef} className="absolute inset-0">
                <Image
                  src={currentPortal.src}
                  alt={t(currentPortal.titleAr, currentPortal.titleEn)}
                  fill
                  priority
                  className="object-cover opacity-65 transition-all duration-700"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A09] via-[#0A0A09]/40 to-transparent" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="rounded-full bg-[#0A0A09]/80 border border-[#C89D66]/50 px-3.5 py-1 font-mono text-xs font-bold text-[#C89D66]">
                  {t("نموذج توضيحي • ", "SAMPLE • ")}{currentPortal.tag}
                </span>
                <Link
                  href={getSubdomainUrl(currentPortal.creator.split(".")[0], host)}
                  dir="ltr"
                  className="rounded-full bg-[#0A0A09]/80 border border-[#F4F1EA]/20 px-4 py-1 font-mono text-xs font-bold text-[#F4F1EA] hover:border-[#C89D66] transition"
                >
                  https://{currentPortal.creator} ↗
                </Link>
              </div>

              <div className="relative z-10 mt-auto pt-32 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#C89D66] mb-2">
                    STYLE 0{activePortalSlide + 1} OF 07
                  </p>
                  <h2 className="arabic-diacritics text-3xl sm:text-5xl font-extrabold text-[#F4F1EA]">
                    {t(currentPortal.titleAr, currentPortal.titleEn)}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={getSubdomainUrl(currentPortal.creator.split(".")[0], host)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#C89D66] px-5 py-3 text-xs sm:text-sm font-bold text-[#0A0A09] shadow-lg hover:opacity-90 transition"
                  >
                    <Compass className="h-4 w-4" />
                    <span>{t("شاهد المثال", "View sample")}</span>
                  </Link>
                  <Link
                    href="/templates"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#F4F1EA]/20 bg-[#121210]/90 px-5 py-3 text-xs sm:text-sm font-bold text-[#F4F1EA] hover:border-[#C89D66] transition"
                  >
                    <Layers className="h-4 w-4 text-[#C89D66]" />
                    <span>{t("تصفح القوالب السبعة", "Inspect All 7 Templates")}</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Portal Bottom Selector Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 border-t border-[#F4F1EA]/10 bg-[#121210]">
              {PORTAL_SHOWCASE_PLATES.map((item, idx) => (
                <button
                  key={item.creator}
                  type="button"
                  onClick={() => setActivePortalSlide(idx)}
                  className={`p-3.5 text-start border-e border-b lg:border-b-0 border-[#F4F1EA]/8 transition cursor-pointer ${
                    activePortalSlide === idx
                      ? "bg-[#181815] text-[#C89D66]"
                      : "text-[#A09C94] hover:text-[#F4F1EA]"
                  }`}
                >
                  <p className="font-mono text-[10px] opacity-75">0{idx + 1}</p>
                  <p className="arabic-diacritics font-bold text-xs truncate mt-0.5">
                    {t(item.titleAr.split("•")[0], item.titleEn.split("•")[0])}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Action Strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 rounded-xl border border-[#9A7B4F]/50 bg-secondary/80 px-6 py-3 text-sm font-bold text-foreground transition hover:border-[#9A7B4F] hover:bg-[#9A7B4F]/15"
          >
            <Layers className="h-4 w-4 text-[#9A7B4F] dark:text-[#C89D66]" />
            <span>{t("استكشف الستايلات السبعة", "Explore all 7 styles")}</span>
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition hover:border-[#9A7B4F]"
          >
            <ShieldCheck className="h-4 w-4 text-[#1E3A2F] dark:text-[#C89D66]" />
            <span>
              {t(
                "استكشف معرضًا تجريبيًا (layla.taqdom.me)",
                "Explore a sample portfolio (layla.taqdom.me)"
              )}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
