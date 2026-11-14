const encoder = new TextEncoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
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
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS mcp_access_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_used_at INTEGER,
      revoked_at INTEGER
    )
  `).run();
}

export async function handleMcpTokenApi(request, url, env, session) {
  if (!session?.username || session.isTestAccount) return json({ error: "Authentication required" }, 401);
  if (!env?.DB) return json({ error: "Account storage unavailable" }, 503);
  await ensureSchema(env);
  const username = String(session.username).toLowerCase();
  const userId = String(session.userId || session.id || `user-${username}`);

  if (request.method === "GET") {
    const { results = [] } = await env.DB.prepare(
      "SELECT id, label, created_at, last_used_at, revoked_at FROM mcp_access_tokens WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 30"
    ).bind(userId).all();
    return json({ tokens: results });
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const label = String(body.label || "MCP connection").trim().slice(0, 60) || "MCP connection";
    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM mcp_access_tokens WHERE user_id = ?1 AND revoked_at IS NULL"
    ).bind(userId).first();
    if (Number(count?.total || 0) >= 10) return json({ error: "Maximum 10 active MCP connections" }, 429);
    const token = randomToken();
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO mcp_access_tokens (id, user_id, username, token_hash, label, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    ).bind(id, userId, username, await digest(token), label, Date.now()).run();
    return json({
      token,
      connection: { id, label, endpoint: `https://taqdom.me/mcp/${username}`, created_at: Date.now() },
      warning: "Copy this token now. It will not be shown again.",
    }, 201);
  }

  if (request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Token id required" }, 400);
    await env.DB.prepare(
      "UPDATE mcp_access_tokens SET revoked_at = ?1 WHERE id = ?2 AND user_id = ?3 AND revoked_at IS NULL"
    ).bind(Date.now(), id, userId).run();
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405, { allow: "GET, POST, DELETE" });
}

const TEMPLATE_IDS = ["madar", "athar", "haven", "siyada", "wameed", "salam", "meshwar"];
const CANVAS_SECTIONS = ["hero", "metrics", "skills", "projects", "timeline", "contact"];
const HERO_VARIANTS = ["split-showcase", "centered-monolith", "asymmetric-editorial", "terminal-bento", "full-bleed-poster"];
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
const CUSTOM_SECTION_KINDS = ["richtext", "cards", "stats", "faq", "quote", "cta"];

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
    summary: "Set customDesign.enabled=true via design_custom_portfolio_theme to completely bypass built-in templates and render an original, sovereign personal website with custom hex palette, typography pairing, hero architecture, project grid, GPU visual effects, section order, and custom sections.",
    heroVariants: HERO_VARIANTS,
    projectGrids: PROJECT_GRIDS,
    typography: { headingStyles: HEADING_STYLES, bodyStyles: BODY_STYLES, scales: TYPE_SCALES },
    cardRadii: CARD_RADII,
    maxWidths: MAX_WIDTHS,
    navStyles: NAV_STYLES,
    effects: { gridPatterns: GRID_PATTERNS, hoverLifts: HOVER_LIFTS, borderStyles: BORDER_STYLES },
    sectionOrderIds: CANVAS_SECTIONS,
    customSectionKinds: CUSTOM_SECTION_KINDS,
    standaloneGuarantee: "All published portfolios launch as a 100% standalone personal website at https://<username>.taqdom.me with zero Taqdom chrome, ads, or footer branding.",
  },
};

const BILINGUAL = {
  type: "object",
  properties: { ar: { type: "string", maxLength: 12000 }, en: { type: "string", maxLength: 12000 } },
  additionalProperties: false,
};

