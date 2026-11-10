"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sparkles,
  ShieldCheck,
  Globe2,
  ArrowUpLeft,
  ArrowUpRight,
  Sliders,
  ExternalLink,
  CheckCircle2,
  UserPlus,
  LogIn,
} from "lucide-react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";
import {
  normalizeUsername,
  validateUsername,
  getSubdomainUrl,
  TemplateId,
  ALL_TEMPLATE_IDS,
} from "@/lib/types";

export default function AuthPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const setUser = useTaqdomStore((s) => s.setUser);
  const setDraft = useTaqdomStore((s) => s.setDraft);
  const resetTestAccount = useTaqdomStore((s) => s.resetTestAccount);

  const [mode, setMode] = useState<"login" | "register">("register");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [template, setTemplate] = useState<TemplateId>("haven");
  const [loading, setLoading] = useState(false);
  const [flagshipLoggedIn, setFlagshipLoggedIn] = useState(false);
  const [host, setHost] = useState("taqdom.me");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  const handleFlagshipCreatorAccess = async () => {
    setLoading(true);
    try {
      await resetTestAccount();
      setFlagshipLoggedIn(true);
      toast.success(
        t(
          "تم الدخول إلى الحساب التجريبي (layla@taqdom.me)!",
          "Signed in to Demo Creator Preview (layla@taqdom.me)!"
        )
      );
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeUsername(username);
    const val = validateUsername(clean);
    if (!val.valid) {
      toast.error(t(val.reasonAr || "اسم غير صالح", val.reasonEn || "Invalid username"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username: clean,
          password,
          displayName: displayName || clean,
          template,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }
      setUser(data.user);
      if (data.portfolio) {
        setDraft(data.portfolio, false);
      }
      toast.success(
        t(
          `مرحباً بك في تَقَدُّم! تم حجز النطاق ${clean}.taqdom.me`,
          `Welcome to Taqdom! Claimed ${clean}.taqdom.me`
        )
      );
      router.push("/dashboard");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      setUser(data.user);
      if (data.portfolio) {
        setDraft(data.portfolio, false);
      }
      toast.success(t("تم تسجيل الدخول بنجاح!", "Signed in successfully!"));
      router.push("/dashboard");
    } catch {
      toast.error("Login error");
    } finally {
      setLoading(false);
    }
  };

  const flagshipSubdomainHref = getSubdomainUrl("layla", host);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="pt-32 pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Column 1: One-click demo creator preview */}
            <div className="lg:col-span-6 glass-panel rounded-3xl p-8 border-2 border-[#9A7B4F] dark:border-[#C89D66] shadow-2xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#9A7B4F]/15 border border-[#9A7B4F]/40 px-3.5 py-1 text-xs font-bold text-[#9A7B4F] dark:text-[#C89D66]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {t(
                    "معاينة الحساب التجريبي • Demo Creator Preview",
                    "DEMO CREATOR SHOWCASE ACCESS"
                  )}
                </span>
              </div>

              <h1 className="arabic-diacritics text-3xl sm:text-4xl font-extrabold">
                {t(
                  "معاينة فورية للحساب التجريبي للمبدعة ليلى منصور",
                  "Instant Demo Creator Studio Preview"
                )}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t(
                  "استكشف لوحة التحكم والاستوديو الحي مباشرة عبر الحساب التجريبي للمهندسة ليلى منصور (layla.taqdom.me) المحمّل مسبقاً بالمشاريع المعمارية والصور بدقة 4K.",
                  "Explore the live Studio and dashboard through a sample portfolio (layla.taqdom.me)."
                )}
              </p>

              {/* Demo Creator Preview Card */}
              <div className="rounded-2xl bg-secondary/80 border border-border p-5 flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-[#9A7B4F] dark:border-[#C89D66] shrink-0">
                  <Image
                    src="/images/creators/layla.jpg"
                    alt="Layla Mansour Demo Creator"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="arabic-diacritics font-bold text-base">
                    {t("ليلى منصور — مهندسة معمارية", "Layla Mansour — Principal Architect")}
                  </h2>
                  <p dir="ltr" className="font-mono text-xs text-[#9A7B4F] dark:text-[#C89D66] truncate">
                    Email: layla@taqdom.me • Handle: layla
                  </p>
                  <p dir="ltr" className="font-mono text-xs font-bold text-[#1E3A2F] dark:text-[#C89D66]">
                    Subdomain: https://layla.taqdom.me
                  </p>
                </div>
              </div>

              {/* 1-Click Demo Creator Login Button */}
              <button
                type="button"
                data-testid="test-account-login-btn"
                onClick={handleFlagshipCreatorAccess}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#9A7B4F] dark:bg-[#C89D66] hover:opacity-95 py-4 px-6 text-sm sm:text-base font-extrabold text-[#F7F5F0] dark:text-[#0A0A09] shadow-xl transition cursor-pointer"
              >
                <ShieldCheck className="h-5 w-5" />
                <span>
                  {t(
                    "دخول المعاينة السريعة للحساب التجريبي (layla.taqdom.me)",
                    "Launch Demo Creator Preview (layla.taqdom.me)"
                  )}
                </span>
              </button>

              {/* Direct Quick Links for Flagship Creator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link
                  href="/studio?u=layla"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background hover:border-[#9A7B4F] px-4 py-3 text-xs font-bold transition"
                >
                  <Sliders className="h-4 w-4 text-[#9A7B4F] dark:text-[#C89D66]" />
                  <span>{t("فتح الاستوديو الحي (layla)", "Open Live Studio (layla)")}</span>
                </Link>

                <Link
                  href={flagshipSubdomainHref}
                  dir="ltr"
                  data-testid="open-flagship-subdomain-btn"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background hover:border-[#9A7B4F] px-4 py-3 font-mono text-xs font-bold transition"
                >
                  <span>layla.taqdom.me</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#9A7B4F] dark:text-[#C89D66]" />
                </Link>
              </div>

              {flagshipLoggedIn && (
                <div className="rounded-xl bg-[#1E3A2F]/15 border border-[#1E3A2F]/40 p-3 flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4 text-[#1E3A2F] dark:text-[#C89D66]" />
                  <span>
                    {t("تم تفعيل جلسة المبدع التجريبي بنجاح!", "Demo creator session activated!")}
                  </span>
                </div>
              )}
            </div>

            {/* Column 2: Standard Register / Sign In Form */}
            <div className="lg:col-span-6 glass-panel rounded-3xl p-8 border border-border space-y-6">
              <div className="flex rounded-2xl bg-secondary p-1">
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                    mode === "register"
                      ? "bg-[#9A7B4F] dark:bg-[#C89D66] text-[#F7F5F0] dark:text-[#0A0A09] shadow"
                      : "text-muted-foreground"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{t("إنشاء مساحتك", "Create your space")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                    mode === "login"
                      ? "bg-[#9A7B4F] dark:bg-[#C89D66] text-[#F7F5F0] dark:text-[#0A0A09] shadow"
                      : "text-muted-foreground"
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  <span>{t("تسجيل الدخول", "Sign In")}</span>
                </button>
              </div>

              {mode === "register" ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      {t("اختَر اسم رابطك الشخصي", "Choose your personal address")}
                    </label>
                    <div
                      dir="ltr"
                      className="flex items-center rounded-xl border border-border bg-background px-3.5 py-2.5"
                    >
                      <Globe2 className="h-4 w-4 text-[#9A7B4F] dark:text-[#C89D66] me-2 shrink-0" />
                      <input
                        type="text"
                        required
                        dir="ltr"
                        value={username}
                        onChange={(e) => setUsername(normalizeUsername(e.target.value))}
                        placeholder="sara"
                        className="w-full bg-transparent font-mono text-sm focus:outline-none text-left"
                      />
                      <span dir="ltr" className="font-mono text-xs font-bold text-[#9A7B4F] dark:text-[#C89D66]">
                        .taqdom.me
                      </span>
                    </div>
                    <p dir="ltr" className="mt-1 font-mono text-xs text-[#9A7B4F] dark:text-[#C89D66]">
                      https://{username || "username"}.taqdom.me
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      {t("الاسم الذي سيظهر في معرضك", "Name shown on your portfolio")}
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t("مثال: سارة المنشاوي", "e.g. Sara El-Menshawy")}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      {t("البريد الإلكتروني", "Email Address")}
                    </label>
                    <input
                      type="email"
                      required
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="creator@taqdom.me"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      {t("كلمة المرور", "Password")}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      {t("اختَر الستايل الأول (7 خيارات)", "Choose your starting style (7 options)")}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ALL_TEMPLATE_IDS.map((tpl) => (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => setTemplate(tpl)}
                          className={`rounded-xl border py-2 text-xs font-bold uppercase ${
                            template === tpl
                              ? "border-[#9A7B4F] dark:border-[#C89D66] bg-[#9A7B4F]/20"
                              : "border-border bg-background"
                          }`}
                        >
                          {tpl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground text-background py-3.5 text-sm font-bold transition hover:opacity-90 cursor-pointer"
                  >
                    <span>
                      {t(
                        "إنشاء مساحتي",
                        "Create my space"
                      )}
                    </span>
                    {lang === "ar" ? (
                      <ArrowUpLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      {t("اسم المستخدم أو البريد الإلكتروني", "Username or Email")}
                    </label>
                    <input
                      type="text"
                      required
                      dir="ltr"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="layla@taqdom.me / layla"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      {t("كلمة المرور", "Password")}
                    </label>
                    <input
                      type="password"
                      required
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground text-background py-3.5 text-sm font-bold transition hover:opacity-90 cursor-pointer"
                  >
                    <span>{t("تسجيل الدخول إلى لوحتي", "Sign In to Dashboard")}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </main>
  );
}
