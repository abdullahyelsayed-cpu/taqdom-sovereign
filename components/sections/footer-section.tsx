"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";
import { useLanguage } from "@/lib/i18n";
import { getSubdomainUrl } from "@/lib/types";

export function FooterSection() {
  const { lang, toggleLang, t } = useLanguage();
  const [host, setHost] = useState("taqdom.me");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  return (
    <footer className="relative border-t border-border pt-20 pb-12 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-border/60">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <TaqdomLogo size={44} lang={lang} />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t(
                "تَقَدُّم (Taqdom) — المنصة المصرية الفاخرة والأرقى عالمياً لإنشاء معارض الأعمال ثلاثية الأبعاد للمبدعين على نطاقاتهم الفرعية السيادية المستقلة.",
                "Taqdom — Egypt's sovereign luxury portfolio platform empowering architects, directors, founders, and designers on dedicated .taqdom.me subdomains."
              )}
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={toggleLang}
                className="rounded-xl border border-border bg-secondary/70 px-3.5 py-1.5 text-xs font-bold text-foreground hover:border-[#C5A059]"
              >
                {lang === "ar" ? "Switch to English (EN)" : "التبديل إلى العربية"}
              </button>
            </div>
          </div>

          {/* Platform Pages */}
          <div>
            <h4 className="mb-4 text-xs font-mono uppercase tracking-widest text-[#C5A059]">
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
                  {t("معرض القوالب الأربعة", "4 Sovereign Templates")}
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
                  {t("التسجيل / حساب الاختبار", "Sign In / Test Account")}
                </Link>
              </li>
            </ul>
          </div>

          {/* 4 Templates */}
          <div>
            <h4 className="mb-4 text-xs font-mono uppercase tracking-widest text-[#C5A059]">
              {t("القوالب الأربعة", "Archetypes")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/templates/athar" className="text-muted-foreground hover:text-foreground">
                  {t("أَثَر | Athar (معماري 3D)", "Athar • 3D Architectural")}
                </Link>
              </li>
              <li>
                <Link href="/templates/madar" className="text-muted-foreground hover:text-foreground">
                  {t("مَدَار | Madar (سينمائي)", "Madar • Cinema 2.39:1")}
                </Link>
              </li>
              <li>
                <Link href="/templates/siyada" className="text-muted-foreground hover:text-foreground">
                  {t("سِيَادَة | Siyada (تنفيذي)", "Siyada • Executive")}
                </Link>
              </li>
              <li>
                <Link href="/templates/noor" className="text-muted-foreground hover:text-foreground">
                  {t("نُور | Noor (مجلة فنية)", "Noor • Editorial Issue")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Live Subdomains */}
          <div>
            <h4 className="mb-4 text-xs font-mono uppercase tracking-widest text-[#C5A059]">
              {t("نطاقات حية", "Live Subdomains")}
            </h4>
            <ul className="space-y-2.5 text-sm font-mono" dir="ltr">
              {(["test", "layla", "youssef", "farida", "karim"] as const).map((u) => (
                <li key={u}>
                  <Link
                    href={getSubdomainUrl(u, host)}
                    className="text-muted-foreground hover:text-[#C5A059] transition"
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
