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
  const [template, setTemplate] = useState<TemplateId>("athar");
  const [loading, setLoading] = useState(false);
  const [testLoggedIn, setTestLoggedIn] = useState(false);
  const [host, setHost] = useState("taqdom.me");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  const handleOneClickTestAccount = async () => {
    setLoading(true);
    try {
      await resetTestAccount();
      setTestLoggedIn(true);
      toast.success(
        t(
          "تم تسجيل الدخول بحساب الاختبار الرسمي (test@taqdom.me)!",
          "Logged in with Official Test Account (test@taqdom.me)!"
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

  const testSubdomainHref = getSubdomainUrl("test", host);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="pt-32 pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Column 1: 1-Click Test Account Showcase Card (MANDATORY FEATURE) */}
            <div className="lg:col-span-6 glass-panel rounded-3xl p-8 border-2 border-[#C5A059] shadow-2xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/50 px-3.5 py-1 text-xs font-bold text-[#C5A059]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {t(
                    "حساب الاختبار الرسمي الجاهز • 1-Click Test Account",
                    "OFFICIAL 1-CLICK TEST ACCOUNT"
                  )}
                </span>
              </div>

              <h1 className="arabic-diacritics text-3xl sm:text-4xl font-extrabold">
                {t(
                  "دخول فوري بحساب الاختبار بدون تسجيل",
                  "Instant 1-Click Test Account Access"
                )}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t(
                  "جرب كامل قدرات منصة تَقَدُّم فوراً عبر حساب الاختبار الرسمي المحمّل مسبقاً ببورتفوليو معماري ثلاثي الأبعاد كامل بالصور والمشاريع.",
                  "Experience Taqdom's full capabilities immediately using our pre-loaded sovereign test account with architectural 3D projects."
                )}
              </p>

              {/* Pre-loaded Test Creator Card */}
              <div className="rounded-2xl bg-secondary/80 border border-border p-5 flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-[#C5A059] shrink-0">
                  <Image
                    src="/images/creators/test.jpg"
                    alt="Ahmed El-Kilany Test Account"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="arabic-diacritics font-bold text-base">
                    {t("أحمد الكيلاني (حساب الاختبار)", "Ahmed El-Kilany (Test Account)")}
                  </h2>
                  <p dir="ltr" className="font-mono text-xs text-[#C5A059] truncate">
                    Email: test@taqdom.me • Username: test
                  </p>
                  <p dir="ltr" className="font-mono text-xs font-bold text-emerald-600 dark:text-[#00F5D4]">
                    Subdomain: https://test.taqdom.me
                  </p>
                </div>
              </div>

              {/* 1-Click Test Login Button */}
              <button
                type="button"
                data-testid="test-account-login-btn"
                onClick={handleOneClickTestAccount}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#C5A059] hover:bg-[#D4AF37] py-4 px-6 text-sm sm:text-base font-extrabold text-[#111113] shadow-xl transition cursor-pointer"
              >
                <ShieldCheck className="h-5 w-5" />
                <span>
                  {t(
                    "دخول فوري بحساب الاختبار | 1-Click Test Account",
                    "1-Click Test Account Login (test@taqdom.me)"
                  )}
                </span>
              </button>

              {/* Direct Quick Links for Test Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link
                  href="/studio?u=test"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background hover:border-[#C5A059] px-4 py-3 text-xs font-bold transition"
                >
                  <Sliders className="h-4 w-4 text-[#C5A059]" />
                  <span>{t("فتح استوديو التعديل (test)", "Open Studio for test")}</span>
                </Link>

                <Link
                  href={testSubdomainHref}
                  dir="ltr"
                  data-testid="open-test-subdomain-btn"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background hover:border-[#00F5D4] px-4 py-3 font-mono text-xs font-bold transition"
                >
                  <span>test.taqdom.me</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#00F5D4]" />
                </Link>
              </div>

              {testLoggedIn && (
                <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-3 flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>
                    {t("تم تفعيل جلسة الاختبار بنجاح!", "Test session activated!")}
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
                      ? "bg-[#C5A059] text-[#111113] shadow"
                      : "text-muted-foreground"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{t("حجز نطاق وإنشاء حساب", "Claim Subdomain & Sign Up")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                    mode === "login"
                      ? "bg-[#C5A059] text-[#111113] shadow"
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
                      {t("اختر اسم المستخدم للنطاق الفرعي", "Choose Your Sovereign Subdomain")}
                    </label>
                    <div
                      dir="ltr"
                      className="flex items-center rounded-xl border border-border bg-background px-3.5 py-2.5"
                    >
                      <Globe2 className="h-4 w-4 text-[#C5A059] me-2 shrink-0" />
                      <input
                        type="text"
                        required
                        dir="ltr"
                        value={username}
                        onChange={(e) => setUsername(normalizeUsername(e.target.value))}
                        placeholder="ahmed"
                        className="w-full bg-transparent font-mono text-sm focus:outline-none text-left"
                      />
                      <span dir="ltr" className="font-mono text-xs font-bold text-[#C5A059]">
                        .taqdom.me
                      </span>
                    </div>
                    <p dir="ltr" className="mt-1 font-mono text-xs text-[#C5A059]">
                      https://{username || "username"}.taqdom.me
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      {t("الاسم الكامل (يظهر في المعرض)", "Full Display Name")}
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
                      {t("القالب المبدئي المفضل", "Initial Archetype Template")}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(["athar", "madar", "siyada", "noor"] as const).map((tpl) => (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => setTemplate(tpl)}
                          className={`rounded-xl border py-2 text-xs font-bold uppercase ${
                            template === tpl
                              ? "border-[#C5A059] bg-[#C5A059]/20"
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
                        "إنشاء الحساب وإطلاق النطاق الفرعي",
                        "Create Account & Launch Subdomain"
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
                      placeholder="test@taqdom.me / test"
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
