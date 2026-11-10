"use client";

import React from "react";
import Image from "next/image";
import { Cpu, Globe, Shield, Zap, Sparkles, Code2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const TECH_SPECS = [
  {
    icon: Globe,
    badge: "EDGE ROUTING",
    titleAr: "نطاقات فرعية مستقلة لكل معرض",
    titleEn: "A Dedicated Subdomain for Every Portfolio",
    descAr:
      "يربط توجيه النطاقات كل معرض بعنوان مستقل مثل username.taqdom.me، مع إدارة المسارات والتحويلات عبر Cloudflare Workers وتخزين البيانات في D1.",
    descEn:
      "Wildcard routing maps each portfolio to an address such as username.taqdom.me, with request handling through Cloudflare Workers and persistence in D1.",
    image: "/images/ultra/madar-hero.webp",
  },
  {
    icon: Cpu,
    badge: "MOTION SYSTEM",
    titleAr: "حركة مدروسة وتفاعل سلس",
    titleEn: "Purposeful Motion & Responsive Interaction",
    descAr:
      "تجمع المنصة بين انتقالات هادئة، وحركات مرتبطة بالتمرير عند الحاجة، وبطاقات تفاعلية تحافظ على وضوح المحتوى ولا تزاحم تجربة القراءة.",
    descEn:
      "Measured transitions, optional scroll-linked movement, and interactive cards keep the interface expressive without competing with the content.",
    image: "/images/ultra/salam-hero.webp",
  },
  {
    icon: Zap,
    badge: "SEARCH & SHARING",
    titleAr: "أساس تقني للظهور والمشاركة",
    titleEn: "A Foundation for Search & Sharing",
    descAr:
      "تضم المنصة بيانات وصفية قابلة للتخصيص، وخرائط موقع، وبطاقات مشاركة، وبيانات منظمة للملفات الشخصية والأعمال حيث تتوفر البيانات اللازمة.",
    descEn:
      "Customizable metadata, sitemaps, social-sharing cards, and structured profile and project data where the required information is available.",
    image: "/images/ultra/siyada-hero.webp",
  },
  {
    icon: Shield,
    badge: "ARABIC & ENGLISH",
    titleAr: "تجربة عربية وإنجليزية من اليمين واليسار",
    titleEn: "Arabic RTL & English LTR by Design",
    descAr:
      "تدعم الواجهة اتجاهي RTL وLTR، مع خطوط عربية وإنجليزية واضحة، ومسافات مناسبة للتشكيل العربي، وعناصر تنقل قابلة للاستخدام عبر لوحة المفاتيح.",
    descEn:
      "The interface supports RTL and LTR layouts, readable Arabic and Latin typography, careful diacritic spacing, and keyboard-accessible navigation.",
    image: "/images/ultra/wameed-hero.webp",
  },
];

export function TechnologySection() {
  const { t } = useLanguage();

  return (
    <section id="technology" className="relative border-t border-border/60 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="mb-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[#B68C51] dark:text-[#D7B77B]">
            <Code2 className="h-3.5 w-3.5" />
            <span>{t("٠٣ • الهندسة والتجربة", "03 • ENGINEERING & EXPERIENCE")}</span>
          </span>
          <h2 className="arabic-diacritics text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t("تقنية واضحة خلف تجربة متقنة", "Thoughtful Engineering Behind a Considered Experience")}
          </h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
            {t(
              "بُنيت تَقَدُّم باستخدام Next.js وCloudflare Workers وD1 وGSAP؛ لتجمع بين بنية ويب حديثة وتجربة عرض قابلة للتطوير.",
              "Taqdom uses Next.js, Cloudflare Workers, D1, and GSAP to bring a modern web foundation together with a flexible presentation experience."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {TECH_SPECS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <article key={idx} className="group flex flex-col overflow-hidden rounded-3xl glass-panel">
                <div className="relative h-56 w-full overflow-hidden">
                  <Image
                    src={item.image}
                    alt={t(item.titleAr, item.titleEn)}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090B0D]/90 via-[#090B0D]/25 to-transparent" />
                  <div className="absolute start-4 top-4 inline-flex items-center gap-2 rounded-full border border-[#D7B77B]/40 bg-[#090B0D]/80 px-3 py-1 font-mono text-[11px] text-[#E2C18D]">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.badge}</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between p-7">
                  <div>
                    <h3 className="arabic-diacritics mb-2.5 text-xl font-bold text-foreground sm:text-2xl">
                      {t(item.titleAr, item.titleEn)}
                    </h3>
                    <p className="text-sm leading-8 text-muted-foreground">
                      {t(item.descAr, item.descEn)}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4 font-mono text-xs text-[#B68C51] dark:text-[#D7B77B]">
                    <span>NEXT.JS • CLOUDFLARE • GSAP</span>
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
