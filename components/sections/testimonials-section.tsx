"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Quote, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const TESTIMONIALS = [
  {
    nameAr: "نادية الحمامي",
    nameEn: "Nadia El-Hamamy",
    roleAr: "مديرة إبداعية — استوديو الزمالك، القاهرة",
    roleEn: "Creative Director — Zamalek Atelier, Cairo",
    avatar: "/images/creators/nadia.jpg",
    quoteAr:
      "«أخيراً منصة عربية تفهم معنى الفخامة البصرية الحقيقية! التبديل بين الوضع المرمري النهاري والوضع الليلي المستقبلي، مع حماية التشكيل العربي، جعل بورتفوليو الاستوديو يبدو كأنه مرشح لجائزة عالمية.»",
    quoteEn:
      "“Finally a platform born in Egypt that understands true visual luxury. The Living Alabaster daylight mode and flawless Arabic typography elevated our studio showcase immediately.”",
  },
  {
    nameAr: "عمر الدسوقي",
    nameEn: "Omar El-Desouky",
    roleAr: "مهندس معماري ومصمم بـ WebGL — دبي ولندن",
    roleEn: "Spatial Architect & Computational Designer — Dubai & London",
    avatar: "/images/creators/omar.jpg",
    quoteAr:
      "«القدرة على حجز نطاق فرعي نظيف باسمي قبل .taqdom.me مع التحكم الحي في إضاءة الـ 3D من داخل الاستوديو وفّرت عليّ شهوراً من البرمجة المخصصة.»",
    quoteEn:
      "“Having my own clean subdomain before .taqdom.me paired with real-time 3D lighting controls in the Studio saved me months of custom WebGL development.”",
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
    qAr: "هل يمكنني تجربة المنصة فوراً بدون إنشاء حساب جديد؟",
    qEn: "Can I test the platform immediately without registering?",
    aAr: "نعم! وفرنا في صفحة /auth زراً للدخول الفوري بضغطة واحدة بحساب الاختبار الرسمي (test@taqdom.me / النطاق: test.taqdom.me) المحمّل مسبقاً بالمشاريع والصور لتجربة الاستوديو والنشر فوراً.",
    aEn: "Yes! On /auth you can click the 1-Click Test Account button (test@taqdom.me / test.taqdom.me), pre-loaded with architectural projects so you can test editing and publishing right away.",
  },
  {
    qAr: "هل يمكنني التبديل بين القوالب الأربعة دون فقدان بياناتي؟",
    qEn: "Can I switch between the 4 templates without losing my projects?",
    aAr: "بكل تأكيد. جميع القوالب الأربعة (أَثَر، مَدَار، سِيَادَة، نُور) تشترك في هيكل البيانات الموحد، مما يتيح لك التبديل بينها بضغطة واحدة داخل الاستوديو.",
    aEn: "Absolutely. Athar, Madar, Siyada, and Noor share a unified data schema so you can switch templates instantaneously inside the Studio while keeping all projects and SEO settings.",
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
            src="/images/testimonial-house.png"
            alt="Taqdom Architectural Sanctuary"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/90 via-[#050508]/45 to-transparent" />
          <div className="relative z-10 max-w-4xl">
            <span className="inline-block rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 px-3.5 py-1 text-xs font-semibold text-[#D4AF37] mb-4">
              {t("٠٧ • شهادات المبدعين", "07 • VOICES OF SOVEREIGN CREATORS")}
            </span>
            <p className="arabic-diacritics text-2xl sm:text-4xl font-bold text-[#EDEAE2] leading-snug">
              {t(
                "«تَقَدُّم ليست مجرد أداة لبناء المواقع، بل صالة عرض سيادية تمنح الإبداع المصري والعربي مكانته العالمية المستحقة.»",
                "“Taqdom is not merely a portfolio builder — it is a sovereign museum engineered for creators who refuse mediocrity.”"
              )}
            </p>
          </div>
        </div>

        {/* Human Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {TESTIMONIALS.map((item, idx) => (
            <div key={idx} className="glass-panel rounded-3xl p-8 flex flex-col justify-between gap-6">
              <div>
                <Quote className="h-8 w-8 text-[#C5A059] mb-4 opacity-80" />
                <p className="text-base sm:text-lg text-foreground leading-relaxed">
                  {t(item.quoteAr, item.quoteEn)}
                </p>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-border/60">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-[#C5A059]">
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
                      className={`h-5 w-5 text-[#C5A059] shrink-0 transition-transform ${
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
