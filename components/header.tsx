"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Menu,
  X,
  Sun,
  Moon,
  Globe,
  Sparkles,
  UserCheck,
  Compass,
  Layers,
  Sliders,
} from "lucide-react";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const user = useTaqdomStore((s) => s.user);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/", labelAr: "الرئيسية", labelEn: "Home" },
    { href: "/templates", labelAr: "القوالب السبعة", labelEn: "7 Templates", icon: Layers },
    { href: "/studio", labelAr: "الاستوديو الحي", labelEn: "Live Studio", icon: Sliders },
    { href: "/explore", labelAr: "دليل المبدعين", labelEn: "Creators", icon: Compass },
    { href: "/dashboard", labelAr: "لوحتي", labelEn: "Dashboard" },
  ];

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header
      className={`fixed top-4 left-1/2 z-50 w-[94%] max-w-6xl -translate-x-1/2 rounded-2xl transition-all duration-500 ${
        isScrolled ? "glass-panel px-4 py-2.5 shadow-2xl md:px-6" : "glass-panel px-4 py-3 md:px-6"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="shrink-0 rounded-lg focus-visible:outline-offset-4" aria-label={t("الصفحة الرئيسية لتَقَدُّم", "Taqdom home")}>
          <TaqdomLogo size={40} lang={lang} />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t("التنقل الرئيسي", "Main navigation")}>
          {navItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-300 ${
                  active
                    ? "border border-[#C89D66]/40 bg-[#C89D66]/10 font-bold text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                {t(item.labelAr, item.labelEn)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <button
            type="button"
            data-testid="theme-toggle"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/70 px-3 py-2 text-xs font-medium text-foreground transition hover:border-[#C89D66]"
            title={t("تبديل الوضع النهاري والليلي", "Toggle light and dark appearance")}
            aria-label={t("تبديل الوضع النهاري والليلي", "Toggle light and dark appearance")}
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-[#D7B77B]" />
                <span>{t("الوضع النهاري", "Light mode")}</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-[#B68C51]" />
                <span>{t("الوضع الليلي", "Dark mode")}</span>
              </>
            )}
          </button>

          <button
            type="button"
            data-testid="lang-toggle"
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/70 px-3 py-2 text-xs font-bold text-foreground transition hover:border-[#C89D66]"
            title="Switch Language / تغيير اللغة"
            aria-label={t("التبديل إلى الإنجليزية", "Switch to Arabic")}
          >
            <Globe className="h-3.5 w-3.5 text-[#C89D66]" />
            <span>{lang === "ar" ? "EN" : "عربي"}</span>
          </button>

          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C89D66] px-4 py-2 text-xs font-bold text-[#090B0D] shadow-lg transition hover:opacity-90"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span dir="ltr">{user.username}.taqdom.me</span>
            </Link>
          ) : (
            <Link
              href="/auth"
              data-testid="header-auth-btn"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C89D66] px-4 py-2 text-xs font-bold text-[#090B0D] shadow-lg transition hover:opacity-90"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t("دخول / احجز نطاقك", "Sign in / Claim your domain")}</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={toggleLang}
            className="rounded-lg border border-border bg-secondary/80 px-2.5 py-1.5 text-xs font-bold text-foreground"
            aria-label={t("التبديل إلى الإنجليزية", "Switch to Arabic")}
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="rounded-lg border border-border bg-secondary/80 p-2 text-foreground"
            aria-label={t("تبديل الوضع النهاري والليلي", "Toggle light and dark appearance")}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-lg border border-border bg-secondary/80 p-2 text-foreground"
            aria-label={isMenuOpen ? t("إغلاق القائمة", "Close menu") : t("فتح القائمة", "Open menu")}
            aria-expanded={isMenuOpen}
            aria-controls="taqdom-mobile-navigation"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div id="taqdom-mobile-navigation" className="mt-3 border-t border-border pt-4 pb-2 lg:hidden">
          <nav className="flex flex-col gap-2" aria-label={t("التنقل الرئيسي", "Main navigation")}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                aria-current={item.href === pathname ? "page" : undefined}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {t(item.labelAr, item.labelEn)}
              </Link>
            ))}
            <Link
              href="/auth"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#C89D66] px-4 py-3 text-sm font-bold text-[#090B0D]"
            >
              <Sparkles className="h-4 w-4" />
              <span>{t("دخول / استعراض الحساب التجريبي", "Sign in / Explore the demo account")}</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
