import { normalizeUsername } from "../lib/types.ts";
import { ensureOAuthSchema, oauthCorsHeaders } from "./oauth.mjs";

const encoder = new TextEncoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...oauthCorsHeaders(),
      ...headers,
    },
  });
}

function hex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function digest(value) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

function randomToken() {
  return "tqd_mcp_" + hex(crypto.getRandomValues(new Uint8Array(32)));
}

async function ensureSchema(env) {
  await ensureOAuthSchema(env);
}

export async function handleMcpTokenApi(request, url, env, session) {
  if (!session?.username || session.isTestAccount) {
    return json({ error: "Authentication required" }, 401);
  }
  if (!env?.DB) return json({ error: "Account storage unavailable" }, 503);
  await ensureSchema(env);
  const username = String(session.username).toLowerCase();
  const userId = String(session.userId || session.id || `user-${username}`);

  if (request.method === "GET") {
    const { results = [] } = await env.DB.prepare(
      "SELECT id, label, created_at, last_used_at, revoked_at FROM mcp_access_tokens WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 30"
    )
      .bind(userId)
      .all();
    return json({ tokens: results });
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const label = String(body.label || "MCP connection").trim().slice(0, 60) || "MCP connection";
    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM mcp_access_tokens WHERE user_id = ?1 AND revoked_at IS NULL"
    )
      .bind(userId)
      .first();
    if (Number(count?.total || 0) >= 10) {
      return json({ error: "Maximum 10 active MCP connections" }, 429);
    }
    const token = randomToken();
    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
      "INSERT INTO mcp_access_tokens (id, user_id, username, token_hash, label, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )
      .bind(id, userId, username, await digest(token), label, now)
      .run();
    return json(
      {
        token,
        connection: {
          id,
          label,
          endpoint: `https://taqdom.me/mcp/${username}`,
          directUrl: `https://taqdom.me/mcp/${username}?token=${token}`,
          created_at: now,
        },
        warning: "Copy this token now. It will not be shown again.",
      },
      201
    );
  }

  if (request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Token id required" }, 400);
    await env.DB.prepare(
      "UPDATE mcp_access_tokens SET revoked_at = ?1 WHERE id = ?2 AND user_id = ?3 AND revoked_at IS NULL"
    )
      .bind(Date.now(), id, userId)
      .run();
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405, { allow: "GET, POST, DELETE" });
}

const TEMPLATE_IDS = ["madar", "athar", "haven", "siyada", "wameed", "salam", "meshwar"];
const CANVAS_SECTIONS = ["hero", "metrics", "skills", "projects", "timeline", "contact"];
const HERO_VARIANTS = [
  "split-showcase",
  "centered-monolith",
  "asymmetric-editorial",
  "terminal-bento",
  "full-bleed-poster",
  "minimal-typographic",
  "cards-mosaic",
];
const PROJECT_GRIDS = ["bento", "masonry", "editorial-rows", "showcase-cards", "minimal-list"];
const HEADING_STYLES = ["display", "editorial-serif", "technical-mono", "geometric"];
const BODY_STYLES = ["sans", "serif", "mono"];
const TYPE_SCALES = ["compact", "balanced", "bold"];
const CARD_RADII = ["none", "sm", "md", "lg", "full"];
const MAX_WIDTHS = ["narrow", "standard", "wide"];
const NAV_STYLES = ["floating-glass", "minimal-top", "split-editorial"];
const GRID_PATTERNS = ["none", "dots", "lines", "radial"];
const HOVER_LIFTS = ["subtle", "magnetic", "sharp"];
const BORDER_STYLES = ["hairline", "glow", "brutalist", "none"];
const CUSTOM_SECTION_KINDS = [
  "richtext",
  "cards",
  "stats",
  "faq",
  "quote",
  "cta",
  "timeline",
  "testimonials",
  "gallery",
];

const TEMPLATE_CATALOG_DETAILS = [
  { id: "madar", name: { ar: "مَدَار", en: "Orbit" }, bestFor: "AI engineers, product builders, technical founders", defaultMode: "dark" },
  { id: "athar", name: { ar: "أَثَر", en: "Frame" }, bestFor: "Creative directors, filmmakers, visual artists", defaultMode: "dark" },
  { id: "haven", name: { ar: "مَلاذ", en: "Forma" }, bestFor: "Architects, interior & spatial designers", defaultMode: "light" },
  { id: "siyada", name: { ar: "سِيَادَة", en: "Index" }, bestFor: "Executives, legal/finance partners, advisors", defaultMode: "light" },
  { id: "wameed", name: { ar: "وَمِيض", en: "Pulse" }, bestFor: "Revenue leaders, B2B growth & sales directors", defaultMode: "dark" },
  { id: "salam", name: { ar: "سَلَام", en: "Flux" }, bestFor: "Product marketers, growth strategists, GTM", defaultMode: "light" },
  { id: "meshwar", name: { ar: "مِشْوَار", en: "Kin" }, bestFor: "Consultants, people leaders, executive coaches", defaultMode: "light" },
];

const DESIGN_CAPABILITIES = {
  builtInTemplates: TEMPLATE_CATALOG_DETAILS,
  bespokeCustomDesignEngine: {
    summary:
      "Set customDesign.enabled=true via design_custom_portfolio_theme to completely bypass built-in templates and render an original, sovereign personal website. Flexible schema: partial palettes auto-derive accessible contrasting surface/text colors, named/rgb/hsl/hex colors are normalized, and layout/section aliases from Gemini or Claude are automatically mapped.",
    heroVariants: HERO_VARIANTS,
    projectGrids: PROJECT_GRIDS,
    typography: { headingStyles: HEADING_STYLES, bodyStyles: BODY_STYLES, scales: TYPE_SCALES },
    cardRadii: CARD_RADII,
    maxWidths: MAX_WIDTHS,
    navStyles: NAV_STYLES,
    effects: { gridPatterns: GRID_PATTERNS, hoverLifts: HOVER_LIFTS, borderStyles: BORDER_STYLES },
    sectionOrderIds: CANVAS_SECTIONS,
    customSectionKinds: CUSTOM_SECTION_KINDS,
    standaloneGuarantee:
      "All published portfolios launch as a 100% standalone personal website at https://<username>.taqdom.me with zero Taqdom chrome, ads, or footer branding.",
  },
};

const BILINGUAL = {
  type: ["object", "string"],
  properties: {
    ar: { type: "string", maxLength: 12000 },
    en: { type: "string", maxLength: 12000 },
  },
  additionalProperties: true,
};

