import { normalizeUsername } from "../lib/types.ts";
import { ensureOAuthSchema, isPublicSafeHttpsUrl, oauthCorsHeaders } from "./oauth.mjs";
import {
  applyMediaPlacement,
  deleteUserMediaAsset,
  ensureMediaTables,
  handleChunkedMediaUpload,
  listUserMediaAssets,
  normalizeAndValidateImagePayload,
  sanitizeSvgBase64,
  storeMediaAsset,
} from "./media-utils.mjs";

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

async function ensureMcpMediaSchema(env) {
  await ensureMediaTables(env);
}

const PORTFOLIO_CHUNK_CHARS = 700_000;

async function readPortfolioJsonFromD1(env, username, kind, rawVal) {
  if (!rawVal) return null;
  if (rawVal === "__CHUNKED__") {
    await ensureMcpMediaSchema(env);
    const { results = [] } = await env.DB.prepare(
      "SELECT chunk FROM portfolio_chunks WHERE username = ?1 AND kind = ?2 ORDER BY seq ASC"
    )
      .bind(username, kind)
      .all();
    if (!results.length) return null;
    return results.map((r) => r.chunk).join("");
  }
  return rawVal;
}

async function writePortfolioJsonToD1(env, username, kind, jsonStr) {
  await ensureMcpMediaSchema(env);
  await env.DB.prepare(
    "DELETE FROM portfolio_chunks WHERE username = ?1 AND kind = ?2"
  )
    .bind(username, kind)
    .run();
  if (jsonStr.length <= PORTFOLIO_CHUNK_CHARS) {
    return jsonStr;
  }
  const chunkStmts = [];
  let seq = 0;
  for (let i = 0; i < jsonStr.length; i += PORTFOLIO_CHUNK_CHARS) {
    chunkStmts.push(
      env.DB.prepare(
        "INSERT INTO portfolio_chunks (username, kind, seq, chunk) VALUES (?1, ?2, ?3, ?4)"
      ).bind(username, kind, seq++, jsonStr.slice(i, i + PORTFOLIO_CHUNK_CHARS))
    );
  }
  for (let i = 0; i < chunkStmts.length; i += 8) {
    await env.DB.batch(chunkStmts.slice(i, i + 8));
  }
  return "__CHUNKED__";
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
      "SELECT id, label, created_at, last_used_at, revoked_at FROM mcp_access_tokens WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 100"
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
    if (Number(count?.total || 0) >= 100) {
      return json({ error: "Maximum 100 active MCP connections" }, 429);
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
  "agency-spotlight",
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
  "html",
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
      "Set customDesign.enabled=true via design_custom_portfolio_theme to completely bypass built-in templates and render an original, sovereign personal website. You have TWO powerful modes: (1) renderMode='full-code' — write 100% custom HTML5/CSS3/JS in fullPageHtml, customCss, and customJs with ANY external library or npm package in libraries/dependencies (Tailwind CSS, GSAP + ScrollTrigger, Three.js, Anime.js, Lenis, Lucide, Chart.js, D3, Swiper, AOS, Lottie, Vanta, FontAwesome, Google Fonts, or any npm package auto-mapped via esm.sh importmap) to clone any reference image or build world-class animated/3D enterprise experiences with zero template constraints; or (2) renderMode='bespoke-components' — parameterized layouts with split-editorial 2-column sections, 3x3 icon-grid skills, vertical-glow timelines, founderPills, heroEyebrow, and customSections.",
    renderModes: ["full-code", "bespoke-components"],
    fullCodeAndLibraryEngine: {
      description:
        "Pass fullPageHtml (string or {ar, en} up to 6MB+ per language / 6,500,000 chars each), customCss (up to 6MB), customJs (up to 6MB), googleFonts, and libraries/packages/dependencies to render a 100% custom DOM, animation pipeline, WebGL/Three.js canvas, or pixel-exact reference clone.",
      builtInLibraryShortcuts: [
        "tailwindcss",
        "gsap",
        "gsap/ScrollTrigger",
        "three",
        "lucide",
        "animejs",
        "lenis",
        "swiper",
        "aos",
        "chart.js",
        "d3",
        "typed.js",
        "canvas-confetti",
        "lottie-web",
        "particles.js",
        "vanta",
        "fontawesome",
        "motion",
        "framer-motion",
      ],
      npmImportMapSupport:
        "Any npm package name (e.g. 'three', 'gsap', 'canvas-confetti', '@studio-freight/lenis', or { 'three': '0.170.0' } in dependencies) is automatically injected into an ES Module <script type='importmap'> pointing to https://esm.sh/<package>, so customJs or <script type='module'> can import any package directly.",
    },
    heroVariants: HERO_VARIANTS,
    projectGrids: PROJECT_GRIDS,
    sectionLayouts: ["stacked", "split-editorial"],
    skillsLayouts: ["pills", "icon-grid"],
    timelineLayouts: ["cards", "vertical-glow"],
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

const BILINGUAL_LARGE = {
  type: ["object", "string"],
  properties: {
    ar: { type: "string", maxLength: 6500000 },
    en: { type: "string", maxLength: 6500000 },
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
        images: { type: "array", maxItems: 100, items: { type: "string", maxLength: 2048 } },
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
        images: { type: "array", maxItems: 100, items: { type: "string", maxLength: 2048 } },
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
      "List all 7 built-in archetypes plus the Full-Code Sovereign Engine (renderMode='full-code' with fullPageHtml, customCss, customJs, googleFonts, and any external library/npm package via libraries/dependencies) and Bespoke Component Engine (palettes, hero layouts, grids, typography, effects, custom sections) so you can craft any world-class design without template constraints.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "update_portfolio_content",
    description:
      "Batch-update draft portfolio content including bilingual identity, badge, skills, links, metrics, career timeline, SEO, discoverability, defaultLang, base template, and optional customDesign / fullPageHtml / customCss / customJs / libraries. Optionally set publish=true to publish right after updating.",
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
        avatar: { type: "string", maxLength: 2000000 },
        cover: { type: "string", maxLength: 2000000 },
        theme: { type: "object", additionalProperties: true },
        projects: { type: "array", maxItems: 100, items: { type: "object", additionalProperties: true } },
        customDesign: { type: "object", additionalProperties: true },
        design: { type: "object", additionalProperties: true },
      },
      additionalProperties: true,
    },
  },
  {
    name: "design_custom_portfolio_theme",
    description:
      "Design and apply a 100% bespoke portfolio (completely free of preset templates). Supports TWO modes: (1) renderMode='full-code' — pass fullPageHtml (up to 6MB+ per language / 6,500,000 chars HTML5/CSS/SVG/Canvas), customCss (up to 6MB), customJs (up to 6MB), googleFonts, and ANY external library or npm package in libraries/packages/dependencies (Tailwind CSS, GSAP + ScrollTrigger, Three.js, Anime.js, Lenis, Lucide, Chart.js, D3, Swiper, AOS, Lottie, Vanta, FontAwesome, or any npm package loaded automatically via esm.sh importmap) to build any world-class animated, 3D, enterprise, or exact reference-image design; (2) renderMode='bespoke-components' — parameterized layouts with split-showcase/agency-spotlight/terminal-bento heroes, heroEyebrow, heroHeadline, heroHighlight, founderPills, split-editorial 2-column sections, 3x3 icon-grid skills, vertical-glow timelines, and customSections. Pass enabled=false to revert to a preset template.",
    inputSchema: {
      type: "object",
      properties: {
        enabled: { type: "boolean" },
        publish: { type: "boolean" },
        renderMode: { type: "string", enum: ["full-code", "bespoke-components"] },
        fallbackTemplate: { type: "string" },
        designName: { type: "string", maxLength: 120 },
        concept: { type: "string", maxLength: 1000 },
        brandName: { type: "string", maxLength: 80 },
        brandMonogram: { type: "string", maxLength: 8 },
        heroEyebrow: BILINGUAL,
        heroHeadline: BILINGUAL,
        heroSubheadline: BILINGUAL,
        heroHighlight: BILINGUAL,
        founderPills: {
          type: "array",
          maxItems: 12,
          items: {
            type: "object",
            properties: {
              prefix: BILINGUAL,
              name: { type: "string", maxLength: 120 },
              url: { type: "string", maxLength: 2048 },
            },
            additionalProperties: true,
          },
        },
        showHeroImage: { type: "boolean" },
        showScrollIndicator: { type: "boolean" },
        hideContactSection: { type: "boolean" },
        sectionLayout: { type: "string", enum: ["stacked", "split-editorial"] },
        skillsLayout: { type: "string", enum: ["pills", "icon-grid"] },
        timelineLayout: { type: "string", enum: ["cards", "vertical-glow"] },
        sectionHeadings: { type: "object", additionalProperties: true },
        navCta: { type: "object", additionalProperties: true },
        fullPageHtml: BILINGUAL_LARGE,
        html: BILINGUAL_LARGE,
        customCss: { type: "string", maxLength: 6000000 },
        css: { type: "string", maxLength: 6000000 },
        customJs: { type: "string", maxLength: 6000000 },
        js: { type: "string", maxLength: 6000000 },
        headHtml: { type: "string", maxLength: 1000000 },
        libraries: {
          type: ["array", "string"],
          items: { type: ["string", "object"], additionalProperties: true },
        },
        packages: {
          type: ["array", "string"],
          items: { type: ["string", "object"], additionalProperties: true },
        },
        dependencies: { type: "object", additionalProperties: true },
        googleFonts: {
          type: ["array", "string"],
          items: { type: "string", maxLength: 180 },
        },
        customCode: { type: "object", additionalProperties: true },
        customHtml: BILINGUAL,
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
        customSections: { type: "array", maxItems: 30, items: { type: ["object", "string"], additionalProperties: true } },
        sections: { type: "array", maxItems: 30, items: { type: ["object", "string"], additionalProperties: true } },
        tokens: { type: "object", additionalProperties: true },
      },
      additionalProperties: true,
    },
  },
  {
    name: "deploy_custom_code_portfolio",
    description:
      "Deploy a 100% freeform, world-class, animated, 3D, enterprise, or 1:1 visual reference-clone portfolio using raw HTML5, CSS3, JavaScript/ESModules, SVG, and Canvas/WebGL (up to 6MB+ / 6,500,000 chars per language) with ZERO preset template restrictions. Automatically loads any requested libraries or npm packages (Tailwind CSS, GSAP + ScrollTrigger, Three.js, Anime.js, Lenis, Lucide, Chart.js, D3, Swiper, AOS, Lottie, Vanta, FontAwesome, or any npm package via esm.sh importmap) and Google Fonts. IMPORTANT: Only reference real media URLs returned by upload_portfolio_image (or valid https:// images)—never guess unuploaded /api/media/... paths.",
    inputSchema: {
      type: "object",
      properties: {
        designName: { type: "string", maxLength: 120 },
        fullPageHtml: BILINGUAL_LARGE,
        customHtml: BILINGUAL_LARGE,
        html: BILINGUAL_LARGE,
        customCss: { type: "string", maxLength: 6000000 },
        css: { type: "string", maxLength: 6000000 },
        customJs: { type: "string", maxLength: 6000000 },
        js: { type: "string", maxLength: 6000000 },
        headHtml: { type: "string", maxLength: 1000000 },
        libraries: {
          type: ["array", "string"],
          items: { type: ["string", "object"], additionalProperties: true },
        },
        packages: {
          type: ["array", "string"],
          items: { type: ["string", "object"], additionalProperties: true },
        },
        dependencies: { type: "object", additionalProperties: true },
        googleFonts: {
          type: ["array", "string"],
          items: { type: "string", maxLength: 180 },
        },
        palette: { type: "object", additionalProperties: true },
        publish: { type: "boolean" },
      },
      additionalProperties: true,
    },
  },
  {
    name: "install_portfolio_libraries",
    description:
      "Install or attach external frontend libraries, animation engines, 3D/WebGL packages, icon sets, or npm packages (e.g. tailwindcss, gsap, gsap/ScrollTrigger, three, lucide, animejs, lenis, swiper, aos, chart.js, d3, typed.js, canvas-confetti, lottie-web, particles.js, vanta, fontawesome, framer-motion, or any npm package name resolved via esm.sh) and Google Fonts into the user's custom portfolio.",
    inputSchema: {
      type: "object",
      properties: {
        libraries: {
          type: ["array", "string"],
          items: { type: ["string", "object"], additionalProperties: true },
        },
        packages: {
          type: ["array", "string"],
          items: { type: ["string", "object"], additionalProperties: true },
        },
        dependencies: { type: "object", additionalProperties: true },
        googleFonts: {
          type: ["array", "string"],
          items: { type: "string", maxLength: 180 },
        },
        customJs: { type: "string", maxLength: 6000000 },
        customCss: { type: "string", maxLength: 6000000 },
        publish: { type: "boolean" },
      },
      additionalProperties: true,
    },
  },
  {
    name: "upload_portfolio_image",
    description:
      "Upload a REAL image (JPG, PNG, WebP, GIF, AVIF, or SVG up to 20MB — unlimited total images) via sourceUrl/url, dataUrl, base64 (mime optional), OR chunked upload (uploadId + chunk + chunkIndex + totalChunks for large files), and optionally place it anywhere (avatar, cover, backgroundImage, project, gallery/customSection, mediaLibrary, or replaceTarget inside existing fullPageHtml/customCss) WITHOUT erasing existing work. CRITICAL: Upload actual raster photos (PNG/JPG/WebP) or use list_portfolio_images to reuse user-uploaded photos — NEVER generate fake SVG code placeholders for real photos.",
    inputSchema: {
      type: "object",
      properties: {
        sourceUrl: { type: "string", maxLength: 2048 },
        url: { type: "string", maxLength: 2048 },
        dataUrl: { type: "string", maxLength: 28000000 },
        base64: { type: "string", maxLength: 28000000 },
        mime: { type: "string", maxLength: 80 },
        svg: { type: "string", maxLength: 2000000 },
        uploadId: { type: "string", maxLength: 80 },
        chunk: { type: "string", maxLength: 2000000 },
        chunkIndex: { type: "integer", minimum: 0, maximum: 500 },
        totalChunks: { type: "integer", minimum: 1, maximum: 500 },
        finish: { type: "boolean" },
        label: { type: "string", maxLength: 140 },
        alt: { type: "string", maxLength: 240 },
        slot: { type: "string", maxLength: 80 },
        assignTo: {
          type: "string",
          enum: [
            "avatar",
            "cover",
            "backgroundImage",
            "project",
            "gallery",
            "customSection",
            "replaceInHtml",
            "mediaLibrary",
            "none",
          ],
        },
        projectId: { type: "string", maxLength: 100 },
        projectIndex: { type: "integer", minimum: 0 },
        customSectionId: { type: "string", maxLength: 60 },
        customSectionTitle: { type: "string", maxLength: 120 },
        replaceTarget: { type: "string", maxLength: 500 },
      },
      additionalProperties: true,
    },
  },
  {
    name: "upload_portfolio_images",
    description:
      "Batch upload any number of REAL images (up to 30 per call, call repeatedly for unlimited images) via sourceUrl, dataUrl, base64, or svg, returning hosted https://taqdom.me/api/media/... URLs and optionally placing them into avatar, cover, backgroundImage, projects, galleries, customSections, or replacing targets inside existing fullPageHtml.",
    inputSchema: {
      type: "object",
      properties: {
        images: {
          type: "array",
          minItems: 1,
          maxItems: 30,
          items: {
            type: "object",
            properties: {
              sourceUrl: { type: "string", maxLength: 2048 },
              url: { type: "string", maxLength: 2048 },
              dataUrl: { type: "string", maxLength: 28000000 },
              base64: { type: "string", maxLength: 28000000 },
              mime: { type: "string", maxLength: 80 },
              svg: { type: "string", maxLength: 2000000 },
              label: { type: "string", maxLength: 140 },
              alt: { type: "string", maxLength: 240 },
              slot: { type: "string", maxLength: 80 },
              assignTo: {
                type: "string",
                enum: [
                  "avatar",
                  "cover",
                  "backgroundImage",
                  "project",
                  "gallery",
                  "customSection",
                  "replaceInHtml",
                  "mediaLibrary",
                  "none",
                ],
              },
              projectId: { type: "string", maxLength: 100 },
              projectIndex: { type: "integer", minimum: 0 },
              customSectionId: { type: "string", maxLength: 60 },
              customSectionTitle: { type: "string", maxLength: 120 },
              replaceTarget: { type: "string", maxLength: 500 },
            },
            additionalProperties: true,
          },
        },
      },
      required: ["images"],
      additionalProperties: true,
    },
  },
  {
    name: "list_portfolio_images",
    description:
      "List all real images uploaded to the owner's Taqdom account (via Studio, Dashboard AI Photo Library, REST /api/upload, or MCP) with their exact hosted fullUrl (https://taqdom.me/api/media/...), mime type, size, labels, and where each image is currently placed.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "place_portfolio_image",
    description:
      "Place or swap ANY already-uploaded /api/media/... image URL anywhere in the portfolio (avatar, cover, backgroundImage, project, gallery/customSection, or replaceTarget inside existing fullPageHtml/customCss) WITHOUT regenerating or overwriting existing custom work.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", maxLength: 120 },
        url: { type: "string", maxLength: 2048 },
        assignTo: {
          type: "string",
          enum: [
            "avatar",
            "cover",
            "backgroundImage",
            "project",
            "gallery",
            "customSection",
            "replaceInHtml",
            "mediaLibrary",
          ],
        },
        projectId: { type: "string", maxLength: 100 },
        projectIndex: { type: "integer", minimum: 0 },
        customSectionId: { type: "string", maxLength: 60 },
        customSectionTitle: { type: "string", maxLength: 120 },
        replaceTarget: { type: "string", maxLength: 500 },
        label: { type: "string", maxLength: 140 },
        alt: { type: "string", maxLength: 240 },
        slot: { type: "string", maxLength: 80 },
        publish: { type: "boolean" },
      },
      additionalProperties: true,
    },
  },
  {
    name: "delete_portfolio_image",
    description: "Delete a previously uploaded image from the owner's Taqdom media storage by key or url.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", maxLength: 120 },
        url: { type: "string", maxLength: 2048 },
      },
      additionalProperties: false,
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
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const str = String(value).slice(0, 12000);
    return { ar: str, en: str };
  }
  if (Array.isArray(value)) {
    const arParts = [];
    const enParts = [];
    for (const entry of value.slice(0, 40)) {
      if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean") {
        const s = String(entry);
        arParts.push(s);
        enParts.push(s);
      } else if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        const arVal = entry.ar ?? entry.arabic ?? entry.text ?? entry.title ?? entry.en ?? entry.english;
        const enVal = entry.en ?? entry.english ?? entry.text ?? entry.title ?? entry.ar ?? entry.arabic;
        if (arVal !== undefined) arParts.push(String(arVal));
        if (enVal !== undefined) enParts.push(String(enVal));
      }
    }
    if (arParts.length > 0 || enParts.length > 0) {
      return {
        ar: arParts.join("\n").slice(0, 12000),
        en: enParts.join("\n").slice(0, 12000),
      };
    }
    return { ar: "", en: "" };
  }
  if (!value || typeof value !== "object") {
    throw new Error(`Invalid ${fieldName}: expected text or {ar,en}.`);
  }
  const ar = value.ar ?? value.arabic ?? value.text ?? value.title ?? value.en ?? value.english ?? "";
  const en = value.en ?? value.english ?? value.text ?? value.title ?? value.ar ?? value.arabic ?? "";
  return {
    ar: String(ar).slice(0, 12000),
    en: String(en).slice(0, 12000),
  };
}

