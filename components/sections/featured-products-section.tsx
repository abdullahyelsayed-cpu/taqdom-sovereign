"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft, ArrowUpRight, Layers, Sparkles, Eye } from "lucide-react";
import { TEMPLATES_CATALOG, SEED_PORTFOLIOS } from "@/lib/seed-data";
import { useLanguage } from "@/lib/i18n";
import { getSubdomainUrl } from "@/lib/types";

export function FeaturedProductsSection() {
  const { lang, t } = useLanguage();
  const [host, setHost] = useState("taqdom.me");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  return (
    <section id="templates-showcase" className="relative py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#C5A059] mb-3">
              <Layers className="h-3.5 w-3.5" />
              <span>{t("٠٢ • القوالب السيادية الأربعة", "02 • FOUR SOVEREIGN ARCHETYPES")}</span>
            </span>
            <h2 className="arabic-diacritics text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              {t(
                "أربعة عوالم بصرية مصممة لكل تخصص إبداعي",
                "Four Distinct Worlds of Creative Direction"
              )}
            </h2>
          </div>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 rounded-xl bg-[#C5A059] px-5 py-3 text-sm font-bold text-[#111113] transition hover:bg-[#D4AF37] shrink-0"
          >
            <span>{t("افتح معرض القوالب المستقل", "Open Full Templates Gallery")}</span>
            {lang === "ar" ? <ArrowUpLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
          </Link>
        </div>

        {/* 4 Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TEMPLATES_CATALOG.map((tpl, index) => {
            const creator = SEED_PORTFOLIOS[tpl.defaultCreatorUsername];
            const liveSubUrl = getSubdomainUrl(tpl.defaultCreatorUsername, host);

            return (
              <div
                key={tpl.id}
                className="group glass-panel rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:border-[#C5A059] hover:shadow-2xl"
              >
                {/* Template Visual Cover */}
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={tpl.heroImage}
                    alt={t(tpl.name.ar, tpl.name.en)}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/90 via-[#050508]/30 to-transparent" />

                  {/* Top Number & Persona Pill */}
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#050508]/80 backdrop-blur-md border border-[#D4AF37]/40 px-3 py-1 font-mono text-xs font-bold text-[#D4AF37]">
                      0{index + 1} / {tpl.id.toUpperCase()}
                    </span>
                    <Link
                      href={liveSubUrl}
                      dir="ltr"
                      className="rounded-full bg-[#050508]/80 backdrop-blur-md border border-[#00F5D4]/40 px-3 py-1 font-mono text-xs font-semibold text-[#00F5D4] hover:underline"
                    >
                      {tpl.defaultCreatorUsername}.taqdom.me ↗
                    </Link>
                  </div>

                  {/* Creator Avatar + Template Name */}
                  <div className="absolute bottom-4 inset-x-5 flex items-end justify-between gap-4">
                    <div>
                      <h3 className="arabic-diacritics text-2xl sm:text-3xl font-extrabold text-[#EDEAE2]">
                        {tpl.name.ar} <span className="text-[#D4AF37] font-normal">| {tpl.name.en}</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-[#EDEAE2]/85 mt-1">
                        {t(tpl.tagline.ar, tpl.tagline.en)}
                      </p>
                    </div>
                    {creator && (
                      <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden border-2 border-[#D4AF37]">
                        <Image
                          src={creator.avatar}
                          alt={t(creator.name.ar, creator.name.en)}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Template Details & Actions */}
                <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                  <div>
                    <p className="text-xs font-semibold text-[#C5A059] mb-2">
                      {t(tpl.persona.ar, tpl.persona.en)}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(tpl.description.ar, tpl.description.en)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tpl.features.map((f, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-secondary/80 border border-border px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          {t(f.ar, f.en)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
                    <Link
                      href={`/studio?template=${tpl.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#111113] transition"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{t("استخدم هذا القالب في الاستوديو", "Use Template in Studio")}</span>
                    </Link>
                    <Link
                      href={`/templates/${tpl.slug}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/70 hover:border-[#C5A059] px-4 py-2.5 text-xs font-bold text-foreground transition"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#C5A059]" />
                      <span>{t("معاينة حية", "Live Preview")}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
