"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  KeyRound,
  Layers3,
  Palette,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Wand2,
} from "lucide-react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useLanguage } from "@/lib/i18n";
import { useTaqdomStore } from "@/lib/store";

type Token = {
  id: string;
  label: string;
  created_at: number;
  last_used_at: number | null;
  revoked_at: number | null;
};

type Created = {
  token: string;
  connection: { id?: string; endpoint: string; directUrl?: string; label: string };
  warning: string;
};

type ClientTab = "oauth" | "gemini" | "claude" | "curl";

export default function McpConnectionsPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const user = useTaqdomStore((s) => s.user);
  const draft = useTaqdomStore((s) => s.draft);

  const [tokens, setTokens] = useState<Token[]>([]);
  const [label, setLabel] = useState("Gemini / Claude Architect");
  const [created, setCreated] = useState<Created | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [clientTab, setClientTab] = useState<ClientTab>("oauth");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDemoSession, setIsDemoSession] = useState(false);
  const [sessionUsername, setSessionUsername] = useState("");

  const activeUsername = user?.username || draft?.username || sessionUsername || "yourname";
  const endpointUrl = created?.connection?.endpoint || `https://taqdom.me/mcp/${activeUsername}`;
  const oauthEndpointUrl = "https://taqdom.me/mcp";
  const tokenDisplay = created?.token || "tqd_mcp_YOUR_GENERATED_TOKEN";
  const directUrlDisplay =
    created?.connection?.directUrl || `${endpointUrl}?token=${tokenDisplay}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      if (meRes.ok) {
        const meData = await meRes.json().catch(() => null);
        if (meData && meData.authenticated === false) {
          router.replace("/auth");
          return;
        }
        if (meData?.user?.username) {
          setSessionUsername(String(meData.user.username));
        }
        if (meData?.user?.isTestAccount) {
          setIsDemoSession(true);
          setTokens([]);
          return;
        }
      }
      setIsDemoSession(false);
      const response = await fetch("/api/mcp/tokens", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/auth");
        return;
      }
      if (response.status === 403 || response.status === 404) {
        setTokens([]);
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("تعذر تحميل الاتصالات", "Could not load MCP connections"));
      setTokens(data.tokens || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("حدث خطأ", "An error occurred"));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/mcp/tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("تعذر إنشاء الاتصال", "Could not create MCP connection"));
      setCreated(data);
      await load();
      toast.success(t("تم إنشاء اتصال MCP بنجاح", "MCP connection created"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("حدث خطأ", "An error occurred"));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    const response = await fetch(`/api/mcp/tokens?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error(t("تعذر إلغاء الاتصال", "Could not revoke connection"));
      return;
    }
    setConfirmRevokeId(null);
    setCreated((prev) => (prev && prev.connection?.id === id ? null : prev));
    toast.success(t("تم إلغاء الاتصال", "Connection revoked"));
    await load();
  };

  const copyText = async (value: string, key: string) => {
    await navigator.clipboard?.writeText(value);
    setCopiedKey(key);
    toast.success(t("تم النسخ إلى الحافظة", "Copied to clipboard"));
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const oauthSnippet = JSON.stringify(
    {
      mcpServers: {
        taqdom: {
          url: oauthEndpointUrl,
          note: "Triggers OAuth 2.1 browser sign-in automatically (Taqdom or Google Sign-In)",
        },
      },
    },
    null,
    2
  );

  const geminiSnippet = JSON.stringify(
    {
      mcpServers: {
        taqdomPortfolio: {
          httpUrl: directUrlDisplay,
        },
      },
    },
    null,
    2
  );

  const claudeSnippet = JSON.stringify(
    {
      mcpServers: {
        "taqdom-portfolio": {
          type: "http",
          url: oauthEndpointUrl,
        },
      },
    },
    null,
    2
  );

  const curlSnippet = `curl -X POST "${endpointUrl}" \\
  -H "Authorization: Bearer ${tokenDisplay}" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_portfolio_blueprint","arguments":{}}}'`;

  const activeConfigSnippet =
    clientTab === "oauth"
      ? oauthSnippet
      : clientTab === "gemini"
      ? geminiSnippet
      : clientTab === "claude"
      ? claudeSnippet
      : curlSnippet;

  const masterArchitectPrompt = t(
    `أنت مصمم مواقع ومخرج فني خبير (Art Director & Frontend Architect). اتصل بمعرضي عبر خادم Taqdom MCP، واقرأ بياناتي عبر get_portfolio_blueprint واكتشف قدرات التصميم المخصص عبر list_templates_and_capabilities.

أريد تصميم بورتفوليو أسطوري مخصص على مزاجي بالكامل حتى لو كان التصميم نفسه مختلفًا تمامًا عن القوالب السبعة الجاهزة:
1. ابتكر هوية بصرية أصلية (لوحة ألوان عالية التباين، تدرج إضاءة أنيق، خطوط مناسبة، وتخطيط Hero وتصميم شبكات مشاريع Bento أو Editorial).
2. أضف أقسامًا مخصصة (مثل: فلسفة التصميم، أو خدمات/مجالات التعاون، أو أسئلة شائعة، أو شريط دعوة للتواصل) عبر design_custom_portfolio_theme مع الحرص على صياغة عربية وإنجليزية احترافية عبر update_portfolio_content و create_project/update_project.
3. اعرض عليّ ملخص التصميم النهائي، وعندما أوافق قم بنشره مباشرة عبر publish_portfolio ليظهر كموقع شخصي مستقل بالكامل على https://${activeUsername}.taqdom.me.`,
    `You are an elite Art Director & Frontend Architect. Connect to my Taqdom MCP server, inspect my current draft via get_portfolio_blueprint and check list_templates_and_capabilities.

Design a completely bespoke, original luxury personal portfolio for me — you do NOT need to stay within the 7 preset templates:
1. Synthesize an original design system (high-contrast custom palette, refined gradients, typography pairing, bespoke heroVariant, projectGrid, GPU hover physics, and customSections such as Principles/Services cards, FAQ accordion, stats, quote, or CTA) via design_custom_portfolio_theme.
2. Elevate my bilingual (Arabic & English) bio, projects, skills, metrics, and timeline via update_portfolio_content and create_project/update_project.
3. Present your design blueprint, then publish live to my standalone site at https://${activeUsername}.taqdom.me using publish_portfolio.`
  );

  const toolsCatalog = [
    ["design_custom_portfolio_theme", t("تصميم ثيم وتخطيط وأقسام مخصصة بالكامل خارج أي قالب جاهز", "Design bespoke colors, hero, grid, effects & custom sections beyond presets")],
    ["get_portfolio_blueprint", t("قراءة المخطط الكامل للمعرض وقدرات التصميم المخصص", "Inspect full portfolio blueprint, design state & publication status")],
    ["list_templates_and_capabilities", t("استعراض القوالب السبعة + كل قدرات محرك التصميم المخصص", "Inspect 7 presets + full bespoke design-engine specification")],
    ["update_portfolio_content", t("تحديث شامل للمحتوى والمهارات والإنجازات والمسار وSEO", "Batch-update bilingual content, skills, metrics, timeline & SEO")],
    ["get_portfolio", t("قراءة بيانات المعرض وحالة النشر", "Read account draft portfolio & publication status")],
    ["get_profile", t("قراءة الملف الشخصي والروابط", "Read profile details & social links")],
    ["update_profile", t("تعديل الاسم والنبذة والمهارات والمظهر", "Update core profile fields & theme mode")],
    ["list_projects", t("عرض المشاريع الحالية في المسودة", "List projects currently saved in draft")],
    ["create_project", t("إضافة مشروع جديد ثنائي اللغة", "Create a new bilingual project card")],
    ["update_project", t("تعديل مشروع قائم بالمعرّف", "Update an existing project by projectId")],
    ["delete_project", t("حذف مشروع من المسودة", "Remove a project from draft")],
    ["publish_portfolio", t("نشر التصميم والمحتوى مباشرة كموقع مستقل", "Publish draft live to standalone personal site")],
  ];

  const BackArrow = lang === "ar" ? ArrowRight : ArrowLeft;

  return (
    <main className="dashboard-experience min-h-screen bg-background text-foreground">
      <Header />
      <section className="mx-auto max-w-6xl px-4 pb-24 pt-32 sm:px-6 space-y-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <BackArrow className="h-4 w-4" />
          <span>{t("العودة للوحة التحكم", "Back to Dashboard")}</span>
        </Link>

        {/* Hero Header */}
        <div className="glass-panel rounded-3xl p-7 sm:p-9 border border-[#C99750]/35 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-[#C99750]/45 bg-[#C99750]/12 p-3.5 shrink-0">
              <Wand2 className="h-7 w-7 text-[#9A7B4F] dark:text-[#E4B66F]" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#9A7B4F] dark:text-[#E4B66F]">
                TAQDOM ARCHITECT MCP v2.0
              </p>
              <h1 className="arabic-diacritics mt-1.5 text-3xl font-black sm:text-4xl">
                {t("اتصالات MCP لتصميم بورتفوليو على مزاجك", "MCP Architect Connections")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                {t(
                  "اربط معرضك بتطبيقات Gemini أو Claude عبر رابط OAuth 2.1 التلقائي ليفتح لك تسجيل الدخول بحسابك أو بحساب Google مباشرة، ودَع الذكاء الاصطناعي يصمم لك موقعًا متكاملًا بألوان وتخطيط وأقسام مخصصة حتى لو كان التصميم مختلفًا تمامًا عن القوالب الجاهزة.",
                  "Connect your portfolio to Gemini, Claude, or any MCP client via OAuth 2.1 automatic sign-in (with Taqdom or Google) or a one-click direct URL so AI can design a bespoke site beyond any preset template."
                )}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/85 px-4 py-3 text-xs space-y-2 shrink-0 w-full lg:w-auto">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#9A7B4F] dark:text-[#E4B66F]">
              {t("رابط OAuth التلقائي (بدون مفتاح يدوي)", "ZERO-CONFIG OAUTH 2.1 URL")}
            </span>
            <div className="flex items-center gap-2">
              <p dir="ltr" className="font-mono font-bold text-foreground break-all">
                {oauthEndpointUrl}
              </p>
              <button
                type="button"
                onClick={() => void copyText(oauthEndpointUrl, "oauth-ep")}
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-border bg-background p-2 hover:border-[#C99750] cursor-pointer"
                aria-label="Copy OAuth MCP URL"
              >
                {copiedKey === "oauth-ep" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Security Guarantee */}
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/8 p-5 sm:p-6">
          <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
            <span>{t("وصول آمن للقراءة والكتابة والتصميم المخصص", "Scoped Read, Write & Custom Design Access")}</span>
          </div>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {t(
              "الاتصال يتيح القراءة والكتابة على مسودة حسابك فقط، بما يشمل تصميم ثيمات وأقسام مخصصة عبر design_custom_portfolio_theme وتعديل المحتوى والمشاريع. النشر العام لا يحدث تلقائيًا؛ بل يتطلب استدعاء أداة publish_portfolio صراحةً ليظهر موقعك المستقل دون أي علامات مزعجة. كل مفتاح مشفر بـ SHA-256 ومعزول بحسابك، ويمكنك إلغاؤه في أي لحظة.",
              "Tokens grant read/write access strictly to your own account draft, including custom design tools and bilingual content editing. Public changes remain private until publish_portfolio is explicitly called. Tokens are SHA-256 hashed and revocable at any instant."
            )}
          </p>
        </div>

        {/* Token Generator + Active Connections */}
        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="glass-panel rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#9A7B4F] dark:text-[#E4B66F]" />
              <h2 className="text-xl font-extrabold">{t("إنشاء اتصال جديد", "Create New MCP Key")}</h2>
            </div>
            <label className="mt-5 block text-sm font-bold" htmlFor="mcp-label">
              {t("اسم الاتصال (مثلاً: Gemini CLI أو Claude Desktop)", "Connection Label")}
            </label>
            <input
              id="mcp-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={60}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[#C99750]"
            />
            <button
              type="button"
              data-testid="mcp-create-token-btn"
              onClick={create}
              disabled={busy || !label.trim() || isDemoSession}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#9A7B4F] dark:bg-[#C89D66] px-5 py-3 text-sm font-extrabold text-[#F7F5F0] dark:text-[#0A0A09] shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{busy ? t("جارٍ الإنشاء...", "Creating...") : t("إنشاء مفتاح MCP", "Generate MCP Token")}</span>
            </button>
            {isDemoSession ? (
              <div className="mt-3 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-xs leading-6 text-foreground">
                {t(
                  "حساب المعاينة للعرض فقط ولا يصدر مفاتيح MCP. أنشئ حسابك السيادي المجاني لتوليد مفاتيح حقيقية والربط مع Gemini و Claude.",
                  "Demo accounts are read-only. Create your free sovereign account to issue real MCP keys for Gemini & Claude."
                )}{" "}
                <Link href="/auth" className="font-bold underline text-[#9A7B4F] dark:text-[#E4B66F]">
                  {t("أنشئ حسابك الآن", "Create account")}
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                {t(
                  "يمكنك إنشاء حتى 10 مفاتيح نشطة، لكل أداة ذكاء اصطناعي مفتاحها المستقل.",
                  "Up to 10 active connections per account so you can isolate Gemini, Claude, and custom agents."
                )}
              </p>
            )}
          </div>

          <div className="glass-panel rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">{t("اتصالات حسابك", "Your Connections")}</h2>
              <button
                type="button"
                onClick={() => void load()}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-background p-2.5 hover:border-[#C99750] transition cursor-pointer"
                aria-label={t("تحديث", "Refresh")}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {loading ? (
              <p className="py-8 text-sm text-muted-foreground">{t("جارٍ تحميل الاتصالات...", "Loading connections...")}</p>
            ) : tokens.length === 0 ? (
              <p className="py-8 text-sm text-muted-foreground">
                {t("لا توجد اتصالات حتى الآن. أنشئ أول مفتاح لربط Gemini أو Claude.", "No connections yet. Generate a token to link Gemini or Claude.")}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {tokens.map((tok) => (
                  <div
                    key={tok.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/60 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-sm">{tok.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {tok.revoked_at ? t("ملغي", "Revoked") : t("نشط", "Active")} ·{" "}
                        {new Date(tok.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
                      </p>
                    </div>
                    {!tok.revoked_at &&
                      (confirmRevokeId === tok.id ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => void revoke(tok.id)}
                            className="min-h-[44px] inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white cursor-pointer"
                          >
                            {t("تأكيد الإلغاء", "Confirm")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRevokeId(null)}
                            className="min-h-[44px] inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-semibold cursor-pointer"
                          >
                            {t("تراجع", "Cancel")}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRevokeId(tok.id)}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-red-500/35 p-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                          aria-label={t("إلغاء الاتصال", "Revoke connection")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* One-time Created Token Banner */}
        {created && (
          <div className="rounded-3xl border-2 border-emerald-500/45 bg-emerald-500/8 p-6 sm:p-7 space-y-4">
            <h2 className="text-lg font-black text-emerald-700 dark:text-emerald-300">
              {t("تم إنشاء مفتاح الاتصال، انسخه الآن", "Token Generated, Copy Now")}
            </h2>
            <p className="text-sm text-muted-foreground">{created.warning}</p>
            <div>
              <label className="block text-xs font-bold mb-1">MCP Endpoint</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  dir="ltr"
                  value={created.connection.endpoint}
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => void copyText(created.connection.endpoint, "ep")}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-background px-3 py-2 cursor-pointer"
                  aria-label="Copy endpoint"
                >
                  {copiedKey === "ep" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                {t("رابط مباشر جاهز للاستخدام (بدون إعداد Headers)", "Pre-Authenticated Direct URL (Zero-Header)")}
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  dir="ltr"
                  data-testid="mcp-direct-url-input"
                  value={created.connection.directUrl || directUrlDisplay}
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => void copyText(created.connection.directUrl || directUrlDisplay, "direct-url")}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-background px-3 py-2 cursor-pointer"
                  aria-label="Copy Direct MCP URL"
                >
                  {copiedKey === "direct-url" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Bearer Token</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  dir="ltr"
                  value={created.token}
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => void copyText(created.token, "tok")}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-background px-3 py-2 cursor-pointer"
                  aria-label="Copy token"
                >
                  {copiedKey === "tok" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreated(null)}
              className="min-h-[44px] inline-flex items-center text-sm font-bold text-muted-foreground underline cursor-pointer"
            >
              {t("أخفِ المفتاح بعد حفظه بأمان", "Hide token after saving safely")}
            </button>
          </div>
        )}

        {/* Ready-to-Use Client Integration Snippets + Architect Master Prompt */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-3xl border border-border bg-card p-6 sm:p-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-[#9A7B4F] dark:text-[#E4B66F]" />
                <h2 className="text-lg font-extrabold">{t("إعداد فوري لـ Gemini و Claude", "Instant Gemini & Claude Config")}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background p-1">
                {(
                  [
                    ["oauth", "OAuth 2.1"],
                    ["gemini", "Gemini"],
                    ["claude", "Claude"],
                    ["curl", "HTTP"],
                  ] as const
                ).map(([tabId, labelTxt]) => (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => setClientTab(tabId)}
                    className={`min-h-[46px] inline-flex items-center justify-center rounded-lg px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
                      clientTab === tabId
                        ? "bg-[#9A7B4F] dark:bg-[#C89D66] text-[#F7F5F0] dark:text-[#0A0A09]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {labelTxt}
                  </button>
                ))}
              </div>
            </div>
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-2xl border border-border bg-[#0B111E] p-4 font-mono text-xs leading-relaxed text-[#E7EEF9]"
            >
              {activeConfigSnippet}
            </pre>
            <button
              type="button"
              onClick={() => void copyText(activeConfigSnippet, "cfg")}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold hover:border-[#C99750] cursor-pointer"
            >
              {copiedKey === "cfg" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{t("نسخ الإعداد", "Copy Configuration")}</span>
            </button>
          </div>

          <div className="glass-panel rounded-3xl border border-[#C99750]/35 bg-card p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#9A7B4F] dark:text-[#E4B66F]" />
              <h2 className="text-lg font-extrabold">
                {t("برومبت التصميم الأسطوري (انسخه في المحادثة)", "Master Bespoke Design Prompt")}
              </h2>
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              {t(
                "بعد ربط خادم MCP في Gemini أو Claude، الصق هذا التوجيه مع وصف الذوق أو الألوان التي تفضلها ليصمم لك موقعًا جديدًا كليًا:",
                "After adding your MCP config in Gemini or Claude, paste this prompt with your desired vibe or aesthetic:"
              )}
            </p>
            <div className="rounded-2xl border border-border bg-background/80 p-4 text-xs leading-7 text-foreground whitespace-pre-line">
              {masterArchitectPrompt}
            </div>
            <button
              type="button"
              onClick={() => void copyText(masterArchitectPrompt, "prompt")}
              className="min-h-[46px] inline-flex items-center gap-2 rounded-xl bg-[#9A7B4F] dark:bg-[#C89D66] px-4 py-3 text-xs font-extrabold text-[#F7F5F0] dark:text-[#0A0A09] cursor-pointer"
            >
              {copiedKey === "prompt" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{t("نسخ البرومبت الأسطوري", "Copy Architect Prompt")}</span>
            </button>
          </div>
        </div>

        {/* Full Catalog: Tools, Resources & Prompts */}
        <div className="glass-panel rounded-3xl border border-border bg-card p-6 sm:p-7 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#9A7B4F] dark:text-[#E4B66F]" />
              <h2 className="text-xl font-extrabold">
                {t("قدرات MCP المتكاملة (12 أداة + موارد + برومبتات)", "Full MCP Capabilities (12 Tools, Resources & Prompts)")}
              </h2>
            </div>
            <span className="rounded-full border border-[#C99750]/40 bg-[#C99750]/10 px-3 py-1 font-mono text-[11px] font-bold text-[#9A7B4F] dark:text-[#E4B66F]">
              MCP 2025-03-26 • Streamable HTTP
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {toolsCatalog.map(([name, desc]) => (
              <div
                key={name}
                className="rounded-2xl border border-border/70 bg-background/70 p-4 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <code className="text-xs font-bold text-[#9A7B4F] dark:text-[#E4B66F]" dir="ltr">
                  {name}
                </code>
                <p className="mt-1.5 text-xs leading-6 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-border/60">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#9A7B4F] dark:text-[#E4B66F]">
                <Layers3 className="h-4 w-4" />
                <span>{t("موارد MCP الجاهزة (Resources)", "MCP Resources")}</span>
              </div>
              <ul className="space-y-1 text-xs font-mono text-muted-foreground" dir="ltr">
                <li>taqdom://portfolio/{activeUsername}/blueprint</li>
                <li>taqdom://design-system/capabilities</li>
                <li>taqdom://portfolio/{activeUsername}/creative-brief</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#9A7B4F] dark:text-[#E4B66F]">
                <Sparkles className="h-4 w-4" />
                <span>{t("قوالب التوجيه المدمجة (MCP Prompts)", "Built-in MCP Prompts")}</span>
              </div>
              <ul className="space-y-1 text-xs font-mono text-muted-foreground" dir="ltr">
                <li>design-bespoke-portfolio</li>
                <li>architect-case-studies</li>
                <li>rebrand-for-target-role</li>
              </ul>
            </div>
          </div>

          <p className="text-xs leading-6 text-muted-foreground">
            {t(
              "يدعم الخادم الآن OAuth 2.1 التفاعلي مع تسجيل الدخول بحساب Google أو تَقَدُّم (PKCE S256)، والروابط المباشرة الجاهزة، ومفاتيح Bearer المشفرة بـ SHA-256 عبر MCP Streamable HTTP. تظل التعديلات محفوظة في مسودتك الخاصة حتى تطلب النشر عبر publish_portfolio.",
              "Supports interactive OAuth 2.1 browser consent (PKCE S256 with Taqdom or Google Sign-In), pre-authenticated direct URLs, and SHA-256 hashed Bearer tokens over MCP Streamable HTTP. Edits stay private in draft until publish_portfolio is called."
            )}
          </p>
        </div>
      </section>
      <FooterSection />
    </main>
  );
}
