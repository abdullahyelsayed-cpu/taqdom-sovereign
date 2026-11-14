"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CheckCircle2,
  KeyRound,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useLanguage } from "@/lib/i18n";
import {
  consumeGoogleRedirectResult,
  signInWithGoogleFirebase,
} from "@/lib/firebase-client";

interface ClientInspection {
  ok: boolean;
  client?: {
    clientId: string;
    clientName: string;
    isCimd?: boolean;
  };
  redirectUri?: string;
  scopes?: string[];
  requestedUsername?: string | null;
  error?: string;
  error_description?: string;
}

interface SessionInfo {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    isTestAccount?: boolean;
  } | null;
}

export default function OAuthAuthorizePage() {
  const { lang, t } = useLanguage();

  const [queryParams, setQueryParams] = useState({
    client_id: "",
    redirect_uri: "",
    state: "",
    scope: "portfolio:read portfolio:write portfolio:publish",
    code_challenge: "",
    code_challenge_method: "",
    resource: "",
    response_type: "code",
  });

  const [clientCheck, setClientCheck] = useState<ClientInspection | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as SessionInfo;
        setSession(data);
        return data;
      }
    } catch {
      // Ignore network errors
    }
    setSession({ authenticated: false, user: null });
    return null;
  };

  useEffect(() => {
    let active = true;
    const sp = new URLSearchParams(window.location.search);
    const parsed = {
      client_id: sp.get("client_id") || "",
      redirect_uri: sp.get("redirect_uri") || "",
      state: sp.get("state") || "",
      scope: sp.get("scope") || "portfolio:read portfolio:write portfolio:publish",
      code_challenge: sp.get("code_challenge") || "",
      code_challenge_method: sp.get("code_challenge_method") || "",
      resource: sp.get("resource") || "",
      response_type: sp.get("response_type") || "code",
    };
    setQueryParams(parsed);

    const bootstrap = async () => {
      try {
        const redirectOutcome = await consumeGoogleRedirectResult();
        if (redirectOutcome?.status === "ok") {
          const authRes = await fetch("/api/auth/firebase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: redirectOutcome.idToken }),
          });
          if (!authRes.ok) {
            const authData = await authRes.json().catch(() => null);
            setAuthError(
              authData?.error ||
                t(
                  "تعذّر إكمال تسجيل الدخول عبر Google. حاول مرة أخرى.",
                  "Could not finish Google sign-in. Please try again."
                )
            );
          }
        } else if (redirectOutcome?.status === "error") {
          setAuthError(redirectOutcome.message);
        }
      } catch (err) {
        setAuthError(
          err instanceof Error
            ? err.message
            : t(
                "تعذّر إكمال تسجيل الدخول عبر Google.",
                "Could not complete Google sign-in."
              )
        );
      }

      const mePromise = refreshSession();
      const infoPromise = parsed.client_id
        ? fetch(`/api/oauth/client-info?${sp.toString()}`, { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => ({ ok: false, error_description: "Unable to verify OAuth client." }))
        : Promise.resolve({
            ok: false,
            error: "missing_params",
            error_description: "No OAuth authorization request parameters were provided.",
          });

      const [, info] = await Promise.all([mePromise, infoPromise]);
      if (active) {
        setClientCheck(info as ClientInspection);
        setLoading(false);
      }
    };

    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const handleGoogleLogin = async () => {
    setBusy(true);
    setAuthError(null);
    try {
      const outcome = await signInWithGoogleFirebase();
      if (outcome.status === "error") {
        setAuthError(outcome.message);
        toast.error(outcome.message);
        return;
      }
      if (outcome.status !== "ok") return;
      const res = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: outcome.idToken, displayName: outcome.displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google sign-in failed");
      await refreshSession();
      toast.success(
        t(
          `تم تسجيل الدخول بحساب ${data.user.username}`,
          `Signed in as @${data.user.username}`
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("تعذر تسجيل الدخول عبر Google", "Google authentication failed"));
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      await refreshSession();
      toast.success(t("تم تسجيل الدخول بنجاح", "Signed in successfully"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("فشل تسجيل الدخول", "Sign in failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDecision = async (decision: "approve" | "deny") => {
    setBusy(true);
    try {
      const res = await fetch("/api/oauth/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...queryParams,
          decision,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirectTo) {
        throw new Error(data.error_description || data.error || "Authorization failed");
      }
      window.location.assign(data.redirectTo);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("تعذر إتمام التفويض", "Could not complete authorization"));
      setBusy(false);
    }
  };

  const isRealAccount = Boolean(
    session?.authenticated && session.user?.username && !session.user.isTestAccount
  );

  const scopeLabels: Record<string, string> = {
    "portfolio:read": t(
      "قراءة بيانات ملفك الشخصي ومشاريعك وبنية التصميم الحالية",
      "Read your portfolio blueprint, profile details, and project list"
    ),
    "portfolio:write": t(
      "تعديل المحتوى وإنشاء تصاميم وأقسام مخصصة بالكامل داخل المسودة",
      "Edit bilingual content and design bespoke themes & sections in draft"
    ),
    "portfolio:publish": t(
      "نشر التعديلات على موقعك المستقل عندما تطلب ذلك",
      "Publish approved drafts live to your standalone subdomain"
    ),
  };

  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-background text-foreground">
      <Header />
      <section className="mx-auto max-w-2xl px-4 pb-24 pt-32 sm:px-6">
        <div className="glass-panel rounded-3xl border border-[#C99750]/35 bg-card p-6 sm:p-9 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-[#C99750]/45 bg-[#C99750]/12 p-3">
              <ShieldCheck className="h-6 w-6 text-[#9A7B4F] dark:text-[#E4B66F]" />
            </div>
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A7B4F] dark:text-[#E4B66F]">
                TAQDOM MCP OAUTH 2.1
              </p>
              <h1 className="text-2xl font-black">
                {t("تفويض اتصال الذكاء الاصطناعي", "Authorize AI Workspace Access")}
              </h1>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("جارٍ التحقق من طلب الاتصال...", "Verifying OAuth 2.1 authorization request...")}
            </div>
          ) : !clientCheck?.ok ? (
            <div className="space-y-5 rounded-2xl border border-border bg-background/70 p-5">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h2 className="font-bold text-base">
                    {clientCheck?.error === "missing_params"
                      ? t("تتم إدارة هذا المسار تلقائيًا بواسطة تطبيقات MCP", "Automatic OAuth 2.1 Endpoint")
                      : t("تعذر التحقق من طلب التفويض", "Authorization Request Invalid")}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {clientCheck?.error === "missing_params"
                      ? t(
                          "أضف رابط https://taqdom.me/mcp داخل Gemini CLI أو Claude وسيُفتح لك هذا الرابط تلقائيًا لتسجيل الدخول بنقرة واحدة.",
                          "Add https://taqdom.me/mcp inside Gemini CLI or Claude and this screen will launch automatically for one-click sign-in."
                        )
                      : clientCheck?.error_description || "Invalid OAuth 2.1 parameters."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/mcp"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#9A7B4F] dark:bg-[#C89D66] px-5 py-2.5 text-sm font-extrabold text-[#F7F5F0] dark:text-[#0A0A09]"
                >
                  {t("الانتقال إلى إعدادات MCP", "Go to MCP Connections")}
                </Link>
                <Link
                  href="/auth"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm font-bold"
                >
                  {t("صفحة تسجيل الدخول", "Sign In Page")}
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Client Card */}
              <div className="rounded-2xl border border-border bg-background/70 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("التطبيق الطالب للربط", "Requesting Client")}
                    </p>
                    <p className="text-lg font-extrabold">{clientCheck.client?.clientName}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <Lock className="h-3.5 w-3.5" />
                    PKCE S256
                  </span>
                </div>
                {clientCheck.requestedUsername && (
                  <p className="text-xs font-mono text-[#9A7B4F] dark:text-[#E4B66F]" dir="ltr">
                    Target Account: @{clientCheck.requestedUsername}
                  </p>
                )}
              </div>

              {/* Scopes */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("الصلاحيات المطلوبة", "Requested Permissions")}
                </p>
                <ul className="space-y-2">
                  {(clientCheck.scopes || []).map((sc) => (
                    <li
                      key={sc}
                      className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-background/60 p-3 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#9A7B4F] dark:text-[#E4B66F] shrink-0 mt-0.5" />
                      <div>
                        <span dir="ltr" className="font-mono text-xs font-bold block">
                          {sc}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {scopeLabels[sc] || sc}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Auth Check / Approval */}
              {!isRealAccount ? (
                <div className="space-y-4 rounded-2xl border border-border bg-secondary/40 p-5">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Sparkles className="h-4 w-4 text-[#9A7B4F] dark:text-[#E4B66F]" />
                    <span>
                      {t(
                        "سجّل الدخول بحسابك لإتمام الربط",
                        "Sign in to your Taqdom account to connect"
                      )}
                    </span>
                  </div>
                  {authError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive"
                    >
                      {authError}
                    </div>
                  )}

                  <button
                    type="button"
                    data-testid="oauth-google-signin-btn"
                    onClick={() => void handleGoogleLogin()}
                    disabled={busy}
                    className="w-full min-h-[48px] flex items-center justify-center gap-3 rounded-2xl border border-border bg-background hover:border-[#9A7B4F] px-5 py-3 text-sm font-extrabold shadow-sm transition cursor-pointer"
                  >
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                      <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                    </svg>
                    <span>
                      {t("المتابعة بحساب Google", "Continue with Google")}
                    </span>
                  </button>

                  <div className="relative flex items-center py-1">
                    <div className="grow border-t border-border" />
                    <span className="mx-3 text-[11px] font-bold uppercase text-muted-foreground">
                      {t("أو", "or")}
                    </span>
                    <div className="grow border-t border-border" />
                  </div>

                  <form onSubmit={handlePasswordLogin} className="space-y-3">
                    <input
                      type="text"
                      required
                      dir="ltr"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={t("اسم المستخدم أو البريد الإلكتروني", "Username or email")}
                      className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="password"
                      required
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("كلمة المرور", "Password")}
                      className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-foreground text-background py-2.5 text-sm font-bold cursor-pointer"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>{t("تسجيل الدخول", "Sign In")}</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {t("مسجّل الدخول بالحساب", "Signed in as")}
                        </p>
                        <p className="font-mono text-sm font-bold truncate" dir="ltr">
                          @{session?.user?.username} ({session?.user?.email})
                        </p>
                      </div>
                    </div>
                    <KeyRound className="h-4 w-4 text-emerald-600 shrink-0" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      data-testid="oauth-approve-btn"
                      onClick={() => void handleDecision("approve")}
                      disabled={busy}
                      className="flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-2xl bg-[#9A7B4F] dark:bg-[#C89D66] px-6 py-3.5 text-sm font-extrabold text-[#F7F5F0] dark:text-[#0A0A09] shadow-lg transition hover:opacity-95 disabled:opacity-60 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{t("الموافقة وربط الحساب", "Approve & Connect")}</span>
                    </button>
                    <button
                      type="button"
                      data-testid="oauth-deny-btn"
                      onClick={() => void handleDecision("deny")}
                      disabled={busy}
                      className="min-h-[48px] flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-6 py-3.5 text-sm font-bold hover:border-red-500/50 cursor-pointer"
                    >
                      <span>{t("رفض", "Deny")}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <FooterSection />
    </main>
  );
}