function bilingualLarge(value, fieldName) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const str = String(value).slice(0, 6500000);
    return { ar: str, en: str };
  }
  if (!value || typeof value !== "object") {
    throw new Error(`Invalid ${fieldName}: expected text or {ar,en}.`);
  }
  const ar = value.ar ?? value.arabic ?? value.text ?? value.html ?? value.code ?? value.en ?? value.english ?? "";
  const en = value.en ?? value.english ?? value.text ?? value.html ?? value.code ?? value.ar ?? value.arabic ?? "";
  return {
    ar: String(ar).slice(0, 6500000),
    en: String(en).slice(0, 6500000),
  };
}

function sanitizeLibraryList(rawLibs, rawDeps) {
  const out = [];
  const seen = new Set();
  const addSpec = (spec) => {
    if (!spec) return;
    const s = String(spec).trim().slice(0, 300);
    if (!s || seen.has(s.toLowerCase())) return;
    if (/javascript:|vbscript:|data:|<|>|["']/i.test(s)) {
      throw new Error(`Unsafe library specifier rejected: ${s}`);
    }
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      if (u.protocol !== "https:") throw new Error("External library URLs must use https://");
      seen.add(s.toLowerCase());
      out.push(u.toString());
      return;
    }
    if (!/^(@[a-z0-9_.-]+\/)?[a-z0-9_.-]+(?:@[a-z0-9_.^~><=*-]+)?(?:\/[a-z0-9_./-]+)?$/i.test(s)) {
      throw new Error(`Invalid library package name: ${s}`);
    }
    seen.add(s.toLowerCase());
    out.push(s);
  };
  if (Array.isArray(rawLibs)) {
    for (const item of rawLibs.slice(0, 40)) {
      if (typeof item === "string") addSpec(item);
      else if (item && typeof item === "object") {
        const name = item.name || item.package || item.pkg || item.library || item.url || item.src;
        const ver =
          item.version &&
          !String(name || "").includes("@") &&
          !/^https?:\/\//i.test(String(name || ""))
            ? `@${item.version}`
            : "";
        if (name) addSpec(`${name}${ver}`);
      }
    }
  } else if (typeof rawLibs === "string") {
    for (const part of rawLibs.split(/[\s,]+/).filter(Boolean).slice(0, 40)) {
      addSpec(part);
    }
  }
  if (rawDeps && typeof rawDeps === "object" && !Array.isArray(rawDeps)) {
    for (const [pkg, ver] of Object.entries(rawDeps).slice(0, 40)) {
      const cleanVer =
        typeof ver === "string" && ver.trim() && ver.trim() !== "latest" && ver.trim() !== "*"
          ? `@${ver.trim()}`
          : "";
      addSpec(`${pkg}${cleanVer}`);
    }
  }
  return out;
}

