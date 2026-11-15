// cloudflare/worker.mjs — Sovereign Edge Worker for taqdom.me & *.taqdom.me backed by Cloudflare D1
import { SEED_PORTFOLIOS, createStarterPortfolio, TEMPLATES_CATALOG } from "../lib/seed-data.ts";
import { ALL_TEMPLATE_IDS, RESERVED_USERNAMES, normalizeUsername, validateUsername } from "../lib/types.ts";
import { handleMcpRequest, handleMcpRestRequest, handleMcpTokenApi, handleOpenApiSpec } from "./mcp.mjs";
import { handleOAuthRequest, isOAuthRoute } from "./oauth.mjs";
import { DEFAULT_FIREBASE_PROJECT_ID, suggestAvailableUsername, verifyFirebaseIdToken } from "./firebase-auth.mjs";

const APP_ROUTES = new Set([
  ...RESERVED_USERNAMES,
  "icon",
  "apple-icon",
  "opengraph-image",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "openapi.json",
]);

const edgeStore = {
  portfolios: structuredClone(SEED_PORTFOLIOS),
  unpublished: new Set(),
  users: {},
  media: {},
  views: {
    layla: 9340,
    youssef: 7615,
    farida: 6490,
    karim: 5290,
    tariq: 8140,
    salma: 7420,
    nora: 5890,
  },
};

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseHost(rawHost) {
  const host = (rawHost || "").toLowerCase().trim();
  if (host === "taqdom.me") return { root: "taqdom.me", sub: null };
  if (host.endsWith(".taqdom.me")) {
    return {
      root: "taqdom.me",
      sub: host.slice(0, -".taqdom.me".length),
    };
  }
  const localMatch = host.match(/^(?:([a-z0-9-]+)\.)?(localhost(?::\d+)?|lvh\.me(?::\d+)?)$/);
  if (localMatch) {
    return {
      root: localMatch[2],
      sub: localMatch[1] || null,
    };
  }
  return { root: null, sub: null };
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function applySecurityHeaders(response, allowCrossOrigin = false) {
  const headers = new Headers(response.headers);
  headers.delete("server");
  headers.delete("x-powered-by");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  headers.set("Cross-Origin-Resource-Policy", allowCrossOrigin ? "cross-origin" : "same-site");
  headers.set(
    "Content-Security-Policy-Report-Only",
    "default-src 'self' blob: data:; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; connect-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://apis.google.com https://accounts.google.com https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://esm.sh; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com; frame-src 'self' blob: data: https://*.firebaseapp.com https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com"
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

let usersFirebaseColumnsReady = false;
async function ensureUsersFirebaseColumns(env) {
  if (usersFirebaseColumnsReady || !env?.DB) return;
  for (const col of [
    "ALTER TABLE users ADD COLUMN firebase_uid TEXT",
    "ALTER TABLE users ADD COLUMN auth_provider TEXT",
  ]) {
    try {
      await env.DB.prepare(col).run();
    } catch {
      // Column already exists
    }
  }
  usersFirebaseColumnsReady = true;
}

let rateLimitSchemaPromise = null;
let rateLimitSigningKeyPromise = null;
let lastRateLimitCleanup = 0;

async function parseJsonBody(request, maxBytes = 65536) {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declared = Number(contentLength);
    if (!Number.isSafeInteger(declared) || declared < 0 || declared > maxBytes) {
      return { ok: false, status: 413 };
    }
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: true, value: {} };
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
  }

  if (total === 0) return { ok: true, value: {} };

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, status: 400 };
    }
    return { ok: true, value };
  } catch {
    return { ok: false, status: 400 };
  }
}

async function enforceRateLimit(request, env, scope, limit, windowMs, subject = "", includeIp = true) {
  if (!env?.DB || typeof env?.AUTH_SECRET !== "string" || env.AUTH_SECRET.length < 32) {
    return jsonResponse(
      { error: "الحماية المؤقتة غير متاحة الآن. حاول بعد قليل / Security service temporarily unavailable." },
      503,
      { "Retry-After": "30" }
    );
  }

  try {
    if (!rateLimitSchemaPromise) {
      rateLimitSchemaPromise = env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS edge_rate_limits (
          key_hash TEXT NOT NULL,
          window_start INTEGER NOT NULL,
          hits INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (key_hash, window_start)
        )`
      )
        .run()
        .then(() => true)
        .catch((error) => {
          rateLimitSchemaPromise = null;
          throw error;
        });
    }
    await rateLimitSchemaPromise;

    if (!rateLimitSigningKeyPromise) {
      rateLimitSigningKeyPromise = crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(env.AUTH_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
    }
    const signingKey = await rateLimitSigningKeyPromise;
    const ip = includeIp
      ? request.headers.get("CF-Connecting-IP") || request.headers.get("x-real-ip") || "unknown"
      : "";
    const keyMaterial = `taqdom-rate-v1\\0${scope}\\0${ip}\\0${String(subject).toLowerCase().slice(0, 256)}`;
    const digest = new Uint8Array(await crypto.subtle.sign("HMAC", signingKey, new TextEncoder().encode(keyMaterial)));
    const keyHash = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const row = await env.DB.prepare(
      `INSERT INTO edge_rate_limits (key_hash, window_start, hits)
       VALUES (?1, ?2, 1)
       ON CONFLICT(key_hash, window_start) DO UPDATE SET hits = hits + 1
       RETURNING hits`
    )
      .bind(keyHash, windowStart)
      .first();
    const hits = Number(row?.hits);
    if (!Number.isFinite(hits)) throw new Error("Rate limit counter was not returned.");

    if (now - lastRateLimitCleanup > 6 * 60 * 60 * 1000) {
      lastRateLimitCleanup = now;
      env.DB.prepare("DELETE FROM edge_rate_limits WHERE window_start < ?1")
        .bind(now - 24 * 60 * 60 * 1000)
        .run()
        .catch(() => {});
    }

    if (hits > limit) {
      const retryAfter = Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000));
      return jsonResponse(
        { error: "طلبات كثيرة في وقت قصير. حاول مرة أخرى بعد قليل / Too many requests. Try again shortly." },
        429,
        { "Retry-After": String(retryAfter) }
      );
    }
    return null;
  } catch {
    return jsonResponse(
      { error: "تعذر التحقق من حدّ الطلبات. حاول لاحقًا / Rate limit check failed." },
      503,
      { "Retry-After": "30" }
    );
  }
}

function rateLimitBodyError(result) {
  return jsonResponse(
    { error: result.status === 413 ? "حجم الطلب أكبر من المسموح / Request body is too large." : "بيانات الطلب غير صالحة / Invalid JSON body." },
    result.status
  );
}

const PBKDF2_CURRENT_ITERATIONS = 600000;
const PBKDF2_LEGACY_ITERATIONS = 100000;
const PBKDF2_WORKERD_MAX_ITERATIONS = 100000;
const PBKDF2_SALT_PREFIX = "pbkdf2-sha256$";

function parsePasswordSalt(storedSalt) {
  const value = String(storedSalt || "");
  if (value.startsWith(PBKDF2_SALT_PREFIX)) {
    const parts = value.split("$");
    const iterations = Number(parts[1]);
    const hex = parts[2] || "";
    if (![PBKDF2_LEGACY_ITERATIONS, PBKDF2_CURRENT_ITERATIONS].includes(iterations) || !/^[a-f0-9]{32}$/i.test(hex)) {
      throw new Error("Invalid stored password salt.");
    }
    return {
      saltBytes: new Uint8Array(hex.match(/.{2}/g).map((byte) => parseInt(byte, 16))),
      iterations,
    };
  }
  if (!/^[a-f0-9]{32}$/i.test(value)) {
    throw new Error("Invalid legacy password salt.");
  }
  return {
    saltBytes: new Uint8Array(value.match(/.{2}/g).map((byte) => parseInt(byte, 16))),
    iterations: PBKDF2_LEGACY_ITERATIONS,
  };
}

function constantTimeStringEqual(left, right) {
  const encoder = new TextEncoder();
  const a = encoder.encode(String(left || ""));
  const b = encoder.encode(String(right || ""));
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    difference |= (a[i] || 0) ^ (b[i] || 0);
  }
  return difference === 0;
}

function safePortfolioHref(value) {
  const raw = String(value || "").trim().slice(0, 2048);
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

function safeJsonForHtmlScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
function sanitizeCustomDesignUrlsEdge(customDesign) {
  if (!customDesign || typeof customDesign !== "object") return customDesign;
  const next = { ...customDesign };
  if (next.navCta && typeof next.navCta === "object") {
    next.navCta = {
      ...next.navCta,
      ...(next.navCta.url ? { url: safePortfolioHref(next.navCta.url) } : {}),
    };
  }
  if (next.heroCta && typeof next.heroCta === "object") {
    next.heroCta = {
      ...next.heroCta,
      ...(next.heroCta.primaryUrl ? { primaryUrl: safePortfolioHref(next.heroCta.primaryUrl) } : {}),
      ...(next.heroCta.secondaryUrl ? { secondaryUrl: safePortfolioHref(next.heroCta.secondaryUrl) } : {}),
    };
  }
  if (Array.isArray(next.founderPills)) {
    next.founderPills = next.founderPills.map((pill) => ({
      ...pill,
      ...(pill?.url ? { url: safePortfolioHref(pill.url) } : {}),
    }));
  }
  if (Array.isArray(next.customSections)) {
    next.customSections = next.customSections.map((sec) => ({
      ...sec,
      ...(Array.isArray(sec?.items)
        ? {
            items: sec.items.map((item) => ({
              ...item,
              ...(item?.url ? { url: safePortfolioHref(item.url) } : {}),
            })),
          }
        : {}),
    }));
  }
  return next;
}

function toPublicPortfolio(portfolio) {
  if (!portfolio || typeof portfolio !== "object") return null;
  const { email: privateAccountEmail, ...publicPortfolio } = portfolio;
  void privateAccountEmail;
  if (Array.isArray(publicPortfolio.links)) {
    publicPortfolio.links = publicPortfolio.links
      .filter((link) => link && typeof link === "object")
      .map((link) => ({ ...link, url: safePortfolioHref(link.url) }));
  }
  if (publicPortfolio.customDesign) {
    publicPortfolio.customDesign = sanitizeCustomDesignUrlsEdge(publicPortfolio.customDesign);
  }
  return publicPortfolio;
}

function toExploreSummaryPortfolio(portfolio) {
  const clean = toPublicPortfolio(portfolio);
  if (!clean) return null;
  if (clean.customDesign && typeof clean.customDesign === "object") {
    const {
      fullPageHtml: _omitFullHtml,
      customCss: _omitCss,
      customJs: _omitJs,
      headHtml: _omitHeadHtml,
      customHtml: _omitCustomHtml,
      customCode: _omitCustomCode,
      ...lightDesign
    } = clean.customDesign;
    void _omitFullHtml;
    void _omitCss;
    void _omitJs;
    void _omitHeadHtml;
    void _omitCustomHtml;
    void _omitCustomCode;
    clean.customDesign = lightDesign;
  }
  return clean;
}

function validJpegBytes(bytes) {
  if (bytes.length < 16 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return false;
  let pos = 2;
  let hasSof = false;
  let hasSos = false;
  let hasEoi = false;

  while (pos < bytes.length) {
    while (pos < bytes.length && bytes[pos] !== 0xff) pos++;
    if (pos >= bytes.length) break;
    while (pos < bytes.length && bytes[pos] === 0xff) pos++;
    if (pos >= bytes.length) return false;
    const marker = bytes[pos++];
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (marker === 0xd8) return false;
    if (marker === 0xd9) {
      hasEoi = true;
      break;
    }
    if (pos + 2 > bytes.length) return false;
    const segLen = (bytes[pos] << 8) | bytes[pos + 1];
    if (segLen < 2 || pos + segLen > bytes.length) return false;

    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isSof) {
      if (segLen < 8 || pos + 7 > bytes.length) return false;
      const height = (bytes[pos + 3] << 8) | bytes[pos + 4];
      const width = (bytes[pos + 5] << 8) | bytes[pos + 6];
      if (width <= 0 || height <= 0) return false;
      hasSof = true;
    }

    pos += segLen;
    if (marker === 0xda) {
      hasSos = true;
      while (pos + 1 < bytes.length) {
        if (bytes[pos] === 0xff) {
          const next = bytes[pos + 1];
          if (next === 0x00 || next === 0xff || (next >= 0xd0 && next <= 0xd7)) {
            pos += next === 0xff ? 1 : 2;
            continue;
          }
          break;
        }
        pos++;
      }
      if (pos >= bytes.length - 1) return false;
    }
  }

  return hasSof && hasSos && hasEoi;
}

function validPngBytes(bytes) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 33 || !signature.every((byte, index) => bytes[index] === byte)) return false;
  let pos = 8;
  let hasIhdr = false;
  let hasIdat = false;
  let hasIend = false;
  while (pos + 12 <= bytes.length) {
    const chunkLen = ((bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3]) >>> 0;
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    if (pos + 12 + chunkLen > bytes.length) return false;
    if (pos === 8) {
      if (type !== "IHDR" || chunkLen !== 13) return false;
      const w = ((bytes[pos + 8] << 24) | (bytes[pos + 9] << 16) | (bytes[pos + 10] << 8) | bytes[pos + 11]) >>> 0;
      const h = ((bytes[pos + 12] << 24) | (bytes[pos + 13] << 16) | (bytes[pos + 14] << 8) | bytes[pos + 15]) >>> 0;
      if (w === 0 || h === 0) return false;
      hasIhdr = true;
    } else if (type === "IDAT" && chunkLen > 0) {
      hasIdat = true;
    } else if (type === "IEND") {
      hasIend = chunkLen === 0;
      break;
    }
    pos += 12 + chunkLen;
  }
  return hasIhdr && hasIdat && hasIend;
}

function validWebpBytes(bytes) {
  if (bytes.length < 20) return false;
  if (String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== "RIFF") return false;
  if (String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) !== "WEBP") return false;
  const riffSize = (bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24)) >>> 0;
  if (riffSize < 12 || riffSize + 8 > bytes.length) return false;
  const end = 8 + riffSize;
  let pos = 12;
  let hasFrame = false;
  while (pos + 8 <= end) {
    const cc = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
    const chunkSize = (bytes[pos + 4] | (bytes[pos + 5] << 8) | (bytes[pos + 6] << 16) | (bytes[pos + 7] << 24)) >>> 0;
    const padded = chunkSize + (chunkSize & 1);
    if (pos + 8 + chunkSize > end) return false;
    if (cc === "VP8 " && chunkSize >= 10) {
      hasFrame = true;
    } else if (cc === "VP8L" && chunkSize >= 5 && bytes[pos + 8] === 0x2f) {
      hasFrame = true;
    } else if (cc === "VP8X" && chunkSize >= 10) {
      const w = 1 + (bytes[pos + 12] | (bytes[pos + 13] << 8) | (bytes[pos + 14] << 16));
      const h = 1 + (bytes[pos + 15] | (bytes[pos + 16] << 8) | (bytes[pos + 17] << 16));
      if (w <= 0 || h <= 0) return false;
    }
    pos += 8 + padded;
  }
  return hasFrame || pos === end;
}

function validGifBytes(bytes) {
  if (bytes.length < 14) return false;
  const hdr = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
  if (hdr !== "GIF87a" && hdr !== "GIF89a") return false;
  const w = bytes[6] | (bytes[7] << 8);
  const h = bytes[8] | (bytes[9] << 8);
  if (w === 0 || h === 0) return false;
  return bytes[bytes.length - 1] === 0x3b;
}

function validAvifBytes(bytes) {
  if (bytes.length < 16) return false;
  const ftypSize = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  if (ftypSize < 16 || ftypSize > bytes.length) return false;
  if (String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]) !== "ftyp") return false;
  const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (!["avif", "avis", "mif1"].includes(brand)) return false;
  let pos = ftypSize;
  let hasMeta = false;
  let hasMdat = false;
  while (pos + 8 <= bytes.length) {
    const boxSize = ((bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3]) >>> 0;
    const boxType = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    const effective = boxSize === 0 ? bytes.length - pos : boxSize;
    if (effective < 8 || pos + effective > bytes.length) return false;
    if (boxType === "meta") hasMeta = true;
    if (boxType === "mdat") hasMdat = true;
    pos += effective;
  }
  return hasMeta && hasMdat;
}

function validRasterBytes(mime, bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12) return false;
  if (mime === "image/jpeg") return validJpegBytes(bytes);
  if (mime === "image/png") return validPngBytes(bytes);
  if (mime === "image/webp") return validWebpBytes(bytes);
  if (mime === "image/gif") return validGifBytes(bytes);
  if (mime === "image/avif") return validAvifBytes(bytes);
  return false;
}

function validRasterImageData(mime, base64) {
  try {
    const clean = String(base64 || "").replace(/\s+/g, "");
    if (!clean || clean.length > 28_000_000) return false;
    const raw = atob(clean);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return validRasterBytes(mime, bytes);
  } catch {
    return false;
  }
}

function sanitizeSvgBase64(base64) {
  try {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    let svgText = new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim();
    if (!/<svg[\s>]/i.test(svgText) || !/<\/svg>/i.test(svgText)) return null;
    svgText = svgText
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/(?:href|xlink:href)\s*=\s*(?:"\s*(?:javascript|vbscript):[^"]*"|'\s*(?:javascript|vbscript):[^']*')/gi, "");
    if (/<script|foreignObject|\bon[a-z]+\s*=|(?:javascript|vbscript):/i.test(svgText)) {
      return null;
    }
    const cleanBytes = new TextEncoder().encode(svgText);
    let outBin = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < cleanBytes.length; i += chunkSize) {
      outBin += String.fromCharCode(...cleanBytes.subarray(i, i + chunkSize));
    }
    return {
      base64: btoa(outBin),
      size: cleanBytes.byteLength,
    };
  } catch {
    return null;
  }
}

async function hashPasswordEdge(password, storedSalt) {
  const encoder = new TextEncoder();
  let saltBytes;
  let iterations;
  if (storedSalt) {
    const parsed = parsePasswordSalt(storedSalt);
    saltBytes = parsed.saltBytes;
    iterations = parsed.iterations;
  } else {
    saltBytes = crypto.getRandomValues(new Uint8Array(16));
    iterations = PBKDF2_CURRENT_ITERATIONS;
  }

  let remaining = iterations;
  let currentKeyBytes = encoder.encode(password);
  let derivedBytes = new Uint8Array(32);

  while (remaining > 0) {
    const stepIterations = Math.min(remaining, PBKDF2_WORKERD_MAX_ITERATIONS);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      currentKeyBytes,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBytes.slice().buffer,
        iterations: stepIterations,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    derivedBytes = new Uint8Array(derivedBits);
    currentKeyBytes = derivedBytes;
    remaining -= stepIterations;
  }

  const hash = Array.from(derivedBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const saltHex = Array.from(saltBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return {
    hash,
    salt: PBKDF2_SALT_PREFIX + iterations + "$" + saltHex,
  };
}

function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(b64) {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(padded)));
}

async function signEdgeSession(payload, secret) {
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("AUTH_SECRET is not configured. Set a Worker secret of at least 32 characters.");
  }
  const encoder = new TextEncoder();
  const data = base64UrlEncode(JSON.stringify({ ...payload, exp: Date.now() + 30 * 86400 * 1000 }));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const sigHex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${data}.${sigHex}`;
}

async function verifyEdgeSession(token, secret) {
  if (typeof secret !== "string" || secret.length < 32) return null;
  if (!token || !token.includes(".")) return null;
  const [data, sigHex] = token.split(".");
  if (!data || !sigHex) return null;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g).map((b) => parseInt(b, 16)));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
    if (!valid) return null;
    const parsed = JSON.parse(base64UrlDecode(data));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

const initializedWorkerMediaDbs = new WeakSet();

async function ensureWorkerMediaSchema(env) {
  if (!env?.DB || initializedWorkerMediaDbs.has(env.DB)) return;
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS media_blobs (key TEXT PRIMARY KEY, mime TEXT NOT NULL, size INTEGER NOT NULL, data_url TEXT NOT NULL, created_at INTEGER NOT NULL)"
  ).run();
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS media_chunks (key TEXT NOT NULL, seq INTEGER NOT NULL, chunk TEXT NOT NULL, PRIMARY KEY (key, seq))"
  ).run();
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS portfolio_chunks (username TEXT NOT NULL, kind TEXT NOT NULL, seq INTEGER NOT NULL, chunk TEXT NOT NULL, PRIMARY KEY (username, kind, seq))"
  ).run();
  initializedWorkerMediaDbs.add(env.DB);
}

