"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";
import { normalizeUsername, validateUsername } from "@/lib/types";

export default function DashboardSettingsPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const user = useTaqdomStore((s) => s.user);
  const draft = useTaqdomStore((s) => s.draft);
  const setUser = useTaqdomStore((s) => s.setUser);
  const setDraft = useTaqdomStore((s) => s.setDraft);

  const currentUsername = user?.username || draft.username || "test";
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNew = normalizeUsername(newUsername);
    if (cleanNew !== currentUsername) {
      const val = validateUsername(cleanNew);
      if (!val.valid) {
        toast.error(t(val.reasonAr || "اسم غير صالح", val.reasonEn || "Invalid username"));
        return;
      }
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
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update settings");
        return;
      }
      if (data.user) setUser(data.user);
      if (data.portfolio) setDraft(data.portfolio, false);
      setNewPassword("");
      toast.success(t("تم تحديث إعدادات الحساب بنجاح!", "Account settings updated!"));
    } catch {
      toast.error(t("حدث خطأ في الاتصال", "Network error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const res = await fetch(`/api/auth/settings?u=${encodeURIComponent(currentUsername)}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || t("لا يمكن حذف حساب العرض الرسمي", "Cannot delete showcase account"));
      return;
    }
    setUser(null);
    toast.success(t("تم حذف الحساب بنجاح", "Account deleted"));
    router.push("/auth");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="arabic-diacritics text-3xl sm:text-4xl font-extrabold">
                {t("إعدادات الحساب والنطاق السيادي", "Sovereign Account Settings")}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t(
                  "إدارة اسم النطاق الفرعي وكلمة المرور وأمان حسابك على منصة تَقَدُّم.",
                  "Manage your subdomain handle, password credentials, and account security."
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

          <form onSubmit={handleSaveSettings} className="glass-panel rounded-3xl p-8 space-y-6 border border-border">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold mb-2">
                <Globe2 className="h-4 w-4 text-[#C5A059]" />
                <span>{t("تغيير اسم النطاق الفرعي (Subdomain)", "Change Subdomain Username")}</span>
              </label>
              <div
                dir="ltr"
                className="flex items-center rounded-xl border border-border bg-background px-4 py-2.5"
              >
                <input
                  type="text"
                  dir="ltr"
                  value={newUsername}
                  onChange={(e) => setNewUsername(normalizeUsername(e.target.value))}
                  className="w-full bg-transparent font-mono text-sm focus:outline-none text-left"
                />
                <span dir="ltr" className="font-mono text-xs font-bold text-[#C5A059]">
                  .taqdom.me
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-amber-600 dark:text-[#D4AF37]">
                {t(
                  "تنبيه: تغيير اسم المستخدم ينقل معرضك فوراً إلى النطاق الفرعي الجديد.",
                  "Warning: Changing your username immediately moves your portfolio to the new subdomain."
                )}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold mb-2">
                <KeyRound className="h-4 w-4 text-[#C5A059]" />
                <span>{t("كلمة المرور الجديدة (اختياري)", "New Password (optional)")}</span>
              </label>
              <input
                type="password"
                dir="ltr"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] px-6 py-3 text-xs sm:text-sm font-bold text-[#111113] shadow-lg transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? t("جارٍ الحفظ...", "Saving...") : t("حفظ التغييرات", "Save Changes")}</span>
            </button>
          </form>

          <div className="glass-panel rounded-3xl p-8 border border-red-500/30 space-y-4">
            <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
              <ShieldAlert className="h-5 w-5" />
              <span>{t("منطقة الخطر — حذف الحساب", "Danger Zone — Delete Account")}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "حذف الحساب يؤدي إلى إزالة البورتفوليو وتحرير النطاق الفرعي الخاص بك نهائياً (حسابات العرض الرسمية محمية ضد الحذف).",
                "Deleting your account permanently removes your portfolio and releases your subdomain (official showcase accounts are protected)."
              )}
            </p>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 px-5 py-2.5 text-xs font-bold text-red-500 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t("حذف الحساب نهائياً", "Delete Account Permanently")}</span>
            </button>
          </div>
        </div>
      </section>

      <FooterSection />
    </main>
  );
}
