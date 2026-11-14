export type TemplateId =
  | "madar"
  | "athar"
  | "haven"
  | "siyada"
  | "wameed"
  | "salam"
  | "meshwar";

export const ALL_TEMPLATE_IDS: TemplateId[] = [
  "madar",
  "athar",
  "haven",
  "siyada",
  "wameed",
  "salam",
  "meshwar",
];

export type BilingualText = {
  ar: string;
  en: string;
};

export type PortfolioProject = {
  id: string;
  title: BilingualText;
  desc: BilingualText;
  year: string;
  images: string[];
  tags: string[];
  url?: string;
  client?: BilingualText;
  metrics?: string;
};

export type Scene3DSettings = {
  enabled: boolean;
  intensity: number;
  speed: number;
  lightAngle: number;
};

export type PortfolioTheme = {
  mode: "light" | "dark" | "auto";
  accent: string;
  scene3d: Scene3DSettings;
};

export type CanvasSectionId = "hero" | "metrics" | "skills" | "projects" | "timeline" | "contact";

export type CanvasSectionLayout = {
  x: number;
  y: number;
  width: number;
  scale: number;
  hidden?: boolean;
};

export type PortfolioCanvasSettings = {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundOverlay?: number;
  backgroundPosition?: "center" | "top" | "bottom";
  backgroundSize?: "cover" | "contain";
  sections?: Partial<Record<CanvasSectionId, CanvasSectionLayout>>;
};

export type PortfolioSEO = {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string[];
  noindex?: boolean;
};

export type PortfolioMetric = {
  label: BilingualText;
  value: string;
};

export type PortfolioTimelineItem = {
  year: string;
  role: BilingualText;
  org: BilingualText;
  summary: BilingualText;
};

export type CustomPortfolioPalette = {
  background: string;
  surface: string;
  surfaceAlt?: string;
  text: string;
  muted: string;
  accent: string;
  accentSecondary?: string;
  accentText?: string;
  border?: string;
  heroGradient?: string;
};

export type CustomPortfolioTypography = {
  headingStyle: "display" | "editorial-serif" | "technical-mono" | "geometric";
  bodyStyle?: "sans" | "serif" | "mono";
  scale?: "compact" | "balanced" | "bold";
  headingFontHint?: string;
  bodyFontHint?: string;
};

export type CustomPortfolioLayout = {
  heroVariant:
    | "agency-spotlight"
    | "split-showcase"
    | "centered-monolith"
    | "asymmetric-editorial"
    | "terminal-bento"
    | "full-bleed-poster"
    | "minimal-typographic"
    | "cards-mosaic";
  projectGrid:
    | "bento"
    | "masonry"
    | "editorial-rows"
    | "showcase-cards"
    | "minimal-list";
  cardRadius?: "none" | "sm" | "md" | "lg" | "full";
  maxWidth?: "narrow" | "standard" | "wide";
  showNav?: boolean;
  navStyle?: "floating-glass" | "minimal-top" | "split-editorial";
  sectionOrder?: CanvasSectionId[];
};

export type CustomPortfolioEffects = {
  ambientGlow?: boolean;
  glassBlur?: boolean;
  gridPattern?: "none" | "dots" | "lines" | "radial";
  hoverLift?: "subtle" | "magnetic" | "sharp";
  borderStyle?: "hairline" | "glow" | "brutalist" | "none";
};

export type CustomPortfolioCta = {
  primaryLabel?: BilingualText;
  primaryUrl?: string;
  secondaryLabel?: BilingualText;
  secondaryUrl?: string;
};

export type CustomPortfolioSectionItem = {
  title: BilingualText;
  description?: BilingualText;
  badge?: string;
  value?: string;
  url?: string;
  image?: string;
  avatar?: string;
  role?: BilingualText;
};

export type CustomPortfolioSection = {
  id: string;
  kind: "richtext" | "cards" | "stats" | "faq" | "quote" | "cta" | "timeline" | "testimonials" | "gallery" | "html";
  title: BilingualText;
  subtitle?: BilingualText;
  content?: BilingualText;
  image?: string;
  html?: BilingualText;
  items?: CustomPortfolioSectionItem[];
};

export type CustomPortfolioDesign = {
  enabled: boolean;
  designName?: string;
  concept?: string;
  brandName?: string;
  brandMonogram?: string;
  heroHeadline?: BilingualText;
  heroSubheadline?: BilingualText;
  heroHighlight?: BilingualText;
  showHeroImage?: boolean;
  showScrollIndicator?: boolean;
  navCta?: { label: BilingualText; url: string };
  customHtml?: BilingualText;
  palette: CustomPortfolioPalette;
  typography?: CustomPortfolioTypography;
  layout?: CustomPortfolioLayout;
  effects?: CustomPortfolioEffects;
  heroCta?: CustomPortfolioCta;
  customSections?: CustomPortfolioSection[];
  tokens?: Record<string, string | number | boolean>;
};

export type PortfolioData = {
  username: string;
  template: TemplateId;
  avatar: string;
  cover: string;
  name: BilingualText;
  title: BilingualText;
  bio: BilingualText;
  city: BilingualText;
  email?: string;
  badge?: BilingualText;
  skills?: string[];
  isFlagshipShowcase?: boolean;
  /** Explicit opt-in to appear in the public Explore directory. Direct published URLs remain public. */
  discoverable?: boolean;
  links: { label: string; url: string }[];
  projects: PortfolioProject[];
  metrics?: PortfolioMetric[];
  timeline?: PortfolioTimelineItem[];
  theme: PortfolioTheme;
  /** Personal background and section layout controls edited in Studio Canvas. */
  canvas?: PortfolioCanvasSettings;
  /** Bespoke full-design token & layout architecture applied via MCP or advanced designer. */
  customDesign?: CustomPortfolioDesign;
  seo: PortfolioSEO;
  defaultLang: "ar" | "en";
  publishedAt?: number;
  updatedAt?: number;
  views?: number;
};

