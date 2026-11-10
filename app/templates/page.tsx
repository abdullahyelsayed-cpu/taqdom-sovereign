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
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#C5A059]/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.2em] text-[#C5A059]">
              <Layers className="h-3.5 w-3.5" />
              <span>{t("معرض القوالب السيادية المستقل", "SOVEREIGN TEMPLATES GALLERY")}</span>
            </span>

            <h1 className="arabic-diacritics mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight">
              {t(
                "أربعة قوالب أسطورية، كلٌّ منها صالة عرض متكاملة",
                "Four Iconic Portfolio Archetypes"
              )}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              {t(
                "اختر القالب الذي يعبّر عن هويتك الإبداعية، وعاينه بملء الشاشة، ثم انطلق لتخصيصه في استوديو تَقَدُّم الحي ونشره على نطاقك الفرعي المستقل.",
                "Inspect each template in interactive full-screen mode, explore its live creator showcase, or launch it directly inside Taqdom Studio."
              )}
            </p>
          </div>

          {/* 4 Templates Cards */}
          <div className="space-y-12">
            {TEMPLATES_CATALOG.map((tpl, index) => {
              const sampleCreator = SEED_PORTFOLIOS[tpl.defaultCreatorUsername];
              const subUrl = getSubdomainUrl(tpl.defaultCreatorUsername, host);

              return (
                <div
                  key={tpl.id}
                  data-testid={`template-card-${tpl.id}`}
                  className="glass-panel rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-border hover:border-[#C5A059] transition-all duration-500 shadow-xl"
                >
                  {/* Visual Gallery Column */}
                  <div className="lg:col-span-7 relative min-h-[360px] bg-[#050508] flex flex-col justify-between p-6 overflow-hidden">
                    <Image
                      src={tpl.heroImage}
                      alt={t(tpl.name.ar, tpl.name.en)}
                      fill
                      className="object-cover opacity-80 transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/35 to-transparent" />

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="rounded-full bg-[#050508]/85 border border-[#D4AF37]/50 px-3.5 py-1 font-mono text-xs font-bold text-[#D4AF37]">
                        ARCHETYPE 0{index + 1} • {tpl.id.toUpperCase()}
                      </span>
                      <Link
                        href={subUrl}
                        dir="ltr"
                        className="inline-flex items-center gap-1 rounded-full bg-[#050508]/85 border border-[#00F5D4]/50 px-3.5 py-1 font-mono text-xs font-semibold text-[#00F5D4] hover:underline"
                      >
                        <span>{tpl.defaultCreatorUsername}.taqdom.me</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="relative z-10 mt-auto pt-32 flex items-end justify-between gap-4">
                      <div>
                        <h2 className="arabic-diacritics text-3xl sm:text-5xl font-black text-[#EDEAE2]">
                          {tpl.name.ar}{" "}
                          <span className="font-normal text-[#D4AF37]">| {tpl.name.en}</span>
                        </h2>
                        <p className="mt-1 text-sm text-[#EDEAE2]/85">
                          {t(tpl.tagline.ar, tpl.tagline.en)}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        {tpl.galleryImages.slice(1, 4).map((img, i) => (
                          <div
                            key={i}
                            className="relative h-14 w-20 rounded-xl overflow-hidden border border-[#D4AF37]/40"
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
                      <div className="inline-block rounded-lg bg-[#C5A059]/15 px-3 py-1 text-xs font-bold text-[#C5A059]">
                        {t(tpl.persona.ar, tpl.persona.en)}
                      </div>

                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {t(tpl.description.ar, tpl.description.en)}
                      </p>

                      <div className="space-y-2 pt-2">
                        {tpl.features.map((feat, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                            <Check className="h-4 w-4 text-[#C5A059] shrink-0" />
                            <span>{t(feat.ar, feat.en)}</span>
                          </div>
                        ))}
                      </div>

                      {sampleCreator && (
                        <div className="mt-4 rounded-2xl bg-secondary/70 border border-border p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-11 w-11 rounded-full overflow-hidden border border-[#C5A059]">
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
                            className="font-mono text-xs font-bold text-[#C5A059] hover:underline"
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
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] px-5 py-3.5 text-xs sm:text-sm font-bold text-[#111113] shadow-lg transition cursor-pointer"
                      >
                        <Sliders className="h-4 w-4" />
                        <span>{t("استخدم هذا القالب في الاستوديو", "Use This Template in Studio")}</span>
                      </button>

                      <button
                        type="button"
                        data-testid={`preview-template-${tpl.id}`}
                        onClick={() => setFullscreenTemplate(tpl.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/80 hover:border-[#C5A059] px-4 py-3.5 text-xs sm:text-sm font-bold text-foreground transition cursor-pointer"
                      >
                        <Eye className="h-4 w-4 text-[#C5A059]" />
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
        <div className="fixed inset-0 z-[90] flex flex-col bg-[#050508]">
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 bg-[#0B0C14] border-b border-[#1F2233] text-[#EDEAE2]">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
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
                className="rounded-xl bg-[#D4AF37] px-4 py-1.5 text-xs font-bold text-[#050508]"
              >
                {t("استخدم هذا القالب في الاستوديو", "Use in Studio")}
              </button>
              <button
                type="button"
                onClick={() => setFullscreenTemplate(null)}
                className="inline-flex items-center gap-1 rounded-xl border border-[#1F2233] bg-[#161826] px-3 py-1.5 text-xs font-bold text-[#EDEAE2]"
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