const PORTFOLIO_CHUNK_CHARS = 700_000;

async function resolveChunkedPortfolioJson(env, username, kind, rawJson) {
  if (!rawJson) return null;
  if (rawJson === "__CHUNKED__") {
    await ensureWorkerMediaSchema(env);
    const { results = [] } = await env.DB.prepare(
      "SELECT chunk FROM portfolio_chunks WHERE username = ?1 AND kind = ?2 ORDER BY seq ASC"
    )
      .bind(username, kind)
      .all();
    if (!results.length) return null;
    return results.map((r) => r.chunk).join("");
  }
  return rawJson;
}

async function storeChunkedPortfolioJson(env, username, kind, jsonStr) {
  await ensureWorkerMediaSchema(env);
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

async function parseSessionFromRequest(request, env) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)taqdom_session=([^;]+)/);
  if (!match) return null;
  try {
    const token = decodeURIComponent(match[1].trim());
    const verified = await verifyEdgeSession(token, env?.AUTH_SECRET);
    if (!verified || !verified.username) return verified;
    const uid = verified.userId || verified.id;
    if (
      env?.DB &&
      uid &&
      !verified.isTestAccount &&
      !SEED_PORTFOLIOS[normalizeUsername(verified.username)]
    ) {
      try {
        const row = await env.DB.prepare(
          "SELECT username, email FROM users WHERE id = ?1 LIMIT 1"
        )
          .bind(uid)
          .first();
        if (!row?.username) {
          return null;
        }
        verified.username = normalizeUsername(row.username);
        verified.email = row.email || verified.email;
      } catch {
        // Keep token claims only on transient D1 failure
      }
    }
    return verified;
  } catch {
    return null;
  }
}

function makeSessionCookie(token, isSecure = true) {
  return `taqdom_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${
    isSecure ? "; Secure" : ""
  }`;
}

async function getPublishedPortfolioFromD1(env, username) {
  const clean = normalizeUsername(username);
  if (!clean) return null;

  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT published_json FROM portfolios WHERE username = ?1"
      )
        .bind(clean)
        .first();
      if (row) {
        const resolved = await resolveChunkedPortfolioJson(
          env,
          clean,
          "published",
          row.published_json
        );
        if (!resolved) return null;
        edgeStore.unpublished.delete(clean);
        return toPublicPortfolio(JSON.parse(resolved));
      }
      if (edgeStore.unpublished.has(clean)) return null;
      return SEED_PORTFOLIOS[clean] ? toPublicPortfolio(SEED_PORTFOLIOS[clean]) : null;
    } catch {
      if (edgeStore.unpublished.has(clean)) return null;
      const cached = edgeStore.portfolios[clean];
      if (cached?.publishedAt || cached?.isFlagshipShowcase === true) {
        return toPublicPortfolio(cached);
      }
      return SEED_PORTFOLIOS[clean] ? toPublicPortfolio(SEED_PORTFOLIOS[clean]) : null;
    }
  }

  if (edgeStore.unpublished.has(clean)) return null;
  const cached = edgeStore.portfolios[clean];
  if (cached?.publishedAt || cached?.isFlagshipShowcase === true) {
    return toPublicPortfolio(cached);
  }
  return SEED_PORTFOLIOS[clean] ? toPublicPortfolio(SEED_PORTFOLIOS[clean]) : null;
}

async function getDraftPortfolioFromD1(env, username) {
  const clean = normalizeUsername(username);
  if (!clean) return null;
  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT draft_json, published_json, published_at FROM portfolios WHERE username = ?1"
      )
        .bind(clean)
        .first();
      if (row) {
        const kind = row.draft_json ? "draft" : "published";
        const raw = await resolveChunkedPortfolioJson(
          env,
          clean,
          kind,
          row.draft_json || row.published_json
        );
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            parsed.publishedAt = row.published_json
              ? (parsed.publishedAt || row.published_at || Date.now())
              : null;
            try {
              const viewRow = await env.DB.prepare(
                "SELECT COALESCE(SUM(count), 0) AS total FROM views WHERE username = ?1"
              )
                .bind(clean)
                .first();
              const recordedViews = Number(viewRow?.total || 0);
              const seedBaseline = Number(SEED_PORTFOLIOS[clean]?.views || 0);
              if (parsed.isFlagshipShowcase && seedBaseline > 0) {
                parsed.views = Math.max(Number(parsed.views || 0), seedBaseline + recordedViews);
              } else {
                parsed.views = Math.max(recordedViews, Number(parsed.views || 0));
              }
            } catch {
              // views table optional fallback
            }
          }
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
  }
  return edgeStore.portfolios[clean] || SEED_PORTFOLIOS[clean] || null;
}

