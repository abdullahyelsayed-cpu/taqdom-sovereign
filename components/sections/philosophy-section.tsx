"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Compass, Sparkles, Award, Eye } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function PhilosophySection() {
  const { t } = useLanguage();

  const pillars = [
    {
      icon: Compass,
      titleAr: "نطاق فرعي سيادي مستقل",
      titleEn: "Sovereign Subdomain Identity",
      descAr:
        "لا روابط فرعية مزدحمة بعد اليوم. اسمك يسبق المنصة دائماً بصيغة username.taqdom.me ليمنحك هيبة المؤسسات الكبرى.",
      descEn:
        "Never settle for a buried slash path. Your name leads the domain as username.taqdom.me with full canonical authority.",
    },
    {
      icon: Sparkles,
      titleAr: "روح بشرية وفخامة معمارية",
      titleEn: "Human Soul & Architectural Craft",
      descAr:
        "تصميم يحتفي بالصورة الفوتوغرافية الحقيقية، ملمس الورق المرمري الدافئ، وتفاصيل الحرف العربي المشكّل دون جمود القوالب التقليدية.",
      descEn:
        "Warm Living Alabaster textures, tactile photography, and bespoke Arabic-Latin typography that feel curated by a human art director.",
    },
    {
      icon: Award,
      titleAr: "فيزياء ثلاثية الأبعاد 60FPS",
      titleEn: "60FPS Spatial WebGL Physics",
      descAr:
        "محرك إضاءة وانعكاس ثلاثي الأبعاد يستجيب لحركة الزائر ويبرز مشاريعك كأنها معروضة في قاعة متحف عالمي.",
      descEn:
        "Real-time WebGL lighting and glass refraction that respond to cursor choreography at 60 frames per second.",
    },
  ];

  return (
    <section id="philosophy" className="relative py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end mb-16">
          <div className="lg:col-span-7">
            <span className="inline-block text-xs font-mono uppercase tracking-[0.25em] text-[#C5A059] mb-3">
              {t("٠١ • فلسفة تَقَدُّم المعمارية", "01 • THE TAQDOM MANIFESTO")}
            </span>
            <h2 className="arabic-diacritics text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              {t(
                "كل مبدع يستحق متحفاً خاصاً به، لا مجرد صفحة عابرة.",
                "Every Creator Deserves a Private Museum, Not a Generic Page."
              )}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              {t(
                "ولدت «تَقَدُّم» في القاهرة لترتقي بمعارض أعمال المبدعين العرب والعالميين إلى مصافّ أرقى التجارب الرقمية الفائزة عالمياً، جامِعةً بين الأصالة البصرية وأحدث تقنيات الحافة.",
                "Born in Cairo for visionary creators worldwide, Taqdom transforms static portfolios into living architectural monographs powered by edge computing and spatial WebGL."
              )}
            </p>
          </div>
        </div>

        {/* Dual Architectural Plates + Creator Quote */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
          <div className="lg:col-span-7 relative min-h-[380px] md:min-h-[460px] rounded-3xl overflow-hidden border border-border group">
            <Image
              src="/images/interior-view.png"
              alt={t("قاعة عرض معمارية مضاءة طبيعياً", "Naturally lit architectural sanctuary")}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/85 via-[#050508]/25 to-transparent" />
            <div className="absolute bottom-6 inset-x-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 px-3 py-1 text-xs font-semibold text-[#D4AF37] mb-2">
                  {t("خامة المرمر الحي • Living Alabaster", "Living Alabaster Aesthetics")}
                </span>
                <h3 className="arabic-diacritics text-xl sm:text-2xl font-bold text-[#EDEAE2]">
                  {t(
                    "إضاءة متحفية تبرز أدق تفاصيل أعمالك",
                    "Museum-Calibrated Light for Every Project"
                  )}
                </h3>
              </div>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#050508] shrink-0"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{t("عاين القوالب", "Inspect Templates")}</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative flex-1 min-h-[240px] rounded-3xl overflow-hidden border border-border group">
              <Image
                src="/images/rusted-metal.png"
                alt={t("ملمس المعدن المعتق والذهب", "Weathered Corten & Gold Texture")}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/85 via-transparent to-transparent" />
              <div className="absolute bottom-5 inset-x-5">
                <p className="text-xs font-mono uppercase tracking-widest text-[#00F5D4]">
                  MATERIALITY &amp; DEPTH
                </p>
                <p className="mt-1 text-base font-bold text-[#EDEAE2]">
                  {t(
                    "تناغم الخامات الطبيعية مع شفق السايبر الليلي",
                    "Tactile Corten, Alabaster & Cyber-Luxury Obsidian"
                  )}
                </p>
              </div>
            </div>

            {/* Human Curator Card */}
            <div className="glass-panel rounded-3xl p-6 flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#C5A059]">
                <Image
                  src="/images/creators/layla.jpg"
                  alt="Layla Mansour"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {t(
                    "«مع تَقَدُّم، أصبح موقعي المعماري layla.taqdom.me يُبهِر عملائي في القاهرة وميلانو من اللحظة الأولى.»",
                    "“With Taqdom, my architectural practice at layla.taqdom.me feels like a private exhibition in Milan.”"
                  )}
                </p>
                <p className="mt-1.5 text-xs font-bold text-[#C5A059]">
                  {t(
                    "ليلى منصور — مهندسة معمارية • القاهرة (حساب عرض)",
                    "Layla Mansour — Principal Architect • Cairo (Showcase)"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Three Philosophical Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="glass-panel rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#C5A059]"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C5A059]/15 text-[#C5A059]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="arabic-diacritics text-xl font-bold text-foreground mb-2.5">
                  {t(p.titleAr, p.titleEn)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(p.descAr, p.descEn)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
