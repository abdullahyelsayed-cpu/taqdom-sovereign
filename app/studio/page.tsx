"use client";

import React, { useState, useEffect, Suspense } from "react";
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
} from "lucide-react";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";
import { PortfolioRenderer } from "@/components/templates/portfolio-renderer";
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";
import { TEMPLATES_CATALOG, SEED_PORTFOLIOS, createStarterPortfolio } from "@/lib/seed-data";
import {
  TemplateId,
  ALL_TEMPLATE_IDS,
  normalizeUsername,
  getSubdomainUrl,
  PortfolioProject,
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
  { name: "Warm Bronze", hex: "#9A7B4F" },
  { name: "Cinema Amber", hex: "#C89D66" },
  { name: "Deep Emerald", hex: "#1E3A2F" },
  { name: "Executive Gold", hex: "#B8860B" },
  { name: "Obsidian Slate", hex: "#4A5568" },
  { name: "Terracotta", hex: "#A0522D" },
];

type StudioTab = "identity" | "template" | "projects" | "look3d" | "seo" | "domain";

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

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
    { id: "identity", labelAr: "الهوية", labelEn: "Identity", icon: User },
    { id: "template", labelAr: "القوالب (7)", labelEn: "7 Templates", icon: Layers },
    { id: "projects", labelAr: "المشاريع", labelEn: "Projects", icon: FolderKanban },
    { id: "look3d", labelAr: "المظهر والألوان", labelEn: "Appearance", icon: Sparkles },
    { id: "seo", labelAr: "السيو", labelEn: "SEO", icon: Search },
    { id: "domain", labelAr: "النطاق والنشر", labelEn: "Publish", icon: Globe2 },
  ];

  const liveSubdomainHref = getSubdomainUrl(draft.username, host);

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
              <span>{t("استوديو تَقَدُّم الحي", "Taqdom Live Studio")}</span>
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
                      `نشر البورتفوليو الآن على https://${draft.username}.taqdom.me`,
                      `Publish Now to https://${draft.username}.taqdom.me`
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
                  `تم نشر معرضك الحي بنجاح على النطاق الفرعي المستقل: https://${draft.username}.taqdom.me`,
                  `Your portfolio is now live on your sovereign subdomain: https://${draft.username}.taqdom.me`
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
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-1.5 p-3 border-b border-border bg-secondary/40">
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
                    {t("اسم المستخدم والنطاق الفرعي (Subdomain)", "Username & Sovereign Subdomain")}
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
                          ? t("نهار مرمري (#F7F5F0)", "Warm Alabaster")
                          : t("ليل سينمائي (#0A0A09)", "Cinema Noir")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color Picker */}
                <div>
                  <label className="block text-xs font-bold mb-2">
                    {t("لون التمييز السيادي (Accent Color)", "Sovereign Accent Color")}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
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
                          draft.theme.accent === c.hex ? "border-[#9A7B4F] bg-secondary" : "border-border"
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
                    SOVEREIGN SUBDOMAIN
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

                {/* Sovereign Subdomain QR Code Card */}
                <div className="rounded-2xl border border-border bg-background p-4 flex items-center gap-4">
                  <svg
                    viewBox="0 0 100 100"
                    className="h-20 w-20 shrink-0 rounded-xl border border-[#9A7B4F]/40 bg-[#F7F5F0] p-2 text-[#141413]"
                    aria-label="Subdomain QR Code"
                  >
                    <rect x="8" y="8" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="16" y="16" width="10" height="10" fill="currentColor" />
                    <rect x="66" y="8" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="74" y="16" width="10" height="10" fill="currentColor" />
                    <rect x="8" y="66" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="16" y="74" width="10" height="10" fill="currentColor" />
                    <rect x="42" y="12" width="8" height="8" fill="currentColor" />
                    <rect x="42" y="28" width="8" height="16" fill="currentColor" />
                    <rect x="12" y="44" width="16" height="8" fill="currentColor" />
                    <rect x="42" y="44" width="14" height="14" fill="#9A7B4F" />
                    <rect x="64" y="44" width="10" height="8" fill="currentColor" />
                    <rect x="80" y="44" width="12" height="12" fill="currentColor" />
                    <rect x="44" y="66" width="12" height="10" fill="currentColor" />
                    <rect x="64" y="64" width="14" height="14" fill="currentColor" />
                    <rect x="82" y="76" width="10" height="16" fill="currentColor" />
                    <rect x="44" y="84" width="26" height="8" fill="currentColor" />
                  </svg>
                  <div className="space-y-1">
                    <p className="text-xs font-bold">
                      {t("رمز الاستجابة السريعة (QR) لنطاقك السيادي", "Sovereign Subdomain QR Pass")}
                    </p>
                    <p dir="ltr" className="font-mono text-[11px] text-[#9A7B4F] dark:text-[#C89D66]">
                      https://{draft.username}.taqdom.me
                    </p>
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
                      `نشر البورتفوليو الآن على https://${draft.username}.taqdom.me`,
                      `Publish Now to https://${draft.username}.taqdom.me`
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleUnpublish}
                  className="w-full rounded-xl border border-border bg-background hover:border-red-500/60 py-2.5 text-xs font-bold text-muted-foreground hover:text-red-500 transition cursor-pointer"
                >
                  {t("إيقاف النشر المؤقت (Unpublish)", "Unpublish Subdomain")}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Center Live Interactive Portfolio Preview Stage */}
        <section className="lg:col-span-8 xl:col-span-8 bg-secondary/40 p-3 sm:p-6 flex items-start justify-center overflow-y-auto lg:max-h-[calc(100vh-64px)]">
          <div
            className={`transition-all duration-500 rounded-3xl overflow-hidden border border-border shadow-2xl bg-background ${
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