const TOOLS = [
  { name: "get_portfolio", description: "Read the authenticated account's portfolio draft, publication status, and custom design state.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "get_profile", description: "Read the portfolio owner's profile details and social links.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "list_projects", description: "List projects currently saved in the portfolio.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "update_profile", description: "Update selected profile fields in the owner's draft. Changes are saved but are not public until publish_portfolio is called.", inputSchema: { type: "object", properties: {
    name: BILINGUAL, title: BILINGUAL, bio: BILINGUAL, city: BILINGUAL,
    skills: { type: "array", maxItems: 100, items: { type: "string", maxLength: 80 } },
    links: { type: "array", maxItems: 50, items: { type: "object", properties: { label: { type: "string", maxLength: 100 }, url: { type: "string", maxLength: 2048 } }, required: ["label", "url"], additionalProperties: false } },
    avatar: { type: "string", maxLength: 2048 }, cover: { type: "string", maxLength: 2048 },
    theme: { type: "object", properties: { mode: { type: "string", enum: ["light", "dark", "auto"] }, accent: { type: "string", maxLength: 32 } }, additionalProperties: false },
  }, additionalProperties: false } },
  { name: "create_project", description: "Create a project in the owner's draft. The new project is not public until published.", inputSchema: { type: "object", properties: {
    title: BILINGUAL, desc: BILINGUAL, year: { type: "string", maxLength: 12 },
    tags: { type: "array", maxItems: 30, items: { type: "string", maxLength: 40 } },
    url: { type: "string", maxLength: 2048 }, client: BILINGUAL,
    metrics: { type: "string", maxLength: 500 }, images: { type: "array", maxItems: 12, items: { type: "string", maxLength: 2048 } },
  }, required: ["title", "desc"], additionalProperties: false } },
  { name: "update_project", description: "Update an existing project in the owner's draft using its projectId.", inputSchema: { type: "object", properties: {
    projectId: { type: "string", minLength: 1, maxLength: 100 },
    title: BILINGUAL, desc: BILINGUAL, year: { type: "string", maxLength: 12 },
    tags: { type: "array", maxItems: 30, items: { type: "string", maxLength: 40 } },
    url: { type: "string", maxLength: 2048 }, client: BILINGUAL,
    metrics: { type: "string", maxLength: 500 }, images: { type: "array", maxItems: 12, items: { type: "string", maxLength: 2048 } },
  }, required: ["projectId"], additionalProperties: false } },
  { name: "delete_project", description: "Delete one project from the owner's draft using its projectId.", inputSchema: { type: "object", properties: { projectId: { type: "string", minLength: 1, maxLength: 100 } }, required: ["projectId"], additionalProperties: false } },
  { name: "publish_portfolio", description: "Publish the current draft (including custom design & sections) live to the owner's standalone Taqdom site. Explicit action only.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "get_portfolio_blueprint", description: "Inspect the complete creative blueprint of the owner's portfolio draft plus supported custom design capabilities and schema constraints.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "list_templates_and_capabilities", description: "List all 7 built-in archetypes and the full custom design specification (palettes, hero layouts, grids, typography, effects, custom sections) so you can craft an original site beyond preset templates.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "update_portfolio_content", description: "Batch-update draft portfolio content including bilingual identity, badge, skills, links, metrics, career timeline, SEO, discoverability, defaultLang, and base template.", inputSchema: { type: "object", properties: {
    template: { type: "string", enum: TEMPLATE_IDS },
    defaultLang: { type: "string", enum: ["ar", "en"] },
    discoverable: { type: "boolean" },
    name: BILINGUAL, title: BILINGUAL, bio: BILINGUAL, city: BILINGUAL, badge: BILINGUAL,
    skills: { type: "array", maxItems: 100, items: { type: "string", maxLength: 80 } },
    links: { type: "array", maxItems: 50, items: { type: "object", properties: { label: { type: "string", maxLength: 100 }, url: { type: "string", maxLength: 2048 } }, required: ["label", "url"], additionalProperties: false } },
    metrics: { type: "array", maxItems: 12, items: { type: "object", properties: { label: BILINGUAL, value: { type: "string", maxLength: 80 } }, required: ["label", "value"], additionalProperties: false } },
    timeline: { type: "array", maxItems: 25, items: { type: "object", properties: { year: { type: "string", maxLength: 32 }, role: BILINGUAL, org: BILINGUAL, summary: BILINGUAL }, required: ["year", "role", "org", "summary"], additionalProperties: false } },
    seo: { type: "object", properties: { title: { type: "string", maxLength: 180 }, description: { type: "string", maxLength: 400 }, keywords: { type: "array", maxItems: 30, items: { type: "string", maxLength: 60 } }, noindex: { type: "boolean" } }, additionalProperties: false },
    avatar: { type: "string", maxLength: 2048 }, cover: { type: "string", maxLength: 2048 },
    theme: { type: "object", properties: { mode: { type: "string", enum: ["light", "dark", "auto"] }, accent: { type: "string", maxLength: 32 } }, additionalProperties: false },
  }, additionalProperties: false } },
  { name: "design_custom_portfolio_theme", description: "Design and apply a completely bespoke portfolio look and layout (even if completely different from the 7 templates) with custom color palette, typography, hero layout, project grid, GPU visual effects, hero CTAs, section ordering, and custom sections (FAQ, cards, stats, quote, richtext, CTA). Pass enabled=false to revert to a preset template.", inputSchema: { type: "object", properties: {
    enabled: { type: "boolean" },
    fallbackTemplate: { type: "string", enum: TEMPLATE_IDS },
    designName: { type: "string", maxLength: 120 },
    concept: { type: "string", maxLength: 500 },
    palette: { type: "object", properties: {
      background: { type: "string", maxLength: 16 },
      surface: { type: "string", maxLength: 16 },
      surfaceAlt: { type: "string", maxLength: 16 },
      text: { type: "string", maxLength: 16 },
      muted: { type: "string", maxLength: 16 },
      accent: { type: "string", maxLength: 16 },
      accentText: { type: "string", maxLength: 16 },
      border: { type: "string", maxLength: 40 },
      heroGradient: { type: "string", maxLength: 400 },
    }, required: ["background", "surface", "text", "muted", "accent"], additionalProperties: false },
    typography: { type: "object", properties: {
      headingStyle: { type: "string", enum: HEADING_STYLES },
      bodyStyle: { type: "string", enum: BODY_STYLES },
      scale: { type: "string", enum: TYPE_SCALES },
    }, required: ["headingStyle"], additionalProperties: false },
    layout: { type: "object", properties: {
      heroVariant: { type: "string", enum: HERO_VARIANTS },
      projectGrid: { type: "string", enum: PROJECT_GRIDS },
      cardRadius: { type: "string", enum: CARD_RADII },
      maxWidth: { type: "string", enum: MAX_WIDTHS },
      showNav: { type: "boolean" },
      navStyle: { type: "string", enum: NAV_STYLES },
      sectionOrder: { type: "array", maxItems: 6, items: { type: "string", enum: CANVAS_SECTIONS } },
    }, required: ["heroVariant", "projectGrid"], additionalProperties: false },
    effects: { type: "object", properties: {
      ambientGlow: { type: "boolean" },
      glassBlur: { type: "boolean" },
      gridPattern: { type: "string", enum: GRID_PATTERNS },
      hoverLift: { type: "string", enum: HOVER_LIFTS },
      borderStyle: { type: "string", enum: BORDER_STYLES },
    }, additionalProperties: false },
    heroCta: { type: "object", properties: {
      primaryLabel: BILINGUAL,
      primaryUrl: { type: "string", maxLength: 2048 },
      secondaryLabel: BILINGUAL,
      secondaryUrl: { type: "string", maxLength: 2048 },
    }, additionalProperties: false },
    customSections: { type: "array", maxItems: 8, items: { type: "object", properties: {
      id: { type: "string", minLength: 1, maxLength: 60 },
      kind: { type: "string", enum: CUSTOM_SECTION_KINDS },
      title: BILINGUAL,
      subtitle: BILINGUAL,
      content: BILINGUAL,
      items: { type: "array", maxItems: 12, items: { type: "object", properties: {
        title: BILINGUAL,
        description: BILINGUAL,
        badge: { type: "string", maxLength: 60 },
        value: { type: "string", maxLength: 60 },
        url: { type: "string", maxLength: 2048 },
      }, required: ["title"], additionalProperties: false } },
    }, required: ["id", "kind", "title"], additionalProperties: false } },
  }, additionalProperties: false } },
];

