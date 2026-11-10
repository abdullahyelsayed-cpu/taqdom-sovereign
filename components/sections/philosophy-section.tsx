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
        "لا روابط فرعية مزدحمة بعد اليوم. اسمك يسبق المنصة دائماً بصيغة username.taqdom.me ليمنحك هيبة المؤسسات الكبرى كخريج أو محترف.",
      descEn:
        "Never settle for a buried slash path. Your name leads the domain as username.taqdom.me with full canonical authority.",
    },
    {
      icon: Sparkles,
      titleAr: "سبع هويات مهنية لجيل Z وAlpha",
      titleEn: "Seven Career-Defining Archetypes",
      descAr:
        "من هندسة الذكاء الاصطناعي والعمارة إلى التلي سيلز، المارتيك، والموارد البشرية؛ كل قالب صُمم بلغة بصرية ومكونات تفاعلية خاصة بمجالك.",
      descEn:
        "From AI Engineering and Architecture to Tele-Sales, MarTech, and People Ops — each template is purpose-built with domain-native widgets.",
    },
    {
      icon: Award,
      titleAr: "حركة سينمائية وخطوط محمية التشكيل",
      titleEn: "Awwwards-Grade Motion & Typography",
      descAr:
        "فيزياء تمرير GSAP ScrollTrigger ومنحنيات حركة مدروسة مع تناغم خط Readex Pro وInstrument Serif في وضعي النهار المرمري والليل السينمائي.",
      descEn:
        "Precision GSAP ScrollTrigger choreography and cubic-bezier(0.22, 1, 0.36, 1) transitions paired with Warm Alabaster and Cinema Noir modes.",
    },
  ];

  return (
    <section id="philosophy" className="relative py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end mb-16">
          <div className="lg:col-span-7">
            <span className="inline-block text-xs font-mono uppercase tracking-[0.25em] text-[#9A7B4F] dark:text-[#C89D66] mb-3">
              {t("٠١ • بيان تَقَدُّم المعماري ٢٠٢٦", "01 • THE TAQDOM Q4 2026 MANIFESTO")}
            </span>
            <h2 className="arabic-diacritics text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              {t(
                "كل طالب وخريج ومحترف يستحق صالة عرض سيادية تحمل اسمه.",
                "Every Graduate and Professional Deserves a Sovereign Exhibition."
              )}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              {t(
                "صُممت «تَقَدُّم» لترتقي بالهوية الرقمية لجيل Z وجيل Alpha إلى مصافّ أرقى المواقع الفائزة عالمياً، جامعةً بين الفخامة الهادئة وسرعة الحافة السحابية.",
                "Engineered for Gen-Z and Gen-Alpha pioneers, Taqdom transforms static resumes into living digital monographs powered by Cloudflare Edge."
              )}
            </p>
          </div>
        </div>

        {/* Dual Architectural Plates + Creator Quote */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
          <div className="lg:col-span-7 relative min-h-[380px] md:min-h-[460px] rounded-3xl overflow-hidden border border-border group">
            <Image
              src="/images/ultra/haven-1.webp"
              alt={t("قاعة عرض معمارية مضاءة طبيعياً بدقة 4K", "4K Naturally lit architectural sanctuary")}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A09]/90 via-[#0A0A09]/25 to-transparent" />
            <div className="absolute bottom-6 inset-x-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-[#C89D66]/20 border border-[#C89D66]/50 px-3 py-1 text-xs font-semibold text-[#C89D66] mb-2">
                  {t("خامة المرمر الدافئ • Warm Alabaster 2026", "Warm Alabaster Editorial")}
                </span>
                <h3 className="arabic-diacritics text-xl sm:text-2xl font-bold text-[#F4F1EA]">
                  {t(
                    "صور 4K فائقة الحدة وإضاءة محيطية تبرز أدق تفاصيل مشاريعك",
                    "Ultra-HD 4K Clarity & Museum-Calibrated Contrast"
                  )}
                </h3>
              </div>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 rounded-xl bg-[#C89D66] px-4 py-2.5 text-xs font-bold text-[#0A0A09] shrink-0"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{t("عاين القوالب السبعة", "Inspect 7 Templates")}</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative flex-1 min-h-[240px] rounded-3xl overflow-hidden border border-border group">
              <Image
                src="/images/ultra/athar-hero.webp"
                alt={t("استوديو إبداعي سينمائي", "Cinema Noir Creative Studio")}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A09]/90 via-transparent to-transparent" />
              <div className="absolute bottom-5 inset-x-5">
                <p className="text-xs font-mono uppercase tracking-widest text-[#C89D66]">
                  WARM ALABASTER &amp; CINEMA NOIR
                </p>
                <p className="mt-1 text-base font-bold text-[#F4F1EA]">
                  {t(
                    "تناغم الخامات الدافئة نهاراً مع الكهرمان السينمائي ليلاً",
                    "Tactile Warm Alabaster by Day, Cinema Noir & Amber by Night"
                  )}
                </p>
              </div>
            </div>

            {/* Human Curator Card */}
            <div className="glass-panel rounded-3xl p-6 flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#9A7B4F] dark:border-[#C89D66]">
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
                    "«مع تَقَدُّم، أصبح موقعي المعماري layla.taqdom.me يُبهِر مكاتب الاستشارات والعملاء في القاهرة وميلانو من اللحظة الأولى.»",
                    "“With Taqdom, my architectural monograph at layla.taqdom.me feels like a private exhibition in Milan.”"
                  )}
                </p>
                <p className="mt-1.5 text-xs font-bold text-[#9A7B4F] dark:text-[#C89D66]">
                  {t(
                    "ليلى منصور — مهندسة معمارية • layla.taqdom.me",
                    "Layla Mansour — Principal Architect • layla.taqdom.me"
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
                className="glass-panel rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#9A7B4F] dark:hover:border-[#C89D66]"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9A7B4F]/15 text-[#9A7B4F] dark:text-[#C89D66]">
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
