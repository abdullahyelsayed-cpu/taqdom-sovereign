"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Compass, ExternalLink, MapPin, Search } from "lucide-react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";
import { SEED_PORTFOLIOS, TEMPLATES_CATALOG } from "@/lib/seed-data";
import { getSubdomainUrl, PortfolioData, TemplateId, ALL_TEMPLATE_IDS } from "@/lib/types";

export default function ExplorePage() {
  const { lang, t } = useLanguage();
  const publishedPortfolios = useTaqdomStore((s) => s.publishedPortfolios);
  const [serverPortfolios, setServerPortfolios] = useState<Record<string, PortfolioData>>({});
  const [filterTemplate, setFilterTemplate] = useState<TemplateId | "all">("all");
  const [query, setQuery] = useState("");
  const [host, setHost] = useState("taqdom.me");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
    fetch("/api/portfolio?all=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.portfolios)) {
          const map: Record<string, PortfolioData> = {};
          for (const item of data.portfolios) {
            if (item?.username) {
              map[item.username] = item;
            }
          }
          setServerPortfolios(map);
        }
      })
      .catch(() => {});
  }, []);

  const mergedMap = { ...SEED_PORTFOLIOS, ...publishedPortfolios, ...serverPortfolios };
  const allCreators = Object.values(mergedMap).filter((c) => {
    if (c.isFlagshipShowcase !== true && c.discoverable !== true) return false;
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
    <main className="explore-experience min-h-screen bg-background text-foreground">
      <Header />

      <section className="pt-32 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#9A7B4F]/40 bg-[#9A7B4F]/10 px-4 py-1 text-xs font-mono uppercase tracking-[0.2em] text-[#9A7B4F] dark:text-[#C89D66]">
              <Compass className="h-3.5 w-3.5" />
              <span>{t("اكتشف أعمالًا وأفكارًا", "DISCOVER CREATIVE WORK")}</span>
            </span>
            <h1 className="arabic-diacritics mt-4 text-4xl sm:text-6xl font-extrabold">
              {t("اكتشف ما يصنعه الآخرون", "Discover what others are making")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              {t("تظهر هنا المعارض التجريبية، وأعمال الأشخاص الذين اختاروا الظهور في الدليل. يمكنك نشر رابطك دون إدراجك في Explore.", "This space shows sample portfolios and work from people who opted into the directory. You can publish your link without listing it here.")}
            </p>
          </div>

          {/* Search & 7 Archetypes Filter */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 flex-1 max-w-md">
              <Search className="h-4 w-4 text-[#9A7B4F] dark:text-[#C89D66]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("ابحث بالاسم أو التخصص...", "Search by name or focus...")}
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", ...ALL_TEMPLATE_IDS] as const).map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setFilterTemplate(tpl)}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold uppercase transition cursor-pointer ${
                    filterTemplate === tpl
                      ? "border-[#9A7B4F] dark:border-[#C89D66] bg-[#9A7B4F] dark:bg-[#C89D66] text-[#F7F5F0] dark:text-[#0A0A09]"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tpl === "all" ? t("الكل", "All") : (TEMPLATES_CATALOG.find((item) => item.id === tpl)?.name[lang] || tpl)}
                </button>
              ))}
            </div>
          </div>

          {/* Creators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {allCreators.length === 0 ? (
              <div className="col-span-full glass-panel rounded-3xl px-6 py-16 text-center">
                <Compass className="mx-auto h-8 w-8 text-[#C7F36B]" />
                <h2 className="mt-4 text-lg font-bold">{t("لا توجد نتائج بهذا البحث", "No matches yet")}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                  {t("جرّب كلمة مختلفة أو اختر قالبًا آخر. المعارض الشخصية لا تظهر هنا إلا بعد اختيار صاحبها الإدراج في الدليل.", "Try another search or style. Personal portfolios appear here only when their owners opt in.")}
                </p>
              </div>
            ) : allCreators.map((creator) => {
              const subUrl = getSubdomainUrl(creator.username, host);
              return (
                <div
                  key={creator.username}
                  className="glass-panel rounded-3xl overflow-hidden flex flex-col justify-between border border-border hover:border-[#9A7B4F] dark:hover:border-[#C89D66] transition-all duration-300 shadow-xl"
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={creator.projects[0]?.images[0] || creator.cover}
                      alt={t(creator.name.ar, creator.name.en)}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A09]/90 via-transparent to-transparent" />
                    <div className="absolute top-3.5 end-3.5">
                      <span className="rounded-full bg-[#C89D66] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-[#0A0A09]">
                        {creator.isFlagshipShowcase ? t("مثال", "SAMPLE") : creator.template}
                      </span>
                    </div>
                    <div className="absolute bottom-3.5 inset-x-4 flex items-center gap-3">
                      <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 border-[#C89D66]">
                        <Image
                          src={creator.avatar}
                          alt={t(creator.name.ar, creator.name.en)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h2 className="arabic-diacritics font-bold text-lg text-[#F4F1EA]">
                          {t(creator.name.ar, creator.name.en)}
                        </h2>
                        <div className="flex items-center gap-1 text-xs text-[#C89D66]">
                          <MapPin className="h-3 w-3" />
                          <span>{t(creator.city.ar, creator.city.en)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-[#9A7B4F] dark:text-[#C89D66] mb-1">
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
                        className="font-mono text-xs font-bold text-[#9A7B4F] dark:text-[#C89D66] hover:underline flex items-center gap-1"
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
