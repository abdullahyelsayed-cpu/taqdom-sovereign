"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  User,
  Layers,
  FolderKanban,
  Sparkles,
  Search,
  Globe2,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Rocket,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  Move,
  ImagePlus,
  RotateCcw,
  X,
} from "lucide-react";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";
const PortfolioRenderer = dynamic(
  () => import("@/components/templates/portfolio-renderer").then((module) => module.PortfolioRenderer),
  { ssr: false, loading: () => <div className="min-h-[60vh] w-full animate-pulse rounded-3xl bg-secondary" /> }
);
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";
import { TEMPLATES_CATALOG, SEED_PORTFOLIOS, createStarterPortfolio } from "@/lib/seed-data";
import {
  TemplateId,
  ALL_TEMPLATE_IDS,
  normalizeUsername,
  getSubdomainUrl,
  PortfolioProject,
  CanvasSectionId,
  CanvasSectionLayout,
} from "@/lib/types";

const PRESET_AVATARS = [
  "/images/creators/layla.jpg",
  "/images/creators/youssef.jpg",
  "/images/creators/farida.jpg",
  "/images/creators/karim.jpg",
  "/images/creators/tariq.jpg",
  "/images/creators/salma.jpg",
  "/images/creators/nora.jpg",
  "/images/creators/omar.jpg",
];

const PRESET_PROJECT_IMAGES = [
  "/images/ultra/haven-hero.webp",
  "/images/ultra/haven-1.webp",
  "/images/ultra/madar-hero.webp",
  "/images/ultra/madar-1.webp",
  "/images/ultra/athar-hero.webp",
  "/images/ultra/athar-1.webp",
  "/images/ultra/siyada-hero.webp",
  "/images/ultra/wameed-hero.webp",
  "/images/ultra/salam-hero.webp",
  "/images/ultra/meshwar-hero.webp",
];

const ACCENT_PRESETS = [
  { name: "Electric Violet", hex: "#A78BFA" },
  { name: "Coral Pulse", hex: "#FF8396" },
  { name: "Mint Signal", hex: "#7EE7C4" },
  { name: "Skyline Blue", hex: "#87A8FF" },
];

const CANVAS_SECTIONS: { id: CanvasSectionId; labelAr: string; labelEn: string }[] = [
  { id: "hero", labelAr: "المقدمة", labelEn: "Hero" },
  { id: "metrics", labelAr: "الإحصائيات", labelEn: "Metrics" },
  { id: "skills", labelAr: "المهارات", labelEn: "Skills" },
  { id: "projects", labelAr: "المشاريع", labelEn: "Projects" },
  { id: "timeline", labelAr: "المسيرة", labelEn: "Timeline" },
  { id: "contact", labelAr: "التواصل", labelEn: "Contact" },
];

const CANVAS_SECTIONS_BY_TEMPLATE: Record<TemplateId, CanvasSectionId[]> = {
  madar: ["hero", "metrics", "skills", "projects", "timeline"],
  athar: ["hero", "metrics", "projects", "skills", "timeline"],
  haven: ["hero", "metrics", "projects", "skills", "timeline"],
  siyada: ["hero", "metrics", "projects", "timeline"],
  wameed: ["hero", "metrics", "skills", "projects", "timeline"],
  salam: ["hero", "metrics", "skills", "projects", "timeline"],
  meshwar: ["hero", "metrics", "skills", "projects", "timeline", "contact"],
};

const DEFAULT_CANVAS_LAYOUT: CanvasSectionLayout = { x: 0, y: 0, width: 100, scale: 1 };

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read image"));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

type StudioTab = "identity" | "template" | "projects" | "canvas" | "look3d" | "seo" | "domain";