const PROMPTS = [
  {
    name: "design-bespoke-portfolio",
    description: "Act as an elite Art Director & Frontend Architect to design a 100% bespoke, original portfolio on Taqdom (outside any preset template) and optionally publish it.",
    arguments: [
      { name: "aesthetic_vibe", description: "Desired aesthetic direction (e.g., Swiss Brutalist, Obsidian Editorial, Cyber Glass, Botanical Minimal)", required: false },
      { name: "primary_language", description: "ar or en", required: false },
    ],
  },
  {
    name: "architect-case-studies",
    description: "Transform existing portfolio projects into crisp, impact-driven bilingual case studies with measurable outcomes.",
    arguments: [{ name: "target_audience", description: "Recruiters, startup founders, enterprise clients, etc.", required: false }],
  },
  {
    name: "rebrand-for-target-role",
    description: "Reposition the portfolio headline, bio, skills, metrics, timeline, and custom design system for a specific target role.",
    arguments: [{ name: "target_role", description: "Target job title or positioning", required: true }],
  },
];

function toolResult(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value };
}

function toolError(message) {
  return { content: [{ type: "text", text: String(message) }], isError: true };
}

function bilingual(value, fieldName) {
  if (typeof value === "string") return { ar: value.slice(0, 12000), en: value.slice(0, 12000) };
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid ${fieldName}: expected text or {ar,en}.`);
  return { ar: String(value.ar || "").slice(0, 12000), en: String(value.en || "").slice(0, 12000) };
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
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("Only safe http(s) URLs are accepted.");
  return parsed.toString();
}

function safeHexColor(value, fieldName) {
  const raw = String(value || "").trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) {
    throw new Error(`Invalid hex color for ${fieldName}: expected #RGB or #RRGGBB.`);
  }
  return raw;
}

function safeBorderColor(value) {
  const raw = String(value || "").trim().slice(0, 40);
  if (!raw) return undefined;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) return raw;
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(raw)) return raw;
  throw new Error("Invalid border color: use hex or rgb(a).");
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

