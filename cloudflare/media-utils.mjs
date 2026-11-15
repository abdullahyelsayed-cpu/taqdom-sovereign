import { isPublicSafeHttpsUrl } from "./oauth.mjs";

export const MAX_IMAGE_BYTES = 20_000_000;

export const ALLOWED_IMAGE_MIME_SET = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

/** @type {Record<string, string>} */
export const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export function normalizeImageMime(rawMime) {
  const clean = String(rawMime || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!clean) return "";
  if (clean === "image/jpg" || clean === "image/pjpeg") return "image/jpeg";
  if (clean === "image/x-png") return "image/png";
  if (clean === "image/svg") return "image/svg+xml";
  return clean;
}

export function normalizeBase64Input(rawBase64) {
  let clean = String(rawBase64 || "")
    .replace(/\s+/g, "")
    .replace(/^['"]+|['"]+$/g, "");
  if (!clean) return "";
  if (clean.includes("-") || clean.includes("_")) {
    clean = clean.replace(/-/g, "+").replace(/_/g, "/");
  }
  const mod = clean.length % 4;
  if (mod === 1) return "";
  if (mod === 2) clean += "==";
  else if (mod === 3) clean += "=";
  if (!/^[A-Za-z0-9+/]+=*$/.test(clean)) return "";
  return clean;
}

export function base64ToBytes(base64) {
  const normalized = normalizeBase64Input(base64);
  if (!normalized) return null;
  try {
    const bin = atob(normalized);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function bytesToBase64(bytes) {
  let outBin = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    outBin += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(outBin);
}

export function validJpegBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 16) return false;
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return false;
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

export function validPngBytes(bytes) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!(bytes instanceof Uint8Array) || bytes.length < 33 || !sig.every((b, i) => bytes[i] === b)) {
    return false;
  }
  let pos = 8;
  let sawIhdr = false;
  let sawIdat = false;
  let sawIend = false;
  while (pos + 12 <= bytes.length) {
    const chunkLen =
      ((bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3]) >>> 0;
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    if (pos + 12 + chunkLen > bytes.length) return false;
    if (pos === 8) {
      if (type !== "IHDR" || chunkLen !== 13) return false;
      const w =
        ((bytes[pos + 8] << 24) | (bytes[pos + 9] << 16) | (bytes[pos + 10] << 8) | bytes[pos + 11]) >>> 0;
      const h =
        ((bytes[pos + 12] << 24) | (bytes[pos + 13] << 16) | (bytes[pos + 14] << 8) | bytes[pos + 15]) >>> 0;
      if (w < 1 || h < 1) return false;
      sawIhdr = true;
    } else if (type === "IDAT" && chunkLen > 0) {
      sawIdat = true;
    } else if (type === "IEND") {
      sawIend = chunkLen === 0;
      break;
    }
    pos += 12 + chunkLen;
  }
  return sawIhdr && sawIdat && sawIend;
}

export function validWebpBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 20) return false;
  if (
    bytes[0] !== 0x52 ||
    bytes[1] !== 0x49 ||
    bytes[2] !== 0x46 ||
    bytes[3] !== 0x46 ||
    bytes[8] !== 0x57 ||
    bytes[9] !== 0x45 ||
    bytes[10] !== 0x42 ||
    bytes[11] !== 0x50
  ) {
    return false;
  }
  const riffSize = (bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24)) >>> 0;
  if (riffSize < 12 || riffSize + 8 > bytes.length) return false;
  const end = 8 + riffSize;
  let pos = 12;
  let hasFrame = false;
  while (pos + 8 <= end) {
    const tag = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
    const cSize = (bytes[pos + 4] | (bytes[pos + 5] << 8) | (bytes[pos + 6] << 16) | (bytes[pos + 7] << 24)) >>> 0;
    const padded = cSize + (cSize & 1);
    if (pos + 8 + cSize > end) return false;
    if (tag === "VP8 " && cSize >= 10) {
      if (pos + 18 <= end && bytes[pos + 11] === 0x9d && bytes[pos + 12] === 0x01 && bytes[pos + 13] === 0x2a) {
        const w = (bytes[pos + 14] | (bytes[pos + 15] << 8)) & 0x3fff;
        const h = (bytes[pos + 16] | (bytes[pos + 17] << 8)) & 0x3fff;
        if (w <= 0 || h <= 0) return false;
      }
      hasFrame = true;
    } else if (tag === "VP8L" && cSize >= 5 && bytes[pos + 8] === 0x2f) {
      if (pos + 13 <= end) {
        const b0 = bytes[pos + 9], b1 = bytes[pos + 10], b2 = bytes[pos + 11], b3 = bytes[pos + 12];
        const w = 1 + (b0 | ((b1 & 0x3f) << 8));
        const h = 1 + ((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10));
        if (w <= 0 || h <= 0) return false;
      }
      hasFrame = true;
    } else if (tag === "VP8X" && cSize >= 10) {
      const w = 1 + (bytes[pos + 12] | (bytes[pos + 13] << 8) | (bytes[pos + 14] << 16));
      const h = 1 + (bytes[pos + 15] | (bytes[pos + 16] << 8) | (bytes[pos + 17] << 16));
      if (w < 1 || h < 1) return false;
    }
    pos += 8 + padded;
  }
  return hasFrame || pos === end;
}