async function getAllPublishedPortfoliosFromD1(env) {
  const collect = (entries) =>
    entries
      .filter((portfolio) =>
        portfolio?.isFlagshipShowcase === true ||
        (portfolio?.discoverable === true && Boolean(portfolio?.publishedAt))
      )
      .map(toExploreSummaryPortfolio)
      .filter(Boolean);

  if (env.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT username, published_json FROM portfolios WHERE published_json IS NOT NULL"
      ).all();
      const map = { ...SEED_PORTFOLIOS };
      if (Array.isArray(results)) {
        for (const row of results) {
          if (!row.username || !row.published_json) continue;
          try {
            const resolved = await resolveChunkedPortfolioJson(
              env,
              row.username,
              "published",
              row.published_json
            );
            if (resolved) {
              edgeStore.unpublished.delete(row.username);
              map[row.username] = JSON.parse(resolved);
            }
          } catch {
            // Ignore a single malformed portfolio rather than failing the entire directory.
          }
        }
      }
      return collect(Object.values(map));
    } catch {
      const map = { ...SEED_PORTFOLIOS, ...edgeStore.portfolios };
      for (const username of edgeStore.unpublished) delete map[username];
      return collect(Object.values(map));
    }
  }

  const map = { ...SEED_PORTFOLIOS, ...edgeStore.portfolios };
  for (const username of edgeStore.unpublished) delete map[username];
  return collect(Object.values(map));
}