function validateAndSanitizeCustomDesign(args, existingDesign = null) {
  if (args.enabled === false) {
    return { enabled: false };
  }
  if (!args.palette && !existingDesign?.palette) {
    throw new Error("palette (background, surface, text, muted, accent) is required when enabling custom design.");
  }
  const paletteSrc = args.palette || existingDesign.palette;
  const cleanPalette = {
    background: safeHexColor(paletteSrc.background, "palette.background"),
    surface: safeHexColor(paletteSrc.surface, "palette.surface"),
    ...(paletteSrc.surfaceAlt ? { surfaceAlt: safeHexColor(paletteSrc.surfaceAlt, "palette.surfaceAlt") } : {}),
    text: safeHexColor(paletteSrc.text, "palette.text"),
    muted: safeHexColor(paletteSrc.muted, "palette.muted"),
    accent: safeHexColor(paletteSrc.accent, "palette.accent"),
    ...(paletteSrc.accentText ? { accentText: safeHexColor(paletteSrc.accentText, "palette.accentText") } : {}),
    ...(paletteSrc.border ? { border: safeBorderColor(paletteSrc.border) } : {}),
    ...(paletteSrc.heroGradient ? { heroGradient: safeCssGradient(paletteSrc.heroGradient) } : {}),
  };

  const typographySrc = args.typography || existingDesign?.typography || { headingStyle: "display" };
  const cleanTypography = {
    headingStyle: HEADING_STYLES.includes(typographySrc.headingStyle) ? typographySrc.headingStyle : "display",
    bodyStyle: BODY_STYLES.includes(typographySrc.bodyStyle) ? typographySrc.bodyStyle : "sans",
    scale: TYPE_SCALES.includes(typographySrc.scale) ? typographySrc.scale : "balanced",
  };

  const layoutSrc = args.layout || existingDesign?.layout || { heroVariant: "split-showcase", projectGrid: "showcase-cards" };
  const cleanLayout = {
    heroVariant: HERO_VARIANTS.includes(layoutSrc.heroVariant) ? layoutSrc.heroVariant : "split-showcase",
    projectGrid: PROJECT_GRIDS.includes(layoutSrc.projectGrid) ? layoutSrc.projectGrid : "showcase-cards",
    cardRadius: CARD_RADII.includes(layoutSrc.cardRadius) ? layoutSrc.cardRadius : "lg",
    maxWidth: MAX_WIDTHS.includes(layoutSrc.maxWidth) ? layoutSrc.maxWidth : "standard",
    showNav: layoutSrc.showNav !== false,
    navStyle: NAV_STYLES.includes(layoutSrc.navStyle) ? layoutSrc.navStyle : "floating-glass",
    ...(Array.isArray(layoutSrc.sectionOrder)
      ? { sectionOrder: layoutSrc.sectionOrder.filter((s) => CANVAS_SECTIONS.includes(s)).slice(0, 6) }
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

  const heroCtaSrc = args.heroCta || existingDesign?.heroCta;
  const cleanHeroCta = heroCtaSrc
    ? {
        ...(heroCtaSrc.primaryLabel ? { primaryLabel: bilingual(heroCtaSrc.primaryLabel, "heroCta.primaryLabel") } : {}),
        ...(heroCtaSrc.primaryUrl ? { primaryUrl: safeUrl(heroCtaSrc.primaryUrl, { allowMail: true, allowHash: true }) } : {}),
        ...(heroCtaSrc.secondaryLabel ? { secondaryLabel: bilingual(heroCtaSrc.secondaryLabel, "heroCta.secondaryLabel") } : {}),
        ...(heroCtaSrc.secondaryUrl ? { secondaryUrl: safeUrl(heroCtaSrc.secondaryUrl, { allowMail: true, allowHash: true }) } : {}),
      }
    : undefined;

  const sectionsSrc = "customSections" in args ? args.customSections : existingDesign?.customSections;
  const cleanSections = Array.isArray(sectionsSrc)
    ? sectionsSrc.slice(0, 8).map((sec, idx) => {
        if (!sec || typeof sec !== "object") throw new Error("Each customSection must be an object.");
        const kind = CUSTOM_SECTION_KINDS.includes(sec.kind) ? sec.kind : "cards";
        return {
          id: String(sec.id || `custom-${idx + 1}`).replace(/[^a-z0-9_-]/gi, "-").slice(0, 60),
          kind,
          title: bilingual(sec.title || "", "customSection.title"),
          ...(sec.subtitle ? { subtitle: bilingual(sec.subtitle, "customSection.subtitle") } : {}),
          ...(sec.content ? { content: bilingual(sec.content, "customSection.content") } : {}),
          ...(Array.isArray(sec.items)
            ? {
                items: sec.items.slice(0, 12).map((item) => ({
                  title: bilingual(item?.title || "", "customSection.item.title"),
                  ...(item?.description ? { description: bilingual(item.description, "customSection.item.description") } : {}),
                  ...(item?.badge ? { badge: String(item.badge).slice(0, 60) } : {}),
                  ...(item?.value ? { value: String(item.value).slice(0, 60) } : {}),
                  ...(item?.url ? { url: safeUrl(item.url, { allowMail: true, allowHash: true }) } : {}),
                })),
              }
            : {}),
        };
      })
    : undefined;

  return {
    enabled: true,
    designName: String(args.designName || existingDesign?.designName || "Bespoke Sovereign").slice(0, 120),
    ...(args.concept || existingDesign?.concept
      ? { concept: String(args.concept || existingDesign?.concept).slice(0, 500) }
      : {}),
    palette: cleanPalette,
    typography: cleanTypography,
    layout: cleanLayout,
    effects: cleanEffects,
    ...(cleanHeroCta ? { heroCta: cleanHeroCta } : {}),
    ...(cleanSections ? { customSections: cleanSections } : {}),
  };
}

function normalizeProjectFields(args, partial = false) {
  const result = {};
  if ("title" in args) result.title = bilingual(args.title, "title");
  if ("desc" in args) result.desc = bilingual(args.desc, "desc");
  if ("year" in args) result.year = String(args.year || "").slice(0, 12);
  if ("tags" in args) result.tags = Array.isArray(args.tags) ? args.tags.slice(0, 30).map((tag) => String(tag).slice(0, 40)) : [];
  if ("url" in args) result.url = args.url ? safeUrl(args.url) : "";
  if ("client" in args) result.client = args.client ? bilingual(args.client, "client") : null;
  if ("metrics" in args) result.metrics = String(args.metrics || "").slice(0, 500);
  if ("images" in args) result.images = Array.isArray(args.images) ? args.images.slice(0, 12).map((src) => safeUrl(src, { allowLocal: true })) : [];
  if (!partial && (!result.title || !result.desc)) throw new Error("Project title and description are required.");
  return result;
}

function publicProject(project) {
  return {
    id: String(project?.id || ""),
    title: bilingual(project?.title || "", "title"),
    description: bilingual(project?.desc || "", "description"),
    year: String(project?.year || ""),
    tags: Array.isArray(project?.tags) ? project.tags.filter((tag) => typeof tag === "string").slice(0, 30) : [],
    url: typeof project?.url === "string" ? project.url : null,
    client: project?.client ? bilingual(project.client, "client") : null,
    metrics: typeof project?.metrics === "string" ? project.metrics : null,
    images: Array.isArray(project?.images) ? project.images.filter((image) => typeof image === "string").slice(0, 12) : [],
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
    skills: Array.isArray(portfolio.skills) ? portfolio.skills.filter((skill) => typeof skill === "string").slice(0, 100) : [],
    links: Array.isArray(portfolio.links) ? portfolio.links.map((link) => ({ label: String(link?.label || "").slice(0, 100), url: typeof link?.url === "string" ? link.url : "" })).slice(0, 50) : [],
    projects: Array.isArray(portfolio.projects) ? portfolio.projects.map(publicProject) : [],
    metrics: Array.isArray(portfolio.metrics) ? portfolio.metrics.slice(0, 30).map((metric) => ({ label: bilingual(metric?.label || "", "metric label"), value: String(metric?.value || "") })) : [],
    timeline: Array.isArray(portfolio.timeline) ? portfolio.timeline.slice(0, 50).map((item) => ({ year: String(item?.year || ""), role: bilingual(item?.role || "", "role"), organization: bilingual(item?.org || "", "organization"), summary: bilingual(item?.summary || "", "summary") })) : [],
    theme: portfolio.theme && typeof portfolio.theme === "object" ? { mode: ["light", "dark", "auto"].includes(portfolio.theme.mode) ? portfolio.theme.mode : "auto", accent: String(portfolio.theme.accent || "") } : null,
    customDesign: portfolio.customDesign && typeof portfolio.customDesign === "object" ? portfolio.customDesign : null,
    seo: portfolio.seo && typeof portfolio.seo === "object" ? {
      title: typeof portfolio.seo.title === "string" ? portfolio.seo.title : "",
      description: typeof portfolio.seo.description === "string" ? portfolio.seo.description : "",
      keywords: Array.isArray(portfolio.seo.keywords) ? portfolio.seo.keywords.slice(0, 30) : [],
      noindex: Boolean(portfolio.seo.noindex),
    } : null,
    publishedAt: portfolio.publishedAt || null,
    updatedAt: portfolio.updatedAt || null,
  };
}

async function loadOwnedPortfolio(env, username, userId) {
  const row = await env.DB.prepare(
    "SELECT draft_json, published_json FROM portfolios WHERE username = ?1 AND user_id = ?2"
  ).bind(username, userId).first();
  const raw = row?.draft_json || row?.published_json;
  if (!raw) throw new Error("Portfolio not found for this account.");
  let portfolio;
  try { portfolio = JSON.parse(raw); } catch { throw new Error("Portfolio data is invalid."); }
  return portfolio;
}

async function saveOwnedDraft(env, username, userId, portfolio) {
  const now = Date.now();
  const updated = { ...portfolio, username, updatedAt: now };
  const result = await env.DB.prepare(
    "UPDATE portfolios SET draft_json = ?1, template = ?2, updated_at = ?3 WHERE username = ?4 AND user_id = ?5"
  ).bind(JSON.stringify(updated), String(updated.template || "haven"), now, username, userId).run();
  if (result?.meta?.changes === 0 || result?.changes === 0) throw new Error("Draft was not saved. The account ownership check failed.");
  return updated;
}

async function publishOwnedDraft(env, username, userId, portfolio) {
  const now = Date.now();
  const published = { ...portfolio, username, updatedAt: now, publishedAt: now };
  const result = await env.DB.prepare(
    "UPDATE portfolios SET draft_json = ?1, published_json = ?1, published_at = ?2, updated_at = ?2, template = ?5 WHERE username = ?3 AND user_id = ?4"
  ).bind(JSON.stringify(published), now, username, userId, String(published.template || "haven")).run();
  if (result?.meta?.changes === 0 || result?.changes === 0) throw new Error("Publish failed. The account ownership check failed.");
  return published;
}

export async function handleMcpRequest(request, env, username) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "authorization, content-type, mcp-protocol-version" } });
  if (request.method !== "POST") return json({ error: "Streamable HTTP MCP endpoint accepts POST requests." }, 405, { allow: "POST, OPTIONS" });
  if (!env?.DB) return json({ error: "Account storage unavailable" }, 503);
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer (tqd_mcp_[a-f0-9]{64})$/i);
  if (!match) return json({ error: "A valid Taqdom MCP bearer token is required." }, 401, { "www-authenticate": 'Bearer realm="Taqdom MCP"' });
  await ensureSchema(env);
  const tokenHash = await digest(match[1]);
  const tokenRow = await env.DB.prepare(
    "SELECT id, user_id, username FROM mcp_access_tokens WHERE token_hash = ?1 AND revoked_at IS NULL"
  ).bind(tokenHash).first();
  if (!tokenRow || tokenRow.username !== username) return json({ error: "Invalid, revoked, or out-of-scope MCP token." }, 401);
  await env.DB.prepare("UPDATE mcp_access_tokens SET last_used_at = ?1 WHERE id = ?2").bind(Date.now(), tokenRow.id).run();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid JSON-RPC request" }, 400);
  const respond = (result) => json({ jsonrpc: "2.0", id: body.id ?? null, result }, 200, { "mcp-protocol-version": "2025-03-26" });
  const fail = (code, message) => json({ jsonrpc: "2.0", id: body.id ?? null, error: { code, message } }, 200, { "mcp-protocol-version": "2025-03-26" });

  if (body.jsonrpc !== "2.0" || typeof body.method !== "string") return fail(-32600, "Invalid Request");
  if (body.method === "notifications/initialized" || body.method.startsWith("notifications/")) return new Response(null, { status: 202 });
  if (body.method === "initialize") {
    return respond({
      protocolVersion: "2025-03-26",
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
        "To build a completely custom portfolio design beyond any existing preset template, call design_custom_portfolio_theme with an original palette, typography, heroVariant, projectGrid, GPU effects, custom sectionOrder, heroCta, and customSections (cards, stats, faq, quote, richtext, cta). " +
        "Use update_portfolio_content and create_project/update_project for bilingual (ar & en) content. All writes stay in private draft until you explicitly call publish_portfolio.",
    });
  }
  if (body.method === "ping") return respond({});
  if (body.method === "tools/list") return respond({ tools: TOOLS });

  if (body.method === "resources/list") {
    return respond({
      resources: [
        {
          uri: `taqdom://portfolio/${username}/blueprint`,
          name: `${username} Portfolio Blueprint`,
          description: "Live JSON snapshot of the creator's draft portfolio, projects, and active bespoke design.",
          mimeType: "application/json",
        },
        {
          uri: "taqdom://design-system/capabilities",
          name: "Taqdom Bespoke Design Engine Capabilities",
          description: "Complete reference of the 7 built-in styles plus custom palette, hero, grid, typography, effect, and section tokens.",
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
      return respond({
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(DESIGN_CAPABILITIES, null, 2) }],
      });
    }
    const portfolio = await loadOwnedPortfolio(env, username, tokenRow.user_id).catch(() => null);
    if (!portfolio) return fail(-32602, "Portfolio not found");
    const safe = safePortfolio(portfolio, username);
    if (uri === `taqdom://portfolio/${username}/blueprint`) {
      return respond({
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ portfolio: safe, capabilities: DESIGN_CAPABILITIES }, null, 2) }],
      });
    }
    if (uri === `taqdom://portfolio/${username}/creative-brief`) {
      const md = [
        `# Creative Brief — ${safe.name.en || safe.name.ar || username}`,
        `- **Standalone URL:** https://${username}.taqdom.me`,
        `- **Role:** ${safe.title.en || safe.title.ar}`,
        `- **Projects Count:** ${safe.projects.length}`,
        `- **Skills:** ${safe.skills.join(", ") || "Not specified yet"}`,
        `- **Current Mode:** ${safe.customDesign?.enabled ? `Custom Design (${safe.customDesign.designName})` : `Preset Template (${safe.template})`}`,
        `\n## Instructions for AI Designer\nUse \`design_custom_portfolio_theme\` to invent bespoke aesthetics beyond preset templates, ensuring WCAG text contrast and crisp bilingual Arabic/English copy.`,
      ].join("\n");
      return respond({ contents: [{ uri, mimeType: "text/markdown", text: md }] });
    }
    return fail(-32602, "Unknown resource URI");
  }

  if (body.method === "prompts/list") return respond({ prompts: PROMPTS });

  if (body.method === "prompts/get") {
    const promptName = String(body.params?.name || "");
    const pArgs = body.params?.arguments || {};
    if (promptName === "design-bespoke-portfolio") {
      const vibe = String(pArgs.aesthetic_vibe || "editorial luxury tailored to the creator's craft");
      const langPref = String(pArgs.primary_language || "bilingual Arabic + English");
      return respond({
        description: "Bespoke Art Director & Portfolio Architect Prompt",
        messages: [{
          role: "user",
          content: {
            type: "text",
            text:
              `Inspect my portfolio via get_portfolio_blueprint and list_templates_and_capabilities. ` +
              `Design a completely original, bespoke portfolio for me with aesthetic vibe "${vibe}" (${langPref}). ` +
              `Do NOT limit yourself to preset templates: synthesize a cohesive high-contrast hex palette, typography pairing, heroVariant, projectGrid, GPU effects, and customSections (such as FAQ, Principles/Services cards, or CTA banner) using design_custom_portfolio_theme, refine my content with update_portfolio_content, summarize changes, and ask before or run publish_portfolio as requested.`,
          },
        }],
      });
    }
    if (promptName === "architect-case-studies") {
      const audience = String(pArgs.target_audience || "senior hiring leads and founders");
      return respond({
        description: "Case Study Architect Prompt",
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Call list_projects and get_profile, then upgrade each project via update_project with compelling bilingual storytelling, quantified metrics, and sharp positioning tailored to ${audience}. Keep changes in draft until I confirm publish_portfolio.`,
          },
        }],
      });
    }
    if (promptName === "rebrand-for-target-role") {
      const role = String(pArgs.target_role || "Principal Product Architect");
      return respond({
        description: "Career Repositioning Prompt",
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Read my current blueprint using get_portfolio_blueprint. Rebrand my bilingual title, bio, metrics, timeline, and custom visual theme via update_portfolio_content and design_custom_portfolio_theme specifically for the role: ${role}.`,
          },
        }],
      });
    }
    return fail(-32602, "Unknown prompt name");
  }

  if (body.method === "tools/call") {
    const name = body.params?.name;
    const args = body.params?.arguments || {};
    if (!TOOLS.some((tool) => tool.name === name)) return fail(-32602, "Unknown tool");
    try {
      if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Tool arguments must be an object.");
      const portfolio = await loadOwnedPortfolio(env, username, tokenRow.user_id);

      if (name === "get_profile") {
        const safe = safePortfolio(portfolio, username);
        const { projects, metrics, timeline, ...profile } = safe;
        return respond(toolResult(profile));
      }
      if (name === "list_projects") return respond(toolResult((portfolio.projects || []).map(publicProject)));
      if (name === "get_portfolio") return respond(toolResult(safePortfolio(portfolio, username)));
      if (name === "list_templates_and_capabilities") return respond(toolResult(DESIGN_CAPABILITIES));
      if (name === "get_portfolio_blueprint") {
        return respond(toolResult({
          portfolio: safePortfolio(portfolio, username),
          capabilities: DESIGN_CAPABILITIES,
          publicationStatus: {
            isPublished: Boolean(portfolio.publishedAt),
            publishedAt: portfolio.publishedAt || null,
            publicUrl: `https://${username}.taqdom.me`,
          },
        }));
      }

      if (name === "update_profile") {
        const allowed = new Set(["name", "title", "bio", "city", "skills", "links", "avatar", "cover", "theme"]);
        const keys = Object.keys(args);
        if (!keys.length || keys.some((key) => !allowed.has(key))) throw new Error("Provide at least one supported profile field.");
        for (const key of ["name", "title", "bio", "city"]) if (key in args) portfolio[key] = bilingual(args[key], key);
        if ("skills" in args) portfolio.skills = Array.isArray(args.skills) ? args.skills.slice(0, 100).map((skill) => String(skill).slice(0, 80)) : [];
        if ("links" in args) {
          if (!Array.isArray(args.links) || args.links.length > 50) throw new Error("Links must be an array with at most 50 entries.");
          portfolio.links = args.links.map((link) => ({ label: String(link.label || "").slice(0, 100), url: safeUrl(link.url, { allowMail: true }) }));
        }
        for (const key of ["avatar", "cover"]) if (key in args) portfolio[key] = args[key] ? safeUrl(args[key], { allowLocal: true }) : "";
        if ("theme" in args) {
          if (!args.theme || typeof args.theme !== "object" || Array.isArray(args.theme)) throw new Error("Theme must be an object.");
          portfolio.theme = { mode: ["light", "dark", "auto"].includes(args.theme.mode) ? args.theme.mode : (portfolio.theme?.mode || "auto"), accent: /^#[0-9a-f]{6}$/i.test(String(args.theme.accent || "")) ? args.theme.accent : (portfolio.theme?.accent || "#315BFF") };
        }
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return respond(toolResult({ ok: true, savedTo: "draft", published: false, portfolio: safePortfolio(saved, username) }));
      }

      if (name === "update_portfolio_content") {
        const allowed = new Set(["template", "defaultLang", "discoverable", "name", "title", "bio", "city", "badge", "skills", "links", "metrics", "timeline", "seo", "avatar", "cover", "theme"]);
        const keys = Object.keys(args);
        if (!keys.length || keys.some((key) => !allowed.has(key))) throw new Error("Provide at least one supported portfolio content field.");
        if ("template" in args) {
          if (!TEMPLATE_IDS.includes(args.template)) throw new Error("Invalid template ID.");
          portfolio.template = args.template;
        }
        if ("defaultLang" in args) portfolio.defaultLang = args.defaultLang === "en" ? "en" : "ar";
        if ("discoverable" in args) portfolio.discoverable = Boolean(args.discoverable);
        for (const key of ["name", "title", "bio", "city", "badge"]) if (key in args) portfolio[key] = bilingual(args[key], key);
        if ("skills" in args) portfolio.skills = Array.isArray(args.skills) ? args.skills.slice(0, 100).map((s) => String(s).slice(0, 80)) : [];
        if ("links" in args) {
          portfolio.links = (args.links || []).slice(0, 50).map((link) => ({ label: String(link.label || "").slice(0, 100), url: safeUrl(link.url, { allowMail: true }) }));
        }
        if ("metrics" in args) {
          portfolio.metrics = (args.metrics || []).slice(0, 12).map((m) => ({ label: bilingual(m?.label || "", "metric.label"), value: String(m?.value || "").slice(0, 80) }));
        }
        if ("timeline" in args) {
          portfolio.timeline = (args.timeline || []).slice(0, 25).map((item) => ({
            year: String(item?.year || "").slice(0, 32),
            role: bilingual(item?.role || "", "timeline.role"),
            org: bilingual(item?.org || "", "timeline.org"),
            summary: bilingual(item?.summary || "", "timeline.summary"),
          }));
        }
        if ("seo" in args && args.seo && typeof args.seo === "object") {
          portfolio.seo = {
            ...(portfolio.seo || {}),
            ...(typeof args.seo.title === "string" ? { title: args.seo.title.slice(0, 180) } : {}),
            ...(typeof args.seo.description === "string" ? { description: args.seo.description.slice(0, 400) } : {}),
            ...(Array.isArray(args.seo.keywords) ? { keywords: args.seo.keywords.slice(0, 30).map((k) => String(k).slice(0, 60)) } : {}),
            ...("noindex" in args.seo ? { noindex: Boolean(args.seo.noindex) } : {}),
          };
        }
        for (const key of ["avatar", "cover"]) if (key in args) portfolio[key] = args[key] ? safeUrl(args[key], { allowLocal: true }) : "";
        if ("theme" in args && args.theme && typeof args.theme === "object") {
          portfolio.theme = {
            ...(portfolio.theme || {}),
            mode: ["light", "dark", "auto"].includes(args.theme.mode) ? args.theme.mode : (portfolio.theme?.mode || "auto"),
            accent: /^#[0-9a-f]{6}$/i.test(String(args.theme.accent || "")) ? args.theme.accent : (portfolio.theme?.accent || "#315BFF"),
          };
        }
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return respond(toolResult({ ok: true, savedTo: "draft", published: false, portfolio: safePortfolio(saved, username) }));
      }

      if (name === "design_custom_portfolio_theme") {
        const cleanDesign = validateAndSanitizeCustomDesign(args, portfolio.customDesign || null);
        if (cleanDesign.enabled === false) {
          portfolio.customDesign = { ...(portfolio.customDesign || {}), enabled: false };
          if (args.fallbackTemplate && TEMPLATE_IDS.includes(args.fallbackTemplate)) {
            portfolio.template = args.fallbackTemplate;
          }
        } else {
          portfolio.customDesign = cleanDesign;
          if (cleanDesign.palette?.accent) {
            portfolio.theme = {
              ...(portfolio.theme || { mode: "dark", scene3d: { enabled: true, style: "orbital-grid", intensity: 0.7, speed: 0.8, lightAngle: 45 } }),
              accent: cleanDesign.palette.accent,
            };
          }
        }
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return respond(toolResult({
          ok: true,
          savedTo: "draft",
          published: false,
          customDesign: saved.customDesign,
          previewSummary: cleanDesign.enabled
            ? `Applied bespoke theme "${cleanDesign.designName}" (${cleanDesign.layout?.heroVariant} + ${cleanDesign.layout?.projectGrid}) to draft. Call publish_portfolio to go live at https://${username}.taqdom.me.`
            : `Disabled custom theme; active template is ${saved.template}.`,
        }));
      }

      if (name === "create_project") {
        const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
        if (projects.length >= 100) throw new Error("A portfolio can contain at most 100 projects.");
        const project = { id: crypto.randomUUID(), ...normalizeProjectFields(args) };
        portfolio.projects = [...projects, project];
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return respond(toolResult({ ok: true, savedTo: "draft", project: publicProject(project), updatedAt: saved.updatedAt }));
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
        return respond(toolResult({ ok: true, savedTo: "draft", project: publicProject(projects[index]), updatedAt: saved.updatedAt }));
      }
      if (name === "delete_project") {
        const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
        const next = projects.filter((project) => String(project?.id) !== String(args.projectId));
        if (next.length === projects.length) throw new Error("Project not found in this account.");
        portfolio.projects = next;
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return respond(toolResult({ ok: true, savedTo: "draft", deletedProjectId: String(args.projectId), updatedAt: saved.updatedAt }));
      }
      if (name === "publish_portfolio") {
        const published = await publishOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return respond(toolResult({
          ok: true,
          published: true,
          publicUrl: `https://${username}.taqdom.me`,
          publishedAt: published.publishedAt,
          customDesignEnabled: Boolean(published.customDesign?.enabled),
          designName: published.customDesign?.enabled ? published.customDesign.designName : published.template,
        }));
      }
      return fail(-32602, "Unsupported tool");
    } catch (error) {
      return respond(toolError(error instanceof Error ? error.message : "MCP tool failed."));
    }
  }
  return fail(-32601, "Method not found");
}
