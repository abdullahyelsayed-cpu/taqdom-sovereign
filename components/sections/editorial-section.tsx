"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export function EditorialSection() {
  const { t } = useLanguage();

  const stats = [
    { labelAr: "قوالب سيادية فاخرة", labelEn: "Sovereign Archetypes", value: "04" },
    { labelAr: "سرعة التوجيه على الحافة", labelEn: "Global Edge Routing", value: "<20ms" },
    { labelAr: "حماية التشكيل العربي", labelEn: "Arabic Diacritic Ratio", value: "1.48x" },
    { labelAr: "دعم النطاقات الفرعية", labelEn: "Wildcard Subdomains", value: "∞" },
  ];

  const plates = [
    "/images/4312e1bb-e030-4528-b6df-8a6ea69fe384.png",
    "/images/b2401fa5-4eac-465f-b1f9-014aadc182ee.png",
    "/images/dd1b32a8-3722-4ea2-8808-10d53532809d.png",
    "/images/61af06cc-84d0-4031-a0ed-76fc43b1c1e1.png",
  ];

  return (
    <section id="editorial" className="relative py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          <div className="lg:col-span-5 space-y-5">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#C5A059]">
              {t("٠٦ • التحرير البصري والرواية", "06 • EDITORIAL MONOGRAPH")}
            </span>
            <h2 className="arabic-diacritics text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              {t(
                "مصممة لتُقرأ ككتاب فني نادر، وتُستكشف كمعرض حي",
                "Curated Like a Rare Art Monograph, Engineered Like a Spaceship"
              )}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              {t(
                "سواء كنت تعرض مخططات معمارية دقيقة، أو شريطاً سينمائياً، أو تقريراً تنفيذياً لشركتك الناشئة، تمنحك تَقَدُّم شبكة تحريرية تحترم الفراغ وتبرز جوهر إبداعك.",
                "Whether presenting architectural blueprints, anamorphic film reels, or executive venture mandates, Taqdom frames your work with museum-grade restraint."
              )}
            </p>
            <div className="pt-2">
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-xl bg-[#C5A059] px-6 py-3 text-sm font-bold text-[#111113] transition hover:bg-[#D4AF37]"
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
                  alt={`Editorial architectural study ${i + 1}`}
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
              <p className="font-mono text-4xl sm:text-5xl font-extrabold text-[#C5A059] dark:text-[#D4AF37]">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