function StudioContent() {
  const { lang, toggleLang, t } = useLanguage();
  const searchParams = useSearchParams();

  const draft = useTaqdomStore((s) => s.draft);
  const setDraft = useTaqdomStore((s) => s.setDraft);
  const switchTemplate = useTaqdomStore((s) => s.switchTemplate);
  const undo = useTaqdomStore((s) => s.undo);
  const redo = useTaqdomStore((s) => s.redo);
  const pastDrafts = useTaqdomStore((s) => s.pastDrafts);
  const futureDrafts = useTaqdomStore((s) => s.futureDrafts);
  const publishCurrentDraft = useTaqdomStore((s) => s.publishCurrentDraft);

  const [activeTab, setActiveTab] = useState<StudioTab>("identity");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewLang, setPreviewLang] = useState<"ar" | "en">("ar");
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccessUrl, setPublishedSuccessUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [host, setHost] = useState("taqdom.me");
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [canvasArrangeMode, setCanvasArrangeMode] = useState(false);
  const [selectedCanvasSection, setSelectedCanvasSection] = useState<CanvasSectionId>("hero");
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const canvasStageRef = useRef<HTMLElement | null>(null);
  const canvasDragRef = useRef<{
    element: HTMLElement;
    id: CanvasSectionId;
    pointerId: number;
    mode: "move" | "resize";
    startX: number;
    startY: number;
    base: CanvasSectionLayout;
    stageWidth: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  useEffect(() => {
    setSelectedCanvasSection("hero");
    setCanvasArrangeMode(false);
  }, [draft.template]);

  // Apply URL query parameters (?template=... & ?u=...) and fetch user's draft from server
  useEffect(() => {
    const tplParam = searchParams.get("template") as TemplateId | null;
    const uParam = searchParams.get("u");
    const validTpl =
      tplParam && (ALL_TEMPLATE_IDS as readonly string[]).includes(tplParam)
        ? tplParam
        : null;

    if (validTpl && !uParam) {
      switchTemplate(validTpl);
    }

    if (uParam) {
      const clean = normalizeUsername(uParam);
      if (clean.length >= 3) {
        let cancelled = false;
        fetch(`/api/portfolio?u=${encodeURIComponent(clean)}&mode=draft`, {
          cache: "no-store",
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (cancelled) return;
            if (data?.portfolio) {
              const loaded = {
                ...data.portfolio,
                template: validTpl || data.portfolio.template,
              };
              setDraft(loaded, false);
            } else if (SEED_PORTFOLIOS[clean]) {
              const seeded = {
                ...structuredClone(SEED_PORTFOLIOS[clean]),
                template: validTpl || SEED_PORTFOLIOS[clean].template,
              };
              setDraft(seeded, false);
            } else {
              const current = useTaqdomStore.getState().draft;
              if (current.username === clean) {
                if (validTpl) switchTemplate(validTpl);
              } else {
                const starter = createStarterPortfolio(
                  clean,
                  validTpl || current.template || "haven",
                  clean
                );
                setDraft(starter, false);
              }
            }
          })
          .catch(() => {
            if (!cancelled) {
              setDraft((prev) => ({
                ...prev,
                username: clean,
                template: validTpl || prev.template,
              }), false);
            }
          });
        return () => {
          cancelled = true;
        };
      }
    }
  }, [searchParams, switchTemplate, setDraft]);

  // Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+S (Save)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        fetch("/api/portfolio", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ portfolio: useTaqdomStore.getState().draft }),
        }).catch(() => {});
        toast.success(t("تم حفظ المسودة! (Ctrl+S)", "Draft saved! (Ctrl+S)"));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, t]);

  // Debounced autosave to /api/portfolio only after user edits
  useEffect(() => {
    if (!hasInteracted && pastDrafts.length === 0) return;
    const timer = setTimeout(() => {
      fetch("/api/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio: draft }),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [draft, hasInteracted, pastDrafts.length]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const published = await publishCurrentDraft();
      const targetUrl = getSubdomainUrl(published.username, host);
      setPublishedSuccessUrl(targetUrl);

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#9A7B4F", "#C89D66", "#1E3A2F"],
        });
      } catch {}

      toast.success(
        t(
          `تم نشر البورتفوليو بنجاح على https://${published.username}.taqdom.me!`,
          `Portfolio published live at https://${published.username}.taqdom.me!`
        )
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      const res = await fetch(`/api/portfolio/publish?u=${encodeURIComponent(draft.username)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPublishedSuccessUrl(null);
        toast.success(
          t(
            `تم إيقاف النشر المؤقت للنطاق ${draft.username}.taqdom.me`,
            `Unpublished ${draft.username}.taqdom.me`
          )
        );
      }
    } catch {
      toast.error(t("تعذر إيقاف النشر", "Failed to unpublish"));
    }
  };

  const handleAddProject = () => {
    setHasInteracted(true);
    const newProj: PortfolioProject = {
      id: `proj-${Date.now()}`,
      title: {
        ar: "مشروع إبداعي جديد",
        en: "New Sovereign Project",
      },
      desc: {
        ar: "وصف تفصيلي للمشروع وأثره المهني والتقني.",
        en: "Detailed description of the project's creative direction and impact.",
      },
      year: "2026",
      images: ["/images/ultra/haven-hero.webp", "/images/ultra/haven-1.webp"],
      tags: ["Architecture", "Design", "2026"],
      metrics: "Featured Work",
    };
    setDraft((prev) => ({
      ...prev,
      projects: [newProj, ...prev.projects],
    }));
  };

  const handleDeleteProject = (id: string) => {
    setHasInteracted(true);
    setDraft((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  const handleMoveProject = (index: number, direction: -1 | 1) => {
    setHasInteracted(true);
    setDraft((prev) => {
      const list = [...prev.projects];
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIdx];
      list[targetIdx] = temp;
      return { ...prev, projects: list };
    });
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHasInteracted(true);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        const dataUrl = reader.result;
        onLoaded(dataUrl);
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dataUrl,
              mime: file.type || "image/webp",
              username: draft.username,
            }),
          });
          if (res.ok) {
            const uploaded = await res.json();
            if (uploaded?.dataUrl) {
              onLoaded(uploaded.dataUrl);
            }
          }
        } catch {
          // Keep local dataUrl
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const tabs: { id: StudioTab; labelAr: string; labelEn: string; icon: React.ElementType }[] = [
    { id: "identity", labelAr: "ملفي", labelEn: "Profile", icon: User },
    { id: "template", labelAr: "الستايل", labelEn: "Style", icon: Layers },
    { id: "projects", labelAr: "أعمالي", labelEn: "My work", icon: FolderKanban },
    { id: "canvas", labelAr: "الكانفاس", labelEn: "Canvas", icon: Move },
    { id: "look3d", labelAr: "الألوان", labelEn: "Colors", icon: Sparkles },
    { id: "seo", labelAr: "الظهور", labelEn: "Findability", icon: Search },
    { id: "domain", labelAr: "المشاركة", labelEn: "Share", icon: Globe2 },
  ];

  const liveSubdomainHref = getSubdomainUrl(draft.username, host);

  const availableCanvasSections = CANVAS_SECTIONS.filter((section) =>
    CANVAS_SECTIONS_BY_TEMPLATE[draft.template]?.includes(section.id)
  );
  const canvasLayout = draft.canvas?.sections?.[selectedCanvasSection] || DEFAULT_CANVAS_LAYOUT;
  const updateCanvasSection = (id: CanvasSectionId, patch: Partial<CanvasSectionLayout>) => {
    setHasInteracted(true);
    setDraft((prev) => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        sections: {
          ...prev.canvas?.sections,
          [id]: {
            ...(prev.canvas?.sections?.[id] || DEFAULT_CANVAS_LAYOUT),
            ...patch,
          },
        },
      },
    }));
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (!canvasArrangeMode) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-canvas-section]");
    const id = target?.dataset.canvasSection as CanvasSectionId | undefined;
    if (!target || !id || !CANVAS_SECTIONS.some((item) => item.id === id)) return;
    const rect = target.getBoundingClientRect();
    const stageWidth = Math.max(1, canvasStageRef.current?.clientWidth || rect.width);
    const mode = event.clientX > rect.right - 28 && event.clientY > rect.bottom - 28 ? "resize" : "move";
    const base = draft.canvas?.sections?.[id] || DEFAULT_CANVAS_LAYOUT;
    setSelectedCanvasSection(id);
    canvasDragRef.current = {
      element: target,
      id,
      pointerId: event.pointerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      base,
      stageWidth,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = canvasDragRef.current;
    if (!canvasArrangeMode || !drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const x = Math.max(-220, Math.min(220, drag.base.x + dx));
    const y = Math.max(-220, Math.min(220, drag.base.y + dy));
    drag.element.style.setProperty("--canvas-x", `${x}px`);
    drag.element.style.setProperty("--canvas-y", `${y}px`);
    if (drag.mode === "resize") {
      const width = Math.max(55, Math.min(100, drag.base.width + (dx / drag.stageWidth) * 100));
      drag.element.style.setProperty("--canvas-width", `${width}%`);
    }
  };

  const handleCanvasPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const drag = canvasDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const patch: Partial<CanvasSectionLayout> = {
      x: Math.max(-220, Math.min(220, drag.base.x + dx)),
      y: Math.max(-220, Math.min(220, drag.base.y + dy)),
    };
    if (drag.mode === "resize") {
      patch.width = Math.max(55, Math.min(100, drag.base.width + (dx / drag.stageWidth) * 100));
    }
    updateCanvasSection(drag.id, patch);
    canvasDragRef.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
  };

  const handleCanvasBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(t("استخدم صورة JPG أو PNG أو WebP.", "Choose a JPG, PNG, or WebP image."));
      return;
    }
    if (file.size > 1_500_000) {
      toast.error(t("الحد الأقصى لصورة الخلفية 1.5 ميجابايت.", "Background images must be 1.5 MB or smaller."));
      return;
    }
    setBackgroundUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, mime: file.type, username: draft.username }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error || "Upload failed");
      setHasInteracted(true);
      setDraft((prev) => ({
        ...prev,
        canvas: {
          ...prev.canvas,
          backgroundImage: payload.url,
          backgroundOverlay: prev.canvas?.backgroundOverlay ?? 28,
        },
      }));
      toast.success(t("تم رفع الخلفية وحفظها في معرضك.", "Background uploaded to your portfolio."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("تعذر رفع الصورة.", "Could not upload image."));
    } finally {
      setBackgroundUploading(false);
    }
  };

  const updateCanvasBackground = (patch: Partial<NonNullable<typeof draft.canvas>>) => {
    setHasInteracted(true);
    setDraft((prev) => ({ ...prev, canvas: { ...prev.canvas, ...patch } }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Studio Command Bar */}
      <header className="sticky top-0 z-50 border-b border-border glass-panel px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Logo + Back links */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <TaqdomLogo size={34} lang={lang} />
            </Link>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground border-s border-border ps-4">
              <span>{t("استوديو تَقَدُّم", "Taqdom Studio")}</span>
              <span>•</span>
              <Link
                href={liveSubdomainHref}
                dir="ltr"
                data-testid="studio-subdomain-link"
                className="font-mono font-bold text-[#9A7B4F] dark:text-[#C89D66] hover:underline inline-flex items-center gap-1"
              >
                <span>https://{draft.username}.taqdom.me</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Center: Viewport & Undo/Redo Controls */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-border bg-secondary/70 p-1">
              <button
                type="button"
                onClick={undo}
                disabled={pastDrafts.length === 0}
                className="rounded-lg p-1.5 text-foreground disabled:opacity-35 hover:bg-background"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={futureDrafts.length === 0}
                className="rounded-lg p-1.5 text-foreground disabled:opacity-35 hover:bg-background"
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center rounded-xl border border-border bg-secondary/70 p-1">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`rounded-lg p-1.5 ${
                  device === "desktop" ? "bg-[#9A7B4F] dark:bg-[#C89D66] text-[#F7F5F0] dark:text-[#0A0A09]" : "text-muted-foreground"
                }`}
                title="Desktop Preview"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("tablet")}
                className={`rounded-lg p-1.5 ${
                  device === "tablet" ? "bg-[#9A7B4F] dark:bg-[#C89D66] text-[#F7F5F0] dark:text-[#0A0A09]" : "text-muted-foreground"
                }`}
                title="Tablet Preview"
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`rounded-lg p-1.5 ${
                  device === "mobile" ? "bg-[#9A7B4F] dark:bg-[#C89D66] text-[#F7F5F0] dark:text-[#0A0A09]" : "text-muted-foreground"
                }`}
                title="Mobile Preview"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPreviewLang(previewLang === "ar" ? "en" : "ar")}
              className="rounded-xl border border-border bg-secondary/70 px-3 py-1.5 text-xs font-bold"
            >
              {t("لغة المعاينة:", "Preview:")} {previewLang.toUpperCase()}
            </button>
          </div>

          {/* Right: Language + Publish CTA */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="rounded-xl border border-border bg-secondary/70 px-3 py-2 text-xs font-bold"
            >
              {lang === "ar" ? "EN" : "عربي"}
            </button>

            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center rounded-xl border border-border bg-secondary/70 px-3 py-2 text-xs font-bold"
            >
              {t("لوحتي", "Dashboard")}
            </Link>

            <button
              type="button"
              data-testid="studio-publish-btn"
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-2 rounded-xl bg-[#9A7B4F] dark:bg-[#C89D66] hover:opacity-95 px-4 py-2 text-xs sm:text-sm font-bold text-[#F7F5F0] dark:text-[#0A0A09] shadow-lg transition cursor-pointer"
            >
              <Rocket className="h-4 w-4" />
              <span>
                {publishing
                  ? t("جارٍ النشر...", "Publishing...")
                  : t(
                      `انشر معرضك · https://${draft.username}.taqdom.me`,
                      `Publish portfolio · https://${draft.username}.taqdom.me`
                    )}
              </span>
            </button>
          </div>
        </div>

        {/* Published Notification Banner */}
        {publishedSuccessUrl && (
          <div
            data-testid="studio-publish-banner"
            className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#1E3A2F]/15 border border-[#1E3A2F]/40 px-4 py-2 text-xs"
          >
            <div className="flex items-center gap-2 font-bold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-[#1E3A2F] dark:text-[#C89D66]" />
              <span>
                {t(
                  `تم نشر معرضك على الرابط: https://${draft.username}.taqdom.me`,
                  `Your portfolio is published at  https://${draft.username}.taqdom.me`
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={publishedSuccessUrl}
                data-testid="studio-open-published-link"
                className="inline-flex items-center gap-1 rounded-lg bg-[#9A7B4F] dark:bg-[#C89D66] px-3 py-1 font-bold text-[#F7F5F0] dark:text-[#0A0A09]"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{t("افتح البورتفوليو المنشور", "Open Published Portfolio")}</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Split Workspace: Side Editor + Live Center Stage */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-64px)]">
        {/* Editor Control Panel */}
        <aside className="lg:col-span-4 xl:col-span-4 border-e border-border bg-card/90 flex flex-col h-full lg:max-h-[calc(100vh-64px)] overflow-y-auto">
          {/* Studio Navigation Tabs */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-1.5 p-3 border-b border-border bg-secondary/40">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`studio-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition cursor-pointer ${
                    active
                      ? "bg-[#9A7B4F] dark:bg-[#C89D66] text-[#F7F5F0] dark:text-[#0A0A09] shadow"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t(tab.labelAr, tab.labelEn)}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Body */}
          <div className="p-5 space-y-6 flex-1">
            {/* TAB 1: IDENTITY */}
            {activeTab === "identity" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    {t("اسم الرابط الشخصي", "Personal address")}
                  </label>
                  <div
                    dir="ltr"
                    className="flex items-center rounded-xl border border-border bg-background px-3 py-2"
                  >
                    <input
                      type="text"
                      dir="ltr"
                      data-testid="studio-username-input"
                      value={draft.username}
                      onChange={(e) => {
                        const clean = normalizeUsername(e.target.value);
                        setDraft((prev) => ({
                          ...prev,
                          username: clean || "layla",
                        }));
                      }}
                      className="w-full bg-transparent font-mono text-sm focus:outline-none text-left"
                    />
                    <span dir="ltr" className="font-mono text-xs font-bold text-[#9A7B4F] dark:text-[#C89D66]">
                      .taqdom.me
                    </span>
                  </div>
                  <p dir="ltr" className="mt-1 font-mono text-[11px] text-[#9A7B4F] dark:text-[#C89D66]">
                    https://{draft.username}.taqdom.me
                  </p>
                </div>

                {/* Avatar Picker */}
                <div>
                  <label className="block text-xs font-bold mb-2">
                    {t("الصورة الشخصية (بورتريه)", "Creator Portrait")}
                  </label>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 border-[#9A7B4F] dark:border-[#C89D66] shrink-0">
                      <Image
                        src={draft.avatar || "/images/creators/layla.jpg"}
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <label className="cursor-pointer rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-bold hover:border-[#9A7B4F]">
                      <span>{t("رفع صورة من جهازك", "Upload Custom Portrait")}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, (url) =>
                            setDraft((prev) => ({ ...prev, avatar: url }))
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setDraft((prev) => ({ ...prev, avatar: av }))}
                        className={`relative h-10 w-10 rounded-xl overflow-hidden border-2 ${
                          draft.avatar === av ? "border-[#9A7B4F] scale-105" : "border-transparent opacity-70"
                        }`}
                      >
                        <Image src={av} alt="" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bilingual Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      {t("الاسم بالعربية", "Arabic Name")}
                    </label>
                    <input
                      type="text"
                      data-testid="studio-name-ar-input"
                      value={draft.name.ar}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          name: { ...prev.name, ar: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      {t("الاسم بالإنجليزية", "English Name")}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      data-testid="studio-name-en-input"
                      value={draft.name.en}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          name: { ...prev.name, en: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Bilingual Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      {t("المسمى الوظيفي (عربي)", "Title (AR)")}
                    </label>
                    <input
                      type="text"
                      value={draft.title.ar}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          title: { ...prev.title, ar: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      {t("المسمى الوظيفي (EN)", "Title (EN)")}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={draft.title.en}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          title: { ...prev.title, en: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Bilingual Bio */}
                <div>
                  <label className="block text-xs font-bold mb-1">
                    {t("النبذة التعريفية (عربي)", "Bio (Arabic)")}
                  </label>
                  <textarea
                    rows={3}
                    data-testid="studio-bio-ar-input"
                    value={draft.bio.ar}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        bio: { ...prev.bio, ar: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    {t("النبذة التعريفية (EN)", "Bio (English)")}
                  </label>
                  <textarea
                    rows={3}
                    dir="ltr"
                    data-testid="studio-bio-en-input"
                    value={draft.bio.en}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        bio: { ...prev.bio, en: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* City */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      {t("المدينة (عربي)", "City (AR)")}
                    </label>
                    <input
                      type="text"
                      value={draft.city.ar}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          city: { ...prev.city, ar: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      {t("المدينة (EN)", "City (EN)")}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={draft.city.en}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          city: { ...prev.city, en: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 7 TEMPLATES SWITCHER */}
            {activeTab === "template" && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  {t(
                    "بدّل بين القوالب السبعة فوراً مع الاحتفاظ بجميع مشاريعك وبياناتك:",
                    "Switch between all 7 career archetypes instantaneously while preserving all projects:"
                  )}
                </p>
                {TEMPLATES_CATALOG.map((tpl) => {
                  const selected = draft.template === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      data-testid={`studio-select-template-${tpl.id}`}
                      onClick={() => switchTemplate(tpl.id)}
                      className={`w-full text-start rounded-2xl border p-3.5 transition flex items-center gap-3.5 cursor-pointer ${
                        selected
                          ? "border-[#9A7B4F] dark:border-[#C89D66] bg-[#9A7B4F]/15 shadow-md"
                          : "border-border bg-background hover:border-[#9A7B4F]/50"
                      }`}
                    >
                      <div className="relative h-16 w-24 rounded-xl overflow-hidden shrink-0 border border-border">
                        <Image
                          src={tpl.heroImage}
                          alt={tpl.name.en}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="arabic-diacritics font-bold text-sm">
                            {tpl.name.ar} | {tpl.name.en}
                          </span>
                          {selected && (
                            <span className="rounded-full bg-[#9A7B4F] dark:bg-[#C89D66] px-2 py-0.5 text-[10px] font-bold text-[#F7F5F0] dark:text-[#0A0A09]">
                              {t("نشط", "ACTIVE")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {t(tpl.tagline.ar, tpl.tagline.en)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB 3: PROJECTS MANAGER */}
            {activeTab === "projects" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">
                    {t(`مشاريع المعرض (${draft.projects.length})`, `Portfolio Projects (${draft.projects.length})`)}
                  </span>
                  <button
                    type="button"
                    data-testid="studio-add-project-btn"
                    onClick={handleAddProject}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#9A7B4F] dark:bg-[#C89D66] px-3 py-1.5 text-xs font-bold text-[#F7F5F0] dark:text-[#0A0A09]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t("إضافة مشروع جديد", "Add Project")}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {draft.projects.map((proj, idx) => (
                    <div
                      key={proj.id}
                      className="rounded-2xl border border-border bg-background p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#9A7B4F] dark:text-[#C89D66]">
                          #{idx + 1} • {proj.year}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveProject(idx, -1)}
                            className="rounded-lg border border-border p-1 hover:border-[#9A7B4F]"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveProject(idx, 1)}
                            className="rounded-lg border border-border p-1 hover:border-[#9A7B4F]"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            className="rounded-lg border border-border p-1 text-red-500 hover:border-red-500"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={proj.title.ar}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraft((prev) => ({
                            ...prev,
                            projects: prev.projects.map((item) =>
                              item.id === proj.id
                                ? { ...item, title: { ...item.title, ar: val } }
                                : item
                            ),
                          }));
                        }}
                        placeholder="عنوان المشروع بالعربية"
                        className="w-full rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold"
                      />

                      <input
                        type="text"
                        dir="ltr"
                        value={proj.title.en}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraft((prev) => ({
                            ...prev,
                            projects: prev.projects.map((item) =>
                              item.id === proj.id
                                ? { ...item, title: { ...item.title, en: val } }
                                : item
                            ),
                          }));
                        }}
                        placeholder="Project Title in English"
                        className="w-full rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold"
                      />

                      <textarea
                        rows={2}
                        value={proj.desc.ar}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraft((prev) => ({
                            ...prev,
                            projects: prev.projects.map((item) =>
                              item.id === proj.id
                                ? { ...item, desc: { ...item.desc, ar: val } }
                                : item
                            ),
                          }));
                        }}
                        className="w-full rounded-xl border border-border bg-card px-3 py-1.5 text-xs"
                      />

                      {/* Quick 4K Image Selector & Custom Upload */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="block text-[11px] text-muted-foreground">
                            {t("صورة المشروع (4K):", "Primary Project Image (4K):")}
                          </span>
                          <label className="cursor-pointer rounded-lg border border-border bg-secondary px-2.5 py-1 text-[11px] font-bold hover:border-[#9A7B4F]">
                            <span>{t("رفع صورة للمشروع", "Upload Project Image")}</span>
                            <input
                              type="file"
                              accept="image/*"
                              data-testid={`studio-upload-project-img-${idx}`}
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    projects: prev.projects.map((item) =>
                                      item.id === proj.id
                                        ? { ...item, images: [url, ...item.images.slice(1)] }
                                        : item
                                    ),
                                  }))
                                )
                              }
                            />
                          </label>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {PRESET_PROJECT_IMAGES.slice(0, 6).map((img) => (
                            <button
                              key={img}
                              type="button"
                              onClick={() => {
                                setHasInteracted(true);
                                setDraft((prev) => ({
                                  ...prev,
                                  projects: prev.projects.map((item) =>
                                    item.id === proj.id
                                      ? { ...item, images: [img, ...item.images.slice(1)] }
                                      : item
                                  ),
                                }));
                              }}
                              className={`relative h-10 w-14 shrink-0 rounded-lg overflow-hidden border-2 ${
                                proj.images[0] === img ? "border-[#9A7B4F]" : "border-transparent opacity-60"
                              }`}
                            >
                              <Image src={img} alt="" fill className="object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CANVAS: background and freeform layout controls */}
            {activeTab === "canvas" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold">{t("خلفية مساحتك", "Your canvas background")}</h3>
                      <p className="text-[11px] leading-5 text-muted-foreground">{t("لون، صورة، أو طبقة هادئة خلف محتواك.", "Choose a colour, image, or subtle layer behind your work.")}</p>
                    </div>
                    <label className="relative h-10 w-10 overflow-hidden rounded-xl border border-border cursor-pointer" title={t("اختيار لون الخلفية", "Choose background colour")}>
                      <input
                        type="color"
                        aria-label={t("لون الخلفية", "Background colour")}
                        value={draft.canvas?.backgroundColor || (draft.theme.mode === "dark" ? "#10111B" : "#F4F2FA")}
                        onChange={(event) => updateCanvasBackground({ backgroundColor: event.target.value })}
                        className="absolute inset-[-12px] h-16 w-16 cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Midnight", color: "#10111B" },
                      { label: "Amethyst", color: "#211B38" },
                      { label: "Mist", color: "#F4F2FA" },
                      { label: "Porcelain", color: "#FFFFFF" },
                    ].map((preset) => (
                      <button key={preset.color} type="button" onClick={() => updateCanvasBackground({ backgroundColor: preset.color })}
                        className="rounded-xl border border-border p-1.5 text-center hover:border-primary transition">
                        <span className="mx-auto block h-7 rounded-lg border border-black/10" style={{ background: preset.color }} />
                        <span className="mt-1 block text-[9px] text-muted-foreground">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold">{t("صورة خلفية", "Background image")}</p>
                      <p className="text-[10px] leading-5 text-muted-foreground">{t("JPG / PNG / WebP • حتى 1.5 MB", "JPG / PNG / WebP • up to 1.5 MB")}</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground">
                      {backgroundUploading ? <span className="animate-pulse">{t("جارٍ الرفع", "Uploading")}</span> : <><ImagePlus className="h-3.5 w-3.5" />{t("رفع صورة", "Upload image")}</>}
                      <input type="file" accept="image/jpeg,image/png,image/webp" aria-label={t("رفع صورة خلفية", "Upload a background image")} disabled={backgroundUploading} onChange={handleCanvasBackgroundUpload} className="sr-only" />
                    </label>
                  </div>
                  {draft.canvas?.backgroundImage ? (
                    <div className="relative overflow-hidden rounded-xl border border-border">
                      <Image src={draft.canvas.backgroundImage} alt="Canvas background preview" width={600} height={220} className="h-28 w-full object-cover" unoptimized />
                      <button type="button" onClick={() => updateCanvasBackground({ backgroundImage: undefined })} className="absolute end-2 top-2 rounded-lg bg-black/70 p-1.5 text-white" aria-label={t("إزالة الخلفية", "Remove background")}><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-3 py-5 text-center text-[11px] text-muted-foreground">{t("ارفع صورة أو اترك الخلفية بلونك المفضل.", "Upload an image or keep your selected colour.")}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <label htmlFor="canvas-overlay">{t("تعتيم الخلفية", "Background overlay")}</label>
                    <span className="font-mono text-muted-foreground">{draft.canvas?.backgroundOverlay ?? 18}%</span>
                  </div>
                  <input id="canvas-overlay" type="range" min="0" max="85" step="1" value={draft.canvas?.backgroundOverlay ?? 18}
                    onChange={(event) => updateCanvasBackground({ backgroundOverlay: Number(event.target.value) })} className="w-full accent-primary" />
                  <div className="grid grid-cols-3 gap-2">
                    {(["top", "center", "bottom"] as const).map((position) => (
                      <button key={position} type="button" onClick={() => updateCanvasBackground({ backgroundPosition: position })}
                        className={`rounded-xl border px-2 py-2 text-[10px] font-semibold ${(draft.canvas?.backgroundPosition || "center") === position ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                        {position === "top" ? t("أعلى", "Top") : position === "bottom" ? t("أسفل", "Bottom") : t("وسط", "Center")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-5 space-y-3">
                  <div>
                    <h3 className="text-sm font-extrabold">{t("ترتيب وتحريك العناصر", "Arrange your sections")}</h3>
                    <p className="text-[11px] leading-5 text-muted-foreground">{t("فعّل وضع الترتيب، ثم اسحب القسم داخل المعاينة. اسحب الركن لتغيير عرضه.", "Turn on Arrange, then drag a section in the preview. Drag its corner to resize it.")}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {availableCanvasSections.map((section) => (
                      <button key={section.id} type="button" onClick={() => setSelectedCanvasSection(section.id)}
                        className={`rounded-xl border px-2 py-2 text-[10px] font-bold ${selectedCanvasSection === section.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                        {t(section.labelAr, section.labelEn)}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{t(CANVAS_SECTIONS.find((s) => s.id === selectedCanvasSection)?.labelAr || "القسم", CANVAS_SECTIONS.find((s) => s.id === selectedCanvasSection)?.labelEn || "Section")}</span>
                      <button type="button" onClick={() => updateCanvasSection(selectedCanvasSection, DEFAULT_CANVAS_LAYOUT)} className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-primary"><RotateCcw className="h-3 w-3" />{t("إعادة ضبط", "Reset")}</button>
                    </div>
                    <label className="flex items-center gap-2 text-[10px] font-semibold">
                      <input type="checkbox" checked={Boolean(canvasLayout.hidden)} onChange={(event) => updateCanvasSection(selectedCanvasSection, { hidden: event.target.checked })} className="accent-primary" />
                      {t("إخفاء هذا القسم", "Hide this section")}
                    </label>
                    {[
                      { key: "x" as const, label: t("أفقي", "Horizontal"), min: -180, max: 180, value: canvasLayout.x, suffix: "px" },
                      { key: "y" as const, label: t("رأسي", "Vertical"), min: -180, max: 180, value: canvasLayout.y, suffix: "px" },
                      { key: "width" as const, label: t("العرض", "Width"), min: 55, max: 100, value: canvasLayout.width, suffix: "%" },
                      { key: "scale" as const, label: t("الحجم", "Scale"), min: 0.7, max: 1.2, value: canvasLayout.scale, suffix: "×" },
                    ].map((control) => (
                      <div key={control.key} className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <label htmlFor={`canvas-${control.key}`}>{control.label}</label>
                          <span className="font-mono text-muted-foreground">{control.value}{control.suffix}</span>
                        </div>
                        <input id={`canvas-${control.key}`} type="range" min={control.min} max={control.max} step={control.key === "scale" ? 0.01 : 1}
                          value={control.value} onChange={(event) => updateCanvasSection(selectedCanvasSection, { [control.key]: Number(event.target.value) })}
                          className="w-full accent-primary" />
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => {
                    setHasInteracted(true);
                    setDraft((prev) => ({ ...prev, canvas: { ...prev.canvas, sections: {} } }));
                  }} className="w-full rounded-xl border border-border py-2.5 text-[11px] font-bold text-muted-foreground hover:text-foreground">
                    {t("إعادة ترتيب كل الأقسام", "Reset all section positions")}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: APPEARANCE CONTROLS */}
            {activeTab === "look3d" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold mb-2">
                    {t("وضع الإضاءة الأساسي للمعرض", "Portfolio Surface Mode")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["light", "dark"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setHasInteracted(true);
                          setDraft((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, mode: m },
                          }));
                        }}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${
                          draft.theme.mode === m
                            ? "border-[#9A7B4F] bg-[#9A7B4F]/20"
                            : "border-border bg-background"
                        }`}
                      >
                        {m === "light"
                          ? t("وضع فاتح", "Light")
                          : t("وضع داكن", "Dark")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color Picker */}
                <div>
                  <label className="block text-xs font-bold mb-2">
                    {t("لون التمييز", "Accent color")}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="col-span-3 flex items-center gap-3 rounded-xl border border-border p-3">
                      <span className="text-xs font-bold">{t("لون مخصص", "Custom accent")}</span>
                      <input type="color" aria-label={t("لون تمييز مخصص", "Custom accent colour")} value={draft.theme.accent} onChange={(event) => { setHasInteracted(true); setDraft((prev) => ({ ...prev, theme: { ...prev.theme, accent: event.target.value } })); }} className="ms-auto h-8 w-12 cursor-pointer rounded-lg border border-border bg-transparent" />
                    </label>
                    {ACCENT_PRESETS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          setHasInteracted(true);
                          setDraft((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, accent: c.hex },
                          }));
                        }}
                        className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-medium ${
                          draft.theme.accent === c.hex ? "border-primary bg-primary/10" : "border-border"
                        }`}
                      >
                        <span
                          className="h-4 w-4 rounded-full shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="truncate text-[11px]">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SEO SETTINGS */}
            {activeTab === "seo" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    {t("عنوان السيو (Meta Title)", "SEO Meta Title")}
                  </label>
                  <input
                    type="text"
                    value={draft.seo.title || `${draft.name.ar} | ${draft.name.en} — تَقَدُّم`}
                    onChange={(e) => {
                      setHasInteracted(true);
                      setDraft((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, title: e.target.value },
                      }));
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    {t("وصف محركات البحث (Meta Description)", "SEO Meta Description")}
                  </label>
                  <textarea
                    rows={3}
                    value={draft.seo.description || draft.bio.ar}
                    onChange={(e) => {
                      setHasInteracted(true);
                      setDraft((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, description: e.target.value },
                      }));
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    {t("الكلمات المفتاحية (Keywords مفصولة بفاصلة)", "SEO Keywords (comma-separated)")}
                  </label>
                  <input
                    type="text"
                    value={(draft.seo.keywords || [draft.name.ar, draft.name.en, "Taqdom"]).join(", ")}
                    onChange={(e) => {
                      setHasInteracted(true);
                      const kw = e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean);
                      setDraft((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, keywords: kw },
                      }));
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                  />
                </div>

                <label className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 cursor-pointer">
                  <span className="text-xs font-medium">
                    {t("إخفاء البورتفوليو من محركات البحث (noindex)", "Hide from search engines (noindex)")}
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(draft.seo.noindex)}
                    onChange={(e) => {
                      setHasInteracted(true);
                      setDraft((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, noindex: e.target.checked },
                      }));
                    }}
                    className="h-4 w-4 accent-[#9A7B4F]"
                  />
                </label>

                {/* Live Google Search Snippet Preview */}
                <div className="rounded-2xl border border-border bg-background p-4 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#9A7B4F] dark:text-[#C89D66]">
                    GOOGLE SEARCH &amp; SCHEMA.ORG PREVIEW
                  </span>
                  <p dir="ltr" className="text-xs text-[#1E3A2F] dark:text-[#C89D66] font-mono">
                    https://{draft.username}.taqdom.me
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {draft.seo.title || `${draft.name.ar} — ${draft.title.ar} | تَقَدُّم`}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {draft.seo.description || draft.bio.ar}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 6: DOMAIN & PUBLISH */}
            {activeTab === "domain" && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-[#9A7B4F]/50 bg-[#9A7B4F]/10 p-4 space-y-3">
                  <span className="text-xs font-mono uppercase text-[#9A7B4F] dark:text-[#C89D66]">
                    YOUR TAQDOM ADDRESS
                  </span>
                  <p dir="ltr" className="font-mono text-lg font-extrabold text-foreground break-all">
                    https://{draft.username}.taqdom.me
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(`https://${draft.username}.taqdom.me`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-background border border-border px-3 py-1.5 text-xs font-bold"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? t("تم النسخ", "Copied") : t("نسخ الرابط", "Copy URL")}</span>
                    </button>

                    <Link
                      href={liveSubdomainHref}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background px-3 py-1.5 text-xs font-bold"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{t("معاينة النطاق الحي", "Visit Subdomain")}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setFullscreenPreview(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#9A7B4F] dark:text-[#C89D66]" />
                      <span>{t("معاينة بملء الشاشة", "Full Screen")}</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
                  <label htmlFor="studio-explore-visibility" className="flex items-start gap-3 cursor-pointer">
                    <input
                      id="studio-explore-visibility"
                      data-testid="studio-explore-visibility"
                      type="checkbox"
                      checked={draft.discoverable === true}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, discoverable: event.target.checked }))
                      }
                      className="mt-1 h-4 w-4 accent-[#C7F36B]"
                    />
                    <span className="space-y-1">
                      <span className="block text-sm font-bold text-foreground">
                        {t("أظهر معرضي في دليل Explore", "List my portfolio in Explore")}
                      </span>
                      <span className="block text-xs leading-6 text-muted-foreground">
                        {t("اختياري. سيظهر معرضك في الدليل بعد إعادة النشر. إلغاء الاختيار يخفيه من Explore فقط؛ رابطك المنشور يظل متاحًا لمن يملكه.", "Optional. Your portfolio appears in the directory after you publish again. Turning this off hides it from Explore only; the published URL remains accessible to anyone with the link.")}
                      </span>
                    </span>
                  </label>
                  <div className="rounded-xl bg-secondary/70 px-3 py-2 text-xs leading-6 text-muted-foreground">
                    {t("النشر والظهور في الدليل خياران منفصلان، وأنت تتحكم في كل واحد منهما.", "Publishing and directory listing are separate choices. You control both.")}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#9A7B4F] dark:bg-[#C89D66] hover:opacity-95 py-4 text-sm font-extrabold text-[#F7F5F0] dark:text-[#0A0A09] shadow-xl transition cursor-pointer"
                >
                  <Rocket className="h-4 w-4" />
                  <span>
                    {t(
                      `انشر معرضك · https://${draft.username}.taqdom.me`,
                      `Publish portfolio · https://${draft.username}.taqdom.me`
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleUnpublish}
                  className="w-full rounded-xl border border-border bg-background hover:border-red-500/60 py-2.5 text-xs font-bold text-muted-foreground hover:text-red-500 transition cursor-pointer"
                >
                  {t("إلغاء النشر", "Unpublish portfolio")}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Center Live Interactive Portfolio Preview Stage */}
        <section
          ref={canvasStageRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
          className="lg:col-span-8 xl:col-span-8 bg-secondary/40 p-3 sm:p-6 flex flex-col items-center overflow-y-auto lg:max-h-[calc(100vh-64px)]"
        >
          <div className="mb-3 flex w-full max-w-7xl items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-bold">{t("معاينة مباشرة", "Live canvas preview")}</p>
              <p className="truncate text-[10px] text-muted-foreground">{canvasArrangeMode ? t("اسحب أي قسم لتحريكه، والركن لتغيير عرضه.", "Drag a section to move it; use its corner to resize.") : t("فعّل الترتيب لتحرير مواضع الأقسام مباشرة.", "Enable Arrange to edit section positions directly.")}</p>
            </div>
            <button type="button" onClick={() => setCanvasArrangeMode((value) => !value)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold transition ${canvasArrangeMode ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground"}`}>
              <Move className="h-3.5 w-3.5" />
              {canvasArrangeMode ? t("إنهاء الترتيب", "Done arranging") : t("رتّب العناصر", "Arrange")}
            </button>
          </div>
          <div
            className={`w-full transition-all duration-500 rounded-3xl overflow-hidden border border-border shadow-2xl bg-background ${
              device === "desktop"
                ? "w-full"
                : device === "tablet"
                ? "w-[768px] max-w-full"
                : "w-[390px] max-w-full"
            }`}
          >
            <PortfolioRenderer
              data={draft}
              previewLang={previewLang}
              isStudioPreview
              canvasEditMode={canvasArrangeMode}
              selectedCanvasSection={selectedCanvasSection}
            />
          </div>
        </section>
      </div>

      {/* Fullscreen Live Preview Modal */}
      {fullscreenPreview && (
        <div className="fixed inset-0 z-[95] flex flex-col bg-background">
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
            <span className="font-mono text-xs font-bold text-[#9A7B4F] dark:text-[#C89D66]">
              https://{draft.username}.taqdom.me • FULLSCREEN PREVIEW
            </span>
            <button
              type="button"
              onClick={() => setFullscreenPreview(false)}
              className="rounded-xl bg-[#9A7B4F] dark:bg-[#C89D66] px-4 py-1.5 text-xs font-bold text-[#F7F5F0] dark:text-[#0A0A09]"
            >
              {t("إغلاق المعاينة الكاملة", "Exit Full Screen")}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PortfolioRenderer data={draft} previewLang={previewLang} isStudioPreview />
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          Loading Taqdom Studio...
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
