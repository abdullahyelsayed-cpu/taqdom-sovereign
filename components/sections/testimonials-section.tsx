"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Quote, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const TESTIMONIALS = [
  {
    nameAr: "ليلى منصور",
    nameEn: "Layla Mansour",
    roleAr: "نموذج مهني توضيحي • العمارة والبحث التراثي",
    roleEn: "Illustrative profile • Architecture & heritage research",
    avatar: "/images/creators/layla.jpg",
    quoteAr:
      "«قالب مَلاذ (Haven) يقدّم مساحة هادئة لعرض المشاريع المعمارية، مع تسلسل بصري يترك للعمل نفسه مساحة الظهور.»",
    quoteEn:
      "“The Haven template offers a calm space for architectural work, with a visual rhythm that lets the projects speak for themselves.”",
  },
  {
    nameAr: "يوسف الشريف",
    nameEn: "Youssef El-Sherif",
    roleAr: "نموذج مهني توضيحي • الذكاء الاصطناعي والنظم",
    roleEn: "Illustrative profile • AI systems & engineering",
    avatar: "/images/creators/youssef.jpg",
    quoteAr:
      "«قالب مَدَار يجمع بين المشاريع والمهارات والنتائج في بنية واضحة يسهل استكشافها.»",
    quoteEn:
      "“The Madar template brings projects, skills, and outcomes into a clear structure that is easy to explore.”",
  },
];

const FAQS = [
  {
    qAr: "كيف يعمل النطاق الفرعي المستقل (username.taqdom.me)؟",
    qEn: "How does the personal subdomain (username.taqdom.me) work?",
    aAr: "بعد اختيار اسم المستخدم ونشر المعرض، يوجّه نظام الحافة الزوار إلى عنوانك المستقل مثل https://username.taqdom.me. وتُستخدم التحويلات الدائمة للروابط المعتمدة عند الحاجة.",
    aEn: "After choosing a username and publishing a portfolio, edge routing serves it at an address such as https://username.taqdom.me. Permanent redirects are used for canonical paths where appropriate.",
  },
  {
    qAr: "هل يمكنني معاينة حساب نموذجي وتجربة الاستوديو؟",
    qEn: "Can I preview a sample account and explore the Studio?",
    aAr: "نعم. تتيح صفحة الدخول فتح حساب عرض تجريبي لاستكشاف لوحة التحكم والاستوديو والقوالب قبل إنشاء حسابك.",
    aEn: "Yes. The sign-in page includes a demo account to explore the dashboard, Studio, and templates before creating an account.",
  },
  {
    qAr: "هل يدعم تَقَدُّم الاتصال عبر MCP للقراءة والكتابة باستخدام أدوات الذكاء الاصطناعي؟",
    qEn: "Does Taqdom support MCP read and write access for AI tools?",
    aAr: "نعم. يمكنك ربط معرضك من صفحة اتصالات MCP في لوحة التحكم بتطبيق متوافق مع MCP. يتيح الاتصال قراءة بيانات المعرض والملف الشخصي والمشاريع، وتعديل الملف الشخصي وإضافة المشاريع وتحديثها وحذفها. تُحفظ التغييرات في مسودة خاصة، ولا تظهر للزوار إلا بعد استدعاء أداة publish_portfolio صراحةً. لكل اتصال مفتاح مستقل يمكنك إلغاؤه في أي وقت.",
    aEn: "Yes. Connect your portfolio from the MCP Connections page in your dashboard to an MCP-compatible AI app. The connection can read your portfolio, profile, and projects, and update your profile, create, edit, or delete projects. Changes are saved to a private draft and become public only after the publish_portfolio tool is explicitly called. Each connection has its own revocable token.",
  },
  {
    qAr: "أين أجد رابط MCP ومفتاح الاتصال، وهل يمكنني التحكم في الوصول؟",
    qEn: "Where do I find my MCP endpoint and token, and can I control access?",
    aAr: "افتح لوحة التحكم ثم اتصالات MCP، وأنشئ اتصالًا جديدًا لعرض رابط MCP ومفتاح Bearer مرة واحدة. انسخ المفتاح واحفظه بأمان؛ لا يمكن عرضه مرة أخرى. يمكنك إنشاء حتى 10 اتصالات نشطة وإلغاء أي اتصال منفردًا. الاتصال الحالي يستخدم مفاتيح شخصية عبر HTTPS، ولا يعتمد OAuth 2.1 حتى الآن.",
    aEn: "Open Dashboard → MCP Connections and create a connection to reveal its MCP endpoint and one-time Bearer token. Copy and store the token securely; it cannot be shown again. You can create up to 10 active connections and revoke each one independently. The current connection uses personal HTTPS bearer tokens and does not yet implement OAuth 2.1.",
  },
  {
    qAr: "هل يمكنني التبديل بين القوالب السبعة دون إعادة إدخال بياناتي؟",
    qEn: "Can I switch between the seven templates without re-entering my content?",
    aAr: "تستخدم القوالب هيكل بيانات موحدًا، ويمكن تغيير القالب من الاستوديو مع الاحتفاظ بمحتوى المعرض وفق الحقول التي يدعمها القالب المختار.",
    aEn: "The templates share a unified content model. You can change a template in the Studio while retaining the portfolio content supported by the selected design.",
  },
];