export function validGifBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 14) return false;
  const hdr = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
  if (hdr !== "GIF87a" && hdr !== "GIF89a") return false;
  const w = bytes[6] | (bytes[7] << 8);
  const h = bytes[8] | (bytes[9] << 8);
  if (w < 1 || h < 1) return false;
  for (let back = 1; back <= Math.min(8, bytes.length - 13); back++) {
    const b = bytes[bytes.length - back];
    if (b === 0x3b) return true;
    if (b !== 0x00) break;
  }
  return false;
}

function hasAvifBrand(bytes, ftypSize) {
  const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (["avif", "avis", "mif1", "msf1"].includes(brand)) return true;
  for (let p = 16; p + 4 <= ftypSize; p += 4) {
    const compat = String.fromCharCode(bytes[p], bytes[p + 1], bytes[p + 2], bytes[p + 3]);
    if (["avif", "avis", "mif1", "msf1"].includes(compat)) return true;
  }
  return false;
}

export function validAvifBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 16) return false;
  const ftypSize = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  if (ftypSize < 16 || ftypSize > bytes.length) return false;
  if (String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]) !== "ftyp") return false;
  if (!hasAvifBrand(bytes, ftypSize)) return false;
  let pos = ftypSize;
  let sawMeta = false;
  let sawMdat = false;
  while (pos + 8 <= bytes.length) {
    const size = ((bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3]) >>> 0;
    const effective = size === 0 ? bytes.length - pos : size;
    if (effective < 8 || pos + effective > bytes.length) return false;
    const t = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    if (t === "meta") sawMeta = true;
    if (t === "mdat") sawMdat = true;
    pos += effective;
  }
  return sawMeta && sawMdat;
}

export function validRasterBytes(mime, bytes) {
  const cleanMime = normalizeImageMime(mime);
  if (!(bytes instanceof Uint8Array) || bytes.length < 12) return false;
  if (cleanMime === "image/jpeg") return validJpegBytes(bytes);
  if (cleanMime === "image/png") return validPngBytes(bytes);
  if (cleanMime === "image/webp") return validWebpBytes(bytes);
  if (cleanMime === "image/gif") return validGifBytes(bytes);
  if (cleanMime === "image/avif") return validAvifBytes(bytes);
  return false;
}

export function detectImageMimeFromBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 4) return "";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length >= 6) {
    const hdr = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
    if (hdr === "GIF87a" || hdr === "GIF89a") return "image/gif";
  }
  if (bytes.length >= 16) {
    const ftypSize = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    if (
      ftypSize >= 16 &&
      ftypSize <= bytes.length &&
      String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]) === "ftyp" &&
      hasAvifBrand(bytes, ftypSize)
    ) {
      return "image/avif";
    }
  }
  const headText = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 512));
  if (/<svg[\s>]/i.test(headText)) return "image/svg+xml";
  return "";
}

export function sanitizeSvgBytes(bytes) {
  try {
    let svgText = new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim();
    if (!/<svg[\s>]/i.test(svgText) || !/<\/svg>/i.test(svgText)) return null;
    svgText = svgText
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(
        /(?:href|xlink:href)\s*=\s*(?:"\s*(?:javascript|vbscript):[^"]*"|'\s*(?:javascript|vbscript):[^']*')/gi,
        ""
      );
    if (/<script|foreignObject|\bon[a-z]+\s*=|(?:javascript|vbscript):/i.test(svgText)) {
      return null;
    }
    const cleanBytes = new TextEncoder().encode(svgText);
    return {
      bytes: cleanBytes,
      base64: bytesToBase64(cleanBytes),
      size: cleanBytes.byteLength,
    };
  } catch {
    return null;
  }
}

export function sanitizeSvgBase64(base64) {
  const bytes = base64ToBytes(base64);
  if (!bytes) return null;
  const cleaned = sanitizeSvgBytes(bytes);
  return cleaned ? { base64: cleaned.base64, size: cleaned.size } : null;
}

export function parseFlexibleDataUrl(raw) {
  const input = String(raw || "").trim();
  const b64Match = input.match(
    /^data:(image\/(?:jpe?g|pjpeg|png|x-png|webp|gif|avif|svg\+xml|svg))(?:;[^,]*?)?;base64,([\s\S]+)$/i
  );
  if (b64Match) {
    const mime = normalizeImageMime(b64Match[1]);
    const cleanB64 = normalizeBase64Input(b64Match[2]);
    if (!cleanB64) return null;
    const bytes = base64ToBytes(cleanB64);
    if (!bytes) return null;
    return { mime, bytes, base64: cleanB64 };
  }
  const utf8SvgMatch = input.match(
    /^data:(image\/(?:svg\+xml|svg))(?:;charset=[^,;]+)?(?:;utf8)?,([\s\S]+)$/i
  );
  if (utf8SvgMatch) {
    let text = utf8SvgMatch[2];
    if (text.includes("%3C") || text.includes("%3c")) {
      try {
        text = decodeURIComponent(text);
      } catch {
        // Keep literal text if decode fails
      }
    }
    const bytes = new TextEncoder().encode(text);
    return { mime: "image/svg+xml", bytes, base64: bytesToBase64(bytes) };
  }
  return null;
}

