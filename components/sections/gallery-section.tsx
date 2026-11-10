"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, ExternalLink, MapPin, Sparkles } from "lucide-react";
import { SEED_PORTFOLIOS } from "@/lib/seed-data";
import { useLanguage } from "@/lib/i18n";
import { getSubdomainUrl } from "@/lib/types";

export function GallerySection() {
  const { t } = useLanguage();
  const [host, setHost] = useState("taqdom.me");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  const creators = Object.values(SEED_PORTFOLIOS);

  return (
    <section id="gallery" className="relative py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#C5A059] mb-3">
              <Award className="h-3.5 w-3.5" />
              <span>{t("٠٤ • معرض إبداعات الأعضاء الحي", "04 • LIVE SOVEREIGN CREATORS DIRECTORY")}</span>
            </span>
            <h2 className="arabic-diacritics text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              {t(
                "مبدعون حقيقيون ينبضون بالحياة على نطاقاتهم المستقلة",
                "Visionary Creators Live on Their Subdomains"
              )}
            </h2>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl border border-[#C5A059]/50 bg-secondary/70 px-5 py-3 text-xs font-bold text-foreground hover:border-[#C5A059]"
          >
            <span>{t("تصفح دليل المبدعين الكامل", "View Full Creators Directory")}</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#C5A059]" />
          </Link>
        </div>

        {/* Creators Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {creators.map((creator) => {
            const subUrl = getSubdomainUrl(creator.username, host);
            const firstProject = creator.projects[0];

            return (
              <div
                key={creator.username}
                className="group glass-panel rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 hover:border-[#C5A059] shadow-xl"
              >
                {/* Cover Image */}
                <div className="relative h-52 w-full overflow-hidden">
                  <Image
                    src={firstProject?.images[0] || creator.cover}
                    alt={t(creator.name.ar, creator.name.en)}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/90 via-[#050508]/30 to-transparent" />

                  {/* Honor Badge */}
                  <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#050508]/80 border border-[#D4AF37]/50 px-2.5 py-1 text-[10px] font-semibold text-[#D4AF37]">
                      <Sparkles className="h-3 w-3" />
                      <span>
                        {creator.badge
                          ? t(creator.badge.ar, creator.badge.en)
                          : t("وسام التميز", "Site Distinction")}
                      </span>
                    </span>
                    <span className="rounded-full bg-[#C5A059] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-[#111113]">
                      {creator.template}
                    </span>
                  </div>

                  {/* Creator Portrait & Name */}
                  <div className="absolute bottom-3.5 inset-x-4 flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-[#D4AF37] shadow-md">
                      <Image
                        src={creator.avatar}
                        alt={t(creator.name.ar, creator.name.en)}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="arabic-diacritics text-lg font-bold text-[#EDEAE2] truncate">
                        {t(creator.name.ar, creator.name.en)}
                      </h3>
                      <p className="text-xs text-[#EDEAE2]/80 truncate">
                        {t(creator.title.ar, creator.title.en)}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{t(creator.city.ar, creator.city.en)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio & Subdomain CTA */}
                <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {t(creator.bio.ar, creator.bio.en)}
                  </p>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <Link
                      href={subUrl}
                      dir="ltr"
                      className="font-mono text-xs font-bold text-[#C5A059] dark:text-[#D4AF37] hover:underline flex items-center gap-1"
                    >
                      <span>{creator.username}.taqdom.me</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>

                    <Link
                      href={subUrl}
                      className="rounded-xl bg-foreground text-background px-3.5 py-2 text-xs font-bold transition hover:opacity-90"
                    >
                      {t("زيارة المعرض", "Visit Portfolio")}
                    </Link>
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
