"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Globe2, Sliders, Rocket } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function CollectionSection() {
  const { t } = useLanguage();

  const steps = [
    {
      step: "01",
      icon: Globe2,
      titleAr: "احجز اسمك ونطاقك السيادي",
      titleEn: "Claim Your Sovereign Subdomain",
      descAr:
        "اكتب اسمك ليصبح عنوانك الدائم على الإنترنت بصيغة username.taqdom.me مع شهادة أمان وتوجيه فوري.",
      descEn:
        "Reserve your permanent creative address as username.taqdom.me with automatic edge routing and SSL.",
      image: "/images/hero-side-1.png",
      ctaHref: "/auth",
      ctaAr: "احجز نطاقك الآن",
      ctaEn: "Reserve Subdomain",
    },
    {
      step: "02",
      icon: Sliders,
      titleAr: "شكّل عالمك في الاستوديو الحي",
      titleEn: "Sculpt in the Live 3D Studio",
      descAr:
        "بدّل بين القوالب الأربعة (أَثَر، مَدَار، سِيَادَة، نُور)، تحكم في إضاءة الـ 3D، وأضف مشاريعك بالعربية والإنجليزية.",
      descEn:
        "Switch between Athar, Madar, Siyada, and Noor, tune 3D lighting angles, and curate bilingual projects live.",
      image: "/images/hero-side-2.png",
      ctaHref: "/studio",
      ctaAr: "افتح الاستوديو",
      ctaEn: "Open Live Studio",
    },
    {
      step: "03",
      icon: Rocket,
      titleAr: "انشر بضغطة واحدة للعالم",
      titleEn: "1-Click Global Edge Publish",
      descAr:
        "بمجرد الضغط على زر النشر، ينطلق معرضك على حافة Cloudflare مع خرائط Sitemap وبيانات JSON-LD جاهزة لمحركات البحث.",
      descEn:
        "Hit publish to deploy globally across 300+ edge nodes with instant OpenGraph cards and Schema.org SEO.",
      image: "/images/hero-side-4.png",
      ctaHref: "/templates",
      ctaAr: "استعرض القوالب",
      ctaEn: "Browse Templates",
    },
  ];

  return (
    <section id="workflow" className="relative py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#C5A059]">
            {t("٠٥ • رحلة البناء في ٣ خطوات", "05 • THREE-STEP SOVEREIGN WORKFLOW")}
          </span>
          <h2 className="arabic-diacritics mt-3 text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            {t(
              "من الفكرة إلى متحف رقمي منشور في دقائق",
              "From Vision to Published Monograph in Minutes"
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="group glass-panel rounded-3xl overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={s.image}
                    alt={t(s.titleAr, s.titleEn)}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/85 via-transparent to-transparent" />
                  <div className="absolute top-4 start-4 rounded-xl bg-[#050508]/80 border border-[#D4AF37]/50 px-3 py-1.5 font-mono text-sm font-bold text-[#D4AF37]">
                    STEP {s.step}
                  </div>
                </div>

                <div className="p-7 flex-1 flex flex-col justify-between gap-6">
                  <div>
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059]/15 text-[#C5A059]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="arabic-diacritics text-xl font-bold text-foreground mb-2">
                      {t(s.titleAr, s.titleEn)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(s.descAr, s.descEn)}
                    </p>
                  </div>

                  <Link
                    href={s.ctaHref}
                    className="inline-flex items-center justify-center rounded-xl border border-[#C5A059]/50 bg-secondary/70 hover:bg-[#C5A059] hover:text-[#111113] px-4 py-2.5 text-xs font-bold text-foreground transition"
                  >
                    {t(s.ctaAr, s.ctaEn)}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