async function savePortfolioToD1AndMemory(env, portfolio, isPublish = false, userAuth = null) {
  const clean = normalizeUsername(portfolio.username);
  if (!clean) throw new Error("A valid portfolio username is required.");

  if (!env.DB) {
    throw new Error("Cloudflare D1 is not configured; persistent portfolio storage is unavailable.");
  }

  const now = Date.now();
  const updated = {
    ...portfolio,
    links: Array.isArray(portfolio.links)
      ? portfolio.links.map((link) => ({ ...link, url: safePortfolioHref(link.url) }))
      : [],
    ...(portfolio.customDesign
      ? { customDesign: sanitizeCustomDesignUrlsEdge(portfolio.customDesign) }
      : {}),
    username: clean,
    updatedAt: now,
    publishedAt: isPublish ? now : (edgeStore.unpublished.has(clean) ? null : (portfolio.publishedAt || null)),
  };

  try {
    if (!isPublish) {
      const existingPort = await env.DB.prepare(
        "SELECT published_json, published_at FROM portfolios WHERE username = ?1 LIMIT 1"
      )
        .bind(clean)
        .first();
      updated.publishedAt = existingPort?.published_json
        ? (existingPort.published_at || portfolio.publishedAt || now)
        : null;
    }
    const jsonStr = JSON.stringify(updated);
    const userId = userAuth?.id || `user-${clean}`;
    const email = (userAuth?.email || updated.email || `${clean}@taqdom.me`).toLowerCase().trim();
    const pwdHash = userAuth?.passwordHash || "d1-hash";
    const salt = userAuth?.salt || "d1-salt";

    const existingUser = await env.DB.prepare(
      "SELECT id, email FROM users WHERE username = ?1"
    )
      .bind(clean)
      .first();

    const targetUserId = existingUser?.id || userId;
    if (!existingUser) {
      const emailConflict = await env.DB.prepare(
        "SELECT id FROM users WHERE email = ?1"
      )
        .bind(email)
        .first();
      const safeEmail = emailConflict ? `${clean}.${now}@taqdom.me` : email;
      await env.DB.prepare(
        `INSERT OR IGNORE INTO users (id, email, username, password_hash, salt, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
        .bind(targetUserId, safeEmail, clean, pwdHash, salt, now)
        .run();
    } else if (userAuth?.passwordHash) {
      await env.DB.prepare(
        `UPDATE users SET email = ?1, password_hash = ?2, salt = ?3 WHERE username = ?4`
      )
        .bind(email, pwdHash, salt, clean)
        .run();
    }

    const storedDraftVal = await storeChunkedPortfolioJson(env, clean, "draft", jsonStr);
    const storedPublishedVal = isPublish
      ? await storeChunkedPortfolioJson(env, clean, "published", jsonStr)
      : null;

    await env.DB.prepare(
      `INSERT INTO portfolios (user_id, username, template, draft_json, published_json, published_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
       ON CONFLICT(user_id) DO UPDATE SET
         username = excluded.username,
         template = excluded.template,
         draft_json = excluded.draft_json,
         published_json = CASE WHEN ?8 = 1 THEN excluded.published_json ELSE portfolios.published_json END,
         published_at = CASE WHEN ?8 = 1 THEN excluded.published_at ELSE portfolios.published_at END,
         updated_at = excluded.updated_at`
    )
      .bind(
        targetUserId,
        clean,
        updated.template || "haven",
        storedDraftVal,
        storedPublishedVal,
        isPublish ? now : null,
        now,
        isPublish ? 1 : 0
      )
      .run();
  } catch (error) {
    console.error("Persistence error:", error instanceof Error ? error.message : error);
    throw new Error("Cloudflare D1 persistence failed");
  }

  if (!isPublish) {
    try {
      const postPort = await env.DB.prepare(
        "SELECT published_json, published_at FROM portfolios WHERE username = ?1 LIMIT 1"
      )
        .bind(clean)
        .first();
      updated.publishedAt = postPort?.published_json
        ? (postPort.published_at || updated.publishedAt || now)
        : null;
      if (!postPort?.published_json) {
        edgeStore.unpublished.add(clean);
      }
    } catch {
      // Keep existing updated value on transient post-check failure
    }
  }

  // Update isolate-local cache only after the durable D1 write succeeds.
  edgeStore.portfolios[clean] = updated;
  if (isPublish) edgeStore.unpublished.delete(clean);
  return updated;
}

async function renameAndSaveAccountInD1(env, curUsername, targetRawUsername, options = {}) {
  const cur = normalizeUsername(curUsername);
  if (!cur) {
    return { errorResponse: jsonResponse({ error: "Authentication required" }, 401) };
  }
  if (!env.DB) {
    return { errorResponse: jsonResponse({ error: "Settings storage is unavailable." }, 503) };
  }

  const existingUser = await env.DB.prepare(
    "SELECT id, email, username, password_hash, salt FROM users WHERE username = ?1"
  )
    .bind(cur)
    .first();
  if (!existingUser) {
    return { errorResponse: jsonResponse({ error: "Account not found" }, 404) };
  }

  const portfolioRow = await env.DB.prepare(
    "SELECT published_json, published_at FROM portfolios WHERE username = ?1"
  )
    .bind(cur)
    .first();
  const wasPublished = Boolean(portfolioRow?.published_json);

  let targetUsername = cur;
  const normalizedTarget = normalizeUsername(String(targetRawUsername || cur));
  if (normalizedTarget && normalizedTarget !== cur) {
    const val = validateUsername(String(targetRawUsername));
    if (!val.valid) {
      return { errorResponse: jsonResponse({ error: val.reasonAr || "Invalid username" }, 400) };
    }
    const candidate = val.normalized;
    if (RESERVED_USERNAMES.has(candidate) || SEED_PORTFOLIOS[candidate]) {
      return {
        errorResponse: jsonResponse(
          { error: "هذا الاسم محجوز بالفعل لمبدع آخر / Username already taken" },
          409
        ),
      };
    }
    const takenRow = await env.DB.prepare(
      "SELECT username FROM users WHERE username = ?1 UNION SELECT username FROM portfolios WHERE username = ?1"
    )
      .bind(candidate)
      .first();
    if (takenRow) {
      return {
        errorResponse: jsonResponse(
          { error: "هذا الاسم محجوز بالفعل لمبدع آخر / Username already taken" },
          409
        ),
      };
    }
    targetUsername = candidate;
  }

  let pwdInfo = null;
  if (options.newPassword) {
    const newPassword = String(options.newPassword);
    if (newPassword.length < 8 || newPassword.length > 128) {
      return {
        errorResponse: jsonResponse(
          { error: "استخدم كلمة مرور من 8 إلى 128 حرفًا / Passwords must be 8–128 characters." },
          400
        ),
      };
    }
    pwdInfo = await hashPasswordEdge(newPassword);
  }

  const preservedHash = pwdInfo?.hash || existingUser.password_hash;
  const preservedSalt = pwdInfo?.salt || existingUser.salt;
  const preservedEmail = existingUser.email;
  const preservedUserId = existingUser.id;
  const basePortfolio =
    options.incomingPortfolio && typeof options.incomingPortfolio === "object"
      ? options.incomingPortfolio
      : (await getDraftPortfolioFromD1(env, cur)) || createStarterPortfolio(cur, "haven", cur);
  const currentPortfolio = structuredClone(basePortfolio);
  currentPortfolio.username = targetUsername;
  currentPortfolio.email = preservedEmail;
  currentPortfolio.publishedAt = options.isPublish
    ? Date.now()
    : wasPublished
      ? (portfolioRow?.published_at || currentPortfolio.publishedAt || Date.now())
      : null;
  currentPortfolio.updatedAt = Date.now();

  if (targetUsername !== cur) {
    let publishedJson = null;
    if (options.isPublish) {
      publishedJson = await storeChunkedPortfolioJson(
        env,
        targetUsername,
        "published",
        JSON.stringify(currentPortfolio)
      );
    } else if (wasPublished && portfolioRow?.published_json) {
      const resolvedPrevPub = await resolveChunkedPortfolioJson(
        env,
        cur,
        "published",
        portfolioRow.published_json
      );
      if (resolvedPrevPub) {
        publishedJson = await storeChunkedPortfolioJson(
          env,
          targetUsername,
          "published",
          JSON.stringify({
            ...JSON.parse(resolvedPrevPub),
            username: targetUsername,
            email: preservedEmail,
          })
        );
      }
    }
    const storedDraftRename = await storeChunkedPortfolioJson(
      env,
      targetUsername,
      "draft",
      JSON.stringify(currentPortfolio)
    );
    const renameStatements = [
      env.DB.prepare(
        "UPDATE users SET username = ?1, password_hash = ?2, salt = ?3 WHERE username = ?4"
      ).bind(targetUsername, preservedHash, preservedSalt, cur),
      env.DB.prepare("DELETE FROM portfolio_chunks WHERE username = ?1").bind(cur),
    ];
    if (portfolioRow) {
      renameStatements.push(
        env.DB.prepare(
          "UPDATE portfolios SET username = ?1, draft_json = ?2, published_json = ?3, updated_at = ?4 WHERE username = ?5"
        ).bind(
          targetUsername,
          storedDraftRename,
          publishedJson,
          Date.now(),
          cur
        )
      );
    }
    const { results: optionalTables = [] } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('mcp_access_tokens', 'oauth_refresh_tokens', 'oauth_codes', 'views', 'media')"
    )
      .all()
      .catch(() => ({ results: [] }));
    const tableNames = new Set(optionalTables.map((r) => r.name));
    for (const tbl of ["mcp_access_tokens", "oauth_refresh_tokens", "oauth_codes"]) {
      if (tableNames.has(tbl)) {
        renameStatements.push(
          env.DB.prepare(
            `UPDATE ${tbl} SET username = ?1 WHERE username = ?2 OR user_id = ?3`
          ).bind(targetUsername, cur, preservedUserId)
        );
      }
    }
    if (tableNames.has("views")) {
      renameStatements.push(
        env.DB.prepare("UPDATE views SET username = ?1 WHERE username = ?2").bind(
          targetUsername,
          cur
        )
      );
    }
    if (tableNames.has("media")) {
      renameStatements.push(
        env.DB.prepare("UPDATE media SET user_id = ?1 WHERE user_id = ?2").bind(
          `user-${targetUsername}`,
          `user-${cur}`
        )
      );
    }
    await env.DB.batch(renameStatements);
    delete edgeStore.portfolios[cur];
    delete edgeStore.users[cur];
    edgeStore.views[targetUsername] = edgeStore.views[cur] || 1;
    delete edgeStore.views[cur];
    if (wasPublished || options.isPublish) edgeStore.unpublished.delete(targetUsername);
    else edgeStore.unpublished.add(targetUsername);
  } else if (pwdInfo) {
    await env.DB.prepare(
      "UPDATE users SET password_hash = ?1, salt = ?2 WHERE username = ?3"
    )
      .bind(preservedHash, preservedSalt, cur)
      .run();
  }

  const userAuth = {
    id: preservedUserId,
    email: preservedEmail,
    passwordHash: preservedHash,
    salt: preservedSalt,
  };
  const saved = await savePortfolioToD1AndMemory(
    env,
    currentPortfolio,
    Boolean(options.isPublish),
    userAuth
  );
  edgeStore.users[targetUsername] = {
    id: preservedUserId,
    email: preservedEmail,
    username: targetUsername,
    passwordHash: preservedHash,
    salt: preservedSalt,
  };

  const sessionPayload = {
    id: preservedUserId,
    userId: preservedUserId,
    email: preservedEmail,
    username: targetUsername,
    isTestAccount: false,
  };
  const shouldRefreshCookie = targetUsername !== cur || Boolean(pwdInfo);
  const setCookieHeader = shouldRefreshCookie
    ? makeSessionCookie(
        await signEdgeSession(sessionPayload, env?.AUTH_SECRET),
        options.isSecure !== false
      )
    : null;

  return {
    ok: true,
    renamed: targetUsername !== cur,
    user: sessionPayload,
    portfolio: saved,
    setCookieHeader,
  };
}

async function handleApiRequest(request, url, env) {
  const { pathname, searchParams } = url;
  if (pathname === "/api/health" && (request.method === "GET" || request.method === "HEAD")) {
    try {
      const hasDb = Boolean(env?.DB);
      const hasAuthSecret =
        typeof env?.AUTH_SECRET === "string" && env.AUTH_SECRET.trim().length >= 32;
      let dbOk = false;
      if (hasDb) {
        const row = await env.DB.prepare("SELECT 1 AS ok").first();
        dbOk = row?.ok === 1;
      }
      const probe = await hashPasswordEdge(
        "TaqdomHealthProbe#2026!",
        PBKDF2_SALT_PREFIX + PBKDF2_CURRENT_ITERATIONS + "$00112233445566778899aabbccddeeff"
      );
      const pbkdf2Ok = Boolean(
        probe?.hash &&
          probe.hash.length === 64 &&
          probe?.salt?.startsWith(PBKDF2_SALT_PREFIX + PBKDF2_CURRENT_ITERATIONS + "$")
      );
      const ok = hasDb && dbOk && hasAuthSecret && pbkdf2Ok;
      const status = ok ? 200 : 503;
      if (request.method === "HEAD") {
        return new Response(null, {
          status,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      }
      return jsonResponse(
        {
          ok,
          status: ok ? "healthy" : "degraded",
        },
        status
      );
    } catch (err) {
      console.error(
        "Taqdom health check failed:",
        err instanceof Error ? err.stack || err.message : err
      );
      if (request.method === "HEAD") {
        return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
      }
      return jsonResponse({ ok: false, status: "error" }, 503);
    }
  }

  const isSecure = url.protocol === "https:";
  const origin = request.headers.get("origin");
  const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    isWriteMethod &&
    ((origin && origin !== url.origin) || (!origin && fetchSite === "cross-site"))
  ) {
    return jsonResponse({ error: "Cross-origin request rejected" }, 403);
  }

  const session = await parseSessionFromRequest(request, env);
  const sessionName = normalizeUsername(String(session?.username || ""));

  const rateProfiles = {
    "GET:/api/username/check": ["username-check", 600, 60_000],
    "POST:/api/auth/register": ["register-ip", 120, 60 * 60 * 1000],
    "POST:/api/auth/login": ["login-ip", 120, 15 * 60 * 1000],
    "POST:/api/auth/firebase": ["firebase-auth", 120, 60 * 60 * 1000],
    "POST:/api/auth/google": ["firebase-auth", 120, 60 * 60 * 1000],
    "POST:/api/auth/test-login": ["demo-login", 120, 15 * 60 * 1000],
    "POST:/api/auth/settings": ["account-settings", 200, 60 * 60 * 1000],
    "DELETE:/api/auth/settings": ["account-delete", 60, 60 * 60 * 1000],
    "POST:/api/upload": ["upload", 300, 60 * 60 * 1000],
    "POST:/api/views": ["views", 600, 60_000],
    "POST:/api/portfolio/publish": ["publish", 300, 60 * 60 * 1000],
    "DELETE:/api/portfolio/publish": ["unpublish", 120, 60 * 60 * 1000],
    "GET:/api/mcp/tokens": ["mcp-token-list", 300, 60_000],
    "POST:/api/mcp/tokens": ["mcp-token-create", 120, 60 * 60 * 1000],
    "DELETE:/api/mcp/tokens": ["mcp-token-revoke", 120, 60 * 60 * 1000],
  };
  const profile = rateProfiles[`${request.method}:${pathname}`];
  if (profile) {
    const [scope, limit, windowMs] = profile;
    const rateSubject = scope === "account-delete" ? sessionName : "";
    const rateResponse = await enforceRateLimit(request, env, scope, limit, windowMs, rateSubject);
    if (rateResponse) return rateResponse;
  }

  if (pathname === "/api/mcp/tokens") {
    if (session?.isTestAccount || SEED_PORTFOLIOS[sessionName]) {
      return jsonResponse({ error: "MCP connections are unavailable for showcase accounts." }, 403);
    }
    return handleMcpTokenApi(request, url, env, session);
  }
  const readOnlySession = Boolean(session?.isTestAccount || SEED_PORTFOLIOS[sessionName]);
  const ownsUsername = (username) =>
    Boolean(session?.username) &&
    !readOnlySession &&
    session.username === normalizeUsername(username);
  const unauthorized = () =>
    jsonResponse({ error: "يجب تسجيل الدخول أولاً / Authentication required" }, 401);
  const forbidden = () =>
    jsonResponse({ error: "لا تملك صلاحية تعديل هذا الحساب / You cannot modify this account" }, 403);

  if (pathname === "/api/username/check" && request.method === "GET") {
    const u = searchParams.get("u") || "";
    const val = validateUsername(u);
    if (!val.valid) {
      return jsonResponse({
        username: val.normalized,
        valid: false,
        available: false,
        isDemoAccount: false,
        reasonAr: val.reasonAr,
        reasonEn: val.reasonEn,
      });
    }
    const existing = await getDraftPortfolioFromD1(env, val.normalized);
    const taken = Boolean(existing);
    const isDemo = Boolean(SEED_PORTFOLIOS[val.normalized]);
    return jsonResponse({
      username: val.normalized,
      valid: true,
      available: !taken,
      isDemoAccount: isDemo,
      reasonAr: taken
        ? isDemo
          ? "هذا النطاق مستخدم لحساب عرض حي (يمكنك زيارته الآن)"
          : "هذا الاسم محجوز بالفعل"
        : "النطاق الفرعي متاح للحجز الفوري!",
      reasonEn: taken
        ? isDemo
          ? "Active live showcase subdomain"
          : "Username already taken"
        : "Subdomain is available for instant claim!",
    });
  }

  if (pathname === "/api/auth/test-login" && request.method === "POST") {
    const fresh = await getPublishedPortfolioFromD1(env, "layla");
    if (!fresh) {
      return jsonResponse({ error: "Demo portfolio is temporarily unavailable." }, 503);
    }
    const userPayload = {
      id: "user-layla",
      email: "layla@taqdom.me",
      username: "layla",
      isTestAccount: true,
    };
    const token = await signEdgeSession(userPayload, env?.AUTH_SECRET);
    return jsonResponse(
      {
        ok: true,
        user: userPayload,
        portfolio: fresh,
        readOnly: true,
      },
      200,
      {
        "Set-Cookie": makeSessionCookie(token, isSecure),
      }
    );
  }

  if (pathname === "/api/auth/register" && request.method === "POST") {
    const parsed = await parseJsonBody(request, 32768);
    if (!parsed.ok) return rateLimitBodyError(parsed);
    const body = parsed.value;
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const val = validateUsername(String(body.username || ""));
    const displayName = String(body.displayName || "").trim().slice(0, 80);
    const requestedTemplate = String(body.template || "haven");
    const template = TEMPLATES_CATALOG.some((item) => item.slug === requestedTemplate)
      ? requestedTemplate
      : "haven";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email) || email.length > 254) {
      return jsonResponse(
        { error: "يرجى إدخال بريد إلكتروني صحيح / Valid email required" },
        400
      );
    }
    if (!val.valid) {
      return jsonResponse({ error: val.reasonAr || val.reasonEn || "Invalid username" }, 400);
    }
    if (password.length < 8 || password.length > 128) {
      return jsonResponse(
        { error: "استخدم كلمة مرور من 8 إلى 128 حرفًا / Passwords must be 8–128 characters." },
        400
      );
    }
    if (SEED_PORTFOLIOS[val.normalized]) {
      return jsonResponse(
        { error: "هذا النطاق مستخدم لحساب عرض رسمي / Reserved showcase username" },
        409
      );
    }
    if (!env.DB) {
      return jsonResponse({ error: "Account storage is temporarily unavailable." }, 503);
    }

    const existingRow = await env.DB.prepare(
      "SELECT username, email FROM users WHERE username = ?1 OR LOWER(email) = ?2"
    )
      .bind(val.normalized, email)
      .first();

    if (existingRow && existingRow.username === val.normalized) {
      return jsonResponse(
        { error: "هذا الاسم محجوز بالفعل لمبدع آخر / Username already taken" },
        409
      );
    }
    if (existingRow && existingRow.email?.toLowerCase() === email) {
      return jsonResponse(
        { error: "البريد الإلكتروني مسجل بالفعل / Email already registered" },
        409
      );
    }

    const { hash, salt } = await hashPasswordEdge(password);
    const userObj = {
      id: `user-${crypto.randomUUID()}`,
      email,
      username: val.normalized,
      passwordHash: hash,
      salt,
    };
    const starter = createStarterPortfolio(
      val.normalized,
      template,
      displayName || val.normalized
    );
    starter.email = email;
    await savePortfolioToD1AndMemory(env, starter, true, userObj);
    edgeStore.users[val.normalized] = userObj;

    const sessionPayload = {
      id: userObj.id,
      userId: userObj.id,
      email: userObj.email,
      username: userObj.username,
      isTestAccount: false,
    };
    const token = await signEdgeSession(sessionPayload, env?.AUTH_SECRET);

    return jsonResponse(
      {
        ok: true,
        user: sessionPayload,
        portfolio: starter,
      },
      200,
      {
        "Set-Cookie": makeSessionCookie(token, isSecure),
      }
    );
  }

  if (pathname === "/api/auth/login" && request.method === "POST") {
    const parsed = await parseJsonBody(request, 32768);
    if (!parsed.ok) return rateLimitBodyError(parsed);
    const body = parsed.value;
    const identifier = String(body.identifier || body.email || body.username || "")
      .trim()
      .toLowerCase()
      .slice(0, 254);
    const password = String(body.password || "");

    if (!identifier || !password || password.length > 128) {
      return jsonResponse({ error: "بيانات الدخول غير صحيحة / Invalid credentials" }, 401);
    }

    const identityLimit = await enforceRateLimit(
      request,
      env,
      "login-identity",
      6,
      15 * 60 * 1000,
      identifier,
      false
    );
    if (identityLimit) return identityLimit;
    if (!env.DB) {
      return jsonResponse({ error: "Account storage is temporarily unavailable." }, 503);
    }

    const dbUser = await env.DB.prepare(
      "SELECT id, email, username, password_hash, salt FROM users WHERE LOWER(username) = ?1 OR LOWER(email) = ?1"
    )
      .bind(identifier)
      .first();

    if (!dbUser) {
      await hashPasswordEdge(
        password,
        "pbkdf2-sha256$600000$000102030405060708090a0b0c0d0e0f"
      );
      return jsonResponse(
        { error: "بيانات الدخول غير صحيحة / Invalid credentials" },
        401
      );
    }

    const isSeededHash =
      dbUser.password_hash === "seeded-pbkdf2" ||
      dbUser.password_hash === "seeded" ||
      dbUser.password_hash === "d1-hash";
    if (isSeededHash) {
      return jsonResponse(
        { error: "بيانات الدخول غير صحيحة / Invalid credentials" },
        401
      );
    }
    if (String(dbUser.password_hash || "").startsWith("firebase:")) {
      return jsonResponse(
        { error: "هذا الحساب مرتبط بحساب Google. اضغط على زر المتابعة بحساب Google أو أضف كلمة مرور من الإعدادات." },
        401
      );
    }

    let passwordMatches = false;
    try {
      const { hash } = await hashPasswordEdge(password, dbUser.salt);
      passwordMatches = constantTimeStringEqual(hash, dbUser.password_hash);
    } catch {
      passwordMatches = false;
    }
    if (!passwordMatches) {
      return jsonResponse(
        { error: "بيانات الدخول غير صحيحة / Invalid credentials" },
        401
      );
    }

    // Opportunistically upgrade legacy 100k-iteration hashes after a successful login.
    if (parsePasswordSalt(dbUser.salt).iterations < PBKDF2_CURRENT_ITERATIONS) {
      const upgraded = await hashPasswordEdge(password);
      await env.DB.prepare(
        "UPDATE users SET password_hash = ?1, salt = ?2 WHERE username = ?3"
      )
        .bind(upgraded.hash, upgraded.salt, dbUser.username)
        .run();
      if (edgeStore.users[dbUser.username]) {
        edgeStore.users[dbUser.username].passwordHash = upgraded.hash;
        edgeStore.users[dbUser.username].salt = upgraded.salt;
      }
    }

    const portfolio =
      (await getDraftPortfolioFromD1(env, dbUser.username)) ||
      SEED_PORTFOLIOS[dbUser.username] ||
      createStarterPortfolio(dbUser.username, "haven", dbUser.username);

    const sessionPayload = {
      id: dbUser.id,
      userId: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      isTestAccount: Boolean(SEED_PORTFOLIOS[normalizeUsername(dbUser.username)]),
    };
    const token = await signEdgeSession(sessionPayload, env?.AUTH_SECRET);

    return jsonResponse(
      {
        ok: true,
        user: sessionPayload,
        portfolio,
      },
      200,
      {
        "Set-Cookie": makeSessionCookie(token, isSecure),
      }
    );
  }

  if (
    (pathname === "/api/auth/firebase" || pathname === "/api/auth/google") &&
    request.method === "POST"
  ) {
    const parsed = await parseJsonBody(request, 32768);
    if (!parsed.ok) return rateLimitBodyError(parsed);
    const body = parsed.value;
    const idToken = String(body.idToken || "").trim();
    if (!idToken) {
      return jsonResponse(
        { error: "رمز مصادقة Firebase مطلوب / Firebase ID token required" },
        400
      );
    }
    if (!env.DB) {
      return jsonResponse({ error: "Account storage is temporarily unavailable." }, 503);
    }

    await ensureUsersFirebaseColumns(env);
    const projectId = env?.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
    let verified;
    try {
      verified = await verifyFirebaseIdToken(idToken, projectId);
    } catch (err) {
      return jsonResponse(
        {
          error:
            err instanceof Error
              ? err.message
              : "تعذر التحقق من حساب Google / Google verification failed",
        },
        401
      );
    }

    const existingRow = await env.DB.prepare(
      "SELECT id, email, username, firebase_uid, auth_provider FROM users WHERE firebase_uid = ?1 OR LOWER(email) = ?2 LIMIT 1"
    )
      .bind(verified.uid, verified.email)
      .first();

    if (existingRow && SEED_PORTFOLIOS[normalizeUsername(existingRow.username)]) {
      return jsonResponse(
        { error: "لا يمكن ربط حسابات العرض الرسمية عبر Google" },
        403
      );
    }

    if (existingRow) {
      const existingUsername = normalizeUsername(existingRow.username);
      if (!existingRow.firebase_uid) {
        await env.DB.prepare(
          "UPDATE users SET firebase_uid = ?1, auth_provider = ?2 WHERE id = ?3"
        )
          .bind(verified.uid, verified.provider, existingRow.id)
          .run();
      }
      const portfolio =
        (await getDraftPortfolioFromD1(env, existingUsername)) ||
        createStarterPortfolio(existingUsername, "madar", verified.name || existingUsername);
      const sessionPayload = {
        id: existingRow.id,
        userId: existingRow.id,
        email: existingRow.email,
        username: existingUsername,
        isTestAccount: false,
      };
      const token = await signEdgeSession(sessionPayload, env?.AUTH_SECRET);
      return jsonResponse(
        {
          ok: true,
          isNewUser: false,
          provider: verified.provider,
          user: { ...sessionPayload, authProvider: verified.provider },
          portfolio,
        },
        200,
        { "Set-Cookie": makeSessionCookie(token, isSecure) }
      );
    }

    let chosenUsername = "";
    const requestedRaw = String(body.username || "").trim();
    if (requestedRaw) {
      const val = validateUsername(requestedRaw);
      if (!val.valid) {
        return jsonResponse({ error: val.reasonAr || val.reasonEn || "Invalid username" }, 400);
      }
      if (SEED_PORTFOLIOS[val.normalized] || RESERVED_USERNAMES.has(val.normalized)) {
        return jsonResponse({ error: "هذا النطاق غير متاح / Username unavailable" }, 409);
      }
      const taken = await env.DB.prepare(
        "SELECT 1 AS taken FROM users WHERE username = ?1 OR EXISTS(SELECT 1 FROM portfolios WHERE username = ?1)"
      )
        .bind(val.normalized)
        .first();
      if (taken) {
        return jsonResponse({ error: "هذا الاسم محجوز بالفعل / Username already taken" }, 409);
      }
      chosenUsername = val.normalized;
    } else {
      chosenUsername = await suggestAvailableUsername(
        { displayName: verified.name, email: verified.email, uid: verified.uid },
        async (candidate) => {
          if (RESERVED_USERNAMES.has(candidate) || SEED_PORTFOLIOS[candidate]) return true;
          const row = await env.DB.prepare(
            "SELECT 1 AS taken FROM users WHERE username = ?1"
          )
            .bind(candidate)
            .first();
          return Boolean(row);
        }
      );
    }

    const rawTemplate = String(body.template || "madar").toLowerCase();
    const template = ALL_TEMPLATE_IDS.includes(rawTemplate) ? rawTemplate : "madar";
    const displayName = String(body.displayName || verified.name || chosenUsername)
      .trim()
      .slice(0, 80);

    const uidBytes = new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verified.uid))
    );
    const uidHex = Array.from(uidBytes, (b) => b.toString(16).padStart(2, "0")).join("");

    const userObj = {
      id: `user-${crypto.randomUUID()}`,
      email: verified.email,
      username: chosenUsername,
      passwordHash: `firebase:${uidHex}`,
      salt: "firebase-oauth",
    };

    const starter = createStarterPortfolio(chosenUsername, template, displayName);
    starter.email = verified.email;
    if (verified.picture) {
      starter.avatar = verified.picture;
    }

    await savePortfolioToD1AndMemory(env, starter, true, userObj);
    await env.DB.prepare(
      "UPDATE users SET firebase_uid = ?1, auth_provider = ?2 WHERE id = ?3"
    )
      .bind(verified.uid, verified.provider, userObj.id)
      .run();
    edgeStore.users[chosenUsername] = userObj;

    const sessionPayload = {
      id: userObj.id,
      userId: userObj.id,
      email: userObj.email,
      username: userObj.username,
      isTestAccount: false,
    };
    const token = await signEdgeSession(sessionPayload, env?.AUTH_SECRET);

    return jsonResponse(
      {
        ok: true,
        isNewUser: true,
        provider: verified.provider,
        user: { ...sessionPayload, authProvider: verified.provider },
        portfolio: starter,
      },
      200,
      { "Set-Cookie": makeSessionCookie(token, isSecure) }
    );
  }

  if (pathname === "/api/auth/logout" && request.method === "POST") {
    return jsonResponse(
      { ok: true },
      200,
      { "Set-Cookie": `taqdom_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${isSecure ? "; Secure" : ""}` }
    );
  }

  if (pathname === "/api/auth/me" && request.method === "GET") {
    const session = await parseSessionFromRequest(request, env);
    if (!session || !session.username) {
      return jsonResponse({ authenticated: false, user: null });
    }
    const p =
      (await getDraftPortfolioFromD1(env, session.username)) ||
      SEED_PORTFOLIOS[session.username] ||
      null;
    return jsonResponse({
      authenticated: true,
      user: {
        id: session.userId || session.id || `user-${session.username}`,
        email: session.email || `${session.username}@taqdom.me`,
        username: session.username,
        isTestAccount: Boolean(session.isTestAccount),
      },
      portfolio: p,
    });
  }

  if (pathname === "/api/auth/settings") {
    if (request.method === "POST") {
      if (!session?.username) return unauthorized();
      if (!env.DB) return jsonResponse({ error: "Account storage is temporarily unavailable." }, 503);
      const parsed = await parseJsonBody(request, 32768);
      if (!parsed.ok) return rateLimitBodyError(parsed);
      const body = parsed.value;
      const cur = normalizeUsername(String(session.username || body.currentUsername || ""));
      if (!cur) return jsonResponse({ error: "Missing currentUsername" }, 400);
      if (!ownsUsername(cur)) return forbidden();

      const res = await renameAndSaveAccountInD1(env, cur, body.newUsername || cur, {
        newPassword: body.newPassword ? String(body.newPassword) : "",
        isSecure,
      });
      if (res.errorResponse) return res.errorResponse;

      return jsonResponse(
        { ok: true, user: res.user, portfolio: res.portfolio, renamed: res.renamed },
        200,
        res.setCookieHeader ? { "Set-Cookie": res.setCookieHeader } : {}
      );
    }

    if (request.method === "DELETE") {
      if (!session?.username) return unauthorized();
      if (!env.DB) return jsonResponse({ error: "Account storage is temporarily unavailable." }, 503);
      const u = normalizeUsername(searchParams.get("u") || "");
      if (!u || SEED_PORTFOLIOS[u]) {
        return jsonResponse({ error: "Cannot delete showcase account" }, 403);
      }
      if (!ownsUsername(u)) return forbidden();

      const sessionUid = String(session?.userId || session?.id || "");
      const targetUserRow = sessionUid
        ? await env.DB.prepare("SELECT id, username FROM users WHERE id = ?1 OR username = ?2 LIMIT 1")
            .bind(sessionUid, u)
            .first()
            .catch(() => null)
        : await env.DB.prepare("SELECT id, username FROM users WHERE username = ?1 LIMIT 1")
            .bind(u)
            .first()
            .catch(() => null);
      const uid = String(targetUserRow?.id || sessionUid || "");
      const actualU = normalizeUsername(targetUserRow?.username || u);
      const portfolioRow = uid
        ? await env.DB.prepare(
            "SELECT username, draft_json, published_json FROM portfolios WHERE user_id = ?1 OR username = ?2 LIMIT 1"
          )
            .bind(uid, actualU)
            .first()
            .catch(() => null)
        : await env.DB.prepare(
            "SELECT username, draft_json, published_json FROM portfolios WHERE username = ?1 LIMIT 1"
          )
            .bind(actualU)
            .first()
            .catch(() => null);
      const portfolioUsername = normalizeUsername(portfolioRow?.username || actualU);

      const { results: existingTables = [] } = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('mcp_access_tokens', 'oauth_refresh_tokens', 'oauth_codes', 'portfolio_chunks', 'views', 'media', 'media_blobs', 'media_chunks')"
      )
        .all()
        .catch(() => ({ results: [] }));
      const tableNames = new Set(existingTables.map((r) => r.name));

      const mediaKeysToDelete = new Set();
      if (portfolioRow) {
        const rawParts = [
          await resolveChunkedPortfolioJson(env, portfolioUsername, "draft", portfolioRow.draft_json).catch(() => ""),
          await resolveChunkedPortfolioJson(env, portfolioUsername, "published", portfolioRow.published_json).catch(() => ""),
        ].filter(Boolean);
        for (const raw of rawParts) {
          for (const match of raw.matchAll(/\/api\/media\/([A-Za-z0-9._-]+)/g)) {
            if (match[1]) mediaKeysToDelete.add(match[1]);
          }
        }
      }
      if (tableNames.has("media") && uid) {
        const { results: userMediaRows = [] } = await env.DB.prepare(
          "SELECT key FROM media WHERE user_id = ?1 OR user_id = ?2 OR user_id = ?3"
        )
          .bind(uid, `user-${actualU}`, `user-${u}`)
          .all()
          .catch(() => ({ results: [] }));
        for (const r of userMediaRows) {
          if (r?.key) mediaKeysToDelete.add(String(r.key));
        }
      }

      const deleteStatements = [];
      for (const tbl of ["mcp_access_tokens", "oauth_refresh_tokens", "oauth_codes"]) {
        if (!tableNames.has(tbl)) continue;
        if (uid) {
          deleteStatements.push(
            env.DB.prepare(`DELETE FROM ${tbl} WHERE username = ?1 OR username = ?2 OR user_id = ?3`).bind(actualU, u, uid)
          );
        } else {
          deleteStatements.push(
            env.DB.prepare(`DELETE FROM ${tbl} WHERE username = ?1 OR username = ?2`).bind(actualU, u)
          );
        }
      }
      if (tableNames.has("portfolio_chunks")) {
        deleteStatements.push(
          env.DB.prepare("DELETE FROM portfolio_chunks WHERE username = ?1 OR username = ?2").bind(actualU, u)
        );
      }
      if (tableNames.has("views")) {
        deleteStatements.push(
          env.DB.prepare("DELETE FROM views WHERE username = ?1 OR username = ?2").bind(actualU, u)
        );
      }
      if (tableNames.has("media") && uid) {
        deleteStatements.push(
          env.DB.prepare("DELETE FROM media WHERE user_id = ?1 OR user_id = ?2 OR user_id = ?3").bind(uid, `user-${actualU}`, `user-${u}`)
        );
      }
      for (const mKey of mediaKeysToDelete) {
        if (tableNames.has("media")) {
          deleteStatements.push(env.DB.prepare("DELETE FROM media WHERE key = ?1").bind(mKey));
        }
        if (tableNames.has("media_chunks")) {
          deleteStatements.push(env.DB.prepare("DELETE FROM media_chunks WHERE key = ?1").bind(mKey));
        }
        if (tableNames.has("media_blobs")) {
          deleteStatements.push(env.DB.prepare("DELETE FROM media_blobs WHERE key = ?1").bind(mKey));
        }
      }
      if (uid) {
        deleteStatements.push(
          env.DB.prepare("DELETE FROM portfolios WHERE user_id = ?1 OR username = ?2 OR username = ?3").bind(uid, actualU, u),
          env.DB.prepare("DELETE FROM users WHERE id = ?1 OR username = ?2 OR username = ?3").bind(uid, actualU, u)
        );
      } else {
        deleteStatements.push(
          env.DB.prepare("DELETE FROM portfolios WHERE username = ?1 OR username = ?2").bind(actualU, u),
          env.DB.prepare("DELETE FROM users WHERE username = ?1 OR username = ?2").bind(actualU, u)
        );
      }
      for (let i = 0; i < deleteStatements.length; i += 20) {
        await env.DB.batch(deleteStatements.slice(i, i + 20));
      }
      for (const mKey of mediaKeysToDelete) {
        delete edgeStore.media[mKey];
      }
      for (const nameToClear of new Set([actualU, u, portfolioUsername].filter(Boolean))) {
        delete edgeStore.portfolios[nameToClear];
        delete edgeStore.users[nameToClear];
        delete edgeStore.views[nameToClear];
        edgeStore.unpublished.add(nameToClear);
      }
      return jsonResponse(
        { ok: true },
        200,
        { "Set-Cookie": `taqdom_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${isSecure ? "; Secure" : ""}` }
      );
    }
  }

  if (pathname === "/api/portfolio") {
    if (request.method === "GET") {
      if (searchParams.get("all") === "1") {
        const portfolios = await getAllPublishedPortfoliosFromD1(env);
        return jsonResponse({ portfolios });
      }
      const username = normalizeUsername(searchParams.get("u") || "layla");
      const mode = searchParams.get("mode") || "published";
      if (mode === "draft" && !ownsUsername(username)) return unauthorized();
      const portfolio = mode === "draft"
        ? await getDraftPortfolioFromD1(env, username)
        : await getPublishedPortfolioFromD1(env, username);
      if (!portfolio) return jsonResponse({ error: "Not found" }, 404);
      return jsonResponse({ portfolio });
    }
    if (request.method === "PUT") {
      if (!session?.username) return unauthorized();
      if (!ownsUsername(session.username)) return forbidden();
      const parsed = await parseJsonBody(request, 25_000_000);
      if (!parsed.ok) return rateLimitBodyError(parsed);
      let portfolio = parsed.value?.portfolio;
      if (!portfolio?.username) return jsonResponse({ error: "Invalid payload" }, 400);
      const curSessionName = normalizeUsername(String(session.username));
      let requestedUsername = normalizeUsername(String(portfolio.username));
      if (requestedUsername === "yourname") {
        portfolio = { ...portfolio, username: curSessionName };
        requestedUsername = curSessionName;
      }
      if (requestedUsername === curSessionName) {
        if (!ownsUsername(portfolio.username)) return forbidden();
        const validation = validateUsername(String(portfolio.username));
        if (!validation.valid) {
          return jsonResponse({ error: validation.reasonAr || "Invalid username" }, 400);
        }
        const saved = await savePortfolioToD1AndMemory(
          env,
          { ...portfolio, username: validation.normalized },
          false
        );
        return jsonResponse({ ok: true, portfolio: saved });
      }
      const res = await renameAndSaveAccountInD1(env, curSessionName, portfolio.username, {
        incomingPortfolio: portfolio,
        isPublish: false,
        isSecure,
      });
      if (res.errorResponse) return res.errorResponse;
      return jsonResponse(
        { ok: true, portfolio: res.portfolio, user: res.user, renamed: res.renamed },
        200,
        res.setCookieHeader ? { "Set-Cookie": res.setCookieHeader } : {}
      );
    }
  }

  if (pathname === "/api/portfolio/publish") {
    if (request.method === "POST") {
      if (!session?.username) return unauthorized();
      if (!ownsUsername(session.username)) return forbidden();
      const parsed = await parseJsonBody(request, 25_000_000);
      if (!parsed.ok) return rateLimitBodyError(parsed);
      let portfolio = parsed.value?.portfolio;
      if (!portfolio?.username) return jsonResponse({ error: "Missing portfolio" }, 400);
      const curSessionName = normalizeUsername(String(session.username));
      let requestedUsername = normalizeUsername(String(portfolio.username));
      if (requestedUsername === "yourname") {
        portfolio = { ...portfolio, username: curSessionName };
        requestedUsername = curSessionName;
      }
      if (requestedUsername === curSessionName) {
        if (!ownsUsername(portfolio.username)) return forbidden();
        const validation = validateUsername(String(portfolio.username));
        if (!validation.valid) {
          return jsonResponse({ error: validation.reasonAr || "Invalid username" }, 400);
        }
        const saved = await savePortfolioToD1AndMemory(
          env,
          { ...portfolio, username: validation.normalized },
          true
        );
        return jsonResponse({
          ok: true,
          portfolio: saved,
          subdomainUrl: `https://${saved.username}.taqdom.me`,
        });
      }
      const res = await renameAndSaveAccountInD1(env, curSessionName, portfolio.username, {
        incomingPortfolio: portfolio,
        isPublish: true,
        isSecure,
      });
      if (res.errorResponse) return res.errorResponse;
      return jsonResponse(
        {
          ok: true,
          portfolio: res.portfolio,
          user: res.user,
          renamed: res.renamed,
          subdomainUrl: `https://${res.portfolio.username}.taqdom.me`,
        },
        200,
        res.setCookieHeader ? { "Set-Cookie": res.setCookieHeader } : {}
      );
    }

    if (request.method === "DELETE") {
      if (!session?.username) return unauthorized();
      if (!env.DB) return jsonResponse({ error: "Portfolio storage is unavailable." }, 503);
      const uParam = searchParams.get("u");
      const parsed = await parseJsonBody(request, 8192);
      if (!parsed.ok) return rateLimitBodyError(parsed);
      const clean = normalizeUsername(String(uParam || parsed.value.username || ""));
      if (!clean) return jsonResponse({ error: "Missing username" }, 400);
      if (!ownsUsername(clean)) return forbidden();
      const existing = await env.DB.prepare(
        "SELECT username, draft_json FROM portfolios WHERE username = ?1"
      )
        .bind(clean)
        .first();
      if (!existing) return jsonResponse({ error: "Portfolio not found" }, 404);

      await ensureWorkerMediaSchema(env);
      const now = Date.now();
      let nextDraftVal = null;
      if (existing.draft_json) {
        try {
          const rawDraft = await resolveChunkedPortfolioJson(env, clean, "draft", existing.draft_json);
          if (rawDraft) {
            const parsedDraft = JSON.parse(rawDraft);
            parsedDraft.publishedAt = null;
            parsedDraft.updatedAt = now;
            nextDraftVal = await storeChunkedPortfolioJson(
              env,
              clean,
              "draft",
              JSON.stringify(parsedDraft)
            );
          }
        } catch {
          // Ignore malformed draft; getDraftPortfolioFromD1 still enforces publishedAt: null
        }
      }
      await env.DB.prepare(
        "DELETE FROM portfolio_chunks WHERE username = ?1 AND kind = 'published'"
      )
        .bind(clean)
        .run();
      await env.DB.prepare(
        nextDraftVal !== null
          ? "UPDATE portfolios SET draft_json = ?2, published_json = NULL, published_at = NULL, updated_at = ?3 WHERE username = ?1"
          : "UPDATE portfolios SET published_json = NULL, published_at = NULL, updated_at = ?2 WHERE username = ?1"
      )
        .bind(...(nextDraftVal !== null ? [clean, nextDraftVal, now] : [clean, now]))
        .run();
      edgeStore.unpublished.add(clean);
      if (edgeStore.portfolios[clean]) {
        edgeStore.portfolios[clean] = { ...edgeStore.portfolios[clean], publishedAt: null, updatedAt: now };
      }
      return jsonResponse({ ok: true, username: clean });
    }
  }

  if (pathname === "/api/upload" && request.method === "POST") {
    if (!session?.username) return unauthorized();
    if (!ownsUsername(session.username)) return forbidden();
    if (!env.DB) return jsonResponse({ error: "Image storage is unavailable." }, 503);
    const parsed = await parseJsonBody(request, 28_500_000);
    if (!parsed.ok) return rateLimitBodyError(parsed);
    const body = parsed.value;
    const dataUrl = String(body.dataUrl || "");
    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif|avif|svg\+xml));base64,([A-Za-z0-9+/]+=*)$/i);
    if (!match) {
      return jsonResponse(
        { error: "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP أو GIF أو AVIF أو SVG / Unsupported image format." },
        400
      );
    }
    const mime = match[1].toLowerCase();
    if (body.mime && String(body.mime).toLowerCase() !== mime) {
      return jsonResponse({ error: "Image type mismatch" }, 400);
    }
    let cleanBase64 = match[2];
    const padding = cleanBase64.endsWith("==") ? 2 : cleanBase64.endsWith("=") ? 1 : 0;
    let size = Math.floor((cleanBase64.length * 3) / 4) - padding;
    if (size <= 0 || size > 20_000_000) {
      return jsonResponse({ error: "Max image size is 20MB." }, 413);
    }
    if (mime === "image/svg+xml") {
      const cleanedSvg = sanitizeSvgBase64(cleanBase64);
      if (!cleanedSvg) {
        return jsonResponse({ error: "ملف SVG غير صالح أو يحتوي على أكواد غير آمنة / Unsafe or invalid SVG image." }, 415);
      }
      cleanBase64 = cleanedSvg.base64;
      size = cleanedSvg.size;
      if (size <= 0 || size > 20_000_000) {
        return jsonResponse({ error: "Max image size is 20MB." }, 413);
      }
    } else if (!validRasterImageData(mime, cleanBase64)) {
      return jsonResponse({ error: "محتوى الصورة لا يطابق الصيغة المحددة / Image bytes do not match declared type." }, 415);
    }

    const extMap = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/avif": "avif",
      "image/svg+xml": "svg",
    };
    const ext = extMap[mime] || "webp";
    const key = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const cleanDataUrl = `data:${mime};base64,${cleanBase64}`;
    const now = Date.now();
    await ensureWorkerMediaSchema(env);
    const ownerUserId = String(session.userId || session.id || `user-${session.username}`);
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, user_id TEXT, key TEXT, mime TEXT, size INTEGER, created_at INTEGER)"
    )
      .run()
      .catch(() => {});
    await env.DB.prepare(
      "INSERT OR IGNORE INTO media (id, user_id, key, mime, size, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )
      .bind(crypto.randomUUID(), ownerUserId, key, mime, size, now)
      .run()
      .catch(() => {});

    if (cleanDataUrl.length <= 900_000) {
      await env.DB.prepare(
        "INSERT INTO media_blobs (key, mime, size, data_url, created_at) VALUES (?1, ?2, ?3, ?4, ?5)"
      )
        .bind(key, mime, size, cleanDataUrl, now)
        .run();
    } else {
      const CHUNK_CHARS = 800_000;
      const chunkStmts = [];
      let seq = 0;
      for (let i = 0; i < cleanBase64.length; i += CHUNK_CHARS) {
        chunkStmts.push(
          env.DB.prepare(
            "INSERT INTO media_chunks (key, seq, chunk) VALUES (?1, ?2, ?3)"
          ).bind(key, seq++, cleanBase64.slice(i, i + CHUNK_CHARS))
        );
      }
      for (let i = 0; i < chunkStmts.length; i += 8) {
        await env.DB.batch(chunkStmts.slice(i, i + 8));
      }
      await env.DB.prepare(
        "INSERT INTO media_blobs (key, mime, size, data_url, created_at) VALUES (?1, ?2, ?3, ?4, ?5)"
      )
        .bind(key, mime, size, "__CHUNKED__", now)
        .run();
    }

    return jsonResponse({
      ok: true,
      key,
      size,
      mime,
      url: `/api/media/${key}`,
    });
  }

  if (pathname.startsWith("/api/media/") && request.method === "GET") {
    const key = pathname.slice("/api/media/".length);
    if (!/^\d{10,}-[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp|gif|avif|svg)$/i.test(key)) {
      return new Response("Not found", { status: 404 });
    }
    let item = !env.DB ? edgeStore.media[key] : null;
    let mime = item?.mime || "image/webp";
    let bytes = null;
    if (item?.dataUrl) {
      const base64Idx = item.dataUrl.indexOf("base64,");
      if (base64Idx === -1) return new Response("Invalid media", { status: 400 });
      const binStr = atob(item.dataUrl.slice(base64Idx + 7));
      bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    } else if (env.DB) {
      const row = await env.DB.prepare(
        "SELECT mime, size, data_url FROM media_blobs WHERE key = ?1"
      )
        .bind(key)
        .first();
      if (!row?.data_url) return new Response("Not found", { status: 404 });
      mime = row.mime || "image/webp";
      if (row.data_url === "__CHUNKED__") {
        const { results = [] } = await env.DB.prepare(
          "SELECT chunk FROM media_chunks WHERE key = ?1 ORDER BY seq ASC"
        )
          .bind(key)
          .all();
        if (!results.length) return new Response("Not found", { status: 404 });
        const decodedParts = [];
        let totalLen = 0;
        for (const r of results) {
          const bin = atob(String(r.chunk || ""));
          const part = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) part[i] = bin.charCodeAt(i);
          decodedParts.push(part);
          totalLen += part.length;
        }
        bytes = new Uint8Array(totalLen);
        let offset = 0;
        for (const part of decodedParts) {
          bytes.set(part, offset);
          offset += part.length;
        }
      } else {
        const base64Idx = row.data_url.indexOf("base64,");
        if (base64Idx === -1) return new Response("Invalid media", { status: 400 });
        const binStr = atob(row.data_url.slice(base64Idx + 7));
        bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      }
    }
    if (!bytes) return new Response("Not found", { status: 404 });
    const responseHeaders = {
      "Content-Type": mime,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    };
    if (mime === "image/svg+xml") {
      responseHeaders["Content-Security-Policy"] =
        "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'";
    }
    return new Response(bytes, {
      status: 200,
      headers: responseHeaders,
    });
  }

  if (pathname === "/api/views" && request.method === "POST") {
    const parsed = await parseJsonBody(request, 8192);
    if (!parsed.ok) return rateLimitBodyError(parsed);
    const clean = normalizeUsername(String(parsed.value.username || ""));
    if (!clean) return jsonResponse({ error: "Invalid username" }, 400);
    const published = await getPublishedPortfolioFromD1(env, clean);
    if (!published) return jsonResponse({ error: "Portfolio not found" }, 404);
    if (!env.DB) return jsonResponse({ error: "View counter is unavailable." }, 503);

    const day = new Date().toISOString().slice(0, 10);
    const result = await env.DB.prepare(
      `INSERT INTO views (username, day, count) VALUES (?1, ?2, 1)
       ON CONFLICT(username, day) DO UPDATE SET count = views.count + 1
       RETURNING count`
    )
      .bind(clean, day)
      .first();
    const sumRow = await env.DB.prepare(
      "SELECT COALESCE(SUM(count), 0) AS total FROM views WHERE username = ?1"
    )
      .bind(clean)
      .first();
    const recordedTotal = Number(sumRow?.total || result?.count || 0);
    const seedBaseline = published.isFlagshipShowcase ? Number(SEED_PORTFOLIOS[clean]?.views || 0) : 0;
    const total = seedBaseline + recordedTotal;
    edgeStore.views[clean] = total;
    return jsonResponse({ ok: true, views: edgeStore.views[clean] });
  }

  return jsonResponse({ error: "Not found" }, 404);
}

