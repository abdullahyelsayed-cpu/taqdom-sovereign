"use client";

import React from "react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useLanguage } from "@/lib/i18n";

export default function TermsPage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <section className="pt-32 pb-24 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="arabic-diacritics text-3xl sm:text-5xl font-extrabold">
          {t("شروط الاستخدام — تَقَدُّم", "Terms of Service — Taqdom")}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {t(
            "باستخدامك لمنصة تَقَدُّم، فإنك تحتفظ بملكية كافة أعمالك الفنية والمعمارية المنشورة على نطاقك الفرعي username.taqdom.me.",
            "By using Taqdom, you retain 100% intellectual property ownership of all creative and architectural works published on your username.taqdom.me subdomain."
          )}
        </p>
      </section>
      <FooterSection />
    </main>
  );
}
