"use client";

import React from "react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useLanguage } from "@/lib/i18n";

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <section className="pt-32 pb-24 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="arabic-diacritics text-3xl sm:text-5xl font-extrabold">
          {t("سياسة الخصوصية — تَقَدُّم", "Privacy Policy — Taqdom")}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {t(
            "تحترم منصة تَقَدُّم (Taqdom.me) خصوصية جميع المبدعين والزوار. تُستخدم البيانات المدخلة في الاستوديو حصرياً لعرض معرض أعمالك على نطاقك الفرعي المستقل.",
            "Taqdom.me respects the privacy of all creators and visitors. Data entered inside Taqdom Studio is used strictly to render and serve your sovereign portfolio on your dedicated subdomain."
          )}
        </p>
      </section>
      <FooterSection />
    </main>
  );
}