function rewriteSubdomainHtml(baseHtml, targetUser, customData) {
  const canonicalUrl = `https://${targetUser}.taqdom.me`;
  const headCloseTag = "</head>";
  const headCloseIdx = baseHtml.indexOf(headCloseTag);
  let headHtml = headCloseIdx !== -1 ? baseHtml.slice(0, headCloseIdx) : baseHtml;
  let bodyHtml = headCloseIdx !== -1 ? baseHtml.slice(headCloseIdx) : "";

  headHtml = headHtml
    .replace(/https:\/\/layla\.taqdom\.me/g, canonicalUrl)
    .replace(/layla\.taqdom\.me/g, `${targetUser}.taqdom.me`)
    .replace(/https:\/\/_shell\.taqdom\.me/g, canonicalUrl)
    .replace(/_shell\.taqdom\.me/g, `${targetUser}.taqdom.me`)
    .replace(/https:\/\/test\.taqdom\.me/g, canonicalUrl)
    .replace(/test\.taqdom\.me/g, `${targetUser}.taqdom.me`);

  bodyHtml = bodyHtml
    .replace(/https:\/\/_shell\.taqdom\.me/g, canonicalUrl)
    .replace(/_shell\.taqdom\.me/g, `${targetUser}.taqdom.me`);

  const replaceProfileJsonLd = (fragment, replacement) =>
    fragment.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, (match) =>
      match.includes('"@type":"ProfilePage"') ? replacement : match
    );

  if (!customData) {
    const availTitle = `${targetUser}.taqdom.me — هذا النطاق متاح للحجز | تَقَدُّم`;
    const availDesc = `احجز النطاق السيادي ${targetUser}.taqdom.me وأنشئ معرض أعمالك الفاخر على منصة تَقَدُّم.`;
    const hasRobotsMeta = /<meta name="robots" content="[^"]*"\s*\/?>/i.test(headHtml);
    headHtml = headHtml
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(availTitle)}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"\s*\/?>/i,
        `<meta name="description" content="${escapeHtml(availDesc)}"/>`
      )
      .replace(
        /<meta property="og:title" content="[^"]*"\s*\/?>/i,
        `<meta property="og:title" content="${escapeHtml(availTitle)}"/>`
      )
      .replace(
        /<meta property="og:description" content="[^"]*"\s*\/?>/i,
        `<meta property="og:description" content="${escapeHtml(availDesc)}"/>`
      )
      .replace(
        /<meta property="og:url" content="[^"]*"\s*\/?>/i,
        `<meta property="og:url" content="${escapeHtml(canonicalUrl)}"/>`
      )
      .replace(
        /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
        `<meta name="twitter:title" content="${escapeHtml(availTitle)}"/>`
      )
      .replace(
        /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
        `<meta name="twitter:description" content="${escapeHtml(availDesc)}"/>`
      )
      .replace(
        /<meta name="robots" content="[^"]*"\s*\/?>/gi,
        `<meta name="robots" content="noindex, nofollow"/>`
      );
    const emptyJsonLdScript = '<script type="application/ld+json">{}</script>';
    headHtml = replaceProfileJsonLd(headHtml, emptyJsonLdScript);
    bodyHtml = replaceProfileJsonLd(bodyHtml, emptyJsonLdScript);

    const bootstrapScript = `${
      hasRobotsMeta ? "" : '<meta name="robots" content="noindex, nofollow"/>'
    }<script>window.__TAQDOM_SUBDOMAIN__=${JSON.stringify(
      targetUser
    )};window.__TAQDOM_PORTFOLIO__=null;</script>`;
    return headCloseIdx !== -1
      ? `${headHtml}${bootstrapScript}${bodyHtml}`
      : `${headHtml}${bootstrapScript}`;
  }

  const rawTitle =
    customData.seo?.title ||
    `${customData.name?.ar || targetUser} — ${
      customData.title?.ar || customData.name?.en || targetUser
    }`;
  const title =
    rawTitle
      .replace(/\s*(?:—\s*تَقَدُّم\s*\|\s*Taqdom|\|\s*تَقَدُّم|\|\s*Taqdom|—\s*تَقَدُّم)\s*$/gi, "")
      .trim() ||
    `${customData.name?.ar || targetUser} — ${
      customData.title?.ar || customData.name?.en || targetUser
    }`;
  const fallbackDesc = [customData.bio?.ar, customData.bio?.en].filter(Boolean).join(" — ");
  const rawDesc = String(customData.seo?.description || "").trim();
  const description =
    !rawDesc || /بقالب\s+.*على\s+منصة\s+تَقَدُّم|على\s+منصة\s+تَقَدُّم|\bon\s+Taqdom\b/i.test(rawDesc)
      ? fallbackDesc ||
        rawDesc
          .replace(/\s*(?:بقالب\s+[^.]*\s*)?(?:على\s+منصة\s+تَقَدُّم|on\s+Taqdom)\.?\s*$/gi, "")
          .trim()
      : rawDesc;

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: canonicalUrl,
    mainEntity: {
      "@type": "Person",
      name: customData.name?.en || targetUser,
      alternateName: customData.name?.ar || targetUser,
      jobTitle: customData.title?.en || "",
      description: customData.bio?.en || customData.bio?.ar || "",
      image: (() => {
        const av = String(customData.avatar || "").trim();
        if (/^https?:\/\//i.test(av)) {
          const safeAv = safePortfolioHref(av);
          return safeAv !== "#" ? safeAv : "https://taqdom.me/images/taqdom-avatar-placeholder.svg";
        }
        return `https://taqdom.me${av.startsWith("/") ? av : "/images/taqdom-avatar-placeholder.svg"}`;
      })(),
      url: canonicalUrl,
      address: {
        "@type": "PostalAddress",
        addressLocality: customData.city?.en || "Cairo, Egypt",
      },
      sameAs: Array.isArray(customData.links)
        ? customData.links.filter((l) => l && l.url).map((l) => safePortfolioHref(l.url)).filter((u) => u !== "#")
        : [],
    },
    hasPart: Array.isArray(customData.projects)
      ? customData.projects.filter(Boolean).map((p) => ({
          "@type": "CreativeWork",
          name: p.title?.en || "",
          headline: p.title?.ar || "",
          description: p.desc?.en || "",
          dateCreated: p.year || "2026",
        }))
      : [],
  };

  const resolvedOgImage = (() => {
    const candidate = String(customData.cover || customData.avatar || "").trim();
    if (/^https?:\/\//i.test(candidate)) {
      const safe = safePortfolioHref(candidate);
      return safe !== "#" ? safe : "https://taqdom.me/opengraph-image";
    }
    return candidate.startsWith("/")
      ? `https://taqdom.me${candidate}`
      : "https://taqdom.me/opengraph-image";
  })();

  const keywordsStr = Array.isArray(customData.seo?.keywords) && customData.seo.keywords.length > 0
    ? customData.seo.keywords.join(",")
    : [
        customData.name?.ar,
        customData.name?.en,
        targetUser,
        customData.title?.ar,
        customData.title?.en,
        ...(Array.isArray(customData.skills) ? customData.skills.slice(0, 6) : []),
      ]
        .filter(Boolean)
        .join(",");

  const robotsValue = customData.seo?.noindex ? "noindex, nofollow" : "index, follow";
  const hasCanonicalLink = /<link\b[^>]*\brel=["']canonical["'][^>]*>/i.test(headHtml);
  const hasOgTypeMeta = /<meta\b[^>]*\bproperty=["']og:type["'][^>]*>/i.test(headHtml);
  const hasRobotsMeta = /<meta\b[^>]*\bname=["']robots["'][^>]*>/i.test(headHtml);

  headHtml = headHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<link\b[^>]*\brel=["']canonical["'][^>]*>/gi,
      `<link rel="canonical" href="${escapeHtml(canonicalUrl)}"/>`
    )
    .replace(
      /<meta\b[^>]*\bproperty=["']og:type["'][^>]*>/gi,
      `<meta property="og:type" content="profile"/>`
    )
    .replace(
      /<meta\b[^>]*\bname=["']robots["'][^>]*>/gi,
      `<meta name="robots" content="${robotsValue}"/>`
    )
    .replace(
      /<meta name="description" content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(description)}"/>`
    )
    .replace(
      /<meta name="keywords" content="[^"]*"\s*\/?>/i,
      `<meta name="keywords" content="${escapeHtml(keywordsStr)}"/>`
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${escapeHtml(title)}"/>`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${escapeHtml(description)}"/>`
    )
    .replace(
      /<meta property="og:url" content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${escapeHtml(canonicalUrl)}"/>`
    )
    .replace(
      /<meta property="og:image" content="[^"]*"\s*\/?>/i,
      `<meta property="og:image" content="${escapeHtml(resolvedOgImage)}"/>`
    )
    .replace(
      /<meta property="og:image:alt" content="[^"]*"\s*\/?>/i,
      `<meta property="og:image:alt" content="${escapeHtml(customData.name?.en || customData.name?.ar || targetUser)}"/>`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${escapeHtml(title)}"/>`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${escapeHtml(description)}"/>`
    )
    .replace(
      /<meta name="twitter:image" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${escapeHtml(resolvedOgImage)}"/>`
    )
    .replace(
      /<meta name="twitter:image:alt" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image:alt" content="${escapeHtml(customData.name?.en || customData.name?.ar || targetUser)}"/>`
    );

  const jsonLdScript = `<script type="application/ld+json">${safeJsonForHtmlScript(personJsonLd)}</script>`;
  const hasProfileLdHead = /<script type="application\/ld\+json">[\s\S]*?"@type":"ProfilePage"[\s\S]*?<\/script>/i.test(headHtml);
  const hasProfileLdBody = /<script type="application\/ld\+json">[\s\S]*?"@type":"ProfilePage"[\s\S]*?<\/script>/i.test(bodyHtml);
  headHtml = replaceProfileJsonLd(headHtml, jsonLdScript);
  bodyHtml = hasProfileLdHead
    ? replaceProfileJsonLd(bodyHtml, "")
    : replaceProfileJsonLd(bodyHtml, jsonLdScript);

  const missingSeoTags = [
    hasCanonicalLink ? "" : `<link rel="canonical" href="${escapeHtml(canonicalUrl)}"/>`,
    hasOgTypeMeta ? "" : `<meta property="og:type" content="profile"/>`,
    hasRobotsMeta ? "" : `<meta name="robots" content="${robotsValue}"/>`,
    !hasProfileLdHead && !hasProfileLdBody ? jsonLdScript : "",
  ].join("");

  const safeJson = safeJsonForHtmlScript(customData);
  const bootstrapScript = `${missingSeoTags}<meta name="x-taqdom-bio" content="${escapeHtml(
    customData.bio?.ar || ""
  )}"/><script>window.__TAQDOM_SUBDOMAIN__=${JSON.stringify(
    targetUser
  )};window.__TAQDOM_PORTFOLIO__=${safeJson};</script>`;

  return headCloseIdx !== -1
    ? `${headHtml}${bootstrapScript}${bodyHtml}`
    : `${headHtml}${bootstrapScript}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const rawHost = request.headers.get("host") || url.host;
    const { root, sub } = parseHost(rawHost);
    const { pathname } = url;

    // 0a. Firebase Custom AuthDomain Reverse Proxy (/__/auth/* and /__/firebase/*)
    // Ensures Google Sign-In displays "taqdom.me" instead of "inspirational-terra-rtn3v.firebaseapp.com"
    if (pathname.startsWith("/__/auth/") || pathname.startsWith("/__/firebase/")) {
      const upstreamUrl = `https://inspirational-terra-rtn3v.firebaseapp.com${pathname}${url.search}`;
      const proxyHeaders = new Headers();
      for (const h of ["accept", "accept-language", "user-agent", "content-type"]) {
        const val = request.headers.get(h);
        if (val) proxyHeaders.set(h, val);
      }
      const upstreamRes = await fetch(upstreamUrl, {
        method: request.method,
        headers: proxyHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: "manual",
      });
      const resHeaders = new Headers(upstreamRes.headers);
      for (const internalHeader of [
        "x-served-by",
        "x-cache",
        "x-cache-hits",
        "x-timer",
        "vary",
        "server",
        "x-powered-by",
        "via",
      ]) {
        resHeaders.delete(internalHeader);
      }
      resHeaders.set("X-Content-Type-Options", "nosniff");
      resHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      resHeaders.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        statusText: upstreamRes.statusText,
        headers: resHeaders,
      });
    }

    // 0. OAuth 2.1 Discovery, Dynamic Client Registration, Consent API & Token Exchange
    if (isOAuthRoute(pathname)) {
      const allowCrossOrigin = !pathname.startsWith("/api/oauth/");
      if (["POST:/oauth/register", "POST:/oauth/token", "POST:/api/oauth/approve"].includes(`${request.method}:${pathname}`)) {
        const rateRes = await enforceRateLimit(request, env, `oauth:${pathname}`, 30, 15 * 60 * 1000);
        if (rateRes) return applySecurityHeaders(rateRes, allowCrossOrigin);
      }
      try {
        return applySecurityHeaders(
          await handleOAuthRequest(request, url, env, { parseSessionFn: parseSessionFromRequest }),
          allowCrossOrigin
        );
      } catch (error) {
        console.error(
          "Taqdom OAuth error:",
          request.method,
          pathname,
          error instanceof Error ? error.stack || error.message : error
        );
        return applySecurityHeaders(
          jsonResponse({ error: "server_error", error_description: "OAuth processing failed." }, 500),
          true
        );
      }
    }

    if (pathname === "/oauth/authorize" || pathname === "/oauth/authorize/") {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = "/oauth/authorize";
      assetUrl.search = "";
      return applySecurityHeaders(await env.ASSETS.fetch(new Request(assetUrl.toString())));
    }

    // 0b. Model Context Protocol (MCP) Endpoints & OpenAPI / ChatGPT Actions Bridge
    if (pathname === "/openapi.json" && (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS")) {
      return applySecurityHeaders(handleOpenApiSpec(request, url, false), true);
    }
    if (pathname === "/.well-known/ai-plugin.json" && (request.method === "GET" || request.method === "OPTIONS")) {
      return applySecurityHeaders(handleOpenApiSpec(request, url, true), true);
    }
    if (pathname.startsWith("/api/mcp/tools/")) {
      const toolName = pathname.slice("/api/mcp/tools/".length).replace(/\/+$/, "");
      return applySecurityHeaders(await handleMcpRestRequest(request, env, toolName), true);
    }
    if (pathname === "/mcp" || pathname === "/mcp/") {
      return applySecurityHeaders(await handleMcpRequest(request, env, null, null), true);
    }
    const mcpDirectMatch = pathname.match(/^\/mcp\/([a-z0-9-]{3,30})\/(tqd_(?:mcp|oat)_[a-f0-9]{64})\/?$/i);
    if (mcpDirectMatch) {
      return applySecurityHeaders(
        await handleMcpRequest(request, env, normalizeUsername(mcpDirectMatch[1]), mcpDirectMatch[2]),
        true
      );
    }
    const mcpMatch = pathname.match(/^\/mcp\/([a-z0-9-]{3,30})\/?$/i);
    if (mcpMatch) {
      return applySecurityHeaders(
        await handleMcpRequest(request, env, normalizeUsername(mcpMatch[1]), null),
        true
      );
    }

    // 1. Handle API endpoints
    if (pathname.startsWith("/api/")) {
      try {
        const allowCrossOriginMedia = pathname.startsWith("/api/media/");
        return applySecurityHeaders(await handleApiRequest(request, url, env), allowCrossOriginMedia);
      } catch (error) {
        console.error(
          "Taqdom API error:",
          request.method,
          pathname,
          error instanceof Error ? error.stack || error.message : error
        );
        return applySecurityHeaders(
          jsonResponse({ error: "حدث خطأ داخلي. حاول مرة أخرى / An internal error occurred." }, 500)
        );
      }
    }

    // 2. Dynamic /robots.txt and /sitemap.xml
    if (pathname === "/robots.txt") {
      return applySecurityHeaders(new Response(
        `User-agent: *\nAllow: /\nAllow: /templates\nAllow: /explore\nAllow: /auth\nDisallow: /api/\nDisallow: /dashboard/settings\nHost: https://taqdom.me\nSitemap: https://taqdom.me/sitemap.xml\n`,
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      ));
    }

    if (pathname === "/sitemap.xml") {
      const allPortfolios = await getAllPublishedPortfoliosFromD1(env);
      const urls = [
        "https://taqdom.me",
        "https://taqdom.me/templates",
        "https://taqdom.me/explore",
        "https://taqdom.me/auth",
        ...TEMPLATES_CATALOG.map((t) => `https://taqdom.me/templates/${t.slug}`),
        ...allPortfolios
          .filter((p) => !p?.seo?.noindex && p?.username)
          .map((p) => `https://${p.username}.taqdom.me`),
      ];
      const uniqueUrls = Array.from(new Set(urls));
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls
        .map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`)
        .join("\n")}\n</urlset>`;
      return applySecurityHeaders(new Response(xml, {
        status: 200,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      }));
    }

    // 3. Pass static assets directly to ASSETS binding
    if (
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/images/") ||
      /\.[a-zA-Z0-9]{2,5}$/.test(pathname)
    ) {
      return applySecurityHeaders(await env.ASSETS.fetch(request), pathname.startsWith("/images/"));
    }

    // 4. www -> apex 308 redirect
    if (root && sub === "www") {
      return applySecurityHeaders(Response.redirect(`https://${root}${pathname}${url.search}`, 308));
    }

    // 5. Direct /portfolio/x, /@x, or /x on root -> 308 redirect to https://x.taqdom.me/
    if (root && !sub) {
      const explicitMatch = pathname.match(/^\/(?:portfolio\/|@)([a-z0-9-]{3,30})\/?$/i);
      if (explicitMatch) {
        const candidate = explicitMatch[1].toLowerCase();
        if (!APP_ROUTES.has(candidate) && !candidate.startsWith("-") && !candidate.endsWith("-")) {
          return applySecurityHeaders(Response.redirect(`https://${candidate}.${root}/`, 308));
        }
      }

      const directMatch = pathname.match(/^\/([a-z0-9-]{3,30})\/?$/i);
      if (directMatch) {
        const candidate = directMatch[1].toLowerCase();
        if (!APP_ROUTES.has(candidate) && !candidate.startsWith("-") && !candidate.endsWith("-")) {
          return applySecurityHeaders(Response.redirect(`https://${candidate}.${root}/`, 308));
        }
      }
    }

    // 6. Subdomain request: username.taqdom.me -> serve dynamically enriched portfolio
    if (root && sub && !RESERVED_USERNAMES.has(sub)) {
      if (pathname !== "/") {
        return applySecurityHeaders(
          Response.redirect(`https://${root}${pathname}${url.search}`, 308)
        );
      }

      const targetUser = normalizeUsername(sub);
      const knownStatic = new Set(["layla", "youssef", "farida", "karim", "tariq", "salma", "nora"]);
      const targetPath = knownStatic.has(targetUser)
        ? `/portfolio/${targetUser}`
        : `/portfolio/_shell`;

      const isRscRequest = request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
      if (isRscRequest) {
        const rscUrl = new URL(request.url);
        rscUrl.pathname = `${targetPath}.rsc`;
        rscUrl.search = "";
        const rscRes = await env.ASSETS.fetch(new Request(rscUrl.toString()));
        if (rscRes.ok) {
          return applySecurityHeaders(
            new Response(rscRes.body, {
              status: 200,
              headers: {
                "Content-Type": "text/x-component; charset=utf-8",
                "X-Taqdom-Subdomain": targetUser,
              },
            })
          );
        }
      }

      const assetUrl = new URL(request.url);
      assetUrl.pathname = targetPath;

      const assetRes = await env.ASSETS.fetch(new Request(assetUrl.toString()));
      if (assetRes.ok) {
        const rawHtml = await assetRes.text();
        const customData = await getPublishedPortfolioFromD1(env, targetUser);
        const enrichedHtml = rewriteSubdomainHtml(rawHtml, targetUser, customData);
        return applySecurityHeaders(new Response(enrichedHtml, {
          status: customData ? 200 : 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Taqdom-Subdomain": targetUser,
          },
        }));
      }
    }

    // 7. Standard Marketing / App routes on root domain
    return applySecurityHeaders(await env.ASSETS.fetch(request));
  },
};
