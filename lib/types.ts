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
  links: { label: string; url: string }[];
  projects: PortfolioProject[];
  metrics?: PortfolioMetric[];
  timeline?: PortfolioTimelineItem[];
  theme: PortfolioTheme;
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
