"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldAlert,
  KeyRound,
  Globe2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Save,
  Info,
} from "lucide-react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";
import { normalizeUsername, validateUsername } from "@/lib/types";
import { SEED_PORTFOLIOS } from "@/lib/seed-data";

export default function DashboardSettingsPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const user = useTaqdomStore((s) => s.user);
  const setUser = useTaqdomStore((s) => s.setUser);
  const setDraft = useTaqdomStore((s) => s.setDraft);

  const currentUsername = user?.username || "";
  const isShowcaseAccount = Boolean(
    user?.isFlagshipAccount ||
      user?.isTestAccount ||
      (currentUsername && SEED_PORTFOLIOS[currentUsername])
  );

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const syncedUsernameRef = useRef("");

  useEffect(() => {
    if (user?.username && user.username !== syncedUsernameRef.current) {
      syncedUsernameRef.current = user.username;
      setNewUsername(user.username);
    }
  }, [user?.username]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!active) return;
        if (res.status === 401 || data?.authenticated === false || !data?.user?.username) {
          setUser(null);
          router.replace("/auth");
          return;
        }
        if (res.ok && data?.user) {
          setUser(data.user, data.portfolio || null);
          syncedUsernameRef.current = data.user.username;
          setNewUsername(data.user.username);
        }
      } catch {
        // Keep existing store state if offline
      } finally {
        if (active) setCheckingAuth(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router, setDraft, setUser]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkingAuth || !currentUsername) {
      toast.error(t("يرجى تسجيل الدخول أولاً", "Please sign in first"));
      return;
    }
    if (isShowcaseAccount) {
      toast.info(
        t(
          "حسابات العرض الرسمية للقراءة فقط — أنشئ حسابك المستقل لتعديل الرابط وكلمة المرور.",
          "Official showcase accounts are read-only — create your own account to change your link and password."
        )
      );
      return;
    }
    const cleanNew = normalizeUsername(newUsername);
    if (cleanNew !== currentUsername) {
      const val = validateUsername(cleanNew);
      if (!val.valid) {
        toast.error(t(val.reasonAr || "اسم غير صالح", val.reasonEn || "Invalid username"));
        return;
      }
    }
    if (newPassword && (newPassword.length < 15 || newPassword.length > 128)) {
      toast.error(
        t("استخدم عبارة مرور من 15 إلى 128 حرفًا.", "Use a passphrase between 15 and 128 characters.")
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUsername,
          newUsername: cleanNew !== currentUsername ? cleanNew : undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || t("تعذر تحديث إعدادات الحساب", "Failed to update settings"));
        return;
      }
      if (data.user) {
        syncedUsernameRef.current = data.user.username || "";
        setUser(data.user, data.portfolio || null);
        setNewUsername(data.user.username || cleanNew);
      } else if (data.portfolio) {
        setDraft(data.portfolio, false);
      }
      setNewPassword("");
      toast.success(t("تم تحديث إعدادات الحساب بنجاح!", "Account settings updated!"));
    } catch {
      toast.error(t("حدث خطأ في الاتصال", "Network error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (checkingAuth || deleting || !currentUsername) return;
    if (isShowcaseAccount) {
      toast.error(t("لا يمكن حذف حساب العرض الرسمي", "Cannot delete showcase account"));
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/auth/settings?u=${encodeURIComponent(currentUsername)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || t("تعذر حذف الحساب حالياً", "Failed to delete account"));
        return;
      }
      setUser(null);
      toast.success(t("تم حذف الحساب بنجاح", "Account deleted"));
      router.push("/auth");
    } catch {
      toast.error(t("حدث خطأ في الاتصال أثناء حذف الحساب", "Network error while deleting account"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="arabic-diacritics text-3xl sm:text-4xl font-extrabold">
                {t("إعدادات الحساب والرابط الشخصي", "Account & personal link")}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t(
                  "إدارة اسم رابطك وكلمة المرور وأمان حسابك على تَقَدُّم.",
                  "Manage your personal address, password, and account security."
                )}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-bold"
            >
              {lang === "ar" ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
              <span>{t("العودة للوحتي", "Back to Dashboard")}</span>
            </Link>
          </div>

          {isShowcaseAccount && !checkingAuth && (
            <div className="rounded-3xl border border-[#C89D66]/40 bg-[#C89D66]/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-[#9A7B4F] dark:text-[#C89D66] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    {t("حساب عرض رسمي للقراءة فقط", "Read-only official showcase account")}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(
                      "لا يمكن تغيير رابط حسابات العرض الرسمية أو حذفها. سجّل حسابك المستقل للحصول على رابط شخصي وإعدادات كاملة.",
                      "Official showcase accounts cannot change links or be deleted. Create your own sovereign account for full link and security controls."
                    )}
                  </p>
                </div>
              </div>
              <Link
                href="/auth"
                className="shrink-0 inline-flex items-center justify-center rounded-xl bg-[#9A7B4F] dark:bg-[#C89D66] px-4 py-2 text-xs font-bold text-[#F7F5F0] dark:text-[#0A0A09] hover:opacity-95 transition"
              >
                {t("إنشاء حساب مستقل", "Create sovereign account")}
              </Link>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="glass-panel rounded-3xl p-8 space-y-6 border border-border">
            <div>
              <label htmlFor="settings-username-input" className="flex items-center gap-2 text-xs font-bold mb-2">
                <Globe2 className="h-4 w-4 text-[#9A7B4F] dark:text-[#C89D66]" />
                <span>{t("تغيير اسم الرابط الشخصي", "Change personal link")}</span>
              </label>
              <div
                dir="ltr"
                className="flex items-center rounded-xl border border-border bg-background px-4 py-2.5"
              >
                <input
                  id="settings-username-input"
                  data-testid="settings-username-input"
                  type="text"
                  dir="ltr"
                  value={newUsername}
                  placeholder={checkingAuth ? "..." : ""}
                  disabled={checkingAuth || isShowcaseAccount || saving || deleting}
                  onChange={(e) => setNewUsername(normalizeUsername(e.target.value))}
                  className="w-full bg-transparent font-mono text-sm focus:outline-none text-left disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <span dir="ltr" className="font-mono text-xs font-bold text-[#9A7B4F] dark:text-[#C89D66]">
                  .taqdom.me
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-[#9A7B4F] dark:text-[#C89D66]">
                {t(
                  "تنبيه: تغيير اسم المستخدم ينقل معرضك إلى الرابط الجديد.",
                  "Changing your username moves your portfolio to the new address."
                )}
              </p>
            </div>

            <div>
              <label htmlFor="settings-password-input" className="flex items-center gap-2 text-xs font-bold mb-2">
                <KeyRound className="h-4 w-4 text-[#9A7B4F] dark:text-[#C89D66]" />
                <span>{t("كلمة المرور الجديدة (اختياري)", "New Password (optional)")}</span>
              </label>
              <input
                id="settings-password-input"
                type="password"
                dir="ltr"
                minLength={15}
                maxLength={128}
                value={newPassword}
                disabled={checkingAuth || isShowcaseAccount || saving || deleting}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="•••••••••••••••"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                {t("استخدم عبارة مرور من 15 إلى 128 حرفًا.", "Use a passphrase between 15 and 128 characters.")}
              </p>
            </div>

            <button
              type="submit"
              disabled={checkingAuth || isShowcaseAccount || saving || deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#9A7B4F] dark:bg-[#C89D66] hover:opacity-95 px-6 py-3 text-xs sm:text-sm font-bold text-[#F7F5F0] dark:text-[#0A0A09] shadow-lg transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? t("جارٍ الحفظ...", "Saving...") : t("حفظ التغييرات", "Save Changes")}</span>
            </button>
          </form>

          <div className="glass-panel rounded-3xl p-8 border border-red-500/30 space-y-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
              <ShieldAlert className="h-5 w-5" />
              <span>{t("منطقة الخطر — حذف الحساب", "Danger Zone — Delete Account")}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "حذف الحساب يؤدي إلى إزالة البورتفوليو وتحرير النطاق الفرعي الخاص بك نهائياً (حسابات الأمثلة محمية من الحذف).",
                "Deleting your account permanently removes your portfolio and releases your subdomain (sample accounts are protected)."
              )}
            </p>
            <button
              type="button"
              data-testid="settings-delete-account-btn"
              disabled={checkingAuth || isShowcaseAccount || saving || deleting}
              onClick={handleDeleteAccount}
              className="inline-flex items-center gap-2 rounded-xl border border-red-600/50 dark:border-red-500/50 bg-red-500/10 hover:bg-red-500/20 px-5 py-2.5 text-xs font-bold text-red-700 dark:text-red-400 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              <span>
                {deleting
                  ? t("جارٍ حذف الحساب...", "Deleting account...")
                  : t("حذف الحساب نهائياً", "Delete Account Permanently")}
              </span>
            </button>
          </div>
        </div>
      </section>

      <FooterSection />
    </main>
  );
}
