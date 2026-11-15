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
  ImagePlus,
  KeyRound,
  Layers3,
  Palette,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Upload,
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

type ClientTab = "oauth" | "gemini" | "claude" | "chatgpt" | "curl";

type MediaAsset = {
  key: string;
  mime: string;
  size: number;
  url: string;
  fullUrl: string;
  label?: string;
  alt?: string;
  slot?: string;
  usedIn?: string[];
  createdAt?: number;
};

function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

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
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaLabel, setMediaLabel] = useState("");
  const [deletingMediaKey, setDeletingMediaKey] = useState<string | null>(null);

  const activeUsername = user?.username || draft?.username || sessionUsername || "yourname";
  const endpointUrl = created?.connection?.endpoint || `https://taqdom.me/mcp/${activeUsername}`;
  const oauthEndpointUrl = "https://taqdom.me/mcp";
  const tokenDisplay = created?.token || "tqd_mcp_YOUR_GENERATED_TOKEN";
  const directUrlDisplay =
    created?.connection?.directUrl || `${endpointUrl}?token=${tokenDisplay}`;

  const refreshMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      const mediaRes = await fetch("/api/media", { cache: "no-store" });
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json().catch(() => null);
        setMediaAssets(Array.isArray(mediaData?.images) ? mediaData.images : []);
      }
    } catch {
      // ignore transient load failure
    } finally {
      setMediaLoading(false);
    }
  }, []);

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
          setMediaAssets([]);
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
      void refreshMedia();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("حدث خطأ", "An error occurred"));
    } finally {
      setLoading(false);
    }
  }, [refreshMedia, router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUploadPhotos = async (fileList: FileList | null) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (isDemoSession) {
      toast.info(t("حساب المعاينة للعرض فقط.", "The demo account is read-only."));
      return;
    }
    setMediaUploading(true);
    let totalUploaded = 0;
    try {
      const BATCH = 10;
      for (let i = 0; i < files.length; i += BATCH) {
        const slice = files.slice(i, i + BATCH);
        const formData = new FormData();
        if (mediaLabel.trim()) formData.append("label", mediaLabel.trim());
        for (const f of slice) {
          if (f.size <= 0 || f.size > 20_000_000) {
            throw new Error(t(`الصورة ${f.name} تتجاوز الحد الأقصى 20 ميجابايت.`, `${f.name} exceeds the 20MB limit.`));
          }
          formData.append("files", f);
        }
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok || !payload?.ok) {
          throw new Error(payload?.error || t("تعذر رفع الصور.", "Could not upload photos."));
        }
        totalUploaded += Number(payload.count || 1);
      }
      setMediaLabel("");
      await refreshMedia();
      toast.success(
        totalUploaded === 1
          ? t("تم رفع الصورة بنجاح وأصبحت جاهزة للاستخدام في ChatGPT و Claude و Gemini.", "Photo uploaded and ready for ChatGPT, Claude & Gemini.")
          : t(`تم رفع ${totalUploaded} صور بنجاح وأصبحت جاهزة للذكاء الاصطناعي.`, `${totalUploaded} photos uploaded and ready for AI placement.`)
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("حدث خطأ أثناء رفع الصور.", "Failed to upload images."));
    } finally {
      setMediaUploading(false);
    }
  };

  const handleDeletePhoto = async (key: string) => {
    if (isDemoSession) return;
    setDeletingMediaKey(key);
    try {
      const res = await fetch(`/api/media/${encodeURIComponent(key)}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || t("تعذر حذف الصورة.", "Could not delete image."));
      }
      setMediaAssets((prev) => prev.filter((it) => it.key !== key));
      toast.success(t("تم حذف الصورة من المكتبة.", "Image removed from library."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("تعذر حذف الصورة.", "Could not delete image."));
    } finally {
      setDeletingMediaKey(null);
    }
  };

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
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      toast.success(t("تم النسخ إلى الحافظة", "Copied to clipboard"));
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      toast.error(t("تعذر النسخ التلقائي — انسخ النص يدوياً", "Clipboard unavailable — copy manually"));
    }
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

  const chatgptSnippet = JSON.stringify(
    {
      mcpServerUrl: oauthEndpointUrl,
      openApiSchemaUrl: "https://taqdom.me/openapi.json",
      aiPluginManifest: "https://taqdom.me/.well-known/ai-plugin.json",
      uploadMediaEndpoint: "https://taqdom.me/api/upload",
      mediaLibraryEndpoint: "https://taqdom.me/api/media",
      authentication: {
        type: "OAuth 2.1 or Bearer",
        authorizationUrl: "https://taqdom.me/oauth/authorize",
        tokenUrl: "https://taqdom.me/oauth/token",
        bearerToken: tokenDisplay,
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
      : clientTab === "chatgpt"
      ? chatgptSnippet
      : curlSnippet;

  const masterArchitectPrompt = t(
    `أنت مصمم مواقع ومهندس واجهات عالمي (Art Director & Creative Technologist). اتصل بمعرضي عبر خادم Taqdom MCP، واقرأ بياناتي والصور المرفوعة مسبقاً عبر get_portfolio_blueprint و list_portfolio_images واكتشف قدرات التصميم المخصص عبر list_templates_and_capabilities.

أريد تصميم بورتفوليو أسطوري وحر بالكامل (100% Freeform Full-Code) غير مقيد بأي قالب جاهز — ومع الحفاظ على أي محتوى أو صور سابقة إلا إذا طلبت تعديلها:
1. استخدم أداة deploy_custom_code_portfolio (أو design_custom_portfolio_theme مع renderMode="full-code") لكتابة كود HTML5 و CSS3 و JavaScript مخصص بالكامل عبر fullPageHtml و customCss و customJs، أو مطابقة أي صورة مرجعية أرفقها لك بنسبة 1:1.
2. ثبّت أي مكتبات أو حزم npm عالمية تحتاجها عبر حقل libraries (مثل: gsap، و gsap/ScrollTrigger، و three، و tailwindcss، و lucide، و animejs، و lenis، أو أي حزمة npm عبر esm.sh) مع خطوط Google Fonts.
3. للصور الحقيقية (وليس كود <svg> بديل!): استخدم list_portfolio_images لاكتشاف الصور المرفوعة في حسابي، أو ارفع أي عدد من الصور عبر POST /api/upload (ثنائي multipart / binary / openaiFileIdRefs) أو upload_portfolio_images / upload_portfolio_image (حتى عبر chunks للصور الكبيرة)، وضع أي صورة في أي مكان (avatar، cover، backgroundImage، project، gallery، customSection، أو replaceTarget داخل fullPageHtml) باستخدام place_portfolio_image دون مسح التصميم الحالي.
4. حدّث بياناتي ومشاريعي ومهاراتي عبر update_portfolio_content و create_project/update_project، ثم انشر الموقع مباشرة عبر publish_portfolio ليظهر على https://${activeUsername}.taqdom.me.`,
    `You are an elite Art Director & Creative Technologist. Connect to my Taqdom MCP server, inspect my current draft via get_portfolio_blueprint, list already-uploaded real photos via list_portfolio_images, and check list_templates_and_capabilities.

Build or upgrade a 100% freeform, world-class personal portfolio while preserving existing sections and media unless explicitly asked to replace them:
1. Use deploy_custom_code_portfolio (or design_custom_portfolio_theme with renderMode="full-code") to write bespoke HTML5, CSS3, SVG, Canvas/WebGL, and JavaScript via fullPageHtml, customCss, and customJs — or clone any reference image I upload 1:1.
2. Install any external libraries or npm packages via libraries/install_portfolio_libraries (e.g., gsap, gsap/ScrollTrigger, three, tailwindcss, lucide, animejs, lenis, chart.js, d3, or any npm package loaded via esm.sh) and googleFonts.
3. Use REAL hosted images (never fake placeholder <svg> illustrations): check list_portfolio_images first, upload any count of real binary photos via POST /api/upload (multipart/raw binary/openaiFileIdRefs), upload_portfolio_images batch, or chunked upload_portfolio_image (up to 20MB per image), and place any photo anywhere (avatar, cover, backgroundImage, project, gallery, customSection, or replaceTarget in fullPageHtml) using place_portfolio_image without wiping existing work.
4. Sync my bilingual profile, projects, skills, and timeline via update_portfolio_content and create_project/update_project, then publish live to https://${activeUsername}.taqdom.me using publish_portfolio.`
  );

  const toolsCatalog = [
    ["list_portfolio_images", t("استعراض كل الصور الحقيقية المرفوعة في حسابك مع روابطها وأماكن استخدامها", "List all real uploaded photos in your library with hosted URLs and placements")],
    ["upload_portfolio_image", t("رفع صورة حقيقية (PNG/JPG/WebP/GIF/AVIF/SVG حتى 20MB) بالرابط أو Base64 أو Chunked ووضعها في أي مكان", "Upload real image (url, base64, chunked up to 20MB) and place into any slot or HTML")],
    ["upload_portfolio_images", t("رفع دفعة من عدة صور حقيقية في طلب واحد دون قيود عددية على المعرض", "Batch-upload multiple real photos in one call with unlimited portfolio library storage")],
    ["place_portfolio_image", t("وضع أي صورة مرفوعة في صورة الحساب أو الغلاف أو المشاريع أو المعرض أو داخل HTML دون مسح أي محتوى", "Place any uploaded image into avatar, cover, background, project, gallery, customSection, or HTML non-destructively")],
    ["delete_portfolio_image", t("حذف صورة محددة من مكتبة الوسائط المملوكة للحساب", "Delete an uploaded image from your account media library")],
    ["deploy_custom_code_portfolio", t("بناء أي تصميم عالمي حر بالكامل (HTML/CSS/JS/WebGL حتى 6MB+ لكل لغة) بدون أي قوالب", "Deploy 100% freeform HTML5/CSS3/JS/WebGL portfolio (up to 6MB+ per language) with zero template limits")],
    ["install_portfolio_libraries", t("تثبيت أي مكتبة خارجية أو حزمة npm (GSAP, Three.js, Tailwind, Lucide...)", "Install external libraries & npm packages (GSAP, Three.js, Tailwind, esm.sh)")],
    ["design_custom_portfolio_theme", t("تصميم ثيم وتخطيط وأقسام مخصصة بالكامل (Full-Code أو Bespoke Components)", "Design bespoke full-code or parameterized portfolio themes beyond presets")],
    ["get_portfolio_blueprint", t("قراءة المخطط الكامل للمعرض والصور المرفوعة وقدرات التصميم", "Inspect full portfolio blueprint, uploadedImages & publication status")],
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
              "الاتصال يتيح القراءة والكتابة على مسودة حسابك فقط، بما يشمل تصميم ثيمات وأقسام مخصصة عبر design_custom_portfolio_theme وتعديل المحتوى والمشاريع. النشر العام لا يحدث تلقائيًا؛ بل يتطلب استدعاء أداة publish_portfolio صراحةً ليظهر موقعك المستقل دون أي علامات مزعجة. كل مفتاح مشفر ومعزول بحسابك، ويمكنك إلغاؤه في أي لحظة.",
              "Tokens grant read/write access strictly to your own account draft, including custom design tools and bilingual content editing. Public changes remain private until publish_portfolio is explicitly called. Tokens are cryptographically secured and revocable at any instant."
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
                  "يمكنك إنشاء حتى 100 مفتاح نشط، لكل أداة ذكاء اصطناعي مفتاحها المستقل.",
                  "Up to 100 active connections per account so you can isolate Gemini, Claude, and custom agents."
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

        {/* AI Real Photo Library */}
        <div
          data-testid="mcp-media-library"
          className="glass-panel rounded-3xl border border-border bg-card p-6 sm:p-7 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-[#9A7B4F] dark:text-[#E4B66F]" />
                <h2 className="text-lg font-extrabold">
                  {t(
                    "مكتبة الصور الحقيقية للذكاء الاصطناعي (رفع عدد غير محدود)",
                    "AI Real Photo Library (Unlimited Multi-Image Upload)"
                  )}
                </h2>
              </div>
              <p className="text-xs leading-6 text-muted-foreground">
                {t(
                  "ارفع صورك الشخصية وصور المشاريع والخلفيات هنا مباشرة (JPG, PNG, WebP, GIF, AVIF, SVG حتى 20MB للصورة) — يقرأها ChatGPT و Claude و Gemini تلقائياً عبر list_portfolio_images ويضعها في أي مكان داخل تصميمك دون كتابة كود بديل.",
                  "Upload portrait, project screenshots, and backgrounds directly here (JPG, PNG, WebP, GIF, AVIF, SVG up to 20MB each). ChatGPT, Claude & Gemini automatically discover them via list_portfolio_images and place them anywhere in your portfolio."
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refreshMedia()}
              disabled={mediaLoading}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold hover:border-[#9A7B4F] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${mediaLoading ? "animate-spin" : ""}`} />
              <span>{t("تحديث المكتبة", "Refresh Library")}</span>
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end">
            <div>
              <label htmlFor="mcp-media-label" className="block text-xs font-bold mb-1.5">
                {t("تسمية اختيارية لهذه الدفعة (مثلاً: portrait أو hero أو project-saudi)", "Optional label for this upload (e.g. portrait, hero, project-saudi)")}
              </label>
              <input
                id="mcp-media-label"
                value={mediaLabel}
                onChange={(e) => setMediaLabel(e.target.value)}
                disabled={isDemoSession || mediaUploading}
                placeholder={t("مثال: صورتي الشخصية الرسمية", "e.g. Formal Founder Portrait")}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[#9A7B4F]"
              />
            </div>

            <label
              className={`min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A7B4F] dark:bg-[#C89D66] px-5 py-3 text-sm font-extrabold text-[#F7F5F0] dark:text-[#0A0A09] shadow-sm transition cursor-pointer ${
                isDemoSession || mediaUploading ? "opacity-50 pointer-events-none" : "hover:opacity-95"
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>
                {mediaUploading
                  ? t("جاري رفع الصور...", "Uploading photos...")
                  : t("رفع صورة أو عدة صور حقيقية", "Upload Photo(s)")}
              </span>
              <input
                type="file"
                multiple
                accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.svg"
                data-testid="mcp-media-upload-input"
                className="hidden"
                disabled={isDemoSession || mediaUploading}
                onChange={(e) => {
                  const fl = e.target.files;
                  void handleUploadPhotos(fl).finally(() => {
                    e.target.value = "";
                  });
                }}
              />
            </label>
          </div>

          {mediaAssets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center text-xs text-muted-foreground">
              {mediaLoading
                ? t("جاري تحميل صورك المرفوعة...", "Loading uploaded photos...")
                : t(
                    "لا توجد صور مرفوعة بعد — اضغط «رفع صورة أو عدة صور حقيقية» لإضافة أي عدد من صورك.",
                    "No uploaded images yet — click Upload Photo(s) to add any number of real images."
                  )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mediaAssets.map((asset) => (
                <div
                  key={asset.key}
                  data-testid="mcp-media-card"
                  className="rounded-2xl border border-border bg-background/80 p-3 flex flex-col gap-2.5"
                >
                  <div className="relative h-36 w-full overflow-hidden rounded-xl border border-border/60 bg-secondary/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url}
                      alt={asset.alt || asset.label || asset.key}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs font-bold">
                      <span className="truncate">{asset.label || asset.key}</span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground" dir="ltr">
                        {formatFileSize(asset.size)}
                      </span>
                    </div>
                    <p className="truncate font-mono text-[11px] text-muted-foreground" dir="ltr">
                      {asset.fullUrl}
                    </p>
                    {asset.usedIn && asset.usedIn.length > 0 && (
                      <p className="text-[11px] text-[#9A7B4F] dark:text-[#E4B66F] truncate">
                        {t(`مستخدمة في: ${asset.usedIn.join(", ")}`, `Used in: ${asset.usedIn.join(", ")}`)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => void copyText(asset.fullUrl, `media-${asset.key}`)}
                      className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold hover:border-[#9A7B4F] cursor-pointer"
                    >
                      {copiedKey === `media-${asset.key}` ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{t("نسخ الرابط", "Copy URL")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeletePhoto(asset.key)}
                      disabled={isDemoSession || deletingMediaKey === asset.key}
                      aria-label={`Delete ${asset.key}`}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 px-3 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ready-to-Use Client Integration Snippets + Architect Master Prompt */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-3xl border border-border bg-card p-6 sm:p-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-[#9A7B4F] dark:text-[#E4B66F]" />
                <h2 className="text-lg font-extrabold">{t("إعداد فوري لـ Gemini و Claude و ChatGPT", "Instant Gemini, Claude & ChatGPT Config")}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background p-1">
                {(
                  [
                    ["oauth", "OAuth 2.1"],
                    ["gemini", "Gemini"],
                    ["claude", "Claude"],
                    ["chatgpt", "ChatGPT"],
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
                {t(
                  `قدرات MCP المتكاملة (${toolsCatalog.length} أداة + موارد + برومبتات)`,
                  `Full MCP Capabilities (${toolsCatalog.length} Tools, Resources & Prompts)`
                )}
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
              "يدعم الخادم الآن OAuth 2.1 التفاعلي مع تسجيل الدخول بحساب Google أو تَقَدُّم، والروابط المباشرة الجاهزة، ومفاتيح الوصول المشفرة والمعزولة عبر MCP Streamable HTTP. تظل التعديلات محفوظة في مسودتك الخاصة حتى تطلب النشر عبر publish_portfolio.",
              "Supports interactive OAuth 2.1 browser consent (with Taqdom or Google Sign-In), pre-authenticated direct URLs, and cryptographically secured Bearer tokens over MCP Streamable HTTP. Edits stay private in draft until publish_portfolio is called."
            )}
          </p>
        </div>
      </section>
      <FooterSection />
    </main>
  );
}