export function TestimonialsSection() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="testimonials" className="relative border-t border-border/60 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative mb-12 flex min-h-[320px] items-end overflow-hidden rounded-3xl border border-border p-8 sm:p-12">
          <Image
            src="/images/ultra/siyada-2.webp"
            alt={t("مساحة معمارية هادئة", "A calm architectural space")}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090B0D]/95 via-[#090B0D]/50 to-transparent" />
          <div className="relative z-10 max-w-4xl">
            <span className="mb-4 inline-block rounded-full border border-[#D7B77B]/45 bg-[#C89D66]/15 px-3.5 py-1 text-xs font-semibold text-[#E2C18D]">
              {t("٠٧ • نماذج عرض توضيحية", "07 • ILLUSTRATIVE SHOWCASE PROFILES")}
            </span>
            <p className="arabic-diacritics text-2xl font-bold leading-snug text-[#F4F1EA] sm:text-4xl">
              {t(
                "كل مهنة لها قصة، وكل مشروع يستحق طريقة عرض تُظهر قيمته.",
                "Every discipline has a story. Every project deserves a presentation that reveals its value."
              )}
            </p>
          </div>
        </div>

        <p className="mb-6 rounded-xl border border-[#C89D66]/25 bg-[#C89D66]/[0.06] px-4 py-3 text-xs leading-6 text-muted-foreground">
          {t(
            "تنويه: الأسماء والملفات والعبارات التالية نماذج افتراضية أُضيفت لشرح طريقة العرض، ولا تمثل شهادات عملاء موثّقة.",
            "Note: The names, profiles, and sample statements below are illustrative demo content, not verified customer testimonials."
          )}
        </p>

        <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-2">
          {TESTIMONIALS.map((item, idx) => (
            <article key={idx} className="glass-panel flex flex-col justify-between gap-6 rounded-3xl p-8">
              <div>
                <Quote className="mb-4 h-8 w-8 text-[#C89D66] opacity-80" aria-hidden="true" />
                <p className="text-base leading-8 text-foreground sm:text-lg">
                  {t(item.quoteAr, item.quoteEn)}
                </p>
              </div>
              <div className="flex items-center gap-4 border-t border-border/60 pt-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#C89D66]/50">
                  <Image src={item.avatar} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div>
                  <h3 className="arabic-diacritics font-bold text-foreground">
                    {t(item.nameAr, item.nameEn)}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t(item.roleAr, item.roleEn)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mx-auto max-w-3xl">
          <h3 className="arabic-diacritics mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl">
            {t("الأسئلة الشائعة حول تَقَدُّم", "Frequently Asked Questions")}
          </h3>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="glass-panel overflow-hidden rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-start font-bold text-foreground"
                    aria-expanded={isOpen}
                  >
                    <span>{t(faq.qAr, faq.qEn)}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[#C89D66] transition-transform ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-border/50 px-5 pb-5 pt-3 text-sm leading-8 text-muted-foreground">
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