export async function fetchPublicImageAsset(sourceUrl, env) {
  let currentUrl = String(sourceUrl || "").trim();
  let imgRes = null;
  for (let hop = 0; hop < 6; hop++) {
    if (!isPublicSafeHttpsUrl(currentUrl)) {
      throw new Error("sourceUrl must be a public https:// URL (local/private hosts are blocked).");
    }
    const parsedSrc = new URL(currentUrl);
    if (parsedSrc.port && parsedSrc.port !== "443") {
      throw new Error("sourceUrl must use default HTTPS port 443.");
    }
    const isSameZoneAssetHost =
      parsedSrc.hostname === "taqdom.me" ||
      parsedSrc.hostname === "www.taqdom.me" ||
      parsedSrc.hostname.endsWith(".taqdom.me");
    if (isSameZoneAssetHost && env?.ASSETS && !parsedSrc.pathname.startsWith("/api/")) {
      const assetUrl = `https://taqdom.me${parsedSrc.pathname}${parsedSrc.search}`;
      imgRes = await env.ASSETS.fetch(new Request(assetUrl, { method: "GET" }));
    } else {
      imgRes = await fetch(currentUrl, {
        headers: {
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.9,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (compatible; TaqdomMediaFetcher/2.0; +https://taqdom.me)",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(25000),
      });
    }
    if (imgRes.status >= 300 && imgRes.status < 400) {
      const loc = imgRes.headers.get("location");
      if (!loc) throw new Error("sourceUrl returned an incomplete redirect.");
      currentUrl = new URL(loc, currentUrl).toString();
      continue;
    }
    break;
  }
  if (!imgRes || !imgRes.ok) {
    throw new Error(`Failed to fetch sourceUrl (HTTP ${imgRes?.status || "network"}).`);
  }
  const declaredLen = Number(imgRes.headers.get("content-length") || "0");
  if (declaredLen > MAX_IMAGE_BYTES) {
    throw new Error("Max image size is 20MB.");
  }
  const buf = await imgRes.arrayBuffer();
  if (buf.byteLength <= 0 || buf.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Fetched image is empty or exceeds 20MB limit.");
  }
  const fetchedBytes = new Uint8Array(buf);
  const headerMime = normalizeImageMime(imgRes.headers.get("content-type") || "");
  if (
    headerMime &&
    !headerMime.startsWith("image/") &&
    headerMime !== "application/octet-stream" &&
    headerMime !== "binary/octet-stream"
  ) {
    throw new Error(
      `Unsupported image type (${headerMime}) at sourceUrl — URL returned ${headerMime} instead of an image file.`
    );
  }
  const sniffed = detectImageMimeFromBytes(fetchedBytes);
  const mime = /^image\/(?:jpeg|png|webp|gif|avif)$/.test(sniffed)
    ? sniffed
    : ALLOWED_IMAGE_MIME_SET.has(headerMime)
    ? headerMime
    : sniffed;
  if (!ALLOWED_IMAGE_MIME_SET.has(mime)) {
    throw new Error(`Unsupported image type (${headerMime || "unknown"}) at sourceUrl.`);
  }
  if (mime === "image/svg+xml") {
    const cleaned = sanitizeSvgBytes(fetchedBytes);
    if (!cleaned) throw new Error("Invalid or unsafe SVG markup.");
    return { mime, bytes: cleaned.bytes, base64: cleaned.base64, size: cleaned.size };
  }
  if (!validRasterBytes(mime, fetchedBytes)) {
    throw new Error("Fetched image bytes are truncated, corrupt, or do not match the declared MIME type.");
  }
  return { mime, bytes: fetchedBytes, base64: bytesToBase64(fetchedBytes), size: fetchedBytes.byteLength };
}

/**
 * @param {{ dataUrl?: string; base64?: string; mime?: string; svg?: string; sourceUrl?: string; bytes?: Uint8Array | null; env?: unknown }} [opts]
 */
export async function normalizeAndValidateImagePayload({
  dataUrl = "",
  base64 = "",
  mime = "",
  svg = "",
  sourceUrl = "",
  bytes = null,
  env = null,
} = {}) {
  const cleanUrl = String(sourceUrl || "").trim();
  const cleanDataUrl = String(dataUrl || "").trim();
  const cleanSvg = typeof svg === "string" ? svg.trim() : "";
  const rawBase64 = String(base64 || "").trim();
  let resolvedMime = normalizeImageMime(mime);
  let rawBytes = bytes instanceof Uint8Array ? bytes : null;
  let normalizedB64 = "";

  if (cleanDataUrl) {
    const parsed = parseFlexibleDataUrl(cleanDataUrl);
    if (!parsed) {
      throw new Error("dataUrl must be a base64-encoded image (jpg, png, webp, gif, avif, svg+xml).");
    }
    if (resolvedMime && resolvedMime !== parsed.mime) {
      throw new Error("Image type mismatch between mime and dataUrl.");
    }
    resolvedMime = parsed.mime;
    rawBytes = parsed.bytes;
    normalizedB64 = parsed.base64;
  } else if (rawBase64) {
    if (rawBase64.startsWith("data:")) {
      const parsed = parseFlexibleDataUrl(rawBase64);
      if (!parsed) {
        throw new Error("Invalid image data URI.");
      }
      if (resolvedMime && resolvedMime !== parsed.mime) {
        throw new Error("Image type mismatch.");
      }
      resolvedMime = parsed.mime;
      rawBytes = parsed.bytes;
      normalizedB64 = parsed.base64;
    } else {
      normalizedB64 = normalizeBase64Input(rawBase64);
      rawBytes = normalizedB64 ? base64ToBytes(normalizedB64) : null;
      if (!rawBytes || !rawBytes.byteLength) {
        throw new Error("Invalid base64 image payload.");
      }
    }
  } else if (cleanSvg) {
    resolvedMime = "image/svg+xml";
    rawBytes = new TextEncoder().encode(cleanSvg);
  } else if (rawBytes) {
    // Raw binary upload (multipart File or image/* body)
  } else if (cleanUrl) {
    return await fetchPublicImageAsset(cleanUrl, env);
  } else {
    throw new Error("Provide a binary file, sourceUrl, dataUrl, or base64 image data.");
  }

  if (!rawBytes || rawBytes.byteLength <= 0) {
    throw new Error("Image payload is empty.");
  }
  if (rawBytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Max image size is 20MB.");
  }

  const sniffed = detectImageMimeFromBytes(rawBytes);
  if (!resolvedMime || resolvedMime === "application/octet-stream" || resolvedMime === "binary/octet-stream") {
    resolvedMime = sniffed;
  } else if (/^image\/(?:jpeg|png|webp|gif|avif)$/.test(sniffed) && sniffed !== resolvedMime) {
    // Accept genuine raster bytes even when client mislabeled extension (e.g. png uploaded as .jpg)
    if (validRasterBytes(sniffed, rawBytes)) {
      resolvedMime = sniffed;
    }
  }

  if (!ALLOWED_IMAGE_MIME_SET.has(resolvedMime)) {
    throw new Error(
      `Unsupported image type (${resolvedMime || "unknown"}). Use JPG, PNG, WebP, GIF, AVIF, or SVG.`
    );
  }

  if (resolvedMime === "image/svg+xml") {
    const cleaned = sanitizeSvgBytes(rawBytes);
    if (!cleaned) throw new Error("Invalid or unsafe SVG markup.");
    if (cleaned.size <= 0 || cleaned.size > MAX_IMAGE_BYTES) throw new Error("Max image size is 20MB.");
    return {
      mime: resolvedMime,
      bytes: cleaned.bytes,
      base64: cleaned.base64,
      size: cleaned.size,
    };
  }

  if (!validRasterBytes(resolvedMime, rawBytes)) {
    throw new Error("Image bytes are truncated, corrupt, or do not match the declared MIME type.");
  }

  return {
    mime: resolvedMime,
    bytes: rawBytes,
    base64: normalizedB64 || bytesToBase64(rawBytes),
    size: rawBytes.byteLength,
  };
}

const initializedMediaDbs = new WeakSet();

export async function ensureMediaTables(env) {
  if (!env?.DB || initializedMediaDbs.has(env.DB)) return;
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS media_blobs (key TEXT PRIMARY KEY, mime TEXT NOT NULL, size INTEGER NOT NULL, data_url TEXT NOT NULL, created_at INTEGER NOT NULL)"
  ).run();
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS media_chunks (key TEXT NOT NULL, seq INTEGER NOT NULL, chunk TEXT NOT NULL, PRIMARY KEY (key, seq))"
  ).run();
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS portfolio_chunks (username TEXT NOT NULL, kind TEXT NOT NULL, seq INTEGER NOT NULL, chunk TEXT NOT NULL, PRIMARY KEY (username, kind, seq))"
  ).run();
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, user_id TEXT, username TEXT, key TEXT, mime TEXT, size INTEGER, label TEXT, alt TEXT, slot TEXT, created_at INTEGER)"
  ).run();
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS media_upload_sessions (upload_id TEXT NOT NULL, username TEXT NOT NULL, seq INTEGER NOT NULL, chunk TEXT NOT NULL, mime TEXT, label TEXT, alt TEXT, slot TEXT, created_at INTEGER NOT NULL, PRIMARY KEY (upload_id, username, seq))"
  ).run();

  for (const colDef of [
    "username TEXT",
    "label TEXT",
    "alt TEXT",
    "slot TEXT",
  ]) {
    try {
      await env.DB.prepare(`ALTER TABLE media ADD COLUMN ${colDef}`).run();
    } catch {
      // Column already exists on pre-existing media tables
    }
  }
  initializedMediaDbs.add(env.DB);
}

