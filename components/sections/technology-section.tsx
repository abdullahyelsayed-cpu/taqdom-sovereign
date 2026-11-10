"use client";

import React from "react";
import Image from "next/image";
import { Cpu, Globe, Shield, Zap, Sparkles, Code2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const TECH_SPECS = [
  {
    icon: Globe,
    badge: "WILDCARD DNS EDGE",
    titleAr: "توجيه نطاقات فرعية فوري (*.taqdom.me)",
    titleEn: "Instant Wildcard Subdomain Routing (*.taqdom.me)",
    descAr:
      "يعمل محرك الحافة على ربط كل مبدع بنطاقه المستقل username.taqdom.me مع تحويل تلقائي 308 لأي روابط قديمة وحفظ كامل في قاعدة بيانات D1.",
    descEn:
      "Cloudflare Edge maps every creator directly to username.taqdom.me with automatic 308 canonical redirects and D1 persistence.",
    image: "/images/ultra/madar-hero.webp",
  },
  {
    icon: Cpu,
    badge: "GSAP SCROLLTRIGGER + LENIS",
    titleAr: "هندسة حركة سينمائية بمعايير Awwwards 2026",
    titleEn: "Awwwards 2026 Cinematic Scroll Choreography",
    descAr:
      "بوابات كاميرا مثبتة، معارض أفقية ناعمة، وبطاقات Bento تفاعلية تعمل بمنحنى الحركة cubic-bezier(0.22, 1, 0.36, 1).",
    descEn:
      "Pinned camera portals, horizontal showcase tracks, and tactile Bento cards calibrated with cubic-bezier(0.22, 1, 0.36, 1).",
    image: "/images/ultra/salam-hero.webp",
  },
  {
    icon: Zap,
    badge: "FULL TECHNICAL SEO",
    titleAr: "سيو ديناميكي وبيانات مهيكلة JSON-LD",
    titleEn: "Dynamic Metadata & Rich Person JSON-LD",
    descAr:
      "يولّد النظام تلقائياً خرائط الموقع Sitemap، بطاقات المشاركة، وبيانات Person وCreativeWork لكل مشروع ليظهر اسمك أولاً في البحث.",
    descEn:
      "Automated OpenGraph cards, dynamic sitemaps, and Schema.org Person + CreativeWork graphs per creator.",
    image: "/images/ultra/siyada-hero.webp",
  },
  {
    icon: Shield,
    badge: "BILINGUAL RTL / LTR",
    titleAr: "ثنائية لغوية فورية وحماية التشكيل العربي",
    titleEn: "Zero-Reload AR/EN & Diacritic Typography",
    descAr:
      "تبديل لحظي بين العربية المشكّلة (Readex Pro & IBM Plex Sans Arabic) والإنجليزية (Instrument Serif & Plus Jakarta Sans) بدون وميض.",
    descEn:
      "Instant RTL/LTR direction switching with calibrated line-height preserving Arabic tashkeel diacritics.",
    image: "/images/ultra/wameed-hero.webp",
  },
];

export function TechnologySection() {
  const { t } = useLanguage();

  return (
    <section id="technology" className="relative py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#9A7B4F] dark:text-[#C89D66] mb-3">
            <Code2 className="h-3.5 w-3.5" />
            <span>{t("٠٣ • الهندسة السحابية والحركية الفائقة", "03 • SOVEREIGN CLOUD & MOTION STACK")}</span>
          </span>
          <h2 className="arabic-diacritics text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            {t(
              "تكنولوجيا المستقبل خلف كل هوية مهنية",
              "Hyper-Modern Edge Engineering Under the Hood"
            )}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            {t(
              "بُنيت منصة تَقَدُّم على معمارية Next.js 16 وCloudflare Workers + D1 وGSAP لتضمن سرعة فائقة وأناقة لا تضاهى.",
              "Built on Next.js App Router, Cloudflare Workers + D1, and GSAP ScrollTrigger for sub-20ms global edge delivery."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TECH_SPECS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group glass-panel rounded-3xl overflow-hidden flex flex-col"
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <Image
                    src={item.image}
                    alt={t(item.titleAr, item.titleEn)}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A09]/85 via-[#0A0A09]/25 to-transparent" />
                  <div className="absolute top-4 start-4 inline-flex items-center gap-2 rounded-full bg-[#0A0A09]/80 border border-[#C89D66]/40 px-3 py-1 font-mono text-[11px] text-[#C89D66]">
                    <Icon className="h-3.5 w-3.5 text-[#C89D66]" />
                    <span>{item.badge}</span>
                  </div>
                </div>
                <div className="p-7 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="arabic-diacritics text-xl sm:text-2xl font-bold text-foreground mb-2.5">
                      {t(item.titleAr, item.titleEn)}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(item.descAr, item.descEn)}
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-mono text-[#9A7B4F] dark:text-[#C89D66]">
                    <span>CLOUDFLARE EDGE • D1 • GSAP 2026</span>
                    <Sparkles className="h-3.5 w-3.5" />
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
