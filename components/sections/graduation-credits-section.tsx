"use client";

import Image from "next/image";
import {
  ArrowUpLeft,
  ArrowUpRight,
  Award,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";

const LINKEDIN_URL = "https://www.linkedin.com/in/abdullah-yehia/";

export function GraduationCreditsSection() {
  const { lang, t } = useLanguage();
  const isArabic = lang === "ar";
  const Arrow = isArabic ? ArrowUpLeft : ArrowUpRight;

  return (
    <section
      id="graduation-project"
      aria-labelledby="graduation-project-title"
      className="relative overflow-hidden border-t border-border/70 py-24 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(200,157,102,.12),transparent_58%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-3xl">
          <span className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.22em] text-[#C89D66]">
            <Sparkles className="h-3.5 w-3.5" />
            {t("المحطة الختامية • المشروع وصاحبه", "THE CLOSING NOTE • PROJECT & AUTHOR")}
          </span>
          <h2
            id="graduation-project-title"
            className="arabic-diacritics text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl"
          >
            {t("فكرة تتقدّم… وأثر يستحق أن يُرى.", "A considered idea. A digital presence built to last.")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
            {t(
              "خاتمة توثّق سياق المشروع والرحلة التعليمية التي انطلق منها، وتعرّف بصاحب العمل.",
              "A final note documenting the project's learning context and introducing its creator."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article className="group relative isolate overflow-hidden rounded-[1.75rem] border border-[#C89D66]/35 bg-[#101315] p-7 sm:p-9">
            <div className="pointer-events-none absolute -end-14 -top-16 -z-10 h-64 w-64 rounded-full bg-[#C89D66]/10 blur-3xl transition-opacity duration-500 group-hover:opacity-80" />
            <div className="mb-8 flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C89D66]/35 bg-[#C89D66]/10 px-3 py-1.5 text-[11px] font-semibold text-[#E2C18D]">
                <GraduationCap className="h-3.5 w-3.5" />
                {t("مشروع تخرّج", "GRADUATION PROJECT")}
              </span>
              <TaqdomLogo size={46} showWordmark={false} />
            </div>
            <h3 className="mb-3 text-3xl font-semibold tracking-tight text-[#F4F1EA] sm:text-4xl">
              TAQDOM <span className="text-[#D7B77B]">تَقَدُّم</span>
            </h3>
            <p className="max-w-xl text-sm leading-8 text-[#C7C3BA] sm:text-base">
              {t(
                "منصة لبناء الهوية الرقمية ومعارض الأعمال، تجمع بين العرض الاحترافي، والقوالب المتخصصة، ومساحة رقمية تحمل اسم صاحبها.",
                "A platform for digital identities and professional portfolios, bringing together focused templates, thoughtful presentation, and a personal web address."
              )}
            </p>
            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#D7B77B]">
                {t("ضمن البرنامج التدريبي", "PROGRAM CONTEXT")}
              </p>
              <p className="text-base font-bold leading-7 text-[#F4F1EA]">
                {t(
                  "مبادرة سفراء الذكاء الاصطناعي",
                  "AI Ambassadors Initiative"
                )}
              </p>
              <p className="mt-1 text-sm text-[#C7C3BA]">
                {t("الدفعة الثانية عشرة • المستوى الأساسي", "Batch 12 • Foundation Level")}
              </p>
              <a
                href="https://www.nti.sci.eg/"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#E2C18D] underline-offset-4 hover:underline"
              >
                {t("المعهد القومي للاتصالات (NTI)", "National Telecommunication Institute (NTI)")}
                <Arrow className="h-3.5 w-3.5" />
              </a>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-7 sm:p-9">
            <div className="pointer-events-none absolute -start-16 -bottom-20 h-64 w-64 rounded-full bg-[#C89D66]/10 blur-3xl" />
            <div className="relative flex h-full flex-col">
              <span className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary/70 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                <Award className="h-3.5 w-3.5 text-[#C89D66]" />
                {t("صاحب المشروع", "PROJECT CREATOR")}
              </span>
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.45rem] border border-[#C89D66]/55 bg-secondary shadow-[0_14px_38px_rgba(0,0,0,.22)] sm:h-36 sm:w-36">
                  <Image
                    src="/images/abdullah-yehia.webp"
                    alt={t("عبدالله يحى", "Abdullah Yehia")}
                    fill
                    priority={false}
                    sizes="(max-width: 640px) 112px, 144px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="arabic-diacritics text-2xl font-bold text-foreground sm:text-3xl">
                    {t("عبدالله يحى", "Abdullah Yehia")}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {t(
                      "صاحب ومطوّر مشروع تَقَدُّم",
                      "Creator & Developer of Taqdom"
                    )}
                  </p>
                  <p className="mt-1 text-xs font-mono tracking-wide text-[#C89D66]">
                    AI AMBASSADORS • BATCH 12
                  </p>
                </div>
              </div>
              <p className="mt-7 max-w-xl text-sm leading-8 text-muted-foreground">
                {t(
                  "أؤمن أن التقنية تصبح أكثر قيمة حين تتحول إلى تجربة نافعة، واضحة، ومتاحة للناس.",
                  "I believe technology matters most when it becomes a useful, clear, and accessible experience."
                )}
              </p>
              <div className="mt-auto pt-7">
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#C89D66]/45 bg-[#C89D66]/10 px-5 py-3 text-sm font-bold text-[#D7B77B] transition hover:-translate-y-0.5 hover:bg-[#C89D66]/15 focus-visible:outline-offset-4"
                >
                  LinkedIn
                  <Arrow className="h-4 w-4" />
                </a>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-7 rounded-[1.75rem] border border-border/80 bg-card/65 p-7 sm:p-9">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C89D66]/12 text-[#C89D66]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {t("شكر وتقدير", "ACKNOWLEDGEMENTS")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("تقدير لكل من أسهم في رحلة التعلّم", "With appreciation to those who support learning")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="mb-2 text-sm font-bold text-foreground">
                {t("مدرّب البرنامج", "PROGRAM INSTRUCTOR")}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                {t(
                  "خالص الشكر على الشرح الواضح، والتوجيه العملي، وما قُدّم من دعم طوال الرحلة التدريبية.",
                  "Sincere thanks for the clear teaching, practical guidance, and support throughout the learning journey."
                )}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-foreground">
                {t("المعهد القومي للاتصالات (NTI)", "National Telecommunication Institute (NTI)")}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                {t(
                  "تقدير لدوره في تنمية المهارات الرقمية وإتاحة مسارات تدريبية تطبيقية، بقيادة الأستاذ الدكتور أحمد خطاب، مدير المعهد.",
                  "With appreciation for its digital-skills and applied-training programmes, under the direction of Prof. Ahmed Khattab, NTI Director."
                )}
              </p>
              <a href="https://www.nti.sci.eg/about_nti.html" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#C89D66] underline-offset-4 hover:underline">
                {t("الموقع الرسمي", "Official website")}
              </a>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-foreground">
                {t("الجهاز القومي لتنظيم الاتصالات (NTRA)", "National Telecommunications Regulatory Authority (NTRA)")}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                {t(
                  "تقدير لدوره في تنظيم قطاع الاتصالات ودعم بيئة رقمية موثوقة ومبتكرة، بقيادة المهندس محمد شمروخ، الرئيس التنفيذي للجهاز.",
                  "With appreciation for its work to regulate the telecommunications sector and support a trusted digital environment, under Eng. Mohamed Shamroukh, Executive President."
                )}
              </p>
              <a href="https://www.tra.gov.eg/" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#C89D66] underline-offset-4 hover:underline">
                {t("الموقع الرسمي", "Official website")}
              </a>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-foreground">
                {t("فخامة الرئيس عبد الفتاح السيسي", "H.E. President Abdel Fattah El-Sisi")}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                {t(
                  "تقديرًا للاهتمام ببناء الإنسان المصري، وتنمية القدرات، ودعم مسارات التحول الرقمي.",
                  "In recognition of the national focus on human-capital development, skills, and digital transformation."
                )}
              </p>
              <a href="https://www.presidency.eg/" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#C89D66] underline-offset-4 hover:underline">
                {t("الموقع الرسمي لرئاسة الجمهورية", "Official Presidency website")}
              </a>
            </div>
          </div>
          <p className="mt-7 border-t border-border/70 pt-5 text-xs leading-6 text-muted-foreground">
            {t(
              "تَقَدُّم مشروع تخرّج مستقل أُنجز ضمن السياق التدريبي للمبادرة، ولا يمثّل إعلانًا أو اعتمادًا رسميًا من الجهات المذكورة.",
              "Taqdom is an independent graduation project created in the context of the training programme; it is not an endorsement or official certification by the institutions mentioned."
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