const TOOLS = [
  {
    name: "get_portfolio",
    description: "Read the authenticated account's portfolio draft, publication status, and custom design state.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_profile",
    description: "Read the portfolio owner's profile details and social links.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_projects",
    description: "List projects currently saved in the portfolio.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "update_profile",
    description:
      "Update selected profile fields in the owner's draft. Changes are saved but are not public until publish_portfolio is called.",
    inputSchema: {
      type: "object",
      properties: {
        name: BILINGUAL,
        title: BILINGUAL,
        bio: BILINGUAL,
        city: BILINGUAL,
        skills: { type: "array", maxItems: 100, items: { type: "string", maxLength: 80 } },
        links: {
          type: "array",
          maxItems: 50,
          items: {
            type: "object",
            properties: {
              label: { type: "string", maxLength: 100 },
              url: { type: "string", maxLength: 2048 },
            },
            required: ["label", "url"],
            additionalProperties: false,
          },
        },
        avatar: { type: "string", maxLength: 2048 },
        cover: { type: "string", maxLength: 2048 },
        theme: {
          type: "object",
          properties: {
            mode: { type: "string", enum: ["light", "dark", "auto"] },
            accent: { type: "string", maxLength: 32 },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "create_project",
    description: "Create a project in the owner's draft. The new project is not public until published.",
    inputSchema: {
      type: "object",
      properties: {
        title: BILINGUAL,
        desc: BILINGUAL,
        year: { type: "string", maxLength: 12 },
        tags: { type: "array", maxItems: 30, items: { type: "string", maxLength: 40 } },
        url: { type: "string", maxLength: 2048 },
        client: BILINGUAL,
        metrics: { type: "string", maxLength: 500 },
        images: { type: "array", maxItems: 12, items: { type: "string", maxLength: 2048 } },
      },
      required: ["title", "desc"],
      additionalProperties: false,
    },
  },
  {
    name: "update_project",
    description: "Update an existing project in the owner's draft using its projectId.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", minLength: 1, maxLength: 100 },
        title: BILINGUAL,
        desc: BILINGUAL,
        year: { type: "string", maxLength: 12 },
        tags: { type: "array", maxItems: 30, items: { type: "string", maxLength: 40 } },
        url: { type: "string", maxLength: 2048 },
        client: BILINGUAL,
        metrics: { type: "string", maxLength: 500 },
        images: { type: "array", maxItems: 12, items: { type: "string", maxLength: 2048 } },
      },
      required: ["projectId"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_project",
    description: "Delete one project from the owner's draft using its projectId.",
    inputSchema: {
      type: "object",
      properties: { projectId: { type: "string", minLength: 1, maxLength: 100 } },
      required: ["projectId"],
      additionalProperties: false,
    },
  },
  {
    name: "publish_portfolio",
    description:
      "Publish the current draft (including custom design & sections) live to the owner's standalone Taqdom site. Explicit action only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_portfolio_blueprint",
    description:
      "Inspect the complete creative blueprint of the owner's portfolio draft plus supported custom design capabilities and schema constraints.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_templates_and_capabilities",
    description:
      "List all 7 built-in archetypes and the full custom design specification (palettes, hero layouts, grids, typography, effects, custom sections) so you can craft an original site beyond preset templates.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "update_portfolio_content",
    description:
      "Batch-update draft portfolio content including bilingual identity, badge, skills, links, metrics, career timeline, SEO, discoverability, defaultLang, and base template. Optionally set publish=true to publish right after updating.",
    inputSchema: {
      type: "object",
      properties: {
        template: { type: "string" },
        defaultLang: { type: "string", enum: ["ar", "en"] },
        discoverable: { type: "boolean" },
        publish: { type: "boolean" },
        name: BILINGUAL,
        title: BILINGUAL,
        bio: BILINGUAL,
        city: BILINGUAL,
        badge: BILINGUAL,
        skills: { type: "array", maxItems: 100, items: { type: "string", maxLength: 80 } },
        links: {
          type: "array",
          maxItems: 50,
          items: {
            type: "object",
            properties: {
              label: { type: "string", maxLength: 100 },
              url: { type: "string", maxLength: 2048 },
            },
            required: ["label", "url"],
            additionalProperties: true,
          },
        },
        metrics: {
          type: "array",
          maxItems: 12,
          items: {
            type: "object",
            properties: { label: BILINGUAL, value: { type: "string", maxLength: 80 } },
            required: ["label", "value"],
            additionalProperties: true,
          },
        },
        timeline: {
          type: "array",
          maxItems: 25,
          items: {
            type: "object",
            properties: {
              year: { type: "string", maxLength: 32 },
              role: BILINGUAL,
              org: BILINGUAL,
              summary: BILINGUAL,
            },
            additionalProperties: true,
          },
        },
        seo: {
          type: "object",
          properties: {
            title: { type: "string", maxLength: 180 },
            description: { type: "string", maxLength: 400 },
            keywords: { type: "array", maxItems: 30, items: { type: "string", maxLength: 60 } },
            noindex: { type: "boolean" },
          },
          additionalProperties: true,
        },
        avatar: { type: "string", maxLength: 2048 },
        cover: { type: "string", maxLength: 2048 },
        theme: { type: "object", additionalProperties: true },
      },
      additionalProperties: false,
    },
  },
  {
    name: "design_custom_portfolio_theme",
    description:
      "Design and apply a completely bespoke portfolio look and layout (even if completely different from preset templates). Flexible input: accepts hex/rgb/hsl/named colors, partial palettes (missing text/surface colors auto-derive cleanly with WCAG contrast), custom typography, any heroVariant (split-showcase, centered-monolith, asymmetric-editorial, terminal-bento, full-bleed-poster, minimal-typographic, cards-mosaic) or projectGrid, visual effects, heroCta, sectionOrder, and rich customSections (cards, stats, faq, quote, richtext, cta, timeline, testimonials, gallery). Pass enabled=false to revert to a preset template.",
    inputSchema: {
      type: "object",
      properties: {
        enabled: { type: "boolean" },
        publish: { type: "boolean" },
        fallbackTemplate: { type: "string" },
        designName: { type: "string", maxLength: 120 },
        concept: { type: "string", maxLength: 500 },
        palette: { type: "object", additionalProperties: true },
        colors: { type: "object", additionalProperties: true },
        theme: { type: "object", additionalProperties: true },
        typography: { type: "object", additionalProperties: true },
        fonts: { type: "object", additionalProperties: true },
        layout: { type: "object", additionalProperties: true },
        structure: { type: "object", additionalProperties: true },
        effects: { type: "object", additionalProperties: true },
        heroCta: { type: "object", additionalProperties: true },
        cta: { type: "object", additionalProperties: true },
        customSections: { type: "array", maxItems: 12, items: { type: ["object", "string"], additionalProperties: true } },
        sections: { type: "array", maxItems: 12, items: { type: ["object", "string"], additionalProperties: true } },
        tokens: { type: "object", additionalProperties: true },
      },
      additionalProperties: true,
    },
  },
];

const PROMPTS = [
  {
    name: "design-bespoke-portfolio",
    description:
      "Act as an elite Art Director & Frontend Architect to design a 100% bespoke, original portfolio on Taqdom (outside any preset template) and optionally publish it.",
    arguments: [
      {
        name: "aesthetic_vibe",
        description:
          "Desired aesthetic direction (e.g., Swiss Brutalist, Obsidian Editorial, Cyber Glass, Botanical Minimal)",
        required: false,
      },
      { name: "primary_language", description: "ar or en", required: false },
    ],
  },
  {
    name: "architect-case-studies",
    description:
      "Transform existing portfolio projects into crisp, impact-driven bilingual case studies with measurable outcomes.",
    arguments: [
      {
        name: "target_audience",
        description: "Recruiters, startup founders, enterprise clients, etc.",
        required: false,
      },
    ],
  },
  {
    name: "rebrand-for-target-role",
    description:
      "Reposition the portfolio headline, bio, skills, metrics, timeline, and custom design system for a specific target role.",
    arguments: [
      { name: "target_role", description: "Target job title or positioning", required: true },
    ],
  },
];

function toolResult(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

function toolError(message) {
  return { content: [{ type: "text", text: String(message) }], isError: true };
}

function bilingual(value, fieldName) {
  if (typeof value === "string") {
    return { ar: value.slice(0, 12000), en: value.slice(0, 12000) };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid ${fieldName}: expected text or {ar,en}.`);
  }
  const ar = value.ar ?? value.arabic ?? value.text ?? value.title ?? value.en ?? value.english ?? "";
  const en = value.en ?? value.english ?? value.text ?? value.title ?? value.ar ?? value.arabic ?? "";
  return {
    ar: String(ar).slice(0, 12000),
    en: String(en).slice(0, 12000),
  };
}

function safeUrl(value, { allowMail = false, allowLocal = false, allowHash = false } = {}) {
  const raw = String(value || "").trim().slice(0, 2048);
  if (!raw) return "";
  if (allowHash && /^#[a-z0-9_-]{1,64}$/i.test(raw)) return raw;
  if (allowLocal && /^\/(?!\/)[a-z0-9/_ .%-]*$/i.test(raw)) return raw;
  if (allowMail && /^(mailto:|tel:)[^\s]+$/i.test(raw)) return raw;
  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) candidate = "https://" + candidate;
  const parsed = new URL(candidate);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error("Only safe http(s) URLs are accepted.");
  }
  return parsed.toString();
}

const NAMED_COLORS = {
  black: "#090A0F",
  white: "#FFFFFF",
  ivory: "#FAF8F3",
  cream: "#F6F1E7",
  pearl: "#F3F4F6",
  sand: "#EAE2D3",
  obsidian: "#0B0D14",
  midnight: "#0E1322",
  charcoal: "#181A1F",
  slate: "#1E293B",
  zinc: "#27272A",
  silver: "#CBD5E1",
  gold: "#D4AF37",
  amber: "#F59E0B",
  bronze: "#C89D66",
  copper: "#B87333",
  emerald: "#10B981",
  mint: "#34D399",
  forest: "#0F3D2E",
  teal: "#14B8A6",
  cyan: "#06B6D4",
  sky: "#38BDF8",
  blue: "#3B82F6",
  cobalt: "#315BFF",
  navy: "#0F172A",
  indigo: "#6366F1",
  violet: "#8B5CF6",
  purple: "#9333EA",
  rose: "#F43F5E",
  crimson: "#DC2626",
  coral: "#FB7185",
  orange: "#F97316",
  terracotta: "#C2593F",
  olive: "#556B2F",
  gray: "#64748B",
  grey: "#64748B",
};

function rgbToHex(r, g, b) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)].map((c) => c.toString(16).padStart(2, "0")).join("")
  );
}

function hslToHex(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const lit = Math.max(0, Math.min(100, l)) / 100;
  const k = (n) => (n + hue / 30) % 12;
  const a = sat * Math.min(lit, 1 - lit);
  const f = (n) => lit - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(255 * f(0), 255 * f(8), 255 * f(4));
}

function parseHexLuminance(hexColor) {
  const clean = String(hexColor || "").trim().replace(/^#/, "");
  let r = 128;
  let g = 128;
  let b = 128;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length >= 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  }
  const toLin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function safeColorValue(value, fieldName) {
  const raw = String(value || "").trim();
  if (!raw || raw.length > 64) {
    throw new Error(`Invalid color for ${fieldName}: value is missing or too long.`);
  }
  if (/javascript:|expression\s*\(|url\s*\(|;|<|>/i.test(raw)) {
    throw new Error(`Invalid hex color for ${fieldName}: unsafe expression rejected.`);
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) {
    return raw;
  }
  const lower = raw.toLowerCase();
  if (NAMED_COLORS[lower]) {
    return NAMED_COLORS[lower];
  }
  const rgbMatch = raw.match(
    /^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})(?:\s*[,/]\s*(?:0|1|0?\.\d+))?\s*\)$/i
  );
  if (rgbMatch) {
    return rgbToHex(Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3]));
  }
  const hslMatch = raw.match(
    /^hsla?\(\s*(-?\d+(?:\.\d+)?)(?:deg)?\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)%\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)%(?:\s*[,/]\s*(?:0|1|0?\.\d+))?\s*\)$/i
  );
  if (hslMatch) {
    return hslToHex(Number(hslMatch[1]), Number(hslMatch[2]), Number(hslMatch[3]));
  }
  throw new Error(
    `Invalid hex color for ${fieldName}: expected #RGB, #RRGGBB, rgb(), hsl(), or standard color name.`
  );
}

function safeBorderColor(value) {
  const raw = String(value || "").trim().slice(0, 40);
  if (!raw) return undefined;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) return raw;
  if (
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(raw)
  ) {
    return raw;
  }
  if (NAMED_COLORS[raw.toLowerCase()]) return NAMED_COLORS[raw.toLowerCase()];
  throw new Error("Invalid border color: use hex, rgb(a), or standard color name.");
}

function safeCssGradient(value) {
  if (!value) return undefined;
  const raw = String(value).trim().slice(0, 400);
  if (/url\s*\(|expression\s*\(|;|<|>|script|import/i.test(raw)) {
    throw new Error("Unsafe CSS gradient expression rejected.");
  }
  if (!/^(linear-gradient|radial-gradient|conic-gradient)\([a-z0-9#(),.%\s+-]+\)$/i.test(raw)) {
    throw new Error("Invalid CSS gradient syntax for heroGradient.");
  }
  return raw;
}

function mapHeroVariant(raw) {
  const val = String(raw || "").trim().toLowerCase();
  if (HERO_VARIANTS.includes(val)) return val;
  if (/minimal|typo|clean|stark/.test(val)) return "minimal-typographic";
  if (/mosaic|collage|tile|showcase-grid/.test(val)) return "cards-mosaic";
  if (/center|mono|spotlight|single/.test(val)) return "centered-monolith";
  if (/asym|editor|mag|journal/.test(val)) return "asymmetric-editorial";
  if (/term|bento|dev|code|cyber|tech/.test(val)) return "terminal-bento";
  if (/full|poster|bleed|cinema|hero-img/.test(val)) return "full-bleed-poster";
  return "split-showcase";
}

function mapProjectGrid(raw) {
  const val = String(raw || "").trim().toLowerCase();
  if (PROJECT_GRIDS.includes(val)) return val;
  if (/bento/.test(val)) return "bento";
  if (/mason/.test(val)) return "masonry";
  if (/row|editorial|strip/.test(val)) return "editorial-rows";
  if (/list|minimal|table|index/.test(val)) return "minimal-list";
  return "showcase-cards";
}

function mapHeadingStyle(raw) {
  const val = String(raw || "").trim().toLowerCase();
  if (HEADING_STYLES.includes(val)) return val;
  if (/serif|classic|editorial|playfair|instrument|amiri/.test(val)) return "editorial-serif";
  if (/mono|code|tech|term|jetbrains|ibm/.test(val)) return "technical-mono";
  if (/geo|sans|grotesk|modern|inter|jakarta/.test(val)) return "geometric";
  return "display";
}

function mapSectionKind(raw) {
  const val = String(raw || "").trim().toLowerCase();
  if (CUSTOM_SECTION_KINDS.includes(val)) return val;
  if (/text|markdown|about|story|essay|bio|note/.test(val)) return "richtext";
  if (/stat|metric|kpi|number|impact/.test(val)) return "stats";
  if (/faq|question|qa/.test(val)) return "faq";
  if (/quote|manifesto|epigraph/.test(val)) return "quote";
  if (/cta|action|book|contact|banner/.test(val)) return "cta";
  if (/time|career|history|journey|exp/.test(val)) return "timeline";
  if (/testi|review|endorse|client/.test(val)) return "testimonials";
  if (/gall|photo|media|shot/.test(val)) return "gallery";
  return "cards";
}

function validateAndSanitizeCustomDesign(rawArgs, existingDesign = null) {
  const args =
    rawArgs && typeof rawArgs === "object"
      ? rawArgs.design && typeof rawArgs.design === "object" && !Array.isArray(rawArgs.design)
        ? { ...rawArgs.design, ...rawArgs }
        : rawArgs.config && typeof rawArgs.config === "object" && !Array.isArray(rawArgs.config)
        ? { ...rawArgs.config, ...rawArgs }
        : rawArgs
      : {};

  if (args.enabled === false) {
    return { enabled: false };
  }

  const rawPalette =
    args.palette ||
    args.colors ||
    args.theme?.palette ||
    args.theme?.colors ||
    (args.theme && (args.theme.background || args.theme.bg || args.theme.accent || args.theme.primary)
      ? args.theme
      : null) ||
    existingDesign?.palette ||
    null;

  if (
    !rawPalette &&
    !args.layout &&
    !args.structure &&
    !args.customSections &&
    !args.sections &&
    !args.typography &&
    !args.fonts &&
    !args.hero &&
    !args.effects &&
    !args.heroCta &&
    !args.cta &&
    !args.tokens &&
    !args.designName &&
    !args.name
  ) {
    throw new Error(
      "Provide palette/colors, layout, typography, hero, or customSections when designing a custom theme."
    );
  }

  const paletteSrc = rawPalette || {
    background: "#0B0D14",
    surface: "#141824",
    text: "#F5F2EB",
    muted: "#A6AFC2",
    accent: "#E3B76B",
  };

  const bgRaw = paletteSrc.background ?? paletteSrc.bg ?? existingDesign?.palette?.background ?? "#0B0D14";
  const background = safeColorValue(bgRaw, "palette.background");
  const isLightBg = parseHexLuminance(background) > 0.4;

  const surfaceRaw =
    paletteSrc.surface ??
    paletteSrc.card ??
    paletteSrc.cardBg ??
    existingDesign?.palette?.surface ??
    (isLightBg ? "#FFFFFF" : "#141824");
  const surface = safeColorValue(surfaceRaw, "palette.surface");

  const surfaceAltRaw = paletteSrc.surfaceAlt ?? paletteSrc.surfaceSecondary ?? existingDesign?.palette?.surfaceAlt;
  const surfaceAlt = surfaceAltRaw ? safeColorValue(surfaceAltRaw, "palette.surfaceAlt") : undefined;

  const textRaw =
    paletteSrc.text ??
    paletteSrc.foreground ??
    paletteSrc.fg ??
    existingDesign?.palette?.text ??
    (isLightBg ? "#111318" : "#F5F2EB");
  const text = safeColorValue(textRaw, "palette.text");

  const mutedRaw =
    paletteSrc.muted ??
    paletteSrc.secondaryText ??
    paletteSrc.subtle ??
    existingDesign?.palette?.muted ??
    (isLightBg ? "#4B5563" : "#9CA3AF");
  const muted = safeColorValue(mutedRaw, "palette.muted");

  const accentRaw =
    paletteSrc.accent ??
    paletteSrc.primary ??
    existingDesign?.palette?.accent ??
    "#C89D66";
  const accent = safeColorValue(accentRaw, "palette.accent");

  const accentSecondaryRaw =
    paletteSrc.accentSecondary ?? paletteSrc.secondary ?? existingDesign?.palette?.accentSecondary;
  const accentSecondary = accentSecondaryRaw
    ? safeColorValue(accentSecondaryRaw, "palette.accentSecondary")
    : undefined;

  const accentTextRaw = paletteSrc.accentText ?? paletteSrc.onPrimary ?? existingDesign?.palette?.accentText;
  const accentText = accentTextRaw ? safeColorValue(accentTextRaw, "palette.accentText") : undefined;

  const borderRaw = paletteSrc.border ?? existingDesign?.palette?.border;
  const heroGradientRaw = paletteSrc.heroGradient ?? paletteSrc.gradient ?? existingDesign?.palette?.heroGradient;

  const cleanPalette = {
    background,
    surface,
    ...(surfaceAlt ? { surfaceAlt } : {}),
    text,
    muted,
    accent,
    ...(accentSecondary ? { accentSecondary } : {}),
    ...(accentText ? { accentText } : {}),
    ...(borderRaw ? { border: safeBorderColor(borderRaw) } : {}),
    ...(heroGradientRaw ? { heroGradient: safeCssGradient(heroGradientRaw) } : {}),
  };

  const typographySrc = args.typography || args.fonts || existingDesign?.typography || { headingStyle: "display" };
  const bodyVal = String(typographySrc.bodyStyle || typographySrc.body || "sans").toLowerCase();
  const scaleVal = String(typographySrc.scale || typographySrc.size || "balanced").toLowerCase();
  const cleanTypography = {
    headingStyle: mapHeadingStyle(typographySrc.headingStyle || typographySrc.heading || typographySrc.fontFamily),
    bodyStyle: BODY_STYLES.includes(bodyVal)
      ? bodyVal
      : /serif/.test(bodyVal)
      ? "serif"
      : /mono|code/.test(bodyVal)
      ? "mono"
      : "sans",
    scale: TYPE_SCALES.includes(scaleVal) ? scaleVal : "balanced",
  };

  const baseLayout =
    args.layout && typeof args.layout === "object"
      ? args.layout
      : args.structure && typeof args.structure === "object"
      ? args.structure
      : {};
  const layoutSrc = {
    ...(existingDesign?.layout || {}),
    ...baseLayout,
    ...(args.heroVariant ? { heroVariant: args.heroVariant } : {}),
    ...(typeof args.hero === "string"
      ? { heroVariant: args.hero }
      : args.hero && typeof args.hero === "object" && (args.hero.variant || args.hero.heroVariant)
      ? { heroVariant: args.hero.variant || args.hero.heroVariant }
      : {}),
    ...(args.projectGrid ? { projectGrid: args.projectGrid } : {}),
    ...(args.grid ? { projectGrid: args.grid } : {}),
    ...(args.cardRadius ? { cardRadius: args.cardRadius } : {}),
    ...(args.maxWidth ? { maxWidth: args.maxWidth } : {}),
    ...(args.navStyle ? { navStyle: args.navStyle } : {}),
    ...(typeof args.showNav === "boolean" ? { showNav: args.showNav } : {}),
    ...(Array.isArray(args.sectionOrder) ? { sectionOrder: args.sectionOrder } : {}),
  };

  const radiusVal = String(layoutSrc.cardRadius || layoutSrc.radius || "lg").toLowerCase();
  const widthVal = String(layoutSrc.maxWidth || layoutSrc.width || "standard").toLowerCase();
  const navVal = String(layoutSrc.navStyle || "floating-glass").toLowerCase();

  const cleanLayout = {
    heroVariant: mapHeroVariant(layoutSrc.heroVariant || layoutSrc.hero || "split-showcase"),
    projectGrid: mapProjectGrid(layoutSrc.projectGrid || layoutSrc.grid || "showcase-cards"),
    cardRadius: CARD_RADII.includes(radiusVal)
      ? radiusVal
      : radiusVal === "0" || radiusVal === "sharp"
      ? "none"
      : radiusVal === "pill" || radiusVal === "xl"
      ? "full"
      : "lg",
    maxWidth: MAX_WIDTHS.includes(widthVal) ? widthVal : "standard",
    showNav: layoutSrc.showNav !== false,
    navStyle: NAV_STYLES.includes(navVal) ? navVal : "floating-glass",
    ...(Array.isArray(layoutSrc.sectionOrder)
      ? {
          sectionOrder: layoutSrc.sectionOrder
            .map((s) => String(s).toLowerCase())
            .filter((s) => CANVAS_SECTIONS.includes(s))
            .slice(0, 6),
        }
      : {}),
  };

  const effectsSrc = args.effects || existingDesign?.effects || {};
  const cleanEffects = {
    ambientGlow: effectsSrc.ambientGlow !== false,
    glassBlur: effectsSrc.glassBlur !== false,
    gridPattern: GRID_PATTERNS.includes(effectsSrc.gridPattern) ? effectsSrc.gridPattern : "radial",
    hoverLift: HOVER_LIFTS.includes(effectsSrc.hoverLift) ? effectsSrc.hoverLift : "magnetic",
    borderStyle: BORDER_STYLES.includes(effectsSrc.borderStyle) ? effectsSrc.borderStyle : "hairline",
  };

  const heroCtaSrc = args.heroCta || args.cta || existingDesign?.heroCta;
  const cleanHeroCta =
    heroCtaSrc && typeof heroCtaSrc === "object"
      ? {
          ...(heroCtaSrc.primaryLabel || heroCtaSrc.label
            ? { primaryLabel: bilingual(heroCtaSrc.primaryLabel || heroCtaSrc.label, "heroCta.primaryLabel") }
            : {}),
          ...(heroCtaSrc.primaryUrl || heroCtaSrc.url
            ? {
                primaryUrl: safeUrl(heroCtaSrc.primaryUrl || heroCtaSrc.url, {
                  allowMail: true,
                  allowHash: true,
                  allowLocal: true,
                }),
              }
            : {}),
          ...(heroCtaSrc.secondaryLabel
            ? { secondaryLabel: bilingual(heroCtaSrc.secondaryLabel, "heroCta.secondaryLabel") }
            : {}),
          ...(heroCtaSrc.secondaryUrl
            ? {
                secondaryUrl: safeUrl(heroCtaSrc.secondaryUrl, {
                  allowMail: true,
                  allowHash: true,
                  allowLocal: true,
                }),
              }
            : {}),
        }
      : undefined;

  const sectionsSrc =
    "customSections" in args
      ? args.customSections
      : "sections" in args
      ? args.sections
      : existingDesign?.customSections;

  const cleanSections = Array.isArray(sectionsSrc)
    ? sectionsSrc.slice(0, 12).map((rawSec, idx) => {
        if (typeof rawSec === "string") {
          return {
            id: `custom-${idx + 1}`,
            kind: "richtext",
            title: bilingual(rawSec.slice(0, 80), "customSection.title"),
            content: bilingual(rawSec, "customSection.content"),
          };
        }
        if (!rawSec || typeof rawSec !== "object") {
          throw new Error("Each customSection must be an object or text block.");
        }
        const kind = mapSectionKind(rawSec.kind || rawSec.type);
        const sanitizedId = String(rawSec.id || `custom-${idx + 1}`)
          .replace(/[^a-z0-9_-]+/gi, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 60);

        const rawItems = Array.isArray(rawSec.items)
          ? rawSec.items
          : Array.isArray(rawSec.cards)
          ? rawSec.cards
          : Array.isArray(rawSec.questions)
          ? rawSec.questions
          : Array.isArray(rawSec.faqs)
          ? rawSec.faqs
          : Array.isArray(rawSec.stats)
          ? rawSec.stats
          : Array.isArray(rawSec.metrics)
          ? rawSec.metrics
          : Array.isArray(rawSec.events)
          ? rawSec.events
          : Array.isArray(rawSec.entries)
          ? rawSec.entries
          : Array.isArray(rawSec.testimonials)
          ? rawSec.testimonials
          : Array.isArray(rawSec.links)
          ? rawSec.links
          : null;

        const secTitle = rawSec.title || rawSec.heading || rawSec.label || `Section ${idx + 1}`;
        const secSubtitle = rawSec.subtitle || rawSec.tagline || rawSec.author || rawSec.attribution;
        const secContent =
          rawSec.content ||
          rawSec.body ||
          rawSec.text ||
          rawSec.markdown ||
          rawSec.quote ||
          rawSec.statement;

        return {
          id: sanitizedId || `custom-${idx + 1}`,
          kind,
          title: bilingual(secTitle, "customSection.title"),
          ...(secSubtitle
            ? { subtitle: bilingual(secSubtitle, "customSection.subtitle") }
            : {}),
          ...(secContent
            ? {
                content: bilingual(secContent, "customSection.content"),
              }
            : {}),
          ...(rawItems
            ? {
                items: rawItems.slice(0, 12).map((item, itemIdx) => {
                  if (typeof item === "string") {
                    return { title: bilingual(item, "customSection.item.title") };
                  }
                  if (!item || typeof item !== "object") {
                    return { title: bilingual(`Item ${itemIdx + 1}`, "customSection.item.title") };
                  }
                  const itemTitle = item.title ?? item.name ?? item.question ?? item.label ?? `Item ${itemIdx + 1}`;
                  const itemDesc = item.description ?? item.desc ?? item.answer ?? item.summary ?? item.text;
                  return {
                    title: bilingual(itemTitle, "customSection.item.title"),
                    ...(itemDesc
                      ? { description: bilingual(itemDesc, "customSection.item.description") }
                      : {}),
                    ...(item.badge || item.tag
                      ? { badge: String(item.badge || item.tag).slice(0, 60) }
                      : {}),
                    ...(item.value || item.metric
                      ? { value: String(item.value || item.metric).slice(0, 60) }
                      : {}),
                    ...(item.url || item.href
                      ? {
                          url: safeUrl(item.url || item.href, {
                            allowMail: true,
                            allowHash: true,
                            allowLocal: true,
                          }),
                        }
                      : {}),
                  };
                }),
              }
            : {}),
        };
      })
    : undefined;

  const cleanTokens = {};
  if (args.tokens && typeof args.tokens === "object" && !Array.isArray(args.tokens)) {
    for (const [k, v] of Object.entries(args.tokens).slice(0, 24)) {
      const cleanKey = String(k).replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
      if (!cleanKey) continue;
      if (typeof v === "boolean" || typeof v === "number") cleanTokens[cleanKey] = v;
      else if (typeof v === "string" && !/javascript:|expression\(|url\(|[;<>{}]/i.test(v)) {
        cleanTokens[cleanKey] = v.slice(0, 120);
      }
    }
  }

  return {
    enabled: true,
    designName: String(
      args.designName || args.name || args.title || existingDesign?.designName || "Bespoke Sovereign"
    ).slice(0, 120),
    ...(args.concept || existingDesign?.concept
      ? { concept: String(args.concept || existingDesign?.concept).slice(0, 500) }
      : {}),
    palette: cleanPalette,
    typography: cleanTypography,
    layout: cleanLayout,
    effects: cleanEffects,
    ...(cleanHeroCta && Object.keys(cleanHeroCta).length > 0 ? { heroCta: cleanHeroCta } : {}),
    ...(cleanSections ? { customSections: cleanSections } : {}),
    ...(Object.keys(cleanTokens).length > 0 ? { tokens: cleanTokens } : {}),
  };
}

function normalizeProjectFields(args, partial = false) {
  const result = {};
  if ("title" in args) result.title = bilingual(args.title, "title");
  if ("desc" in args) result.desc = bilingual(args.desc, "desc");
  if ("year" in args) result.year = String(args.year || "").slice(0, 12);
  if ("tags" in args) {
    result.tags = Array.isArray(args.tags)
      ? args.tags.slice(0, 30).map((tag) => String(tag).slice(0, 40))
      : [];
  }
  if ("url" in args) result.url = args.url ? safeUrl(args.url) : "";
  if ("client" in args) result.client = args.client ? bilingual(args.client, "client") : null;
  if ("metrics" in args) result.metrics = String(args.metrics || "").slice(0, 500);
  if ("images" in args) {
    result.images = Array.isArray(args.images)
      ? args.images.slice(0, 12).map((src) => safeUrl(src, { allowLocal: true }))
      : [];
  }
  if (!partial && (!result.title || !result.desc)) {
    throw new Error("Project title and description are required.");
  }
  return result;
}

function publicProject(project) {
  return {
    id: String(project?.id || ""),
    title: bilingual(project?.title || "", "title"),
    description: bilingual(project?.desc || "", "description"),
    year: String(project?.year || ""),
    tags: Array.isArray(project?.tags)
      ? project.tags.filter((tag) => typeof tag === "string").slice(0, 30)
      : [],
    url: typeof project?.url === "string" ? project.url : null,
    client: project?.client ? bilingual(project.client, "client") : null,
    metrics: typeof project?.metrics === "string" ? project.metrics : null,
    images: Array.isArray(project?.images)
      ? project.images.filter((image) => typeof image === "string").slice(0, 12)
      : [],
  };
}

function safePortfolio(portfolio, username) {
  return {
    username: String(portfolio.username || username),
    publicUrl: `https://${String(portfolio.username || username)}.taqdom.me`,
    name: bilingual(portfolio.name || "", "name"),
    title: bilingual(portfolio.title || "", "title"),
    bio: bilingual(portfolio.bio || "", "bio"),
    city: bilingual(portfolio.city || "", "city"),
    ...(portfolio.badge ? { badge: bilingual(portfolio.badge, "badge") } : {}),
    template: String(portfolio.template || ""),
    defaultLang: portfolio.defaultLang === "en" ? "en" : "ar",
    discoverable: Boolean(portfolio.discoverable),
    avatar: typeof portfolio.avatar === "string" ? portfolio.avatar : null,
    cover: typeof portfolio.cover === "string" ? portfolio.cover : null,
    skills: Array.isArray(portfolio.skills)
      ? portfolio.skills.filter((skill) => typeof skill === "string").slice(0, 100)
      : [],
    links: Array.isArray(portfolio.links)
      ? portfolio.links
          .map((link) => ({
            label: String(link?.label || "").slice(0, 100),
            url: typeof link?.url === "string" ? link.url : "",
          }))
          .slice(0, 50)
      : [],
    projects: Array.isArray(portfolio.projects) ? portfolio.projects.map(publicProject) : [],
    metrics: Array.isArray(portfolio.metrics)
      ? portfolio.metrics.slice(0, 30).map((metric) => ({
          label: bilingual(metric?.label || "", "metric label"),
          value: String(metric?.value || ""),
        }))
      : [],
    timeline: Array.isArray(portfolio.timeline)
      ? portfolio.timeline.slice(0, 50).map((item) => ({
          year: String(item?.year || ""),
          role: bilingual(item?.role || "", "role"),
          organization: bilingual(item?.org || "", "organization"),
          summary: bilingual(item?.summary || "", "summary"),
        }))
      : [],
    theme:
      portfolio.theme && typeof portfolio.theme === "object"
        ? {
            mode: ["light", "dark", "auto"].includes(portfolio.theme.mode)
              ? portfolio.theme.mode
              : "auto",
            accent: String(portfolio.theme.accent || ""),
          }
        : null,
    customDesign:
      portfolio.customDesign && typeof portfolio.customDesign === "object"
        ? portfolio.customDesign
        : null,
    seo:
      portfolio.seo && typeof portfolio.seo === "object"
        ? {
            title: typeof portfolio.seo.title === "string" ? portfolio.seo.title : "",
            description:
              typeof portfolio.seo.description === "string" ? portfolio.seo.description : "",
            keywords: Array.isArray(portfolio.seo.keywords)
              ? portfolio.seo.keywords.slice(0, 30)
              : [],
            noindex: Boolean(portfolio.seo.noindex),
          }
        : null,
    publishedAt: portfolio.publishedAt || null,
    updatedAt: portfolio.updatedAt || null,
  };
}

async function loadOwnedPortfolio(env, username, userId) {
  const row = await env.DB.prepare(
    "SELECT draft_json, published_json FROM portfolios WHERE username = ?1 AND user_id = ?2"
  )
    .bind(username, userId)
    .first();
  const raw = row?.draft_json || row?.published_json;
  if (!raw) throw new Error("Portfolio not found for this account.");
  let portfolio;
  try {
    portfolio = JSON.parse(raw);
  } catch {
    throw new Error("Portfolio data is invalid.");
  }
  return portfolio;
}

async function saveOwnedDraft(env, username, userId, portfolio) {
  const now = Date.now();
  const updated = { ...portfolio, username, updatedAt: now };
  const result = await env.DB.prepare(
    "UPDATE portfolios SET draft_json = ?1, template = ?2, updated_at = ?3 WHERE username = ?4 AND user_id = ?5"
  )
    .bind(JSON.stringify(updated), String(updated.template || "haven"), now, username, userId)
    .run();
  if (result?.meta?.changes === 0 || result?.changes === 0) {
    throw new Error("Draft was not saved. The account ownership check failed.");
  }
  return updated;
}

async function publishOwnedDraft(env, username, userId, portfolio) {
  const now = Date.now();
  const published = { ...portfolio, username, updatedAt: now, publishedAt: now };
  const result = await env.DB.prepare(
    "UPDATE portfolios SET draft_json = ?1, published_json = ?1, published_at = ?2, updated_at = ?2, template = ?5 WHERE username = ?3 AND user_id = ?4"
  )
    .bind(JSON.stringify(published), now, username, userId, String(published.template || "haven"))
    .run();
  if (result?.meta?.changes === 0 || result?.changes === 0) {
    throw new Error("Publish failed. The account ownership check failed.");
  }
  return published;
}

async function processSingleRpcCall(body, { env, username, tokenRow, negotiatedProtocol }) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      status: 400,
      payload: { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } },
    };
  }
  const hasId = Object.prototype.hasOwnProperty.call(body, "id") && body.id !== undefined;
  const wrapOk = (result) => ({
    status: 200,
    payload: { jsonrpc: "2.0", id: body.id ?? null, result },
  });
  const wrapErr = (code, message) => ({
    status: 200,
    payload: { jsonrpc: "2.0", id: body.id ?? null, error: { code, message } },
  });

  if (body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return wrapErr(-32600, "Invalid Request");
  }
  if (body.method === "notifications/initialized" || body.method.startsWith("notifications/")) {
    return { status: hasId ? 200 : 202, payload: hasId ? { jsonrpc: "2.0", id: body.id, result: {} } : null };
  }
  if (body.method === "initialize") {
    const requestedProto = String(body.params?.protocolVersion || "");
    const proto = requestedProto === "2024-11-05" ? "2024-11-05" : "2025-03-26";
    return wrapOk({
      protocolVersion: proto,
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
      },
      serverInfo: { name: "taqdom-account-mcp", version: "2.0.0" },
      instructions:
        `You are connected to ${username}'s Sovereign Taqdom Portfolio Architect (https://${username}.taqdom.me). ` +
        "You have full read/write creative control over the account draft: you are NOT limited to the 7 built-in templates. " +
        "Call get_portfolio_blueprint and list_templates_and_capabilities to understand the creator and all visual capabilities. " +
        "To build a completely custom portfolio design beyond any existing preset template, call design_custom_portfolio_theme with an original palette, typography, heroVariant, projectGrid, GPU effects, custom sectionOrder, heroCta, and customSections. " +
        "Use update_portfolio_content and create_project/update_project for bilingual (ar & en) content. Pass publish=true or call publish_portfolio when ready to go live.",
    });
  }
  if (body.method === "ping") return wrapOk({});
  if (body.method === "tools/list") return wrapOk({ tools: TOOLS });

  if (body.method === "resources/list") {
    return wrapOk({
      resources: [
        {
          uri: `taqdom://portfolio/${username}/blueprint`,
          name: `${username} Portfolio Blueprint`,
          description:
            "Live JSON snapshot of the creator's draft portfolio, projects, and active bespoke design.",
          mimeType: "application/json",
        },
        {
          uri: "taqdom://design-system/capabilities",
          name: "Taqdom Bespoke Design Engine Capabilities",
          description:
            "Complete reference of the 7 built-in styles plus custom palette, hero, grid, typography, effect, and section tokens.",
          mimeType: "application/json",
        },
        {
          uri: `taqdom://portfolio/${username}/creative-brief`,
          name: `${username} Creative Direction Brief`,
          description: "Markdown summary for AI designers planning an authentic bespoke website.",
          mimeType: "text/markdown",
        },
      ],
    });
  }

  if (body.method === "resources/read") {
    const uri = String(body.params?.uri || "");
    if (uri === "taqdom://design-system/capabilities") {
      return wrapOk({
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(DESIGN_CAPABILITIES, null, 2),
          },
        ],
      });
    }
    const portfolio = await loadOwnedPortfolio(env, username, tokenRow.user_id).catch(() => null);
    if (!portfolio) return wrapErr(-32602, "Portfolio not found");
    const safe = safePortfolio(portfolio, username);
    if (uri === `taqdom://portfolio/${username}/blueprint`) {
      return wrapOk({
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({ portfolio: safe, capabilities: DESIGN_CAPABILITIES }, null, 2),
          },
        ],
      });
    }
    if (uri === `taqdom://portfolio/${username}/creative-brief`) {
      const md = [
        `# Creative Brief — ${safe.name.en || safe.name.ar || username}`,
        `- **Standalone URL:** https://${username}.taqdom.me`,
        `- **Role:** ${safe.title.en || safe.title.ar}`,
        `- **Projects Count:** ${safe.projects.length}`,
        `- **Skills:** ${safe.skills.join(", ") || "Not specified yet"}`,
        `- **Current Mode:** ${
          safe.customDesign?.enabled
            ? `Custom Design (${safe.customDesign.designName})`
            : `Preset Template (${safe.template})`
        }`,
        `\n## Instructions for AI Designer\nUse \`design_custom_portfolio_theme\` to invent bespoke aesthetics beyond preset templates, ensuring WCAG text contrast and crisp bilingual Arabic/English copy.`,
      ].join("\n");
      return wrapOk({ contents: [{ uri, mimeType: "text/markdown", text: md }] });
    }
    return wrapErr(-32602, "Unknown resource URI");
  }

  if (body.method === "prompts/list") return wrapOk({ prompts: PROMPTS });

  if (body.method === "prompts/get") {
    const promptName = String(body.params?.name || "");
    const pArgs = body.params?.arguments || {};
    if (promptName === "design-bespoke-portfolio") {
      const vibe = String(
        pArgs.aesthetic_vibe || "editorial luxury tailored to the creator's craft"
      );
      const langPref = String(pArgs.primary_language || "bilingual Arabic + English");
      return wrapOk({
        description: "Bespoke Art Director & Portfolio Architect Prompt",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Inspect my portfolio via get_portfolio_blueprint and list_templates_and_capabilities. ` +
                `Design a completely original, bespoke portfolio for me with aesthetic vibe "${vibe}" (${langPref}). ` +
                `Do NOT limit yourself to preset templates: synthesize a cohesive high-contrast palette, typography pairing, heroVariant, projectGrid, GPU effects, and customSections using design_custom_portfolio_theme, refine my content with update_portfolio_content, summarize changes, and ask before or run publish_portfolio as requested.`,
            },
          },
        ],
      });
    }
    if (promptName === "architect-case-studies") {
      const audience = String(pArgs.target_audience || "senior hiring leads and founders");
      return wrapOk({
        description: "Case Study Architect Prompt",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Call list_projects and get_profile, then upgrade each project via update_project with compelling bilingual storytelling, quantified metrics, and sharp positioning tailored to ${audience}. Keep changes in draft until I confirm publish_portfolio.`,
            },
          },
        ],
      });
    }
    if (promptName === "rebrand-for-target-role") {
      const role = String(pArgs.target_role || "Principal Product Architect");
      return wrapOk({
        description: "Career Repositioning Prompt",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Read my current blueprint using get_portfolio_blueprint. Rebrand my bilingual title, bio, metrics, timeline, and custom visual theme via update_portfolio_content and design_custom_portfolio_theme specifically for the role: ${role}.`,
            },
          },
        ],
      });
    }
    return wrapErr(-32602, "Unknown prompt name");
  }

  if (body.method === "tools/call") {
    const name = body.params?.name;
    const args = body.params?.arguments || {};
    if (!TOOLS.some((tool) => tool.name === name)) return wrapErr(-32602, "Unknown tool");
    try {
      if (!args || typeof args !== "object" || Array.isArray(args)) {
        throw new Error("Tool arguments must be an object.");
      }
      const portfolio = await loadOwnedPortfolio(env, username, tokenRow.user_id);

      if (name === "get_profile") {
        const safe = safePortfolio(portfolio, username);
        const { projects, metrics, timeline, ...profile } = safe;
        void projects;
        void metrics;
        void timeline;
        return wrapOk(toolResult(profile));
      }
      if (name === "list_projects") {
        return wrapOk(toolResult((portfolio.projects || []).map(publicProject)));
      }
      if (name === "get_portfolio") {
        return wrapOk(toolResult(safePortfolio(portfolio, username)));
      }
      if (name === "list_templates_and_capabilities") {
        return wrapOk(toolResult(DESIGN_CAPABILITIES));
      }
      if (name === "get_portfolio_blueprint") {
        return wrapOk(
          toolResult({
            portfolio: safePortfolio(portfolio, username),
            capabilities: DESIGN_CAPABILITIES,
            publicationStatus: {
              isPublished: Boolean(portfolio.publishedAt),
              publishedAt: portfolio.publishedAt || null,
              publicUrl: `https://${username}.taqdom.me`,
            },
          })
        );
      }

      if (name === "update_profile") {
        const allowed = new Set([
          "name",
          "title",
          "bio",
          "city",
          "skills",
          "links",
          "avatar",
          "cover",
          "theme",
        ]);
        const keys = Object.keys(args);
        if (!keys.length || keys.some((key) => !allowed.has(key))) {
          throw new Error("Provide at least one supported profile field.");
        }
        for (const key of ["name", "title", "bio", "city"]) {
          if (key in args) portfolio[key] = bilingual(args[key], key);
        }
        if ("skills" in args) {
          portfolio.skills = Array.isArray(args.skills)
            ? args.skills.slice(0, 100).map((skill) => String(skill).slice(0, 80))
            : [];
        }
        if ("links" in args) {
          if (!Array.isArray(args.links) || args.links.length > 50) {
            throw new Error("Links must be an array with at most 50 entries.");
          }
          portfolio.links = args.links.map((link) => ({
            label: String(link.label || "").slice(0, 100),
            url: safeUrl(link.url, { allowMail: true }),
          }));
        }
        for (const key of ["avatar", "cover"]) {
          if (key in args) portfolio[key] = args[key] ? safeUrl(args[key], { allowLocal: true }) : "";
        }
        if ("theme" in args) {
          if (!args.theme || typeof args.theme !== "object" || Array.isArray(args.theme)) {
            throw new Error("Theme must be an object.");
          }
          portfolio.theme = {
            mode: ["light", "dark", "auto"].includes(args.theme.mode)
              ? args.theme.mode
              : portfolio.theme?.mode || "auto",
            accent: /^#[0-9a-f]{6}$/i.test(String(args.theme.accent || ""))
              ? args.theme.accent
              : portfolio.theme?.accent || "#315BFF",
          };
        }
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return wrapOk(
          toolResult({
            ok: true,
            savedTo: "draft",
            published: false,
            portfolio: safePortfolio(saved, username),
          })
        );
      }

      if (name === "update_portfolio_content") {
        const allowed = new Set([
          "template",
          "defaultLang",
          "discoverable",
          "publish",
          "name",
          "title",
          "bio",
          "city",
          "badge",
          "skills",
          "links",
          "metrics",
          "timeline",
          "seo",
          "avatar",
          "cover",
          "theme",
        ]);
        const keys = Object.keys(args);
        if (!keys.length || keys.some((key) => !allowed.has(key))) {
          throw new Error("Provide at least one supported portfolio content field.");
        }
        if ("template" in args) {
          const tpl = String(args.template || "").toLowerCase();
          if (!TEMPLATE_IDS.includes(tpl)) throw new Error("Invalid template ID.");
          portfolio.template = tpl;
        }
        if ("defaultLang" in args) portfolio.defaultLang = args.defaultLang === "en" ? "en" : "ar";
        if ("discoverable" in args) portfolio.discoverable = Boolean(args.discoverable);
        for (const key of ["name", "title", "bio", "city", "badge"]) {
          if (key in args) portfolio[key] = bilingual(args[key], key);
        }
        if ("skills" in args) {
          portfolio.skills = Array.isArray(args.skills)
            ? args.skills.slice(0, 100).map((s) => String(s).slice(0, 80))
            : [];
        }
        if ("links" in args) {
          portfolio.links = (args.links || []).slice(0, 50).map((link) => ({
            label: String(link.label || "").slice(0, 100),
            url: safeUrl(link.url, { allowMail: true }),
          }));
        }
        if ("metrics" in args) {
          portfolio.metrics = (args.metrics || []).slice(0, 12).map((m) => ({
            label: bilingual(m?.label || "", "metric.label"),
            value: String(m?.value || "").slice(0, 80),
          }));
        }
        if ("timeline" in args) {
          portfolio.timeline = (args.timeline || []).slice(0, 25).map((item) => ({
            year: String(item?.year || "").slice(0, 32),
            role: bilingual(item?.role || "", "timeline.role"),
            org: bilingual(item?.org || item?.organization || "", "timeline.org"),
            summary: bilingual(item?.summary || "", "timeline.summary"),
          }));
        }
        if ("seo" in args && args.seo && typeof args.seo === "object") {
          portfolio.seo = {
            ...(portfolio.seo || {}),
            ...(typeof args.seo.title === "string" ? { title: args.seo.title.slice(0, 180) } : {}),
            ...(typeof args.seo.description === "string"
              ? { description: args.seo.description.slice(0, 400) }
              : {}),
            ...(Array.isArray(args.seo.keywords)
              ? { keywords: args.seo.keywords.slice(0, 30).map((k) => String(k).slice(0, 60)) }
              : {}),
            ...("noindex" in args.seo ? { noindex: Boolean(args.seo.noindex) } : {}),
          };
        }
        for (const key of ["avatar", "cover"]) {
          if (key in args) portfolio[key] = args[key] ? safeUrl(args[key], { allowLocal: true }) : "";
        }
        if ("theme" in args && args.theme && typeof args.theme === "object") {
          const accentCandidate = args.theme.accent || args.theme.primary;
          let accentColor = portfolio.theme?.accent || "#315BFF";
          if (accentCandidate) {
            accentColor = safeColorValue(accentCandidate, "theme.accent");
          }
          portfolio.theme = {
            ...(portfolio.theme || {}),
            mode: ["light", "dark", "auto"].includes(args.theme.mode)
              ? args.theme.mode
              : portfolio.theme?.mode || "auto",
            accent: accentColor,
          };
        }
        const saved = args.publish === true
          ? await publishOwnedDraft(env, username, tokenRow.user_id, portfolio)
          : await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return wrapOk(
          toolResult({
            ok: true,
            savedTo: args.publish === true ? "published" : "draft",
            published: Boolean(args.publish === true),
            portfolio: safePortfolio(saved, username),
          })
        );
      }

      if (name === "design_custom_portfolio_theme") {
        const cleanDesign = validateAndSanitizeCustomDesign(args, portfolio.customDesign || null);
        if (cleanDesign.enabled === false) {
          portfolio.customDesign = { ...(portfolio.customDesign || {}), enabled: false };
          const fallback = String(args.fallbackTemplate || "").toLowerCase();
          if (fallback && TEMPLATE_IDS.includes(fallback)) {
            portfolio.template = fallback;
          }
        } else {
          portfolio.customDesign = cleanDesign;
          if (cleanDesign.palette?.accent) {
            portfolio.theme = {
              ...(portfolio.theme || {
                mode: "dark",
                scene3d: { enabled: true, intensity: 0.7, speed: 0.8, lightAngle: 45 },
              }),
              accent: cleanDesign.palette.accent,
            };
          }
        }
        const saved =
          args.publish === true
            ? await publishOwnedDraft(env, username, tokenRow.user_id, portfolio)
            : await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return wrapOk(
          toolResult({
            ok: true,
            savedTo: args.publish === true ? "published" : "draft",
            published: Boolean(args.publish === true),
            publicUrl: `https://${username}.taqdom.me`,
            customDesign: saved.customDesign,
            previewSummary: cleanDesign.enabled
              ? `Applied bespoke theme "${cleanDesign.designName}" (${cleanDesign.layout?.heroVariant} + ${cleanDesign.layout?.projectGrid}) to ${args.publish === true ? "live site" : "draft"}.`
              : `Disabled custom theme; active template is ${saved.template}.`,
          })
        );
      }

      if (name === "create_project") {
        const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
        if (projects.length >= 100) throw new Error("A portfolio can contain at most 100 projects.");
        const project = { id: crypto.randomUUID(), ...normalizeProjectFields(args) };
        portfolio.projects = [...projects, project];
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return wrapOk(
          toolResult({
            ok: true,
            savedTo: "draft",
            project: publicProject(project),
            updatedAt: saved.updatedAt,
          })
        );
      }
      if (name === "update_project") {
        const { projectId, ...fields } = args;
        const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
        const index = projects.findIndex((project) => String(project?.id) === String(projectId));
        if (index < 0) throw new Error("Project not found in this account.");
        if (!Object.keys(fields).length) throw new Error("Provide at least one project field to update.");
        projects[index] = { ...projects[index], ...normalizeProjectFields(fields, true) };
        portfolio.projects = projects;
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return wrapOk(
          toolResult({
            ok: true,
            savedTo: "draft",
            project: publicProject(projects[index]),
            updatedAt: saved.updatedAt,
          })
        );
      }
      if (name === "delete_project") {
        const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
        const next = projects.filter((project) => String(project?.id) !== String(args.projectId));
        if (next.length === projects.length) throw new Error("Project not found in this account.");
        portfolio.projects = next;
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return wrapOk(
          toolResult({
            ok: true,
            savedTo: "draft",
            deletedProjectId: String(args.projectId),
            updatedAt: saved.updatedAt,
          })
        );
      }
      if (name === "publish_portfolio") {
        const published = await publishOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return wrapOk(
          toolResult({
            ok: true,
            published: true,
            publicUrl: `https://${username}.taqdom.me`,
            publishedAt: published.publishedAt,
            customDesignEnabled: Boolean(published.customDesign?.enabled),
            designName: published.customDesign?.enabled
              ? published.customDesign.designName
              : published.template,
          })
        );
      }
      return wrapErr(-32602, "Unsupported tool");
    } catch (error) {
      return wrapOk(toolError(error instanceof Error ? error.message : "MCP tool failed."));
    }
  }
  void negotiatedProtocol;
  return wrapErr(-32601, "Method not found");
}

