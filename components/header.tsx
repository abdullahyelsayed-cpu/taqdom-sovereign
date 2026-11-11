"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles, UserCheck, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const { lang, toggleLang, t } = useLanguage();
  const user = useTaqdomStore((state) => state.user);

  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const navItems = [
    { href: "/", labelAr: "الرئيسية", labelEn: "Home" },
    { href: "/templates", labelAr: "القوالب", labelEn: "Templates" },
    { href: "/#studio-preview", labelAr: "الاستوديو", labelEn: "Studio" },
    { href: "/#pricing", labelAr: "الأسعار", labelEn: "Pricing" },
    { href: "/#about", labelAr: "المطورون", labelEn: "Creators" },
    { href: "/#faq", labelAr: "الأسئلة الشائعة", labelEn: "FAQ" },
  ];

  const brand = (
    <Link href="/" className="neo-header-brand" aria-label={t("الصفحة الرئيسية لتَقَدُّم", "Taqdom home")}>
      <TaqdomLogo size={38} lang={lang} />
    </Link>
  );

  return (
    <header className="neo-header">
      {brand}

      <nav className="neo-header-nav" aria-label={t("التنقل الرئيسي", "Main navigation")}>
        {navItems.map((item) => {
          const destination = item.href.split("#")[0] || "/";
          const active = !item.href.includes("#") && pathname === destination;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
            >
              {t(item.labelAr, item.labelEn)}
            </Link>
          );
        })}
      </nav>

      <div className="neo-header-actions">
        <button
          type="button"
          className="neo-header-theme"
          data-testid="theme-toggle"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={t("تبديل الوضع اللوني", "Toggle colour theme")}
          title={t("تبديل الوضع اللوني", "Toggle colour theme")}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          type="button"
          data-testid="lang-toggle"
          onClick={toggleLang}
          className="neo-header-lang"
          title={t("Switch language", "تغيير اللغة")}
          aria-label={t("Switch to English", "التبديل إلى العربية")}
        >
          {lang === "ar" ? "EN" : "عربي"}
        </button>

        {user ? (
          <Link href="/dashboard" className="neo-button neo-button-primary hidden sm:inline-flex">
            <UserCheck size={15} />
            <span dir="ltr">{user.username}.taqdom.me</span>
          </Link>
        ) : (
          <Link href="/auth" data-testid="header-auth-btn" className="neo-button neo-button-primary hidden sm:inline-flex">
            <Sparkles size={15} />
            <span>{t("ابدأ مساحتك", "Get started")}</span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="neo-mobile-toggle"
          aria-label={isMenuOpen ? t("إغلاق القائمة", "Close menu") : t("فتح القائمة", "Open menu")}
          aria-expanded={isMenuOpen}
          aria-controls="taqdom-mobile-navigation"
        >
          {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {isMenuOpen && (
        <nav id="taqdom-mobile-navigation" className="neo-header-mobile-menu" aria-label={t("التنقل الرئيسي", "Main navigation")}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
              {t(item.labelAr, item.labelEn)}
            </Link>
          ))}
          <Link href={user ? "/dashboard" : "/auth"} onClick={() => setIsMenuOpen(false)}>
            {user ? t("لوحة التحكم", "Dashboard") : t("ابدأ مساحتك مجانًا", "Create your space")}
          </Link>
        </nav>
      )}
    </header>
  );
}