export async function storeMediaAsset({
  env,
  edgeStore = null,
  username,
  userId,
  mime,
  base64,
  size,
  label = "",
  alt = "",
  slot = "",
}) {
  const cleanMime = normalizeImageMime(mime);
  const ext = EXT_BY_MIME[cleanMime] || "webp";
  const key = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const cleanDataUrl = `data:${cleanMime};base64,${base64}`;
  const now = Date.now();
  const cleanUsername = String(username || "").trim().toLowerCase();
  const ownerUserId = String(userId || `user-${cleanUsername}`);
  const cleanLabel = String(label || "").trim().slice(0, 140);
  const cleanAlt = String(alt || "").trim().slice(0, 240);
  const cleanSlot = String(slot || "").trim().slice(0, 80);

  if (env?.DB) {
    await ensureMediaTables(env);
    try {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO media (id, user_id, username, key, mime, size, label, alt, slot, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
      )
        .bind(
          crypto.randomUUID(),
          ownerUserId,
          cleanUsername,
          key,
          cleanMime,
          size,
          cleanLabel || null,
          cleanAlt || null,
          cleanSlot || null,
          now
        )
        .run();
    } catch {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO media (id, user_id, key, mime, size, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
      )
        .bind(crypto.randomUUID(), ownerUserId, key, cleanMime, size, now)
        .run()
        .catch(() => {});
    }

    if (cleanDataUrl.length <= 900_000) {
      await env.DB.prepare(
        "INSERT INTO media_blobs (key, mime, size, data_url, created_at) VALUES (?1, ?2, ?3, ?4, ?5)"
      )
        .bind(key, cleanMime, size, cleanDataUrl, now)
        .run();
    } else {
      const CHUNK_CHARS = 800_000;
      const chunkStmts = [];
      let seq = 0;
      for (let i = 0; i < base64.length; i += CHUNK_CHARS) {
        chunkStmts.push(
          env.DB.prepare("INSERT INTO media_chunks (key, seq, chunk) VALUES (?1, ?2, ?3)").bind(
            key,
            seq++,
            base64.slice(i, i + CHUNK_CHARS)
          )
        );
      }
      for (let i = 0; i < chunkStmts.length; i += 8) {
        await env.DB.batch(chunkStmts.slice(i, i + 8));
      }
      await env.DB.prepare(
        "INSERT INTO media_blobs (key, mime, size, data_url, created_at) VALUES (?1, ?2, ?3, ?4, ?5)"
      )
        .bind(key, cleanMime, size, "__CHUNKED__", now)
        .run();
    }
  } else if (edgeStore) {
    edgeStore.media[key] = {
      mime: cleanMime,
      size,
      dataUrl: cleanDataUrl,
      createdAt: now,
      username: cleanUsername,
      userId: ownerUserId,
      label: cleanLabel || undefined,
      alt: cleanAlt || undefined,
      slot: cleanSlot || undefined,
    };
  } else {
    throw new Error("Image storage is unavailable.");
  }

  const url = `/api/media/${key}`;
  return {
    key,
    mime: cleanMime,
    size,
    url,
    fullUrl: `https://taqdom.me${url}`,
    label: cleanLabel || undefined,
    alt: cleanAlt || undefined,
    slot: cleanSlot || undefined,
    createdAt: now,
  };
}

