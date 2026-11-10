"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Globe2,
  Sliders,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Layers,
  RefreshCw,
  LogOut,
  CheckCircle2,
  FolderKanban,
} from "lucide-react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";
import { getSubdomainUrl } from "@/lib/types";

export default function DashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const user = useTaqdomStore((s) => s.user);
  const draft = useTaqdomStore((s) => s.draft);
  const setUser = useTaqdomStore((s) => s.setUser);
  const resetTestAccount = useTaqdomStore((s) => s.resetTestAccount);

  const [copied, setCopied] = useState(false);
  const [host, setHost] = useState("taqdom.me");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  const activeUsername = user?.username || draft.username || "test";
  const subdomainUrl = getSubdomainUrl(activeUsername, host);
  const canonicalDisplay = `https://${activeUsername}.taqdom.me`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(canonicalDisplay);
    setCopied(true);
    toast.success(t("تم نسخ الرابط المستقل!", "Subdomain link copied!"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetTest = async () => {
    await resetTestAccount();
    toast.success(
      t(
        "تمت إعادة ضبط حساب الاختبار (test.taqdom.me) إلى حالته الأصلية!",
        "Test account (test.taqdom.me) restored to original showcase state!"
      )
    );
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    router.push("/auth");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="pt-32 pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Top Sovereign Status Banner */}
          <div className="glass-panel rounded-3xl p-8 border border-[#C5A059]/50 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative h-20 w-20 rounded-3xl overflow-hidden border-2 border-[#C5A059] shrink-0">
                <Image
                  src={draft.avatar || "/images/creators/test.jpg"}
                  alt={t(draft.name.ar, draft.name.en)}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-0.5 text-xs font-bold text-emerald-600 dark:text-[#00F5D4] mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{t("منشور ونشط على الحافة", "LIVE ON SOVEREIGN EDGE")}</span>
                </div>
                <h1 className="arabic-diacritics text-2xl sm:text-4xl font-extrabold">
                  {t(draft.name.ar, draft.name.en)}
                </h1>
                <p dir="ltr" data-testid="dashboard-subdomain" className="font-mono text-sm font-bold text-[#C5A059] mt-1">
                  {canonicalDisplay}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/studio?u=${activeUsername}`}
                data-testid="dashboard-open-studio"
                className="inline-flex items-center gap-2 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] px-5 py-3 text-xs sm:text-sm font-bold text-[#111113] shadow-lg transition"
              >
                <Sliders className="h-4 w-4" />
                <span>{t("تعديل البورتفوليو في الاستوديو", "Edit in Live Studio")}</span>
              </Link>

              <Link
                href={subdomainUrl}
                data-testid="dashboard-open-portfolio"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/80 hover:border-[#C5A059] px-5 py-3 text-xs sm:text-sm font-bold text-foreground transition"
              >
                <span>{t("فتح البورتفوليو المنشور", "Open Live Portfolio")}</span>
                <ExternalLink className="h-4 w-4 text-[#C5A059]" />
              </Link>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-3 text-xs font-bold"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? t("تم النسخ", "Copied") : t("نسخ الرابط", "Copy URL")}</span>
              </button>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-panel rounded-3xl p-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("إجمالي الزيارات", "Total Portfolio Views")}</span>
                <Eye className="h-4 w-4 text-[#C5A059]" />
              </div>
              <p className="font-mono text-4xl font-extrabold text-foreground">
                {(draft.views || 4820).toLocaleString()}
              </p>
            </div>

            <div className="glass-panel rounded-3xl p-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("القالب المفعل حالياً", "Active Template Archetype")}</span>
                <Layers className="h-4 w-4 text-[#C5A059]" />
              </div>
              <p className="font-mono text-3xl font-extrabold uppercase text-[#C5A059]">
                {draft.template}
              </p>
            </div>

            <div className="glass-panel rounded-3xl p-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("المشاريع المنشورة", "Published Projects")}</span>
                <FolderKanban className="h-4 w-4 text-[#C5A059]" />
              </div>
              <p className="font-mono text-4xl font-extrabold text-foreground">
                {draft.projects.length}
              </p>
            </div>
          </div>

          {/* Quick Account & Test Controls */}
          <div className="glass-panel rounded-3xl p-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="arabic-diacritics text-lg font-bold">
                {t("إدارة الحساب وإعادة ضبط بيانات الاختبار", "Account & Test Environment Controls")}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "يمكنك في أي وقت استعادة بيانات حساب الاختبار (test.taqdom.me) الافتراضية أو تبديل الحساب.",
                  "You can restore the default test account data or switch accounts at any time."
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetTest}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-xs font-bold hover:border-[#C5A059] cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#C5A059]" />
                <span>{t("إعادة ضبط حساب الاختبار", "Reset Test Account")}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-red-500 hover:border-red-500 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{t("تسجيل الخروج", "Sign Out")}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </main>
  );
}
