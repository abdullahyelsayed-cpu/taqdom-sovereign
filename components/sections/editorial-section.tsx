"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export function EditorialSection() {
  const { t } = useLanguage();

  const stats = [
    { labelAr: "قوالب مهنية مستقلة", labelEn: "Career Archetypes", value: "07" },
    { labelAr: "سرعة التوجيه على الحافة", labelEn: "Global Edge Routing", value: "<15ms" },
    { labelAr: "حماية التشكيل العربي", labelEn: "Arabic Diacritic Ratio", value: "1.48x" },
    { labelAr: "نطاقات فرعية سيادية", labelEn: "Wildcard Subdomains", value: "∞" },
  ];

  const plates = [
    "/images/ultra/haven-2.webp",
    "/images/ultra/athar-1.webp",
    "/images/ultra/siyada-1.webp",
    "/images/ultra/salam-1.webp",
  ];

  return (
    <section id="editorial" className="relative py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          <div className="lg:col-span-5 space-y-5">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#9A7B4F] dark:text-[#C89D66]">
              {t("٠٦ • التحرير البصري والرواية", "06 • EDITORIAL MONOGRAPH")}
            </span>
            <h2 className="arabic-diacritics text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              {t(
                "مصممة لتُقرأ ككتاب فني نادر، وتُستكشف كمنصة حية",
                "Curated Like a Rare Art Monograph, Engineered for Gen-Z Velocity"
              )}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              {t(
                "سواء كنت تعرض أبحاث ذكاء اصطناعي، مخططات معمارية، صفقات مبيعات مليونية، أو مسارات أتمتة تسويقية، تمنحك تَقَدُّم شبكة تحريرية تحترم الفراغ وتبرز جوهر إبداعك.",
                "Whether presenting AI systems, architectural plates, revenue quota rings, or MarTech automation pipelines, Taqdom frames your work with museum-grade restraint."
              )}
            </p>
            <div className="pt-2">
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-xl bg-[#9A7B4F] dark:bg-[#C89D66] px-6 py-3 text-sm font-bold text-[#F7F5F0] dark:text-[#0A0A09] transition hover:opacity-95"
              >
                {t("جرب التحرير الحي في الاستوديو", "Experience the Live Editorial Studio")}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            {plates.map((src, i) => (
              <div
                key={src}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border shadow-md"
              >
                <Image
                  src={src}
                  alt={`Editorial 4K plate ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 glass-panel rounded-3xl overflow-hidden">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="p-8 text-center border-b md:border-b-0 border-e border-border/60 last:border-e-0"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {t(s.labelAr, s.labelEn)}
              </p>
              <p className="font-mono text-4xl sm:text-5xl font-extrabold text-[#9A7B4F] dark:text-[#C89D66]">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