function extractMcpToken(request, url, directTokenFromPath = null) {
  if (directTokenFromPath && /^tqd_(?:mcp|oat)_[a-f0-9]{64}$/i.test(directTokenFromPath)) {
    return directTokenFromPath;
  }
  const auth = request.headers.get("authorization") || "";
  const bearerMatch = auth.match(/^Bearer (tqd_(?:mcp|oat)_[a-f0-9]{64})$/i);
  if (bearerMatch) return bearerMatch[1];
  const queryToken = url.searchParams.get("token") || url.searchParams.get("access_token") || "";
  if (/^tqd_(?:mcp|oat)_[a-f0-9]{64}$/i.test(queryToken.trim())) {
    return queryToken.trim();
  }
  return null;
}

/**
 * @param {Request} request
 * @param {any} env
 * @param {string | null} [targetUsername]
 * @param {string | null} [directTokenFromPath]
 */
export async function handleMcpRequest(
  request,
  env,
  targetUsername = null,
  directTokenFromPath = null
) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: oauthCorsHeaders() });
  }
  if (!["GET", "POST", "DELETE"].includes(request.method)) {
    return json(
      { error: "MCP endpoint supports GET, POST, DELETE, and OPTIONS requests." },
      405,
      { allow: "GET, POST, DELETE, OPTIONS" }
    );
  }
  if (!env?.DB) return json({ error: "Account storage unavailable" }, 503);

  const reqUrl = new URL(request.url);
  const username = targetUsername ? normalizeUsername(targetUsername) : null;
  const resourceMetaUrl = username
    ? `${reqUrl.origin}/.well-known/oauth-protected-resource/mcp/${username}`
    : `${reqUrl.origin}/.well-known/oauth-protected-resource/mcp`;

  const rawToken = extractMcpToken(request, reqUrl, directTokenFromPath);
  if (!rawToken) {
    return json(
      {
        error: "authentication_required",
        message: "Sign in via OAuth 2.1 or pass a Taqdom MCP Bearer token.",
        resource_metadata: resourceMetaUrl,
      },
      401,
      {
        "www-authenticate": `Bearer realm="Taqdom MCP", resource_metadata="${resourceMetaUrl}"`,
      }
    );
  }

  await ensureSchema(env);
  const tokenHash = await digest(rawToken);
  const tokenRow = await env.DB.prepare(
    "SELECT id, user_id, username, scope, expires_at FROM mcp_access_tokens WHERE token_hash = ?1 AND revoked_at IS NULL"
  )
    .bind(tokenHash)
    .first();

  if (
    !tokenRow ||
    (tokenRow.expires_at && Number(tokenRow.expires_at) <= Date.now()) ||
    (username && tokenRow.username !== username)
  ) {
    return json(
      { error: "Invalid, expired, revoked, or out-of-scope MCP token." },
      401,
      {
        "www-authenticate": `Bearer realm="Taqdom MCP", error="invalid_token", resource_metadata="${resourceMetaUrl}"`,
      }
    );
  }

  const resolvedUsername = normalizeUsername(tokenRow.username);
  await env.DB.prepare("UPDATE mcp_access_tokens SET last_used_at = ?1 WHERE id = ?2")
    .bind(Date.now(), tokenRow.id)
    .run();

  const sessionHeader = request.headers.get("mcp-session-id") || crypto.randomUUID();
  const reqProtocol = request.headers.get("mcp-protocol-version") || "2025-03-26";
  const protocolVersion = reqProtocol === "2024-11-05" ? "2024-11-05" : "2025-03-26";

  if (request.method === "DELETE") {
    return json({ ok: true, sessionClosed: true }, 200, { "mcp-session-id": sessionHeader });
  }

  if (request.method === "GET") {
    const accept = (request.headers.get("accept") || "").toLowerCase();
    if (accept.includes("text/event-stream")) {
      const ssePayload = `event: endpoint\ndata: ${reqUrl.origin}/mcp/${resolvedUsername}\n\n: taqdom mcp stream ready\n\n`;
      return new Response(ssePayload, {
        status: 200,
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-store",
          "mcp-session-id": sessionHeader,
          "mcp-protocol-version": protocolVersion,
          ...oauthCorsHeaders(),
        },
      });
    }
    return json(
      {
        ok: true,
        server: "taqdom-account-mcp",
        version: "2.0.0",
        username: resolvedUsername,
        protocolVersion,
        endpoint: `${reqUrl.origin}/mcp/${resolvedUsername}`,
        capabilities: ["tools", "resources", "prompts"],
      },
      200,
      { "mcp-session-id": sessionHeader, "mcp-protocol-version": protocolVersion }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON-RPC request" }, 400);

  if (Array.isArray(body)) {
    if (body.length === 0 || body.length > 25) {
      return json({ error: "Invalid JSON-RPC batch size" }, 400);
    }
    const results = [];
    for (const item of body) {
      const out = await processSingleRpcCall(item, {
        env,
        username: resolvedUsername,
        tokenRow,
        negotiatedProtocol: protocolVersion,
      });
      if (out.payload) results.push(out.payload);
    }
    if (results.length === 0) {
      return new Response(null, {
        status: 202,
        headers: {
          "mcp-session-id": sessionHeader,
          "mcp-protocol-version": protocolVersion,
          ...oauthCorsHeaders(),
        },
      });
    }
    return json(results, 200, {
      "mcp-session-id": sessionHeader,
      "mcp-protocol-version": protocolVersion,
    });
  }

  const outcome = await processSingleRpcCall(body, {
    env,
    username: resolvedUsername,
    tokenRow,
    negotiatedProtocol: protocolVersion,
  });
  if (outcome.payload === null) {
    return new Response(null, {
      status: outcome.status || 202,
      headers: {
        "mcp-session-id": sessionHeader,
        "mcp-protocol-version": protocolVersion,
        ...oauthCorsHeaders(),
      },
    });
  }
  return json(outcome.payload, outcome.status || 200, {
    "mcp-session-id": sessionHeader,
    "mcp-protocol-version": protocolVersion,
  });
}
