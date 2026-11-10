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
import { TEMPLATES_CATALOG } from "@/lib/seed-data";
import {
  TemplateId,
  normalizeUsername,
  getSubdomainUrl,
  PortfolioProject,
} from "@/lib/types";

const PRESET_AVATARS = [
  "/images/creators/test.jpg",
  "/images/creators/layla.jpg",
  "/images/creators/youssef.jpg",
  "/images/creators/farida.jpg",
  "/images/creators/karim.jpg",
  "/images/creators/nadia.jpg",
  "/images/creators/omar.jpg",
];

const PRESET_PROJECT_IMAGES = [
  "/images/hero-mono.png",
  "/images/interior-view.png",
  "/images/rusted-metal.png",
  "/images/mono-1.png",
  "/images/mono-2.png",
  "/images/mono-3.png",
  "/images/mono-4.png",
  "/images/hero-side-1.png",
  "/images/hero-side-2.png",
  "/images/hero-side-3.png",
  "/images/hero-side-4.png",
  "/images/testimonial-house.png",
];

const ACCENT_PRESETS = [
  { name: "Royal Gold", hex: "#D4AF37" },
  { name: "Alabaster Bronze", hex: "#C5A059" },
  { name: "Cyber Emerald", hex: "#00F5D4" },
  { name: "Imperial Crimson", hex: "#E11D48" },
  { name: "Amethyst Neon", hex: "#8B5CF6" },
  { name: "Nile Jade", hex: "#10B981" },
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  // Apply URL query parameters (?template=... & ?u=...)
  useEffect(() => {
    const tplParam = searchParams.get("template") as TemplateId | null;
    const uParam = searchParams.get("u");

    if (tplParam && ["athar", "madar", "siyada", "noor"].includes(tplParam)) {
      switchTemplate(tplParam);
    }
    if (uParam) {
      const clean = normalizeUsername(uParam);
      if (clean.length >= 3) {
        setDraft((prev) => ({
          ...prev,
          username: clean,
        }));
      }
    }
  }, [searchParams, switchTemplate, setDraft]);

  // Debounced autosave to /api/portfolio
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio: draft }),
      }).catch(() => {});
    }, 900);
    return () => clearTimeout(timer);
  }, [draft]);

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
          colors: ["#D4AF37", "#C5A059", "#00F5D4"],
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

  const handleAddProject = () => {
    const newProj: PortfolioProject = {
      id: `proj-${Date.now()}`,
      title: {
        ar: "مشروع إبداعي جديد",
        en: "New Sovereign Project",
      },
      desc: {
        ar: "وصف تفصيلي للمشروع وأثره البصري والمعماري.",
        en: "Detailed description of the project's creative direction and impact.",
      },
      year: "2026",
      images: ["/images/hero-mono.png", "/images/interior-view.png"],
      tags: ["Architecture", "3D", "Design"],
      metrics: "Featured Work",
    };
    setDraft((prev) => ({
      ...prev,
      projects: [newProj, ...prev.projects],
    }));
  };

  const handleDeleteProject = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  const handleMoveProject = (index: number, direction: -1 | 1) => {
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
    onLoaded: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onLoaded(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const tabs: { id: StudioTab; labelAr: string; labelEn: string; icon: React.ElementType }[] = [
    { id: "identity", labelAr: "الهوية", labelEn: "Identity", icon: User },
    { id: "template", labelAr: "القالب", labelEn: "Template", icon: Layers },
    { id: "projects", labelAr: "المشاريع", labelEn: "Projects", icon: FolderKanban },
    { id: "look3d", labelAr: "المظهر و 3D", labelEn: "Look & 3D", icon: Sparkles },
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
                className="font-mono font-bold text-[#C5A059] hover:underline inline-flex items-center gap-1"
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
                  device === "desktop" ? "bg-[#C5A059] text-[#111113]" : "text-muted-foreground"
                }`}
                title="Desktop Preview"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("tablet")}
                className={`rounded-lg p-1.5 ${
                  device === "tablet" ? "bg-[#C5A059] text-[#111113]" : "text-muted-foreground"
                }`}
                title="Tablet Preview"
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`rounded-lg p-1.5 ${
                  device === "mobile" ? "bg-[#C5A059] text-[#111113]" : "text-muted-foreground"
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] px-4 py-2 text-xs sm:text-sm font-bold text-[#111113] shadow-lg transition cursor-pointer"
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
            className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-4 py-2 text-xs"
          >
            <div className="flex items-center gap-2 font-bold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
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
                className="inline-flex items-center gap-1 rounded-lg bg-[#C5A059] px-3 py-1 font-bold text-[#111113]"
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
                      ? "bg-[#C5A059] text-[#111113] shadow"
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
                  <div className="flex items-center rounded-xl border border-border bg-background px-3 py-2">
                    <input
                      type="text"
                      dir="ltr"
                      data-testid="studio-username-input"
                      value={draft.username}
                      onChange={(e) => {
                        const clean = normalizeUsername(e.target.value);
                        setDraft((prev) => ({
                          ...prev,
                          username: clean || "test",
                        }));
                      }}
                      className="w-full bg-transparent font-mono text-sm focus:outline-none"
                    />
                    <span dir="ltr" className="font-mono text-xs font-bold text-[#C5A059]">
                      .taqdom.me
                    </span>
                  </div>
                  <p dir="ltr" className="mt-1 font-mono text-[11px] text-[#C5A059]">
                    https://{draft.username}.taqdom.me
                  </p>
                </div>

                {/* Avatar Picker */}
                <div>
                  <label className="block text-xs font-bold mb-2">
                    {t("الصورة الشخصية (بورتريه)", "Creator Portrait")}
                  </label>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 border-[#C5A059] shrink-0">
                      <Image
                        src={draft.avatar || "/images/creators/test.jpg"}
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <label className="cursor-pointer rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-bold hover:border-[#C5A059]">
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
                          draft.avatar === av ? "border-[#C5A059] scale-105" : "border-transparent opacity-70"
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

            {/* TAB 2: TEMPLATE SWITCHER */}
            {activeTab === "template" && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  {t(
                    "بدّل بين القوالب الأربعة فوراً مع الاحتفاظ بجميع مشاريعك وبياناتك:",
                    "Switch between the 4 archetypes instantaneously while preserving all projects:"
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
                          ? "border-[#C5A059] bg-[#C5A059]/15 shadow-md"
                          : "border-border bg-background hover:border-[#C5A059]/50"
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
                            <span className="rounded-full bg-[#C5A059] px-2 py-0.5 text-[10px] font-bold text-[#111113]">
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
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#C5A059] px-3 py-1.5 text-xs font-bold text-[#111113]"
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
                        <span className="font-mono text-xs font-bold text-[#C5A059]">
                          #{idx + 1} • {proj.year}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveProject(idx, -1)}
                            className="rounded-lg border border-border p-1 hover:border-[#C5A059]"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveProject(idx, 1)}
                            className="rounded-lg border border-border p-1 hover:border-[#C5A059]"
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

                      {/* Quick Image Selector */}
                      <div>
                        <span className="block text-[11px] text-muted-foreground mb-1.5">
                          {t("صورة المشروع الرئيسية:", "Primary Project Image:")}
                        </span>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {PRESET_PROJECT_IMAGES.slice(0, 6).map((img) => (
                            <button
                              key={img}
                              type="button"
                              onClick={() =>
                                setDraft((prev) => ({
                                  ...prev,
                                  projects: prev.projects.map((item) =>
                                    item.id === proj.id
                                      ? { ...item, images: [img, ...item.images.slice(1)] }
                                      : item
                                  ),
                                }))
                              }
                              className={`relative h-10 w-14 shrink-0 rounded-lg overflow-hidden border-2 ${
                                proj.images[0] === img ? "border-[#C5A059]" : "border-transparent opacity-60"
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

            {/* TAB 4: 3D & APPEARANCE CONTROLS */}
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
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, mode: m },
                          }))
                        }
                        className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${
                          draft.theme.mode === m
                            ? "border-[#C5A059] bg-[#C5A059]/20"
                            : "border-border bg-background"
                        }`}
                      >
                        {m === "light"
                          ? t("نهار مرمري (#F6F4EE)", "Living Alabaster")
                          : t("ليل أوبسيديان (#050508)", "Cyber Obsidian")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color Picker */}
                <div>
                  <label className="block text-xs font-bold mb-2">
                    {t("لون التمييز الملكي (Accent Color)", "Sovereign Accent Color")}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ACCENT_PRESETS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, accent: c.hex },
                          }))
                        }
                        className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-medium ${
                          draft.theme.accent === c.hex ? "border-[#C5A059] bg-secondary" : "border-border"
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

                {/* 3D Scene Controls */}
                <div className="rounded-2xl border border-border bg-background p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">
                      {t("تفعيل مجسم صقر حورس 3D", "Enable 3D Horus Sculpture")}
                    </span>
                    <input
                      type="checkbox"
                      checked={draft.theme.scene3d.enabled}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          theme: {
                            ...prev.theme,
                            scene3d: { ...prev.theme.scene3d, enabled: e.target.checked },
                          },
                        }))
                      }
                      className="h-4 w-4 accent-[#C5A059]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{t("شدة إضاءة الـ 3D", "3D Light Intensity")}</span>
                      <span className="font-mono">{draft.theme.scene3d.intensity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.2"
                      step="0.1"
                      value={draft.theme.scene3d.intensity}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          theme: {
                            ...prev.theme,
                            scene3d: {
                              ...prev.theme.scene3d,
                              intensity: parseFloat(e.target.value),
                            },
                          },
                        }))
                      }
                      className="w-full accent-[#C5A059]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{t("سرعة تنفس الأجنحة والمدار", "Wing & Orbit Speed")}</span>
                      <span className="font-mono">{draft.theme.scene3d.speed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.1"
                      value={draft.theme.scene3d.speed}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          theme: {
                            ...prev.theme,
                            scene3d: {
                              ...prev.theme.scene3d,
                              speed: parseFloat(e.target.value),
                            },
                          },
                        }))
                      }
                      className="w-full accent-[#C5A059]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{t("زاوية سقوط الضوء", "Directional Light Angle")}</span>
                      <span className="font-mono">{draft.theme.scene3d.lightAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      step="5"
                      value={draft.theme.scene3d.lightAngle}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          theme: {
                            ...prev.theme,
                            scene3d: {
                              ...prev.theme.scene3d,
                              lightAngle: parseInt(e.target.value, 10),
                            },
                          },
                        }))
                      }
                      className="w-full accent-[#C5A059]"
                    />
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
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, title: e.target.value },
                      }))
                    }
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
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, description: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                  />
                </div>

                {/* Live Google Search Snippet Preview */}
                <div className="rounded-2xl border border-border bg-background p-4 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#C5A059]">
                    GOOGLE SEARCH &amp; SCHEMA.ORG PREVIEW
                  </span>
                  <p dir="ltr" className="text-xs text-emerald-600 dark:text-[#00F5D4] font-mono">
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
                <div className="rounded-2xl border border-[#C5A059]/50 bg-[#C5A059]/10 p-4 space-y-3">
                  <span className="text-xs font-mono uppercase text-[#C5A059]">
                    SOVEREIGN SUBDOMAIN
                  </span>
                  <p dir="ltr" className="font-mono text-lg font-extrabold text-foreground break-all">
                    https://{draft.username}.taqdom.me
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(`https://${draft.username}.taqdom.me`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-background border border-border px-3 py-1.5 text-xs font-bold"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? t("تم النسخ", "Copied") : t("نسخ الرابط", "Copy URL")}</span>
                    </button>

                    <Link
                      href={liveSubdomainHref}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background px-3 py-1.5 text-xs font-bold"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{t("معاينة النطاق الحي", "Visit Subdomain")}</span>
                    </Link>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#C5A059] hover:bg-[#D4AF37] py-4 text-sm font-extrabold text-[#111113] shadow-xl transition cursor-pointer"
                >
                  <Rocket className="h-4 w-4" />
                  <span>
                    {t(
                      `نشر البورتفوليو الآن على https://${draft.username}.taqdom.me`,
                      `Publish Now to https://${draft.username}.taqdom.me`
                    )}
                  </span>
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
