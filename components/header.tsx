"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, X, Sun, Moon, Globe, Sparkles, UserCheck, Compass, Layers, Sliders } from "lucide-react";
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/", labelAr: "الرئيسية", labelEn: "Home" },
    { href: "/templates", labelAr: "القوالب الأربعة", labelEn: "Templates", icon: Layers },
    { href: "/studio", labelAr: "الاستوديو الحي", labelEn: "Studio", icon: Sliders },
    { href: "/explore", labelAr: "معرض المبدعين", labelEn: "Creators", icon: Compass },
    { href: "/dashboard", labelAr: "لوحتي", labelEn: "Dashboard" },
  ];

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-6xl transition-all duration-500 rounded-2xl ${
        isScrolled
          ? "glass-panel shadow-2xl py-2.5 px-4 md:px-6"
          : "glass-panel py-3 px-4 md:px-6"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link href="/" className="shrink-0 focus:outline-none">
          <TaqdomLogo size={38} lang={lang} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  active
                    ? "bg-[#C5A059]/20 text-foreground font-bold border border-[#C5A059]/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {t(item.labelAr, item.labelEn)}
              </Link>
            );
          })}
        </nav>

        {/* Controls: Theme + Language + Auth CTA */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Day / Night Mode Switcher */}
          <button
            type="button"
            data-testid="theme-toggle"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/70 px-3 py-2 text-xs font-medium text-foreground transition hover:border-[#C5A059]"
            title={t("تبديل الوضع النهاري / الليلي", "Toggle Day / Night Mode")}
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>{t("نهار مرمري", "Alabaster")}</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-[#C5A059]" />
                <span>{t("ليل مستقبلي", "Cyber Night")}</span>
              </>
            )}
          </button>

          {/* Instant AR / EN Switcher */}
          <button
            type="button"
            data-testid="lang-toggle"
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/70 px-3 py-2 text-xs font-bold text-foreground transition hover:border-[#C5A059]"
            title="Switch Language / تغيير اللغة"
          >
            <Globe className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>{lang === "ar" ? "EN" : "عربي"}</span>
          </button>

          {/* Auth / Account Button */}
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C5A059] px-4 py-2 text-xs font-bold text-[#111113] shadow-lg transition hover:bg-[#D4AF37]"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span dir="ltr">{user.username}.taqdom.me</span>
            </Link>
          ) : (
            <Link
              href="/auth"
              data-testid="header-auth-btn"
              className="inline-flex items-center gap-2 rounded-xl bg-[#111113] dark:bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#F6F4EE] dark:text-[#050508] shadow-lg transition hover:opacity-90"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37] dark:text-[#050508]" />
              <span>{t("دخول / حساب الاختبار", "Sign In / Test Account")}</span>
            </Link>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={toggleLang}
            className="rounded-lg border border-border bg-secondary/80 px-2.5 py-1.5 text-xs font-bold text-foreground"
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="rounded-lg border border-border bg-secondary/80 p-1.5 text-foreground"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-lg border border-border bg-secondary/80 p-1.5 text-foreground"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="mt-3 border-t border-border pt-4 pb-2 lg:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {t(item.labelAr, item.labelEn)}
              </Link>
            ))}
            <Link
              href="/auth"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#C5A059] px-4 py-3 text-sm font-bold text-[#111113]"
            >
              <Sparkles className="h-4 w-4" />
              <span>{t("التسجيل / دخول فوري بحساب الاختبار", "Sign In / 1-Click Test Account")}</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