export type TemplateMeta = {
  id: TemplateId;
  slug: TemplateId;
  name: BilingualText;
  tagline: BilingualText;
  persona: BilingualText;
  description: BilingualText;
  heroImage: string;
  galleryImages: string[];
  accentColor: string;
  defaultCreatorUsername: string;
  features: BilingualText[];
};

export const RESERVED_USERNAMES = new Set([
  "www",
  "app",
  "api",
  "admin",
  "studio",
  "auth",
  "oauth",
  "mcp",
  "firebase",
  "well-known",
  "mail",
  "cdn",
  "static",
  "dashboard",
  "blog",
  "help",
  "status",
  "templates",
  "explore",
  "legal",
  "portfolio",
  "root",
  "support",
]);

export function safePortfolioUrl(value: unknown): string {
  const raw = typeof value === "string" ? value.trim().slice(0, 2048) : "";
  if (!raw || raw.includes("\n") || raw.includes("\r")) return "#";
  if (/^#[a-z0-9_-]+$/i.test(raw)) return raw;
  if (/^(mailto:|tel:)/i.test(raw)) return raw;
  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) {
    if (/^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[:/].*)?$/i.test(candidate)) candidate = "https://" + candidate;
    else return "#";
  }
  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) return "#";
    return parsed.toString();
  } catch {
    return "#";
  }
}

export function normalizeUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 30);
}

export function validateUsername(raw: string): {
  valid: boolean;
  normalized: string;
  reasonAr?: string;
  reasonEn?: string;
} {
  const normalized = raw.trim().toLowerCase();
  if (normalized.length < 3) {
    return {
      valid: false,
      normalized,
      reasonAr: "يجب أن يتكون الاسم من ٣ أحرف على الأقل",
      reasonEn: "Username must be at least 3 characters",
    };
  }
  if (normalized.length > 30) {
    return {
      valid: false,
      normalized,
      reasonAr: "الحد الأقصى ٣٠ حرفاً",
      reasonEn: "Maximum 30 characters allowed",
    };
  }
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      reasonAr: "يُسمح بالحروف الإنجليزية الصغيرة والأرقام والشرطة (-) فقط",
      reasonEn: "Only lowercase letters (a-z), numbers (0-9), and hyphens (-) allowed",
    };
  }
  if (normalized.startsWith("-") || normalized.endsWith("-")) {
    return {
      valid: false,
      normalized,
      reasonAr: "لا يمكن أن يبدأ أو ينتهي الاسم بشرطة",
      reasonEn: "Cannot start or end with a hyphen",
    };
  }
  if (RESERVED_USERNAMES.has(normalized)) {
    return {
      valid: false,
      normalized,
      reasonAr: "هذا النطاق محجوز للنظام",
      reasonEn: "This subdomain is reserved by the system",
    };
  }
  return { valid: true, normalized };
}

export function getSubdomainUrl(username: string, currentHost?: string): string {
  const clean = normalizeUsername(username) || "layla";
  if (currentHost) {
    const h = currentHost.toLowerCase();
    if (h.includes("localhost")) {
      const port = h.includes(":") ? h.split(":")[1] : "3000";
      return `http://${clean}.localhost:${port}`;
    }
    if (h.includes("lvh.me")) {
      const port = h.includes(":") ? h.split(":")[1] : "3000";
      return `http://${clean}.lvh.me:${port}`;
    }
  }
  return `https://${clean}.taqdom.me`;
}

export function formatStandalonePortfolioTitle(
  portfolio: Pick<PortfolioData, "name" | "title" | "seo" | "username"> | null | undefined,
  fallbackUsername: string
): string {
  const fallback =
    portfolio?.name?.ar || portfolio?.name?.en || fallbackUsername || "Portfolio";
  const sub = portfolio?.title?.ar || portfolio?.title?.en || "";
  const raw = portfolio?.seo?.title || (sub ? `${fallback} — ${sub}` : fallback);
  const cleaned = raw
    .replace(/\s*(?:—\s*تَقَدُّم\s*\|\s*Taqdom|\|\s*تَقَدُّم|\|\s*Taqdom|—\s*تَقَدُّم)\s*$/gi, "")
    .trim();
  return cleaned || fallback;
}

export function formatStandalonePortfolioDescription(
  portfolio: Pick<PortfolioData, "bio" | "seo"> | null | undefined
): string {
  const fallback = [portfolio?.bio?.ar, portfolio?.bio?.en].filter(Boolean).join(" — ");
  const raw = String(portfolio?.seo?.description || "").trim();
  if (!raw) return fallback;
  if (/بقالب\s+.*على\s+منصة\s+تَقَدُّم|على\s+منصة\s+تَقَدُّم|\bon\s+Taqdom\b/i.test(raw)) {
    return fallback || raw.replace(/\s*(?:بقالب\s+[^.]*\s*)?(?:على\s+منصة\s+تَقَدُّم|on\s+Taqdom)\.?\s*$/gi, "").trim();
  }
  return raw;
}
