"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Sparkles,
  Eye,
  ExternalLink,
  X,
  Check,
  Sliders,
} from "lucide-react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { TEMPLATES_CATALOG, SEED_PORTFOLIOS } from "@/lib/seed-data";
import { TemplateId, getSubdomainUrl } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";
import { PortfolioRenderer } from "@/components/templates/portfolio-renderer";

export default function TemplatesPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const switchTemplate = useTaqdomStore((s) => s.switchTemplate);
  const [fullscreenTemplate, setFullscreenTemplate] = useState<TemplateId | null>(null);
  const [host, setHost] = useState("taqdom.me");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  const handleSelectForStudio = (tplId: TemplateId) => {
    switchTemplate(tplId);
    router.push(`/studio?template=${tplId}`);
  };

  const activePreviewMeta = TEMPLATES_CATALOG.find((item) => item.id === fullscreenTemplate);
  const activePreviewData = activePreviewMeta
    ? SEED_PORTFOLIOS[activePreviewMeta.defaultCreatorUsername]
    : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="pt-32 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page Hero */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#9A7B4F]/40 bg-[#9A7B4F]/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.2em] text-[#9A7B4F] dark:text-[#C89D66]">
              <Layers className="h-3.5 w-3.5" />
              <span>{t("معرض الستايلات", "SEVEN PORTFOLIO STYLES")}</span>
            </span>

            <h1 className="arabic-diacritics mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight">
              {t(
                "اختَر شكلًا يعرض شغلك بأفضل طريقة",
                "Seven ways to shape your portfolio"
              )}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              {t(
                "استكشف كل تصميم، افتح المثال التجريبي، ثم اختَر ما تريد تخصيصه في الاستوديو.",
                "Explore each design, open its sample portfolio, then choose what to customise in the Studio."
              )}
            </p>
          </div>

          <p className="mx-auto -mt-8 mb-12 max-w-3xl rounded-2xl border border-[#C7F36B]/25 bg-[#C7F36B]/[0.06] px-5 py-4 text-center text-sm leading-7 text-muted-foreground">
            {t("المعارض المعروضة هنا أمثلة توضيحية لتجربة القوالب، وليست ملفات عملاء موثّقة.", "The portfolios shown here are illustrative samples to preview each style, not verified customer profiles.")}
          </p>

          {/* 7 Templates Cards */}
          <div className="space-y-12">
            {TEMPLATES_CATALOG.map((tpl, index) => {
              const sampleCreator = SEED_PORTFOLIOS[tpl.defaultCreatorUsername];
              const subUrl = getSubdomainUrl(tpl.defaultCreatorUsername, host);

              return (
                <div
                  key={tpl.id}
                  data-testid={`template-card-${tpl.id}`}
                  className="glass-panel rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-border hover:border-[#9A7B4F] dark:hover:border-[#C89D66] transition-all duration-500 shadow-xl"
                >
                  {/* Visual Gallery Column */}
                  <div className="lg:col-span-7 relative min-h-[360px] bg-[#0A0A09] flex flex-col justify-between p-6 overflow-hidden">
                    <Image
                      src={tpl.heroImage}
                      alt={t(tpl.name.ar, tpl.name.en)}
                      fill
                      className="object-cover opacity-80 transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A09] via-[#0A0A09]/35 to-transparent" />

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="rounded-full bg-[#0A0A09]/85 border border-[#C89D66]/50 px-3.5 py-1 font-mono text-xs font-bold text-[#C89D66]">
                        STYLE 0{index + 1} • {tpl.id.toUpperCase()}
                      </span>
                      <Link
                        href={subUrl}
                        dir="ltr"
                        className="inline-flex items-center gap-1 rounded-full bg-[#0A0A09]/85 border border-[#F4F1EA]/25 px-3.5 py-1 font-mono text-xs font-semibold text-[#F4F1EA] hover:text-[#C89D66] transition"
                      >
                        <span>SAMPLE · {tpl.defaultCreatorUsername}.taqdom.me</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="relative z-10 mt-auto pt-32 flex items-end justify-between gap-4">
                      <div>
                        <h2 className="arabic-diacritics text-3xl sm:text-5xl font-black text-[#F4F1EA]">
                          {tpl.name.ar}{" "}
                          <span className="font-normal text-[#C89D66]">| {tpl.name.en}</span>
                        </h2>
                        <p className="mt-1 text-sm text-[#F4F1EA]/85">
                          {t(tpl.tagline.ar, tpl.tagline.en)}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        {tpl.galleryImages.slice(1, 3).map((img, i) => (
                          <div
                            key={i}
                            className="relative h-14 w-20 rounded-xl overflow-hidden border border-[#C89D66]/40"
                          >
                            <Image src={img} alt="" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Info & CTA Column */}
                  <div className="lg:col-span-5 p-8 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <div className="inline-block rounded-lg bg-[#9A7B4F]/15 px-3 py-1 text-xs font-bold text-[#9A7B4F] dark:text-[#C89D66]">
                        {t(tpl.persona.ar, tpl.persona.en)}
                      </div>

                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {t(tpl.description.ar, tpl.description.en)}
                      </p>

                      <div className="space-y-2 pt-2">
                        {tpl.features.map((feat, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                            <Check className="h-4 w-4 text-[#9A7B4F] dark:text-[#C89D66] shrink-0" />
                            <span>{t(feat.ar, feat.en)}</span>
                          </div>
                        ))}
                      </div>

                      {sampleCreator && (
                        <div className="mt-4 rounded-2xl bg-secondary/70 border border-border p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-11 w-11 rounded-full overflow-hidden border border-[#9A7B4F] dark:border-[#C89D66]">
                              <Image
                                src={sampleCreator.avatar}
                                alt={t(sampleCreator.name.ar, sampleCreator.name.en)}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">
                                {t(sampleCreator.name.ar, sampleCreator.name.en)}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {t(sampleCreator.title.ar, sampleCreator.title.en)}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={subUrl}
                            dir="ltr"
                            className="font-mono text-xs font-bold text-[#9A7B4F] dark:text-[#C89D66] hover:underline"
                          >
                            {sampleCreator.username}.taqdom.me ↗
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-border/60">
                      <button
                        type="button"
                        data-testid={`use-template-${tpl.id}`}
                        onClick={() => handleSelectForStudio(tpl.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A7B4F] dark:bg-[#C89D66] hover:opacity-95 px-5 py-3.5 text-xs sm:text-sm font-bold text-[#F7F5F0] dark:text-[#0A0A09] shadow-lg transition cursor-pointer"
                      >
                        <Sliders className="h-4 w-4" />
                        <span>{t("ابدأ بهذا الستايل", "Start with this style")}</span>
                      </button>

                      <button
                        type="button"
                        data-testid={`preview-template-${tpl.id}`}
                        onClick={() => setFullscreenTemplate(tpl.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/80 hover:border-[#9A7B4F] px-4 py-3.5 text-xs sm:text-sm font-bold text-foreground transition cursor-pointer"
                      >
                        <Eye className="h-4 w-4 text-[#9A7B4F] dark:text-[#C89D66]" />
                        <span>{t("معاينة بملء الشاشة", "Full-Screen Preview")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Full-Screen Template Preview Modal */}
      {fullscreenTemplate && activePreviewData && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-[#0A0A09]">
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 bg-[#121210] border-b border-[#F4F1EA]/10 text-[#F4F1EA]">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-[#C89D66]" />
              <span className="font-bold text-sm">
                {t(
                  `معاينة حية لقالب «${activePreviewMeta?.name.ar}»`,
                  `Live Interactive Preview: ${activePreviewMeta?.name.en}`
                )}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSelectForStudio(fullscreenTemplate)}
                className="rounded-xl bg-[#C89D66] px-4 py-1.5 text-xs font-bold text-[#0A0A09]"
              >
                {t("ابدأ بهذا الستايل", "Use this style")}
              </button>
              <button
                type="button"
                onClick={() => setFullscreenTemplate(null)}
                className="inline-flex items-center gap-1 rounded-xl border border-[#F4F1EA]/15 bg-[#0A0A09] px-3 py-1.5 text-xs font-bold text-[#F4F1EA]"
              >
                <X className="h-4 w-4" />
                <span>{t("إغلاق المعاينة", "Close")}</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PortfolioRenderer data={activePreviewData} previewLang={lang} />
          </div>
        </div>
      )}

      <FooterSection />
    </main>
  );
}