export function collectMediaUsageFromPortfolio(portfolio) {
  const usageMap = new Map();
  const mark = (rawUrl, location) => {
    if (typeof rawUrl !== "string") return;
    const m = rawUrl.match(/\/api\/media\/([A-Za-z0-9._-]+)/);
    if (!m?.[1]) return;
    const key = m[1];
    const list = usageMap.get(key) || [];
    if (!list.includes(location)) list.push(location);
    usageMap.set(key, list);
  };

  if (!portfolio || typeof portfolio !== "object") return usageMap;
  mark(portfolio.avatar, "avatar");
  mark(portfolio.cover, "cover");
  mark(portfolio.canvas?.backgroundImage, "backgroundImage");
  if (Array.isArray(portfolio.projects)) {
    portfolio.projects.forEach((p, idx) => {
      if (Array.isArray(p?.images)) {
        p.images.forEach((img) => mark(img, `project:${p.id || idx}`));
      }
    });
  }
  if (Array.isArray(portfolio.mediaLibrary)) {
    portfolio.mediaLibrary.forEach((item) => mark(item?.url || item?.key, item?.slot || "mediaLibrary"));
  }
  const cd = portfolio.customDesign;
  if (cd && typeof cd === "object") {
    if (Array.isArray(cd.customSections)) {
      cd.customSections.forEach((sec) => {
        mark(sec?.image, `customSection:${sec?.id || "gallery"}`);
        if (Array.isArray(sec?.items)) {
          sec.items.forEach((it) => mark(it?.image || it?.avatar, `customSection:${sec?.id || "gallery"}`));
        }
      });
    }
    for (const htmlStr of [
      cd.fullPageHtml?.en,
      cd.fullPageHtml?.ar,
      cd.customCode?.html?.en,
      cd.customCode?.html?.ar,
      cd.customCss,
      cd.customCode?.css,
    ]) {
      if (typeof htmlStr === "string") {
        for (const match of htmlStr.matchAll(/\/api\/media\/([A-Za-z0-9._-]+)/g)) {
          if (match[1]) mark(`/api/media/${match[1]}`, "fullPageHtml");
        }
      }
    }
  }
  return usageMap;
}

