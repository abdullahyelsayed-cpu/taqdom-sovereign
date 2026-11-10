"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Quote, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const TESTIMONIALS = [
  {
    nameAr: "ليلى منصور",
    nameEn: "Layla Mansour",
    roleAr: "مهندسة معمارية وباحثة في التراث المعاصر — القاهرة وميلانو",
    roleEn: "Principal Architect & Heritage Researcher — Cairo & Milan",
    avatar: "/images/creators/layla.jpg",
    quoteAr:
      "«قالب مَلاذ (Haven) في تَقَدُّم حوّل مشروع تخرجي وأعمالي المعمارية إلى معرض رقمي ينافس كبرى المكاتب العالمية. النطاق المستقل layla.taqdom.me منحني حضوراً فورياً أمام لجان التحكيم.»",
    quoteEn:
      "“The Haven template transformed my architectural thesis and studio works into a monograph that rivals international practices. Having layla.taqdom.me gave me instant authority.”",
  },
  {
    nameAr: "يوسف الشريف",
    nameEn: "Youssef El-Sherif",
    roleAr: "مهندس ذكاء اصطناعي ونظم موزعة — القاهرة",
    roleEn: "AI Systems & Full-Stack Engineer — Cairo",
    avatar: "/images/creators/youssef.jpg",
    quoteAr:
      "«لوحة الأوامر السريعة Cmd+K وشبكة Bento في قالب مَدَار أبهرت مسؤولي التوظيف في شركات التقنية الكبرى منذ الثانية الأولى.»",
    quoteEn:
      "“The Cmd+K command palette and Bento telemetry grid in the Madar template impressed engineering hiring managers from the very first second.”",
  },
];

const FAQS = [
  {
    qAr: "كيف يعمل النطاق الفرعي المستقل (username.taqdom.me)؟",
    qEn: "How does the sovereign subdomain (username.taqdom.me) work?",
    aAr: "بمجرد اختيار اسم المستخدم ونشر البورتفوليو من الاستوديو، يقوم نظام الحافة بتوجيه الزوار مباشرة إلى https://username.taqdom.me، ويحوّل أي رابط فرعي قديم تلقائياً برمز 308 للحفاظ على قوة السيو.",
    aEn: "As soon as you claim your username and publish in the Studio, our Edge middleware serves your portfolio directly at https://username.taqdom.me with automatic 308 canonical redirects.",
  },
  {
    qAr: "هل يمكنني معاينة حساب مبدع موثق وتجربة الاستوديو فوراً؟",
    qEn: "Can I preview a verified flagship creator account in the Studio right away?",
    aAr: "نعم! وفرنا في صفحة الدخول زر المعاينة السريعة للحساب النموذجي الموثق للمهندسة ليلى منصور (layla.taqdom.me) لتتمكن من استكشاف الاستوديو الحي وتجربة القوالب السبعة فوراً.",
    aEn: "Yes! On the sign-in page you can launch the 1-click verified flagship creator session (layla.taqdom.me) pre-loaded with 4K architectural projects to explore the Studio immediately.",
  },
  {
    qAr: "هل يمكنني التبديل بين القوالب السبعة دون فقدان بياناتي؟",
    qEn: "Can I switch between all 7 templates without losing my projects?",
    aAr: "بكل تأكيد. جميع القوالب السبعة (مَدَار، أَثَر، مَلاذ، سِيَادَة، وَمِيض، سَلَام، مِشْوَار) تشترك في هيكل البيانات الموحد، مما يتيح لك التبديل بينها بضغطة واحدة داخل الاستوديو.",
    aEn: "Absolutely. All seven archetypes (Madar, Athar, Haven, Siyada, Wameed, Salam, and Meshwar) share a unified data schema so you can switch templates instantaneously inside the Studio.",
  },
];

export function TestimonialsSection() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="testimonials" className="relative py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cinematic Banner with Architectural Backdrop */}
        <div className="relative rounded-3xl overflow-hidden border border-border mb-20 min-h-[340px] flex items-end p-8 sm:p-12">
          <Image
            src="/images/ultra/haven-hero.webp"
            alt="Taqdom Architectural Sanctuary"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A09]/90 via-[#0A0A09]/45 to-transparent" />
          <div className="relative z-10 max-w-4xl">
            <span className="inline-block rounded-full bg-[#C89D66]/20 border border-[#C89D66]/50 px-3.5 py-1 text-xs font-semibold text-[#C89D66] mb-4">
              {t("٠٧ • شهادات الخريجين والمحترفين", "07 • VOICES OF SOVEREIGN CREATORS")}
            </span>
            <p className="arabic-diacritics text-2xl sm:text-4xl font-bold text-[#F4F1EA] leading-snug">
              {t(
                "«تَقَدُّم ليست مجرد أداة لبناء المواقع، بل هوية سيادية تمنح الخريج والمحترف العربي مكانته العالمية المستحقة.»",
                "“Taqdom is not merely a portfolio builder — it is a sovereign digital identity engineered for creators who refuse mediocrity.”"
              )}
            </p>
          </div>
        </div>

        {/* Human Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {TESTIMONIALS.map((item, idx) => (
            <div key={idx} className="glass-panel rounded-3xl p-8 flex flex-col justify-between gap-6">
              <div>
                <Quote className="h-8 w-8 text-[#9A7B4F] dark:text-[#C89D66] mb-4 opacity-80" />
                <p className="text-base sm:text-lg text-foreground leading-relaxed">
                  {t(item.quoteAr, item.quoteEn)}
                </p>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-border/60">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-[#9A7B4F] dark:border-[#C89D66]">
                  <Image
                    src={item.avatar}
                    alt={t(item.nameAr, item.nameEn)}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="arabic-diacritics font-bold text-foreground">
                    {t(item.nameAr, item.nameEn)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t(item.roleAr, item.roleEn)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="mx-auto max-w-3xl">
          <h3 className="arabic-diacritics text-2xl sm:text-3xl font-bold text-center text-foreground mb-8">
            {t("الأسئلة الشائعة حول تَقَدُّم", "Frequently Asked Questions")}
          </h3>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="glass-panel rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-start font-bold text-foreground"
                  >
                    <span>{t(faq.qAr, faq.qEn)}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-[#9A7B4F] dark:text-[#C89D66] shrink-0 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                      {t(faq.aAr, faq.aEn)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
