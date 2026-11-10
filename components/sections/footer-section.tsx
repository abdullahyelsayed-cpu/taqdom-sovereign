"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";
import { useLanguage } from "@/lib/i18n";
import { getSubdomainUrl } from "@/lib/types";
import { TEMPLATES_CATALOG } from "@/lib/seed-data";

export function FooterSection() {
  const { lang, toggleLang, t } = useLanguage();
  const [host, setHost] = useState("taqdom.me");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  const flagshipUsers = ["layla", "youssef", "farida", "karim", "tariq", "salma", "nora"] as const;

  return (
    <footer className="relative border-t border-border pt-20 pb-12 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-border/60">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <TaqdomLogo size={44} lang={lang} />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t(
                "تَقَدُّم (Taqdom) — المنصة السيادية لإنشاء معارض الأعمال والهويات الرقمية للطلاب والخريجين والمحترفين على نطاقاتهم الفرعية المستقلة.",
                "Taqdom — The sovereign portfolio platform empowering graduates, engineers, architects, and revenue leaders on dedicated .taqdom.me subdomains."
              )}
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={toggleLang}
                className="rounded-xl border border-border bg-secondary/70 px-3.5 py-1.5 text-xs font-bold text-foreground hover:border-[#9A7B4F] dark:hover:border-[#C89D66]"
              >
                {lang === "ar" ? "Switch to English (EN)" : "التبديل إلى العربية"}
              </button>
            </div>
          </div>

          {/* Platform Pages */}
          <div>
            <h4 className="mb-4 text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#C89D66]">
              {t("المنصة", "Platform")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground">
                  {t("الصفحة الرئيسية", "Home Atelier")}
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-muted-foreground hover:text-foreground">
                  {t("معرض القوالب السبعة", "7 Sovereign Templates")}
                </Link>
              </li>
              <li>
                <Link href="/studio" className="text-muted-foreground hover:text-foreground">
                  {t("استوديو تَقَدُّم الحي", "Taqdom Live Studio")}
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-muted-foreground hover:text-foreground">
                  {t("دليل المبدعين المنشورين", "Explore Creators")}
                </Link>
              </li>
              <li>
                <Link href="/auth" className="text-muted-foreground hover:text-foreground">
                  {t("بوابة الدخول وحجز النطاق", "Sign In & Claim Subdomain")}
                </Link>
              </li>
            </ul>
          </div>

          {/* 7 Templates */}
          <div>
            <h4 className="mb-4 text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#C89D66]">
              {t("القوالب السبعة", "7 Archetypes")}
            </h4>
            <ul className="space-y-2 text-sm">
              {TEMPLATES_CATALOG.map((tpl) => (
                <li key={tpl.id}>
                  <Link
                    href={`/templates/${tpl.slug}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {tpl.name.ar} | {tpl.name.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Live Subdomains */}
          <div>
            <h4 className="mb-4 text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#C89D66]">
              {t("نطاقات المبدعين الحية", "Live Subdomains")}
            </h4>
            <ul className="space-y-2 text-sm font-mono" dir="ltr">
              {flagshipUsers.map((u) => (
                <li key={u}>
                  <Link
                    href={getSubdomainUrl(u, host)}
                    className="text-muted-foreground hover:text-[#9A7B4F] dark:hover:text-[#C89D66] transition"
                  >
                    {u}.taqdom.me ↗
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Giant Sculptural Wordmark */}
        <div className="py-10 text-center select-none">
          <div className="arabic-diacritics text-5xl sm:text-7xl md:text-8xl font-black tracking-tight gold-shimmer-text opacity-90">
            تَقَدُّم • TAQDOM.ME
          </div>
        </div>

        {/* Bottom Copyright & Legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground pt-6 border-t border-border/40">
          <p>
            {t(
              "© ٢٠٢٦ تَقَدُّم (Taqdom.me) — صُنع بفخر وإتقان في مصر للعالم.",
              "© 2026 Taqdom.me — Crafted with Sovereign Pride in Cairo, Egypt."
            )}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/legal/privacy" className="hover:text-foreground">
              {t("سياسة الخصوصية", "Privacy Policy")}
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground">
              {t("شروط الاستخدام", "Terms of Service")}
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              {t("لوحة التحكم", "Dashboard")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
