"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Compass, ExternalLink, MapPin, Search } from "lucide-react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";
import { SEED_PORTFOLIOS } from "@/lib/seed-data";
import { getSubdomainUrl, TemplateId } from "@/lib/types";

export default function ExplorePage() {
  const { t } = useLanguage();
  const publishedPortfolios = useTaqdomStore((s) => s.publishedPortfolios);
  const [filterTemplate, setFilterTemplate] = useState<TemplateId | "all">("all");
  const [query, setQuery] = useState("");
  const [host, setHost] = useState("taqdom.me");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  const mergedMap = { ...SEED_PORTFOLIOS, ...publishedPortfolios };
  const allCreators = Object.values(mergedMap).filter((c) => {
    if (filterTemplate !== "all" && c.template !== filterTemplate) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.username.toLowerCase().includes(q) ||
      c.name.ar.toLowerCase().includes(q) ||
      c.name.en.toLowerCase().includes(q) ||
      c.title.ar.toLowerCase().includes(q) ||
      c.title.en.toLowerCase().includes(q)
    );
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="pt-32 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#C5A059]/10 px-4 py-1 text-xs font-mono uppercase tracking-[0.2em] text-[#C5A059]">
              <Compass className="h-3.5 w-3.5" />
              <span>{t("دليل المبدعين المنشورين", "SOVEREIGN CREATORS DIRECTORY")}</span>
            </span>
            <h1 className="arabic-diacritics mt-4 text-4xl sm:text-6xl font-extrabold">
              {t("استكشف معارض أعضاء تَقَدُّم", "Explore Published Sovereign Portfolios")}
            </h1>
          </div>

          {/* Search & Archetype Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 flex-1 max-w-md">
              <Search className="h-4 w-4 text-[#C5A059]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("ابحث باسم المبدع أو النطاق...", "Search by creator or subdomain...")}
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", "athar", "madar", "siyada", "noor"] as const).map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setFilterTemplate(tpl)}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold uppercase transition ${
                    filterTemplate === tpl
                      ? "border-[#C5A059] bg-[#C5A059] text-[#111113]"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tpl === "all" ? t("الكل", "All") : tpl}
                </button>
              ))}
            </div>
          </div>

          {/* Creators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {allCreators.map((creator) => {
              const subUrl = getSubdomainUrl(creator.username, host);
              return (
                <div
                  key={creator.username}
                  className="glass-panel rounded-3xl overflow-hidden flex flex-col justify-between border border-border hover:border-[#C5A059] transition-all duration-300 shadow-xl"
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={creator.projects[0]?.images[0] || creator.cover}
                      alt={t(creator.name.ar, creator.name.en)}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/90 via-transparent to-transparent" />
                    <div className="absolute bottom-3.5 inset-x-4 flex items-center gap-3">
                      <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 border-[#D4AF37]">
                        <Image
                          src={creator.avatar}
                          alt={t(creator.name.ar, creator.name.en)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h2 className="arabic-diacritics font-bold text-lg text-[#EDEAE2]">
                          {t(creator.name.ar, creator.name.en)}
                        </h2>
                        <div className="flex items-center gap-1 text-xs text-[#D4AF37]">
                          <MapPin className="h-3 w-3" />
                          <span>{t(creator.city.ar, creator.city.en)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-[#C5A059] mb-1">
                        {t(creator.title.ar, creator.title.en)}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {t(creator.bio.ar, creator.bio.en)}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                      <Link
                        href={subUrl}
                        dir="ltr"
                        className="font-mono text-xs font-bold text-[#C5A059] hover:underline flex items-center gap-1"
                      >
                        <span>{creator.username}.taqdom.me</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <Link
                        href={subUrl}
                        className="rounded-xl bg-foreground text-background px-3.5 py-1.5 text-xs font-bold"
                      >
                        {t("زيارة المعرض", "Visit")}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <FooterSection />
    </main>
  );
}