export async function listUserMediaAssets({ env, edgeStore = null, username, userId, portfolio = null }) {
  const cleanUsername = String(username || "").trim().toLowerCase();
  const uid = String(userId || "").trim();
  const usageMap = collectMediaUsageFromPortfolio(portfolio);
  const byKey = new Map();

  if (env?.DB) {
    await ensureMediaTables(env);
    let rows = [];
    try {
      const res = await env.DB.prepare(
        `SELECT m.key, COALESCE(b.mime, m.mime) AS mime, COALESCE(b.size, m.size) AS size,
                m.label, m.alt, m.slot, COALESCE(m.created_at, b.created_at) AS created_at
         FROM media m
         LEFT JOIN media_blobs b ON b.key = m.key
         WHERE m.username = ?1 OR m.user_id = ?2 OR m.user_id = ?3 OR m.user_id = ?4
         ORDER BY created_at DESC LIMIT 250`
      )
        .bind(cleanUsername, uid || `user-${cleanUsername}`, `user-${cleanUsername}`, cleanUsername)
        .all();
      rows = Array.isArray(res?.results) ? res.results : [];
    } catch {
      const res = await env.DB.prepare(
        `SELECT m.key, COALESCE(b.mime, m.mime) AS mime, COALESCE(b.size, m.size) AS size,
                COALESCE(m.created_at, b.created_at) AS created_at
         FROM media m
         LEFT JOIN media_blobs b ON b.key = m.key
         WHERE m.user_id = ?1 OR m.user_id = ?2 OR m.user_id = ?3
         ORDER BY created_at DESC LIMIT 250`
      )
        .bind(uid || `user-${cleanUsername}`, `user-${cleanUsername}`, cleanUsername)
        .all()
        .catch(() => ({ results: [] }));
      rows = Array.isArray(res?.results) ? res.results : [];
    }

    for (const r of rows) {
      const k = String(r?.key || "").trim();
      if (!k || byKey.has(k)) continue;
      const blobExists = r.size != null;
      if (!blobExists) {
        const chk = await env.DB.prepare("SELECT mime, size, created_at FROM media_blobs WHERE key = ?1")
          .bind(k)
          .first()
          .catch(() => null);
        if (!chk) continue;
        r.mime = chk.mime;
        r.size = chk.size;
        r.created_at = chk.created_at;
      }
      byKey.set(k, {
        key: k,
        mime: String(r.mime || "image/webp"),
        size: Number(r.size || 0),
        url: `/api/media/${k}`,
        fullUrl: `https://taqdom.me/api/media/${k}`,
        ...(r.label ? { label: String(r.label) } : {}),
        ...(r.alt ? { alt: String(r.alt) } : {}),
        ...(r.slot ? { slot: String(r.slot) } : {}),
        usedIn: usageMap.get(k) || [],
        createdAt: Number(r.created_at || 0),
      });
    }

    for (const k of usageMap.keys()) {
      if (byKey.has(k)) continue;
      const b = await env.DB.prepare("SELECT mime, size, created_at FROM media_blobs WHERE key = ?1")
        .bind(k)
        .first()
        .catch(() => null);
      if (!b) continue;
      byKey.set(k, {
        key: k,
        mime: String(b.mime || "image/webp"),
        size: Number(b.size || 0),
        url: `/api/media/${k}`,
        fullUrl: `https://taqdom.me/api/media/${k}`,
        usedIn: usageMap.get(k) || [],
        createdAt: Number(b.created_at || 0),
      });
    }
  } else if (edgeStore?.media) {
    for (const [k, item] of Object.entries(edgeStore.media)) {
      if (
        item &&
        (item.username === cleanUsername ||
          item.userId === uid ||
          item.userId === `user-${cleanUsername}` ||
          usageMap.has(k))
      ) {
        byKey.set(k, {
          key: k,
          mime: item.mime || "image/webp",
          size: Number(item.size || 0),
          url: `/api/media/${k}`,
          fullUrl: `https://taqdom.me/api/media/${k}`,
          ...(item.label ? { label: item.label } : {}),
          ...(item.alt ? { alt: item.alt } : {}),
          ...(item.slot ? { slot: item.slot } : {}),
          usedIn: usageMap.get(k) || [],
          createdAt: Number(item.createdAt || 0),
        });
      }
    }
  }

  return Array.from(byKey.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function deleteUserMediaAsset({ env, edgeStore = null, username, userId, key, portfolio = null }) {
  const cleanKey = String(key || "").trim().replace(/^\/api\/media\//, "");
  if (!/^\d{10,}-[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp|gif|avif|svg)$/i.test(cleanKey)) {
    throw new Error("Invalid media key.");
  }
  const cleanUsername = String(username || "").trim().toLowerCase();
  const uid = String(userId || "").trim();
  const usageMap = collectMediaUsageFromPortfolio(portfolio);

  if (env?.DB) {
    await ensureMediaTables(env);
    let ownedRow = null;
    try {
      ownedRow = await env.DB.prepare(
        "SELECT key FROM media WHERE key = ?1 AND (username = ?2 OR user_id = ?3 OR user_id = ?4 OR user_id = ?5) LIMIT 1"
      )
        .bind(cleanKey, cleanUsername, uid || `user-${cleanUsername}`, `user-${cleanUsername}`, cleanUsername)
        .first();
    } catch {
      ownedRow = await env.DB.prepare(
        "SELECT key FROM media WHERE key = ?1 AND (user_id = ?2 OR user_id = ?3 OR user_id = ?4) LIMIT 1"
      )
        .bind(cleanKey, uid || `user-${cleanUsername}`, `user-${cleanUsername}`, cleanUsername)
        .first()
        .catch(() => null);
    }
    const anyOwnerRow = await env.DB.prepare("SELECT key FROM media WHERE key = ?1 LIMIT 1")
      .bind(cleanKey)
      .first()
      .catch(() => null);
    const inOwnPortfolio = usageMap.has(cleanKey);
    if (!ownedRow && (anyOwnerRow || !inOwnPortfolio)) {
      throw new Error("Image not found or owned by another account.");
    }
    await env.DB.batch([
      env.DB.prepare("DELETE FROM media WHERE key = ?1").bind(cleanKey),
      env.DB.prepare("DELETE FROM media_chunks WHERE key = ?1").bind(cleanKey),
      env.DB.prepare("DELETE FROM media_blobs WHERE key = ?1").bind(cleanKey),
    ]);
    return { ok: true, deletedKey: cleanKey };
  }

  if (edgeStore?.media?.[cleanKey]) {
    const item = edgeStore.media[cleanKey];
    if (
      item.username !== cleanUsername &&
      item.userId !== uid &&
      item.userId !== `user-${cleanUsername}` &&
      !usageMap.has(cleanKey)
    ) {
      throw new Error("Image not found or owned by another account.");
    }
    delete edgeStore.media[cleanKey];
    return { ok: true, deletedKey: cleanKey };
  }
  throw new Error("Image not found.");
}

export async function handleChunkedMediaUpload({
  env,
  edgeStore = null,
  username,
  userId,
  uploadId,
  chunk,
  chunkIndex = 0,
  totalChunks = 1,
  finish = false,
  mime = "",
  label = "",
  alt = "",
  slot = "",
}) {
  if (!env?.DB) throw new Error("Chunked image upload requires D1 storage.");
  await ensureMediaTables(env);
  const cleanUser = String(username || "").trim().toLowerCase();
  const cleanId = String(uploadId || "")
    .trim()
    .replace(/[^a-z0-9._-]/gi, "-")
    .slice(0, 80);
  if (!cleanId) throw new Error("Provide uploadId when uploading image chunks.");

  const idx = Number.isFinite(Number(chunkIndex)) ? Math.max(0, Math.floor(Number(chunkIndex))) : 0;
  const total = Number.isFinite(Number(totalChunks)) ? Math.max(1, Math.floor(Number(totalChunks))) : 1;
  if (idx >= 500 || total > 500) throw new Error("Too many image chunks (max 500).");

  const chunkStr = String(chunk || "").replace(/\s+/g, "");
  if (chunkStr) {
    const existingCountRow = await env.DB.prepare(
      "SELECT COALESCE(SUM(length(chunk)), 0) AS total_chars FROM media_upload_sessions WHERE upload_id = ?1 AND username = ?2"
    )
      .bind(cleanId, cleanUser)
      .first()
      .catch(() => ({ total_chars: 0 }));
    if (Number(existingCountRow?.total_chars || 0) + chunkStr.length > 28_500_000) {
      throw new Error("Chunked upload exceeds 20MB image limit.");
    }
    await env.DB.prepare(
      `INSERT INTO media_upload_sessions (upload_id, username, seq, chunk, mime, label, alt, slot, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
       ON CONFLICT(upload_id, username, seq) DO UPDATE SET
         chunk = excluded.chunk,
         mime = COALESCE(NULLIF(excluded.mime, ''), media_upload_sessions.mime),
         label = COALESCE(NULLIF(excluded.label, ''), media_upload_sessions.label),
         alt = COALESCE(NULLIF(excluded.alt, ''), media_upload_sessions.alt),
         slot = COALESCE(NULLIF(excluded.slot, ''), media_upload_sessions.slot),
         created_at = excluded.created_at`
    )
      .bind(
        cleanId,
        cleanUser,
        idx,
        chunkStr,
        normalizeImageMime(mime) || null,
        String(label || "").slice(0, 140) || null,
        String(alt || "").slice(0, 240) || null,
        String(slot || "").slice(0, 80) || null,
        Date.now()
      )
      .run();
  }

  const { results = [] } = await env.DB.prepare(
    "SELECT seq, chunk, mime, label, alt, slot FROM media_upload_sessions WHERE upload_id = ?1 AND username = ?2 ORDER BY seq ASC"
  )
    .bind(cleanId, cleanUser)
    .all();

  const shouldFinish = Boolean(finish) || results.length >= total;
  if (!shouldFinish) {
    return {
      partial: true,
      uploadId: cleanId,
      receivedChunks: results.length,
      totalChunks: total,
      nextChunkIndex: idx + 1,
    };
  }

  const assembled = results.map((r) => String(r.chunk || "")).join("");
  const metaMime = normalizeImageMime(mime || results.find((r) => r.mime)?.mime || "");
  const metaLabel = String(label || results.find((r) => r.label)?.label || "").trim();
  const metaAlt = String(alt || results.find((r) => r.alt)?.alt || "").trim();
  const metaSlot = String(slot || results.find((r) => r.slot)?.slot || "").trim();

  let validated;
  try {
    validated = await normalizeAndValidateImagePayload({
      ...(assembled.startsWith("data:") ? { dataUrl: assembled } : { base64: assembled, mime: metaMime }),
      env,
    });
  } finally {
    await env.DB.prepare("DELETE FROM media_upload_sessions WHERE upload_id = ?1 AND username = ?2")
      .bind(cleanId, cleanUser)
      .run()
      .catch(() => {});
  }

  const stored = await storeMediaAsset({
    env,
    edgeStore,
    username: cleanUser,
    userId,
    mime: validated.mime,
    base64: validated.base64,
    size: validated.size,
    label: metaLabel,
    alt: metaAlt,
    slot: metaSlot,
  });

  return { partial: false, ...stored };
}

function replaceTargetInHtmlString(str, target, replacementUrl) {
  if (typeof str !== "string" || !target) return { next: str, changed: false };
  if (!str.includes(target)) return { next: str, changed: false };
  return { next: str.split(target).join(replacementUrl), changed: true };
}

export function applyMediaPlacement({
  portfolio,
  url,
  fullUrl,
  key = "",
  mime = "",
  size = 0,
  assignTo = "none",
  projectId = "",
  projectIndex = null,
  customSectionId = "",
  customSectionTitle = "",
  replaceTarget = "",
  label = "",
  alt = "",
  slot = "",
}) {
  if (!portfolio || typeof portfolio !== "object") return { changed: false, placedIn: [] };
  const targetUrl = fullUrl || url;
  const relOrTargetUrl = url || fullUrl;
  const placedIn = [];
  let changed = false;

  if (key && (assignTo === "mediaLibrary" || label || alt || slot)) {
    const existingLib = Array.isArray(portfolio.mediaLibrary) ? portfolio.mediaLibrary : [];
    const nextItem = {
      key,
      url: targetUrl,
      ...(mime ? { mime } : {}),
      ...(size ? { size } : {}),
      ...(label ? { label: String(label).slice(0, 140) } : {}),
      ...(alt ? { alt: String(alt).slice(0, 240) } : {}),
      ...(slot ? { slot: String(slot).slice(0, 80) } : {}),
      createdAt: Date.now(),
    };
    const filtered = existingLib.filter((it) => it && it.key !== key && it.url !== targetUrl);
    portfolio.mediaLibrary = [nextItem, ...filtered].slice(0, 200);
    changed = true;
    if (assignTo === "mediaLibrary") placedIn.push("mediaLibrary");
  }

  if (replaceTarget) {
    const cd = portfolio.customDesign;
    if (cd && typeof cd === "object") {
      if (cd.fullPageHtml && typeof cd.fullPageHtml === "object") {
        for (const l of ["ar", "en"]) {
          const r = replaceTargetInHtmlString(cd.fullPageHtml[l], replaceTarget, targetUrl);
          if (r.changed) {
            cd.fullPageHtml[l] = r.next;
            changed = true;
            placedIn.push(`fullPageHtml.${l}`);
          }
        }
      }
      if (cd.customCode?.html && typeof cd.customCode.html === "object") {
        for (const l of ["ar", "en"]) {
          const r = replaceTargetInHtmlString(cd.customCode.html[l], replaceTarget, targetUrl);
          if (r.changed) {
            cd.customCode.html[l] = r.next;
            changed = true;
          }
        }
      }
      if (typeof cd.customCss === "string") {
        const r = replaceTargetInHtmlString(cd.customCss, replaceTarget, targetUrl);
        if (r.changed) {
          cd.customCss = r.next;
          changed = true;
          placedIn.push("customCss");
        }
      }
    }
    if (portfolio.avatar === replaceTarget) {
      portfolio.avatar = relOrTargetUrl;
      changed = true;
      placedIn.push("avatar");
    }
    if (portfolio.cover === replaceTarget) {
      portfolio.cover = relOrTargetUrl;
      changed = true;
      placedIn.push("cover");
    }
  }

  const mode = String(assignTo || "none");
  if (mode === "avatar" || mode === "cover") {
    portfolio[mode] = relOrTargetUrl;
    changed = true;
    placedIn.push(mode);
  } else if (mode === "backgroundImage") {
    portfolio.canvas = { ...(portfolio.canvas || {}), backgroundImage: relOrTargetUrl };
    changed = true;
    placedIn.push("backgroundImage");
  } else if (mode === "project" || projectId || projectIndex !== null) {
    const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
    const pIdx = projectId
      ? projects.findIndex((p) => String(p?.id) === String(projectId))
      : Number.isInteger(Number(projectIndex)) && Number(projectIndex) >= 0
      ? Number(projectIndex)
      : 0;
    if (pIdx >= 0 && projects[pIdx]) {
      const imgs = Array.isArray(projects[pIdx].images) ? projects[pIdx].images : [];
      const deduped = imgs.filter((x) => x !== relOrTargetUrl && x !== targetUrl);
      projects[pIdx] = { ...projects[pIdx], images: [relOrTargetUrl, ...deduped].slice(0, 100) };
      portfolio.projects = projects;
      changed = true;
      placedIn.push(`project:${projects[pIdx].id || pIdx}`);
    }
  } else if (mode === "gallery" || mode === "customSection") {
    const cd = portfolio.customDesign && typeof portfolio.customDesign === "object"
      ? portfolio.customDesign
      : { enabled: true };
    const sections = Array.isArray(cd.customSections) ? [...cd.customSections] : [];
    const secId = String(customSectionId || "ai-gallery").replace(/[^a-z0-9_-]+/gi, "-").slice(0, 60) || "ai-gallery";
    let sIdx = sections.findIndex((s) => s?.id === secId);
    const titleObj = customSectionTitle
      ? { ar: String(customSectionTitle), en: String(customSectionTitle) }
      : { ar: "معرض الصور", en: "Visual Gallery" };
    const newItem = {
      title: { ar: String(label || alt || "صورة مرفوعة"), en: String(label || alt || "Uploaded visual") },
      ...(alt ? { description: { ar: String(alt), en: String(alt) } } : {}),
      image: targetUrl,
      ...(slot ? { badge: String(slot).slice(0, 60) } : {}),
    };
    if (sIdx < 0) {
      sections.push({
        id: secId,
        kind: "gallery",
        title: titleObj,
        items: [newItem],
      });
    } else {
      const existingItems = Array.isArray(sections[sIdx].items) ? sections[sIdx].items : [];
      sections[sIdx] = {
        ...sections[sIdx],
        items: [...existingItems, newItem].slice(0, 100),
      };
    }
    portfolio.customDesign = { ...cd, enabled: true, customSections: sections.slice(0, 30) };
    changed = true;
    placedIn.push(`customSection:${secId}`);
  }

  return { changed, placedIn };
}