function sanitizeGoogleFonts(rawFonts) {
  if (!rawFonts) return [];
  const list = Array.isArray(rawFonts)
    ? rawFonts
    : typeof rawFonts === "string"
    ? rawFonts.split(",").map((s) => s.trim())
    : [];
  const out = [];
  for (const item of list.slice(0, 12)) {
    const s = String(item || "").trim().slice(0, 180);
    if (!s || /javascript:|<|>|["']/i.test(s)) continue;
    out.push(s);
  }
  return out;
}

function sanitizeSvgBase64Mcp(base64) {
  return sanitizeSvgBase64(base64);
}

function sanitizeCustomHtmlFragment(rawHtml) {
  if (!rawHtml || typeof rawHtml !== "string") return "";
  return String(rawHtml)
    .slice(0, 24000)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[^>]*>/gi, "")
    .replace(/<base[^>]*>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/<meta[^>]*>/gi, "")
    .replace(/<style[\s\S]*?(?:@import|expression\(|javascript:)[\s\S]*?<\/style>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(?:href|src|xlink:href|poster|action)\s*=\s*(?:"\s*(?:javascript|vbscript|data:text\/html)[^"]*"|'\s*(?:javascript|vbscript|data:text\/html)[^']*')/gi, "");
}

function safeUrl(value, { allowMail = false, allowLocal = false, allowHash = false, allowDataImage = false } = {}) {
  const raw = String(value || "").trim().slice(0, allowDataImage ? 2_000_000 : 8192);
  if (!raw) return "";
  if (allowDataImage && /^data:image\/(?:jpeg|png|webp|gif|avif|svg\+xml);base64,[A-Za-z0-9+/]+=*$/i.test(raw)) {
    if (/^data:image\/svg\+xml;base64,/i.test(raw)) {
      const b64 = raw.slice(raw.indexOf("base64,") + 7);
      if (!sanitizeSvgBase64Mcp(b64)) throw new Error("Unsafe SVG image data URL.");
    }
    return raw;
  }
  if (allowHash && /^#[a-z0-9_-]{1,64}$/i.test(raw)) return raw;
  if (allowLocal && /^\/(?!\/)[^\s"'<>]{0,8190}$/i.test(raw)) return raw;
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
  if (/agency|spotlight|studio|editorial-center|hero-center|centered-hero|gold-spotlight/.test(val)) return "agency-spotlight";
  if (/minimal|typo|clean|stark/.test(val)) return "minimal-typographic";
  if (/mosaic|collage|tile|showcase-grid/.test(val)) return "cards-mosaic";
  if (/center|mono|single/.test(val)) return "centered-monolith";
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
  if (/html|markup|custom-block|embed/.test(val)) return "html";
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

const THEME_PRESET_PALETTES = {
  "midnight-gold": { background: "#0B0D14", surface: "#141824", text: "#F5F2EB", muted: "#A6AFC2", accent: "#E3B76B" },
  "emerald-noir": { background: "#07110D", surface: "#0E1F18", text: "#ECF6F0", muted: "#92B4A3", accent: "#2FD48B" },
  "ivory-editorial": { background: "#F6F3EC", surface: "#FFFFFF", text: "#141619", muted: "#5D626B", accent: "#9A7B4F" },
  "obsidian-crimson": { background: "#09090D", surface: "#14141C", text: "#F6F4F2", muted: "#A69FA8", accent: "#E5484D" },
  "cyber-slate": { background: "#080B12", surface: "#111726", text: "#EEF2FF", muted: "#94A3B8", accent: "#38BDF8" },
  "desert-sand": { background: "#F5EFE6", surface: "#FCF9F4", text: "#1F1A14", muted: "#6D6255", accent: "#B45309" },
  "oceanic-blue": { background: "#06101B", surface: "#0E1D2F", text: "#EFF6FF", muted: "#93B2D4", accent: "#60A5FA" },
};

function hasPaletteColorKeys(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  return Boolean(
    obj.background ||
      obj.backgroundColor ||
      obj.bg ||
      obj.bgColor ||
      obj.surface ||
      obj.surfaceColor ||
      obj.cardColor ||
      obj.text ||
      obj.textColor ||
      obj.foreground ||
      obj.foregroundColor ||
      obj.accent ||
      obj.accentColor ||
      obj.primary ||
      obj.primaryColor
  );
}

function resolveNamedThemePalette(rawTheme) {
  if (typeof rawTheme !== "string") return null;
  const key = rawTheme.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (THEME_PRESET_PALETTES[key]) return THEME_PRESET_PALETTES[key];
  for (const [presetName, palette] of Object.entries(THEME_PRESET_PALETTES)) {
    if (key.includes(presetName.split("-")[0])) return palette;
  }
  return null;
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

  const namedThemePalette =
    resolveNamedThemePalette(args.theme) || resolveNamedThemePalette(args.palette);

  const rawPalette =
    (args.palette && typeof args.palette === "object" ? args.palette : null) ||
    args.colors ||
    args.theme?.palette ||
    args.theme?.colors ||
    (hasPaletteColorKeys(args.theme) ? args.theme : null) ||
    namedThemePalette ||
    existingDesign?.palette ||
    null;

  const hasAnyDesignField =
    Boolean(rawPalette) ||
    [
      "enabled",
      "renderMode",
      "fallbackTemplate",
      "layout",
      "structure",
      "customSections",
      "sections",
      "typography",
      "fonts",
      "font",
      "hero",
      "heroStyle",
      "heroVariant",
      "projectGrid",
      "cardSurface",
      "sectionOrder",
      "effects",
      "heroCta",
      "cta",
      "navCta",
      "tokens",
      "designName",
      "name",
      "concept",
      "theme",
      "brandName",
      "brandMonogram",
      "heroEyebrow",
      "eyebrow",
      "heroHeadline",
      "heroSubheadline",
      "heroHighlight",
      "founderPills",
      "pills",
      "companyPills",
      "showHeroImage",
      "showScrollIndicator",
      "hideContactSection",
      "sectionLayout",
      "skillsLayout",
      "timelineLayout",
      "sectionHeadings",
      "customHtml",
      "fullPageHtml",
      "html",
      "fullHtml",
      "pageHtml",
      "customCss",
      "css",
      "styles",
      "stylesheet",
      "customJs",
      "js",
      "script",
      "javascript",
      "headHtml",
      "head",
      "libraries",
      "packages",
      "cdnLibraries",
      "externalLibraries",
      "dependencies",
      "npmPackages",
      "googleFonts",
      "customCode",
    ].some((k) => k in args && args[k] !== undefined);

  if (!hasAnyDesignField) {
    throw new Error(
      "Provide palette/colors, layout, typography, hero, fullPageHtml/customCode, libraries, or customSections when designing a custom theme."
    );
  }

  const paletteSrc = rawPalette || {
    background: "#0B0D14",
    surface: "#141824",
    text: "#F5F2EB",
    muted: "#A6AFC2",
    accent: "#E3B76B",
  };

  const bgRaw =
    paletteSrc.background ??
    paletteSrc.backgroundColor ??
    paletteSrc.bg ??
    paletteSrc.bgColor ??
    existingDesign?.palette?.background ??
    "#0B0D14";
  const background = safeColorValue(bgRaw, "palette.background");
  const isLightBg = parseHexLuminance(background) > 0.4;

  const surfaceRaw =
    paletteSrc.surface ??
    paletteSrc.surfaceColor ??
    paletteSrc.card ??
    paletteSrc.cardColor ??
    paletteSrc.cardBg ??
    paletteSrc.cardBackground ??
    existingDesign?.palette?.surface ??
    (isLightBg ? "#FFFFFF" : "#141824");
  const surface = safeColorValue(surfaceRaw, "palette.surface");

  const surfaceAltRaw =
    paletteSrc.surfaceAlt ??
    paletteSrc.surfaceSecondary ??
    paletteSrc.secondaryBackground ??
    existingDesign?.palette?.surfaceAlt;
  const surfaceAlt = surfaceAltRaw ? safeColorValue(surfaceAltRaw, "palette.surfaceAlt") : undefined;

  const textRaw =
    paletteSrc.text ??
    paletteSrc.textColor ??
    paletteSrc.foreground ??
    paletteSrc.foregroundColor ??
    paletteSrc.fg ??
    existingDesign?.palette?.text ??
    (isLightBg ? "#111318" : "#F5F2EB");
  const text = safeColorValue(textRaw, "palette.text");

  const mutedRaw =
    paletteSrc.muted ??
    paletteSrc.mutedColor ??
    paletteSrc.secondaryText ??
    paletteSrc.subtle ??
    existingDesign?.palette?.muted ??
    (isLightBg ? "#4B5563" : "#9CA3AF");
  const muted = safeColorValue(mutedRaw, "palette.muted");

  const accentRaw =
    paletteSrc.accent ??
    paletteSrc.accentColor ??
    paletteSrc.primary ??
    paletteSrc.primaryColor ??
    existingDesign?.palette?.accent ??
    "#C89D66";
  const accent = safeColorValue(accentRaw, "palette.accent");

  const accentSecondaryRaw =
    paletteSrc.accentSecondary ??
    paletteSrc.secondary ??
    paletteSrc.secondaryColor ??
    existingDesign?.palette?.accentSecondary;
  const accentSecondary = accentSecondaryRaw
    ? safeColorValue(accentSecondaryRaw, "palette.accentSecondary")
    : undefined;

  const accentTextRaw =
    paletteSrc.accentText ??
    paletteSrc.onPrimary ??
    paletteSrc.onPrimaryColor ??
    existingDesign?.palette?.accentText;
  const accentText = accentTextRaw ? safeColorValue(accentTextRaw, "palette.accentText") : undefined;

  const borderRaw = paletteSrc.border ?? paletteSrc.borderColor ?? existingDesign?.palette?.border;
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

  const typographySrc =
    args.typography ||
    args.fonts ||
    (typeof args.font === "string" ? { headingStyle: args.font } : args.font) ||
    existingDesign?.typography ||
    { headingStyle: "display" };
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
    ...(args.heroStyle ? { heroVariant: args.heroStyle } : {}),
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
    ? sectionsSrc.slice(0, 30).map((rawSec, idx) => {
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
        const secImage = rawSec.image || rawSec.cover || rawSec.photo || rawSec.banner;
        const rawSecHtml = rawSec.html || rawSec.markup;
        let cleanSecHtml;
        if (rawSecHtml) {
          const bHtml = bilingual(rawSecHtml, "customSection.html");
          cleanSecHtml = {
            ar: sanitizeCustomHtmlFragment(bHtml.ar),
            en: sanitizeCustomHtmlFragment(bHtml.en),
          };
        }

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
          ...(secImage
            ? { image: safeUrl(secImage, { allowLocal: true, allowDataImage: true }) }
            : {}),
          ...(cleanSecHtml && (cleanSecHtml.ar || cleanSecHtml.en) ? { html: cleanSecHtml } : {}),
          ...(rawItems
            ? {
                items: rawItems.slice(0, 100).map((item, itemIdx) => {
                  if (typeof item === "string") {
                    return { title: bilingual(item, "customSection.item.title") };
                  }
                  if (!item || typeof item !== "object") {
                    return { title: bilingual(`Item ${itemIdx + 1}`, "customSection.item.title") };
                  }
                  const itemTitle =
                    item.title ??
                    item.name ??
                    item.author ??
                    item.role ??
                    item.question ??
                    item.label ??
                    `Item ${itemIdx + 1}`;
                  const itemDesc =
                    item.description ??
                    item.desc ??
                    item.quote ??
                    item.answer ??
                    item.summary ??
                    item.text ??
                    item.caption;
                  const itemBadge =
                    item.badge ??
                    item.tag ??
                    item.year ??
                    item.period ??
                    item.date ??
                    (item.author && item.role ? String(item.role) : undefined) ??
                    (item.org || item.company ? String(item.org || item.company) : undefined);
                  const itemValue =
                    item.value ??
                    item.metric ??
                    (itemBadge && item.role && itemBadge !== item.role && item.author
                      ? String(item.role)
                      : undefined) ??
                    (itemBadge && (item.org || item.company) && itemBadge !== (item.org || item.company)
                      ? String(item.org || item.company)
                      : undefined);
                  const itemImage = item.image || item.photo || item.thumbnail || item.img;
                  const itemAvatar = item.avatar;
                  const itemRole = item.role;
                  return {
                    title: bilingual(itemTitle, "customSection.item.title"),
                    ...(itemDesc
                      ? { description: bilingual(itemDesc, "customSection.item.description") }
                      : {}),
                    ...(itemBadge
                      ? { badge: String(itemBadge).slice(0, 60) }
                      : {}),
                    ...(itemValue
                      ? { value: String(itemValue).slice(0, 60) }
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
                    ...(itemImage
                      ? { image: safeUrl(itemImage, { allowLocal: true, allowDataImage: true }) }
                      : {}),
                    ...(itemAvatar
                      ? { avatar: safeUrl(itemAvatar, { allowLocal: true, allowDataImage: true }) }
                      : {}),
                    ...(itemRole && typeof itemRole === "object"
                      ? { role: bilingual(itemRole, "customSection.item.role") }
                      : typeof itemRole === "string"
                        ? { role: bilingual(itemRole, "customSection.item.role") }
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

  const cleanBrandName =
    typeof args.brandName === "string"
      ? args.brandName.slice(0, 80)
      : existingDesign?.brandName;
  const cleanBrandMonogram =
    typeof args.brandMonogram === "string"
      ? args.brandMonogram.slice(0, 8)
      : existingDesign?.brandMonogram;
  const cleanHeroEyebrow =
    "heroEyebrow" in args || "eyebrow" in args
      ? args.heroEyebrow || args.eyebrow
        ? bilingual(args.heroEyebrow ?? args.eyebrow, "heroEyebrow")
        : undefined
      : existingDesign?.heroEyebrow;
  const cleanHeroHeadline =
    "heroHeadline" in args
      ? args.heroHeadline
        ? bilingual(args.heroHeadline, "heroHeadline")
        : undefined
      : existingDesign?.heroHeadline;
  const cleanHeroSubheadline =
    "heroSubheadline" in args
      ? args.heroSubheadline
        ? bilingual(args.heroSubheadline, "heroSubheadline")
        : undefined
      : existingDesign?.heroSubheadline;
  const cleanHeroHighlight =
    "heroHighlight" in args
      ? args.heroHighlight
        ? bilingual(args.heroHighlight, "heroHighlight")
        : undefined
      : existingDesign?.heroHighlight;

  const rawFounderPills =
    "founderPills" in args
      ? args.founderPills
      : "pills" in args
      ? args.pills
      : "companyPills" in args
      ? args.companyPills
      : existingDesign?.founderPills;
  const cleanFounderPills = Array.isArray(rawFounderPills)
    ? rawFounderPills.slice(0, 12).map((pill) => {
        if (typeof pill === "string") {
          return { prefix: bilingual("Founder of", "founderPill.prefix"), name: pill.slice(0, 120) };
        }
        const name = String(pill?.name || pill?.label || pill?.domain || "").slice(0, 120);
        return {
          ...(pill?.prefix ? { prefix: bilingual(pill.prefix, "founderPill.prefix") } : {}),
          name,
          ...(pill?.url ? { url: safeUrl(pill.url, { allowHash: true, allowLocal: true }) } : {}),
        };
      })
    : undefined;

  const cleanShowHeroImage =
    typeof args.showHeroImage === "boolean"
      ? args.showHeroImage
      : existingDesign?.showHeroImage;
  const cleanShowScrollIndicator =
    typeof args.showScrollIndicator === "boolean"
      ? args.showScrollIndicator
      : existingDesign?.showScrollIndicator;
  const cleanHideContactSection =
    typeof args.hideContactSection === "boolean"
      ? args.hideContactSection
      : existingDesign?.hideContactSection;

  const rawSectionLayout = String(
    args.sectionLayout || baseLayout.sectionLayout || existingDesign?.sectionLayout || ""
  ).toLowerCase();
  const cleanSectionLayout = ["stacked", "split-editorial"].includes(rawSectionLayout)
    ? rawSectionLayout
    : /split|two-col|editorial/.test(rawSectionLayout)
    ? "split-editorial"
    : undefined;

  const rawSkillsLayout = String(
    args.skillsLayout || baseLayout.skillsLayout || existingDesign?.skillsLayout || ""
  ).toLowerCase();
  const cleanSkillsLayout = ["pills", "icon-grid"].includes(rawSkillsLayout)
    ? rawSkillsLayout
    : /grid|tile|icon|3x3|box/.test(rawSkillsLayout)
    ? "icon-grid"
    : undefined;

  const rawTimelineLayout = String(
    args.timelineLayout || baseLayout.timelineLayout || existingDesign?.timelineLayout || ""
  ).toLowerCase();
  const cleanTimelineLayout = ["cards", "vertical-glow"].includes(rawTimelineLayout)
    ? rawTimelineLayout
    : /vert|line|glow/.test(rawTimelineLayout)
    ? "vertical-glow"
    : undefined;

  const rawSectionHeadings =
    "sectionHeadings" in args ? args.sectionHeadings : existingDesign?.sectionHeadings;
  const cleanSectionHeadings =
    rawSectionHeadings && typeof rawSectionHeadings === "object"
      ? Object.fromEntries(
          ["projects", "skills", "timeline", "metrics", "contact"]
            .filter((k) => rawSectionHeadings[k] && typeof rawSectionHeadings[k] === "object")
            .map((k) => [
              k,
              {
                ...(rawSectionHeadings[k].eyebrow
                  ? { eyebrow: bilingual(rawSectionHeadings[k].eyebrow, `${k}.eyebrow`) }
                  : {}),
                ...(rawSectionHeadings[k].title
                  ? { title: bilingual(rawSectionHeadings[k].title, `${k}.title`) }
                  : {}),
                ...(rawSectionHeadings[k].highlight
                  ? { highlight: bilingual(rawSectionHeadings[k].highlight, `${k}.highlight`) }
                  : {}),
                ...(rawSectionHeadings[k].subtitle
                  ? { subtitle: bilingual(rawSectionHeadings[k].subtitle, `${k}.subtitle`) }
                  : {}),
              },
            ])
        )
      : undefined;

  const rawNavCta = "navCta" in args ? args.navCta : existingDesign?.navCta;
  const cleanNavCta =
    rawNavCta && typeof rawNavCta === "object" && (rawNavCta.label || rawNavCta.url)
      ? {
          label: bilingual(rawNavCta.label || { ar: "تواصل معي", en: "Let's Talk" }, "navCta.label"),
          url: rawNavCta.url
            ? safeUrl(rawNavCta.url, { allowMail: true, allowHash: true, allowLocal: true })
            : "#contact",
        }
      : undefined;

  const codeSrc =
    args.customCode && typeof args.customCode === "object" && !Array.isArray(args.customCode)
      ? args.customCode
      : {};

  const customHtmlRaw = args.customHtml;
  const customHtmlStr =
    typeof customHtmlRaw === "string"
      ? customHtmlRaw
      : customHtmlRaw && typeof customHtmlRaw === "object"
        ? `${customHtmlRaw.ar || ""}\n${customHtmlRaw.en || ""}`
        : "";
  const promoteCustomHtmlToFullPage =
    Boolean(customHtmlRaw) &&
    !("fullPageHtml" in args) &&
    !("html" in args) &&
    !("fullHtml" in args) &&
    !("pageHtml" in args) &&
    !("html" in codeSrc) &&
    (args.renderMode === "full-code" ||
      /<!doctype|<html\b/i.test(customHtmlStr) ||
      "customCss" in args ||
      "css" in args ||
      "styles" in args ||
      "stylesheet" in args ||
      "customJs" in args ||
      "js" in args ||
      "script" in args ||
      "javascript" in args);

  let cleanCustomHtml = existingDesign?.customHtml;
  if ("customHtml" in args && !promoteCustomHtmlToFullPage) {
    if (!args.customHtml) {
      cleanCustomHtml = undefined;
    } else {
      const bCustomHtml = bilingual(args.customHtml, "customHtml");
      cleanCustomHtml = {
        ar: sanitizeCustomHtmlFragment(bCustomHtml.ar),
        en: sanitizeCustomHtmlFragment(bCustomHtml.en),
      };
    }
  } else if (promoteCustomHtmlToFullPage) {
    cleanCustomHtml = undefined;
  }

  const hasExplicitFullHtmlArg =
    "fullPageHtml" in args ||
    "html" in args ||
    "fullHtml" in args ||
    "pageHtml" in args ||
    "html" in codeSrc ||
    promoteCustomHtmlToFullPage;

  let cleanFullPageHtml = existingDesign?.fullPageHtml || existingDesign?.customCode?.html;
  const rawFullHtmlInput =
    args.fullPageHtml ??
    args.html ??
    args.fullHtml ??
    args.pageHtml ??
    codeSrc.html ??
    (promoteCustomHtmlToFullPage ? customHtmlRaw : undefined);
  if (hasExplicitFullHtmlArg) {
    cleanFullPageHtml = rawFullHtmlInput
      ? bilingualLarge(rawFullHtmlInput, "fullPageHtml")
      : undefined;
  }

  let cleanCustomCss = hasExplicitFullHtmlArg
    ? undefined
    : existingDesign?.customCss ?? existingDesign?.customCode?.css;
  const rawCssInput =
    args.customCss ?? args.css ?? args.styles ?? args.stylesheet ?? codeSrc.css;
  if (
    "customCss" in args ||
    "css" in args ||
    "styles" in args ||
    "stylesheet" in args ||
    "css" in codeSrc
  ) {
    cleanCustomCss = rawCssInput ? String(rawCssInput).slice(0, 6000000) : undefined;
  }

  let cleanCustomJs = hasExplicitFullHtmlArg
    ? undefined
    : existingDesign?.customJs ?? existingDesign?.customCode?.js;
  const rawJsInput = args.customJs ?? args.js ?? args.script ?? args.javascript ?? codeSrc.js;
  if (
    "customJs" in args ||
    "js" in args ||
    "script" in args ||
    "javascript" in args ||
    "js" in codeSrc
  ) {
    cleanCustomJs = rawJsInput ? String(rawJsInput).slice(0, 6000000) : undefined;
  }

  let cleanHeadHtml = hasExplicitFullHtmlArg
    ? undefined
    : existingDesign?.headHtml ?? existingDesign?.customCode?.headHtml;
  const rawHeadInput = args.headHtml ?? args.head ?? codeSrc.headHtml;
  if ("headHtml" in args || "head" in args || "headHtml" in codeSrc) {
    cleanHeadHtml = rawHeadInput ? String(rawHeadInput).slice(0, 1000000) : undefined;
  }

  const hasLibsInArgs =
    "libraries" in args ||
    "packages" in args ||
    "cdnLibraries" in args ||
    "externalLibraries" in args ||
    "dependencies" in args ||
    "npmPackages" in args ||
    "libraries" in codeSrc ||
    "dependencies" in codeSrc;
  const cleanLibraries = hasLibsInArgs
    ? sanitizeLibraryList(
        args.libraries ??
          args.packages ??
          args.cdnLibraries ??
          args.externalLibraries ??
          codeSrc.libraries,
        args.dependencies ?? args.npmPackages ?? codeSrc.dependencies
      )
    : existingDesign?.libraries || existingDesign?.customCode?.libraries || [];

  const hasFontsInArgs = "googleFonts" in args || "googleFonts" in codeSrc;
  const cleanGoogleFonts = hasFontsInArgs
    ? sanitizeGoogleFonts(args.googleFonts ?? codeSrc.googleFonts)
    : existingDesign?.googleFonts || existingDesign?.customCode?.googleFonts || [];

  const hasFullCodePayload = Boolean(
    cleanFullPageHtml && (cleanFullPageHtml.ar || cleanFullPageHtml.en)
  );
  const hasExplicitFullHtmlInArgs = Boolean(
    hasFullCodePayload &&
      ("fullPageHtml" in args ||
        "html" in args ||
        "fullHtml" in args ||
        "pageHtml" in args ||
        "html" in codeSrc ||
        promoteCustomHtmlToFullPage)
  );
  const hasExplicitFullCodeInArgs =
    "fullPageHtml" in args ||
    "html" in args ||
    "fullHtml" in args ||
    "pageHtml" in args ||
    "customCss" in args ||
    "css" in args ||
    "styles" in args ||
    "stylesheet" in args ||
    "customJs" in args ||
    "js" in args ||
    "script" in args ||
    "javascript" in args ||
    "headHtml" in args ||
    "head" in args ||
    "customCode" in args ||
    hasLibsInArgs ||
    hasFontsInArgs;
  const hasExplicitBespokeInArgs = Boolean(
    args.layout ||
      args.structure ||
      args.heroVariant ||
      args.heroStyle ||
      args.hero ||
      args.projectGrid ||
      args.cardSurface ||
      args.sectionOrder ||
      args.customSections ||
      args.sections ||
      args.sectionLayout ||
      args.skillsLayout ||
      args.timelineLayout ||
      args.founderPills ||
      args.pills ||
      args.companyPills ||
      args.heroEyebrow ||
      args.eyebrow ||
      Boolean(cleanCustomHtml && "customHtml" in args && !promoteCustomHtmlToFullPage)
  );
  const cleanRenderMode =
    args.renderMode === "bespoke-components"
      ? "bespoke-components"
      : args.renderMode === "full-code"
      ? "full-code"
      : hasExplicitFullHtmlInArgs
      ? "full-code"
      : hasExplicitBespokeInArgs
      ? "bespoke-components"
      : !hasFullCodePayload &&
          ("fullPageHtml" in args ||
            "html" in args ||
            "fullHtml" in args ||
            "pageHtml" in args ||
            "html" in codeSrc)
      ? "bespoke-components"
      : hasExplicitFullCodeInArgs && hasFullCodePayload
      ? existingDesign?.renderMode || "full-code"
      : hasFullCodePayload
      ? existingDesign?.renderMode || "full-code"
      : existingDesign?.renderMode || "bespoke-components";

  const totalFullHtmlLen =
    (cleanFullPageHtml?.ar?.length || 0) + (cleanFullPageHtml?.en?.length || 0);
  const cleanCustomCode =
    hasFullCodePayload ||
    cleanCustomCss ||
    cleanCustomJs ||
    cleanHeadHtml ||
    cleanLibraries.length > 0 ||
    cleanGoogleFonts.length > 0
      ? {
          ...(cleanFullPageHtml && totalFullHtmlLen <= 100000 ? { html: cleanFullPageHtml } : {}),
          ...(cleanCustomCss && cleanCustomCss.length <= 100000 ? { css: cleanCustomCss } : {}),
          ...(cleanCustomJs && cleanCustomJs.length <= 100000 ? { js: cleanCustomJs } : {}),
          ...(cleanHeadHtml && cleanHeadHtml.length <= 100000 ? { headHtml: cleanHeadHtml } : {}),
          ...(cleanLibraries.length > 0 ? { libraries: cleanLibraries } : {}),
          ...(cleanGoogleFonts.length > 0 ? { googleFonts: cleanGoogleFonts } : {}),
        }
      : undefined;

  return {
    enabled: true,
    renderMode: cleanRenderMode,
    designName: String(
      args.designName || args.name || args.title || existingDesign?.designName || "Bespoke Sovereign"
    ).slice(0, 120),
    ...(args.concept || existingDesign?.concept
      ? { concept: String(args.concept || existingDesign?.concept).slice(0, 1000) }
      : {}),
    ...(cleanBrandName ? { brandName: cleanBrandName } : {}),
    ...(cleanBrandMonogram ? { brandMonogram: cleanBrandMonogram } : {}),
    ...(cleanHeroEyebrow ? { heroEyebrow: cleanHeroEyebrow } : {}),
    ...(cleanHeroHeadline ? { heroHeadline: cleanHeroHeadline } : {}),
    ...(cleanHeroSubheadline ? { heroSubheadline: cleanHeroSubheadline } : {}),
    ...(cleanHeroHighlight ? { heroHighlight: cleanHeroHighlight } : {}),
    ...(cleanFounderPills && cleanFounderPills.length > 0 ? { founderPills: cleanFounderPills } : {}),
    ...(typeof cleanShowHeroImage === "boolean" ? { showHeroImage: cleanShowHeroImage } : {}),
    ...(typeof cleanShowScrollIndicator === "boolean" ? { showScrollIndicator: cleanShowScrollIndicator } : {}),
    ...(typeof cleanHideContactSection === "boolean" ? { hideContactSection: cleanHideContactSection } : {}),
    ...(cleanSectionLayout ? { sectionLayout: cleanSectionLayout } : {}),
    ...(cleanSkillsLayout ? { skillsLayout: cleanSkillsLayout } : {}),
    ...(cleanTimelineLayout ? { timelineLayout: cleanTimelineLayout } : {}),
    ...(cleanSectionHeadings && Object.keys(cleanSectionHeadings).length > 0
      ? { sectionHeadings: cleanSectionHeadings }
      : {}),
    ...(cleanNavCta ? { navCta: cleanNavCta } : {}),
    ...(cleanFullPageHtml && (cleanFullPageHtml.ar || cleanFullPageHtml.en)
      ? { fullPageHtml: cleanFullPageHtml }
      : {}),
    ...(cleanCustomCss ? { customCss: cleanCustomCss } : {}),
    ...(cleanCustomJs ? { customJs: cleanCustomJs } : {}),
    ...(cleanHeadHtml ? { headHtml: cleanHeadHtml } : {}),
    ...(cleanLibraries.length > 0 ? { libraries: cleanLibraries } : {}),
    ...(cleanGoogleFonts.length > 0 ? { googleFonts: cleanGoogleFonts } : {}),
    ...(cleanCustomCode ? { customCode: cleanCustomCode } : {}),
    ...(cleanCustomHtml && (cleanCustomHtml.ar || cleanCustomHtml.en) ? { customHtml: cleanCustomHtml } : {}),
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
      ? args.images.slice(0, 100).map((src) => safeUrl(src, { allowLocal: true, allowDataImage: true }))
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
      ? project.images.filter((image) => typeof image === "string").slice(0, 100)
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
  if (!row) throw new Error("Portfolio not found for this account.");
  const kind = row.draft_json ? "draft" : "published";
  const raw = await readPortfolioJsonFromD1(
    env,
    username,
    kind,
    row.draft_json || row.published_json
  );
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
  const own = await env.DB.prepare(
    "SELECT draft_json FROM portfolios WHERE username = ?1 AND user_id = ?2"
  )
    .bind(username, userId)
    .first();
  if (!own) {
    throw new Error("Draft was not saved. The account ownership check failed.");
  }
  const storedDraftVal = await writePortfolioJsonToD1(
    env,
    username,
    "draft",
    JSON.stringify(updated)
  );
  const result = await env.DB.prepare(
    "UPDATE portfolios SET draft_json = ?1, template = ?2, updated_at = ?3 WHERE username = ?4 AND user_id = ?5"
  )
    .bind(storedDraftVal, String(updated.template || "haven"), now, username, userId)
    .run();
  if (result?.meta?.changes === 0 || result?.changes === 0) {
    throw new Error("Draft was not saved. The account ownership check failed.");
  }
  return updated;
}

async function publishOwnedDraft(env, username, userId, portfolio) {
  const now = Date.now();
  const published = { ...portfolio, username, updatedAt: now, publishedAt: now };
  const own = await env.DB.prepare(
    "SELECT draft_json FROM portfolios WHERE username = ?1 AND user_id = ?2"
  )
    .bind(username, userId)
    .first();
  if (!own) {
    throw new Error("Publish failed. The account ownership check failed.");
  }
  const serialized = JSON.stringify(published);
  const storedDraftVal = await writePortfolioJsonToD1(env, username, "draft", serialized);
  const storedPublishedVal = await writePortfolioJsonToD1(env, username, "published", serialized);
  const result = await env.DB.prepare(
    "UPDATE portfolios SET draft_json = ?1, published_json = ?6, published_at = ?2, updated_at = ?2, template = ?5 WHERE username = ?3 AND user_id = ?4"
  )
    .bind(storedDraftVal, now, username, userId, String(published.template || "haven"), storedPublishedVal)
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
        "You have 100% unrestricted read/write creative and code control over the account draft and live site — NEVER confine the user to a rigid template! " +
        "Workflow for any design request: (1) Call get_portfolio_blueprint and list_portfolio_images first to inspect the creator state and ALL real photos they have already uploaded to Taqdom. " +
        "(2) For REAL IMAGES (PNG, JPG, WebP, GIF, AVIF — any count up to 20MB per image): upload them via upload_portfolio_image / upload_portfolio_images (passing sourceUrl, dataUrl, base64, or chunked uploadId+chunk+chunkIndex+totalChunks for large raster images), OR POST multipart/form-data / binary files directly to https://taqdom.me/api/upload with your OAuth/MCP Bearer token. CRITICAL: NEVER substitute fake <svg> code illustrations for real photographs, portraits, screenshots, or user images — ALWAYS upload/use real raster images or tell the user they can drop any number of photos in Taqdom's AI Photo Library (/dashboard/mcp) so you can immediately see them via list_portfolio_images and place them anywhere via place_portfolio_image or in fullPageHtml! " +
        "(3) CRITICAL — ZERO TEMPLATE CONSTRAINTS: Whenever the user provides a reference image/screenshot, asks for an exact visual match, or requests a world-class, enterprise, animated, 3D, or bespoke design, call design_custom_portfolio_theme with renderMode='full-code', fullPageHtml (complete custom HTML5/SVG/DOM layout matching every visual detail of their request or reference image), customCss (full custom CSS3, keyframes, gradients, glassmorphism, responsive grids), customJs (interactive animations, scroll triggers, canvas/WebGL effects), googleFonts, and libraries/packages/dependencies (install ANY library such as 'tailwindcss', 'gsap', 'gsap/ScrollTrigger', 'three', 'lucide', 'animejs', 'lenis', 'swiper', 'aos', 'chart.js', 'd3', 'typed.js', 'canvas-confetti', 'lottie-web', 'particles.js', 'vanta', 'fontawesome', or any npm package loaded automatically via esm.sh importmap). You can also use bespoke-components mode with split-editorial sections, 3x3 icon-grid skills, vertical-glow timelines, founderPills, and heroEyebrow. " +
        "(4) Pass publish=true or call publish_portfolio so https://" + username + ".taqdom.me updates immediately.",
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
        `\n## Instructions for AI Designer\nUse \`design_custom_portfolio_theme\` to invent 100% bespoke aesthetics with ZERO template constraints. For reference-image clones, custom animations, 3D scenes, or enterprise layouts, use \`renderMode: "full-code"\` with \`fullPageHtml\`, \`customCss\`, \`customJs\`, \`googleFonts\`, and any external library or npm package in \`libraries\`/\`dependencies\` (loaded automatically via CDN + \`esm.sh\` importmap).`,
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
                `Do NOT limit yourself to preset templates: use design_custom_portfolio_theme with renderMode="full-code" (passing fullPageHtml, customCss, customJs, googleFonts, and any required external libraries/npm packages in libraries/dependencies such as GSAP, ScrollTrigger, Three.js, Lenis, Lucide, or Tailwind) OR renderMode="bespoke-components" (custom palette, typography, heroVariant, heroEyebrow, heroHighlight, founderPills, split-editorial sections, icon-grid skills, vertical-glow timeline, and customSections), refine my content with update_portfolio_content, and publish with publish_portfolio as requested.`,
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
    const rawName = body.params?.name;
    const isFullCodeDeploy = rawName === "deploy_custom_code_portfolio";
    const name =
      isFullCodeDeploy || rawName === "install_portfolio_libraries"
        ? "design_custom_portfolio_theme"
        : rawName;
    const rawArgs = body.params?.arguments || {};
    const args =
      isFullCodeDeploy && rawArgs && typeof rawArgs === "object" && !Array.isArray(rawArgs)
        ? {
            renderMode: "full-code",
            ...rawArgs,
            ...(rawArgs.bodyHtml &&
            !rawArgs.customHtml &&
            !rawArgs.fullPageHtml &&
            !rawArgs.html &&
            !rawArgs.fullHtml &&
            !rawArgs.pageHtml
              ? { fullPageHtml: rawArgs.bodyHtml }
              : {}),
          }
        : rawArgs;
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
        const uploadedImages = await listUserMediaAssets({
          env,
          username,
          userId: tokenRow.user_id,
          portfolio,
        });
        return wrapOk(
          toolResult({
            portfolio: safePortfolio(portfolio, username),
            uploadedImages,
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
        const normalizedArgs = { ...args };
        if (!("title" in normalizedArgs) && (normalizedArgs.headline || normalizedArgs.role || normalizedArgs.tagline)) {
          normalizedArgs.title = normalizedArgs.headline ?? normalizedArgs.role ?? normalizedArgs.tagline;
        }
        if (!("city" in normalizedArgs) && normalizedArgs.location) {
          normalizedArgs.city = normalizedArgs.location;
        }
        if (!("bio" in normalizedArgs) && (normalizedArgs.about || normalizedArgs.summary)) {
          normalizedArgs.bio = normalizedArgs.about ?? normalizedArgs.summary;
        }
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
        const supportedKeys = Object.keys(normalizedArgs).filter((key) => allowed.has(key));
        if (!supportedKeys.length) {
          throw new Error("Provide at least one supported profile field.");
        }
        for (const key of ["name", "title", "bio", "city"]) {
          if (key in normalizedArgs) portfolio[key] = bilingual(normalizedArgs[key], key);
        }
        if ("skills" in normalizedArgs) {
          portfolio.skills = Array.isArray(normalizedArgs.skills)
            ? normalizedArgs.skills.slice(0, 100).map((skill) => String(skill).slice(0, 80))
            : [];
        }
        if ("links" in normalizedArgs) {
          if (!Array.isArray(normalizedArgs.links) || normalizedArgs.links.length > 50) {
            throw new Error("Links must be an array with at most 50 entries.");
          }
          portfolio.links = normalizedArgs.links.map((link) => ({
            label: String(link.label || "").slice(0, 100),
            url: safeUrl(link.url, { allowMail: true }),
          }));
        }
        for (const key of ["avatar", "cover"]) {
          if (key in normalizedArgs) {
            portfolio[key] = normalizedArgs[key]
              ? safeUrl(normalizedArgs[key], { allowLocal: true, allowDataImage: true })
              : "";
          }
        }
        if ("theme" in normalizedArgs) {
          if (!normalizedArgs.theme || typeof normalizedArgs.theme !== "object" || Array.isArray(normalizedArgs.theme)) {
            throw new Error("Theme must be an object.");
          }
          portfolio.theme = {
            mode: ["light", "dark", "auto"].includes(normalizedArgs.theme.mode)
              ? normalizedArgs.theme.mode
              : portfolio.theme?.mode || "auto",
            accent: /^#[0-9a-f]{6}$/i.test(String(normalizedArgs.theme.accent || ""))
              ? normalizedArgs.theme.accent
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
        const normalizedArgs = { ...args };
        if (!("title" in normalizedArgs) && (normalizedArgs.headline || normalizedArgs.role || normalizedArgs.tagline)) {
          normalizedArgs.title = normalizedArgs.headline ?? normalizedArgs.role ?? normalizedArgs.tagline;
        }
        if (!("city" in normalizedArgs) && normalizedArgs.location) {
          normalizedArgs.city = normalizedArgs.location;
        }
        if (!("bio" in normalizedArgs) && (normalizedArgs.about || normalizedArgs.summary)) {
          normalizedArgs.bio = normalizedArgs.about ?? normalizedArgs.summary;
        }
        const topLevelDesignKeys = [
          "renderMode",
          "designName",
          "concept",
          "brandName",
          "brandMonogram",
          "heroEyebrow",
          "eyebrow",
          "heroHeadline",
          "heroSubheadline",
          "heroHighlight",
          "founderPills",
          "pills",
          "companyPills",
          "showHeroImage",
          "showScrollIndicator",
          "hideContactSection",
          "sectionLayout",
          "skillsLayout",
          "timelineLayout",
          "sectionHeadings",
          "palette",
          "colors",
          "layout",
          "structure",
          "typography",
          "fonts",
          "effects",
          "customSections",
          "sections",
          "customHtml",
          "fullPageHtml",
          "html",
          "fullHtml",
          "pageHtml",
          "customCss",
          "css",
          "styles",
          "stylesheet",
          "customJs",
          "js",
          "script",
          "javascript",
          "headHtml",
          "head",
          "libraries",
          "packages",
          "cdnLibraries",
          "externalLibraries",
          "dependencies",
          "npmPackages",
          "googleFonts",
          "customCode",
        ];
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
          "projects",
          "customDesign",
          "design",
          ...topLevelDesignKeys,
        ]);
        const supportedKeys = Object.keys(normalizedArgs).filter((key) => allowed.has(key));
        if (!supportedKeys.length) {
          throw new Error("Provide at least one supported portfolio content field.");
        }
        let requestedCustomTemplate = false;
        if ("template" in normalizedArgs) {
          const tpl = String(normalizedArgs.template || "").toLowerCase().trim();
          if (["custom", "custom-sovereign", "bespoke"].includes(tpl)) {
            requestedCustomTemplate = true;
            if (!TEMPLATE_IDS.includes(portfolio.template)) {
              portfolio.template = "haven";
            }
          } else {
            if (!TEMPLATE_IDS.includes(tpl)) throw new Error("Invalid template ID.");
            portfolio.template = tpl;
          }
        }
        if ("defaultLang" in normalizedArgs) portfolio.defaultLang = normalizedArgs.defaultLang === "en" ? "en" : "ar";
        if ("discoverable" in normalizedArgs) portfolio.discoverable = Boolean(normalizedArgs.discoverable);
        for (const key of ["name", "title", "bio", "city", "badge"]) {
          if (key in normalizedArgs) portfolio[key] = bilingual(normalizedArgs[key], key);
        }
        if ("skills" in normalizedArgs) {
          portfolio.skills = Array.isArray(normalizedArgs.skills)
            ? normalizedArgs.skills.slice(0, 100).map((s) => String(s).slice(0, 80))
            : [];
        }
        if ("links" in normalizedArgs) {
          portfolio.links = (normalizedArgs.links || []).slice(0, 50).map((link) => ({
            label: String(link.label || "").slice(0, 100),
            url: safeUrl(link.url, { allowMail: true }),
          }));
        }
        if ("metrics" in normalizedArgs) {
          portfolio.metrics = (normalizedArgs.metrics || []).slice(0, 12).map((m) => ({
            label: bilingual(m?.label || "", "metric.label"),
            value: String(m?.value || "").slice(0, 80),
          }));
        }
        if ("timeline" in normalizedArgs) {
          portfolio.timeline = (normalizedArgs.timeline || []).slice(0, 25).map((item) => ({
            year: String(item?.year || "").slice(0, 32),
            role: bilingual(item?.role || "", "timeline.role"),
            org: bilingual(item?.org || item?.organization || "", "timeline.org"),
            summary: bilingual(item?.summary || "", "timeline.summary"),
          }));
        }
        if ("projects" in normalizedArgs) {
          if (!Array.isArray(normalizedArgs.projects)) {
            throw new Error("Projects must be an array.");
          }
          portfolio.projects = normalizedArgs.projects.slice(0, 100).map((rawProj) => {
            const proj = rawProj && typeof rawProj === "object" ? { ...rawProj } : {};
            if (!("title" in proj) && proj.name) proj.title = proj.name;
            if (!("desc" in proj)) proj.desc = proj.description ?? proj.summary ?? proj.title ?? "";
            if (!("title" in proj)) proj.title = proj.desc || "Project";
            const cleanId = String(proj.id || "").trim().slice(0, 64) || crypto.randomUUID();
            return { id: cleanId, ...normalizeProjectFields(proj) };
          });
        }
        if ("seo" in normalizedArgs && normalizedArgs.seo && typeof normalizedArgs.seo === "object") {
          portfolio.seo = {
            ...(portfolio.seo || {}),
            ...(typeof normalizedArgs.seo.title === "string" ? { title: normalizedArgs.seo.title.slice(0, 180) } : {}),
            ...(typeof normalizedArgs.seo.description === "string"
              ? { description: normalizedArgs.seo.description.slice(0, 400) }
              : {}),
            ...(Array.isArray(normalizedArgs.seo.keywords)
              ? { keywords: normalizedArgs.seo.keywords.slice(0, 30).map((k) => String(k).slice(0, 60)) }
              : {}),
            ...("noindex" in normalizedArgs.seo ? { noindex: Boolean(normalizedArgs.seo.noindex) } : {}),
          };
        }
        for (const key of ["avatar", "cover"]) {
          if (key in normalizedArgs) {
            portfolio[key] = normalizedArgs[key]
              ? safeUrl(normalizedArgs[key], { allowLocal: true, allowDataImage: true })
              : "";
          }
        }
        if ("theme" in normalizedArgs && normalizedArgs.theme && typeof normalizedArgs.theme === "object") {
          const accentCandidate =
            normalizedArgs.theme.accent || normalizedArgs.theme.primary || normalizedArgs.theme.primaryColor;
          let accentColor = portfolio.theme?.accent || "#315BFF";
          if (accentCandidate) {
            accentColor = safeColorValue(accentCandidate, "theme.accent");
          }
          portfolio.theme = {
            ...(portfolio.theme || {}),
            mode: ["light", "dark", "auto"].includes(normalizedArgs.theme.mode)
              ? normalizedArgs.theme.mode
              : portfolio.theme?.mode || "auto",
            accent: accentColor,
          };
        }
        const topLevelDesignPatch = {};
        for (const k of topLevelDesignKeys) {
          if (k in normalizedArgs && normalizedArgs[k] !== undefined) {
            topLevelDesignPatch[k] = normalizedArgs[k];
          }
        }
        const hasTopLevelDesignPatch = Object.keys(topLevelDesignPatch).length > 0;
        const baseRawDesign =
          normalizedArgs.customDesign && typeof normalizedArgs.customDesign === "object"
            ? normalizedArgs.customDesign
            : normalizedArgs.design && typeof normalizedArgs.design === "object"
              ? normalizedArgs.design
              : null;
        const rawDesign =
          baseRawDesign || hasTopLevelDesignPatch
            ? { ...(baseRawDesign || {}), ...topLevelDesignPatch }
            : requestedCustomTemplate
              ? { enabled: true }
              : null;
        if (rawDesign) {
          const cleanDesign = validateAndSanitizeCustomDesign(rawDesign, portfolio.customDesign || null);
          if (cleanDesign.enabled === false) {
            portfolio.customDesign = { ...(portfolio.customDesign || {}), enabled: false };
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
        }
        const saved = normalizedArgs.publish === true
          ? await publishOwnedDraft(env, username, tokenRow.user_id, portfolio)
          : await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return wrapOk(
          toolResult({
            ok: true,
            savedTo: normalizedArgs.publish === true ? "published" : "draft",
            published: Boolean(normalizedArgs.publish === true),
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
      if (name === "list_portfolio_images") {
        const images = await listUserMediaAssets({
          env,
          username,
          userId: tokenRow.user_id,
          portfolio,
        });
        return wrapOk(
          toolResult({
            ok: true,
            count: images.length,
            images,
            uploadEndpoint: "https://taqdom.me/api/upload",
            note: "All URLs can be placed anywhere in avatar, cover, projects, customSections, or fullPageHtml <img> / CSS url().",
          })
        );
      }

      if (name === "delete_portfolio_image") {
        const delKey = String(args.key || args.url || "").trim();
        if (!delKey) throw new Error("Provide key or url of the image to delete.");
        const res = await deleteUserMediaAsset({
          env,
          username,
          userId: tokenRow.user_id,
          key: delKey,
          portfolio,
        });
        return wrapOk(toolResult(res));
      }

      if (name === "place_portfolio_image") {
        const rawUrl = String(args.url || args.key || "").trim();
        if (!rawUrl) throw new Error("Provide url or key of the uploaded image to place.");
        const normalizedUrl = rawUrl.startsWith("/api/media/")
          ? rawUrl
          : /^https?:\/\/[^/]+\/api\/media\/([A-Za-z0-9._-]+)$/i.test(rawUrl)
          ? rawUrl.replace(/^https?:\/\/[^/]+/, "")
          : /^\d{10,}-[0-9a-f-]{36}\.[a-z0-9]+$/i.test(rawUrl)
          ? `/api/media/${rawUrl}`
          : rawUrl;
        const fullUrl = normalizedUrl.startsWith("/") ? `https://taqdom.me${normalizedUrl}` : normalizedUrl;
        const placement = applyMediaPlacement({
          portfolio,
          url: normalizedUrl,
          fullUrl,
          key: normalizedUrl.startsWith("/api/media/") ? normalizedUrl.slice("/api/media/".length) : "",
          assignTo: args.assignTo || (args.replaceTarget ? "replaceInHtml" : "mediaLibrary"),
          projectId: args.projectId || "",
          projectIndex: args.projectIndex ?? null,
          customSectionId: args.customSectionId || "",
          customSectionTitle: args.customSectionTitle || "",
          replaceTarget: args.replaceTarget || "",
          label: args.label || "",
          alt: args.alt || "",
          slot: args.slot || "",
        });
        let saved = portfolio;
        if (placement.changed) {
          saved =
            args.publish === true
              ? await publishOwnedDraft(env, username, tokenRow.user_id, portfolio)
              : await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        }
        return wrapOk(
          toolResult({
            ok: true,
            url: normalizedUrl,
            fullUrl,
            placedIn: placement.placedIn,
            changed: placement.changed,
            published: Boolean(args.publish === true),
            updatedAt: saved.updatedAt,
          })
        );
      }

      if (name === "upload_portfolio_images") {
        const list = Array.isArray(args.images) ? args.images : [];
        if (!list.length) throw new Error("Provide an images array containing at least 1 image.");
        if (list.length > 30) throw new Error("Upload up to 30 images per batch call (call again for more).");
        const uploaded = [];
        const failed = [];
        let draftChanged = false;
        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          if (!item || typeof item !== "object") {
            failed.push({ index: i, error: "Invalid image entry." });
            continue;
          }
          try {
            const validated = await normalizeAndValidateImagePayload({
              dataUrl: item.dataUrl || "",
              base64: item.base64 || "",
              mime: item.mime || "",
              svg: item.svg || "",
              sourceUrl: item.sourceUrl || item.url || "",
              env,
            });
            const stored = await storeMediaAsset({
              env,
              username,
              userId: tokenRow.user_id,
              mime: validated.mime,
              base64: validated.base64,
              size: validated.size,
              label: item.label || "",
              alt: item.alt || "",
              slot: item.slot || "",
            });
            const placement = applyMediaPlacement({
              portfolio,
              url: stored.url,
              fullUrl: stored.fullUrl,
              key: stored.key,
              mime: stored.mime,
              size: stored.size,
              assignTo: item.assignTo || "none",
              projectId: item.projectId || "",
              projectIndex: item.projectIndex ?? null,
              customSectionId: item.customSectionId || "",
              customSectionTitle: item.customSectionTitle || "",
              replaceTarget: item.replaceTarget || "",
              label: item.label || "",
              alt: item.alt || "",
              slot: item.slot || "",
            });
            if (placement.changed) draftChanged = true;
            uploaded.push({ ...stored, placedIn: placement.placedIn });
          } catch (err) {
            failed.push({
              index: i,
              label: item.label || undefined,
              error: err instanceof Error ? err.message : "Upload failed",
            });
          }
        }
        if (draftChanged) {
          await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        }
        return wrapOk(
          toolResult({
            ok: uploaded.length > 0,
            uploadedCount: uploaded.length,
            failedCount: failed.length,
            images: uploaded,
            urls: uploaded.map((u) => u.url),
            fullUrls: uploaded.map((u) => u.fullUrl),
            ...(failed.length ? { failed } : {}),
            savedToDraft: draftChanged,
          })
        );
      }

      if (name === "upload_portfolio_image") {
        let stored = null;
        if (args.uploadId) {
          const chunkOut = await handleChunkedMediaUpload({
            env,
            username,
            userId: tokenRow.user_id,
            uploadId: args.uploadId,
            chunk: args.chunk || "",
            chunkIndex: args.chunkIndex ?? 0,
            totalChunks: args.totalChunks ?? 1,
            finish: Boolean(args.finish),
            mime: args.mime || "",
            label: args.label || "",
            alt: args.alt || "",
            slot: args.slot || "",
          });
          if (chunkOut.partial) {
            return wrapOk(toolResult({ ok: true, ...chunkOut }));
          }
          stored = chunkOut;
        } else {
          const validated = await normalizeAndValidateImagePayload({
            dataUrl: args.dataUrl || "",
            base64: args.base64 || "",
            mime: args.mime || "",
            svg: args.svg || "",
            sourceUrl: args.sourceUrl || args.url || "",
            env,
          });
          stored = await storeMediaAsset({
            env,
            username,
            userId: tokenRow.user_id,
            mime: validated.mime,
            base64: validated.base64,
            size: validated.size,
            label: args.label || "",
            alt: args.alt || "",
            slot: args.slot || "",
          });
        }

        const assignTo = String(args.assignTo || "none");
        const placement = applyMediaPlacement({
          portfolio,
          url: stored.url,
          fullUrl: stored.fullUrl,
          key: stored.key,
          mime: stored.mime,
          size: stored.size,
          assignTo,
          projectId: args.projectId || "",
          projectIndex: args.projectIndex ?? null,
          customSectionId: args.customSectionId || "",
          customSectionTitle: args.customSectionTitle || "",
          replaceTarget: args.replaceTarget || "",
          label: args.label || "",
          alt: args.alt || "",
          slot: args.slot || "",
        });
        let savedDraft = null;
        if (placement.changed) {
          savedDraft = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        }
        return wrapOk(
          toolResult({
            ok: true,
            key: stored.key,
            mime: stored.mime,
            size: stored.size,
            url: stored.url,
            fullUrl: stored.fullUrl,
            assignedTo: assignTo,
            placedIn: placement.placedIn,
            savedToDraft: Boolean(savedDraft),
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
      const msg = error instanceof Error ? error.message : "MCP tool failed.";
      const safeMsg = /SQLITE|D1_ERROR|d1_|syntax error|table\s+\w+/i.test(msg)
        ? "Operation could not be completed. Please verify your parameters and try again."
        : msg;
      return wrapOk(toolError(safeMsg));
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
 * Resolves an MCP / OAuth 2.1 Bearer token against D1 `mcp_access_tokens`.
 * Used by both MCP JSON-RPC endpoints and cross-origin REST endpoints (/api/upload, /api/media).
 */
export async function resolveMcpBearerIdentity(
  request,
  env,
  targetUsername = null,
  directTokenFromPath = null
) {
  if (!env?.DB) {
    return { ok: false, status: 503, error: "Account storage unavailable" };
  }
  const reqUrl = new URL(request.url);
  const username = targetUsername ? normalizeUsername(targetUsername) : null;
  const resourceMetaUrl = username
    ? `${reqUrl.origin}/.well-known/oauth-protected-resource/mcp/${username}`
    : `${reqUrl.origin}/.well-known/oauth-protected-resource/mcp`;

  const rawToken = extractMcpToken(request, reqUrl, directTokenFromPath);
  if (!rawToken) {
    return {
      ok: false,
      status: 401,
      error: "authentication_required",
      message: "Sign in via OAuth 2.1 or pass a Taqdom MCP Bearer token.",
      resourceMetaUrl,
    };
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
    return {
      ok: false,
      status: 401,
      error: "invalid_token",
      message: "Invalid, expired, revoked, or out-of-scope MCP token.",
      resourceMetaUrl,
    };
  }

  await env.DB.prepare("UPDATE mcp_access_tokens SET last_used_at = ?1 WHERE id = ?2")
    .bind(Date.now(), tokenRow.id)
    .run();

  return {
    ok: true,
    tokenRow,
    username: normalizeUsername(tokenRow.username),
    userId: tokenRow.user_id,
    scope: tokenRow.scope || "",
    resourceMetaUrl,
  };
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
    const hasQueryToken = Boolean(
      reqUrl.searchParams.get("token") || reqUrl.searchParams.get("access_token")
    );
    const sseEndpoint = directTokenFromPath
      ? `${reqUrl.origin}/mcp/${resolvedUsername}/${encodeURIComponent(directTokenFromPath)}`
      : hasQueryToken
      ? `${reqUrl.origin}/mcp/${resolvedUsername}?token=${encodeURIComponent(rawToken)}`
      : `${reqUrl.origin}/mcp/${resolvedUsername}`;
    if (accept.includes("text/event-stream")) {
      const ssePayload = `event: endpoint\ndata: ${sseEndpoint}\n\n: taqdom mcp stream ready\n\n`;
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
        endpoint: sseEndpoint,
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

export function handleOpenApiSpec(request, url, isPluginManifest = false) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: oauthCorsHeaders() });
  }
  const origin = `${url.protocol}//${url.host}`;
  if (isPluginManifest) {
    return json({
      schema_version: "v1",
      name_for_human: "Taqdom Sovereign Portfolio",
      name_for_model: "taqdom_portfolio",
      description_for_human: "Design, edit, upload images, and publish bespoke bilingual personal websites on taqdom.me.",
      description_for_model:
        "Inspect and edit the authenticated creator's Taqdom portfolio, design completely custom visual layouts and CSS themes, upload images up to 20MB, manage projects, and publish live to https://<username>.taqdom.me.",
      auth: {
        type: "oauth",
        client_url: `${origin}/oauth/authorize`,
        scope: "portfolio:read portfolio:write portfolio:publish",
        authorization_url: `${origin}/oauth/token`,
        authorization_content_type: "application/json",
      },
      api: {
        type: "openapi",
        url: `${origin}/openapi.json`,
      },
      logo_url: `${origin}/icon`,
      contact_email: "support@taqdom.me",
      legal_info_url: `${origin}/privacy`,
    });
  }

  const paths = {};
  for (const tool of TOOLS) {
    const isReadOnly = [
      "get_portfolio",
      "get_profile",
      "list_projects",
      "list_portfolio_images",
      "get_portfolio_blueprint",
      "list_templates_and_capabilities",
    ].includes(tool.name);
    paths[`/api/mcp/tools/${tool.name}`] = {
      post: {
        operationId: tool.name,
        summary: tool.description.slice(0, 120),
        description: tool.description,
        "x-openai-isConsequential": !isReadOnly,
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: tool.inputSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Tool execution result",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
        },
      },
    };
  }

  paths["/api/upload"] = {
    post: {
      operationId: "upload_media_binary",
      summary: "Upload one or more real binary images (multipart/form-data, raw image/*, openaiFileIdRefs, or JSON/sourceUrl).",
      description:
        "Accepts binary file uploads (multipart/form-data files/file or raw image/*), ChatGPT openaiFileIdRefs, public HTTPS sourceUrl, base64/dataUrl, or batch JSON arrays up to 20MB per image, and optionally places them into avatar, cover, backgroundImage, project, gallery, customSection, or custom HTML.",
      "x-openai-isConsequential": false,
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: { type: "string", format: "binary", description: "Single binary image file (PNG, JPG, WebP, GIF, AVIF, SVG)." },
                files: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                  description: "Multiple binary image files in one upload.",
                },
                assignTo: { type: "string", description: "Optional placement: avatar, cover, backgroundImage, project, gallery, customSection, replaceInHtml, mediaLibrary." },
                label: { type: "string" },
                alt: { type: "string" },
                projectId: { type: "string" },
                projectIndex: { type: "integer" },
                replaceTarget: { type: "string" },
              },
            },
          },
          "application/json": {
            schema: {
              type: "object",
              properties: {
                openaiFileIdRefs: { type: "array", items: { type: "object" } },
                sourceUrl: { type: "string" },
                dataUrl: { type: "string" },
                base64: { type: "string" },
                mime: { type: "string" },
                files: { type: "array", items: { type: "object" } },
                assignTo: { type: "string" },
                label: { type: "string" },
                alt: { type: "string" },
                projectId: { type: "string" },
                projectIndex: { type: "integer" },
                replaceTarget: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Uploaded image metadata with permanent hosted URLs",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
      },
    },
  };

  paths["/api/media"] = {
    get: {
      operationId: "list_uploaded_media",
      summary: "List all uploaded real images belonging to the authenticated account.",
      "x-openai-isConsequential": false,
      responses: {
        "200": {
          description: "List of uploaded image URLs and metadata",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
      },
    },
  };

  paths["/api/media/{key}"] = {
    delete: {
      operationId: "delete_uploaded_media",
      summary: "Delete an uploaded image key owned by the authenticated account.",
      "x-openai-isConsequential": true,
      parameters: [
        { name: "key", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        "200": {
          description: "Deletion result",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
      },
    },
  };

  if (request.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300",
        ...oauthCorsHeaders(),
      },
    });
  }

  return json({
    openapi: "3.1.0",
    info: {
      title: "Taqdom Sovereign Portfolio Actions API",
      version: "2.0.0",
      description:
        "OpenAPI 3.1 interface for ChatGPT Custom GPT Actions & REST clients to inspect, design bespoke themes, upload images, edit content, and publish Taqdom portfolios.",
    },
    servers: [{ url: origin }],
    security: [{ oauth2: ["portfolio:read", "portfolio:write", "portfolio:publish"] }, { bearerAuth: [] }],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Taqdom MCP or OAuth Bearer token (tqd_mcp_... or tqd_oat_...).",
        },
        oauth2: {
          type: "oauth2",
          flows: {
            authorizationCode: {
              authorizationUrl: `${origin}/oauth/authorize`,
              tokenUrl: `${origin}/oauth/token`,
              scopes: {
                "portfolio:read": "Read portfolio draft, profile, projects, and design system.",
                "portfolio:write": "Modify profile, projects, images, and bespoke theme.",
                "portfolio:publish": "Publish portfolio live to https://<username>.taqdom.me.",
              },
            },
          },
        },
      },
    },
  });
}

export async function handleMcpRestRequest(request, env, toolName) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: oauthCorsHeaders() });
  }
  if (request.method !== "POST") {
    return json({ error: "Use POST for /api/mcp/tools/:toolName" }, 405, { allow: "POST, OPTIONS" });
  }
  if (!env?.DB) return json({ error: "Account storage unavailable" }, 503);

  const reqUrl = new URL(request.url);
  const resourceMetaUrl = `${reqUrl.origin}/.well-known/oauth-protected-resource/mcp`;
  const rawToken = extractMcpToken(request, reqUrl, null);
  if (!rawToken) {
    return json(
      {
        error: "authentication_required",
        message: "Pass Authorization: Bearer <token> or complete OAuth 2.1.",
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
  if (!tokenRow || (tokenRow.expires_at && Number(tokenRow.expires_at) <= Date.now())) {
    return json(
      { error: "Invalid, expired, or revoked Bearer token." },
      401,
      { "www-authenticate": `Bearer realm="Taqdom MCP", error="invalid_token"` }
    );
  }

  const resolvedUsername = normalizeUsername(tokenRow.username);
  await env.DB.prepare("UPDATE mcp_access_tokens SET last_used_at = ?1 WHERE id = ?2")
    .bind(Date.now(), tokenRow.id)
    .run();

  const args = await request.json().catch(() => ({}));
  const outcome = await processSingleRpcCall(
    {
      jsonrpc: "2.0",
      id: "rest-bridge",
      method: "tools/call",
      params: { name: toolName, arguments: args && typeof args === "object" ? args : {} },
    },
    { env, username: resolvedUsername, tokenRow, negotiatedProtocol: "2025-03-26" }
  );

  if (outcome.payload?.error) {
    return json(
      { ok: false, error: outcome.payload.error.message || "Unknown tool" },
      outcome.payload.error.code === -32602 ? 404 : 400
    );
  }
  const result = outcome.payload?.result;
  if (result?.isError) {
    return json(
      { ok: false, error: result?.content?.[0]?.text || "Tool execution failed" },
      400
    );
  }
  return json({ ok: true, result: result?.structuredContent ?? result }, 200);
}
