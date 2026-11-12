"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Copy, KeyRound, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";

type Token = { id: string; label: string; created_at: number; last_used_at: number | null; revoked_at: number | null };
type Created = { token: string; connection: { endpoint: string; label: string }; warning: string };

export default function McpConnectionsPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [label, setLabel] = useState("Claude / ChatGPT");
  const [created, setCreated] = useState<Created | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/mcp/tokens", { cache: "no-store" });
      if (response.status === 401) { router.replace("/auth"); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تحميل الاتصالات");
      setTokens(data.tokens || []);
    } catch (error) { toast.error(error instanceof Error ? error.message : "حدث خطأ"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/mcp/tokens", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر إنشاء الاتصال");
      setCreated(data);
      await load();
      toast.success("تم إنشاء اتصال MCP");
    } catch (error) { toast.error(error instanceof Error ? error.message : "حدث خطأ"); }
    finally { setBusy(false); }
  };

  const revoke = async (id: string) => {
    if (!window.confirm("هل تريد إلغاء هذا الاتصال؟ لن يتمكن التطبيق المتصل من الوصول إلى بياناتك بعد ذلك.")) return;
    const response = await fetch(`/api/mcp/tokens?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) { toast.error("تعذر إلغاء الاتصال"); return; }
    if (created && tokens.find((t) => t.id === id)) setCreated(null);
    toast.success("تم إلغاء الاتصال");
    await load();
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success("تم النسخ");
  };

  return <main className="min-h-screen bg-background text-foreground"><Header />
    <section className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-6">
      <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> العودة للوحة التحكم</Link>
      <div className="mb-8 flex items-start gap-4">
        <div className="rounded-2xl border border-[#C99750]/40 bg-[#C99750]/10 p-3"><KeyRound className="h-7 w-7 text-[#A97835]" /></div>
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#A97835]">Taqdom Connect</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">اتصالات MCP</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">اربط معرضك بتطبيقات الذكاء الاصطناعي المتوافقة مع MCP، واسمح لها بقراءة وتعديل بيانات معرضك من خلال اتصال خاص بحسابك.</p></div>
      </div>

      <div className="mb-6 rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5">
        <div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-emerald-600" /> وصول آمن للقراءة والكتابة</div>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">الاتصال يقدر يعدّل بيانات الملف الشخصي ويضيف ويحدّث ويحذف المشاريع في المسودة. النشر العام لا يحدث تلقائيًا؛ لازم تستدعي أداة publish_portfolio صراحةً. كل مفتاح محصور في حسابك، ويمكنك إلغاؤه فورًا. لا تشارك المفتاح، وسيظهر كاملًا مرة واحدة فقط عند إنشائه.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-extrabold">إنشاء اتصال جديد</h2>
          <label className="mt-5 block text-sm font-bold" htmlFor="mcp-label">اسم الاتصال</label>
          <input id="mcp-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-[#C99750]" />
          <button onClick={create} disabled={busy || !label.trim()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#315BFF] px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"><Plus className="h-4 w-4" /> {busy ? "جارٍ الإنشاء..." : "إنشاء مفتاح MCP"}</button>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">يمكنك إنشاء حتى 10 اتصالات نشطة، لكل تطبيق مفتاح مستقل لتسهيل إلغاء الوصول بشكل منفصل.</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">اتصالات حسابك</h2><button onClick={() => void load()} className="rounded-lg border border-border p-2" aria-label="تحديث"><RefreshCw className="h-4 w-4" /></button></div>
          {loading ? <p className="py-8 text-sm text-muted-foreground">جارٍ تحميل الاتصالات...</p> : tokens.length === 0 ? <p className="py-8 text-sm text-muted-foreground">لا توجد اتصالات حتى الآن. أنشئ أول اتصال لربط معرضك.</p> : <div className="mt-4 space-y-3">{tokens.map((token) => <div key={token.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-4"><div className="min-w-0"><p className="truncate font-bold">{token.label}</p><p className="mt-1 text-xs text-muted-foreground">{token.revoked_at ? "ملغي" : "نشط"} · {new Date(token.created_at).toLocaleDateString("ar-EG")}</p></div>{!token.revoked_at && <button onClick={() => void revoke(token.id)} className="rounded-lg border border-red-500/30 p-2 text-red-600 hover:bg-red-500/10" aria-label="إلغاء الاتصال"><Trash2 className="h-4 w-4" /></button>}</div>)}</div>}
        </div>
      </div>

      {created && <div className="mt-6 rounded-3xl border-2 border-emerald-500/40 bg-emerald-500/5 p-6">
        <h2 className="text-lg font-black text-emerald-700 dark:text-emerald-400">تم إنشاء مفتاح الاتصال — انسخه الآن</h2>
        <p className="mt-2 text-sm text-muted-foreground">{created.warning}</p>
        <label className="mt-4 block text-xs font-bold">MCP Endpoint</label><div className="mt-1 flex gap-2"><input readOnly value={created.connection.endpoint} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" /><button onClick={() => void copy(created.connection.endpoint)} className="rounded-lg border border-border p-2" aria-label="نسخ الرابط"><Copy className="h-4 w-4" /></button></div>
        <label className="mt-4 block text-xs font-bold">Bearer Token</label><div className="mt-1 flex gap-2"><input readOnly value={created.token} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs" /><button onClick={() => void copy(created.token)} className="rounded-lg border border-border p-2" aria-label="نسخ المفتاح"><Copy className="h-4 w-4" /></button></div>
        <button onClick={() => setCreated(null)} className="mt-4 text-sm font-bold text-muted-foreground underline">أخفي المفتاح بعد حفظه بأمان</button>
      </div>}

      <div className="mt-6 rounded-3xl border border-border bg-card p-6"><h2 className="font-extrabold">الأدوات المتاحة</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["get_portfolio","قراءة بيانات المعرض"],["get_profile","قراءة الملف الشخصي"],["list_projects","عرض المشاريع"],["update_profile","تعديل الملف الشخصي"],["create_project","إضافة مشروع"],["update_project","تعديل مشروع"],["delete_project","حذف مشروع"],["publish_portfolio","نشر المسودة"]].map(([name,desc]) => <div key={name} className="rounded-xl bg-muted/50 p-3"><code className="text-xs font-bold text-[#A97835]">{name}</code><p className="mt-1 text-sm">{desc}</p></div>)}</div><p className="mt-4 text-xs leading-6 text-muted-foreground">تستخدم الاتصالات مفاتيح وصول شخصية عبر HTTPS وMCP Streamable HTTP. التعديلات تحفظ كمسودة خاصة حتى تطلب النشر صراحةً. دعم OAuth 2.1 وتفويض التطبيقات من داخل Claude/ChatGPT مرحلة لاحقة مستقلة، وليست مفعّلة في هذه النسخة.</p></div>
    </section><FooterSection /></main>;
}
