import { NextRequest, NextResponse } from "next/server";
import { saveMediaInDb } from "@/lib/db";
import { getRequestSession, sameOriginWriteAllowed } from "@/lib/api-session";

const MAX_IMAGE_BYTES = 20_000_000;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

function validJpegBytesNext(bytes: Uint8Array): boolean {
  if (bytes.length < 16 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return false;
  let pos = 2;
  let sawSof = false;
  let sawSos = false;
  let sawEoi = false;
  while (pos < bytes.length - 1) {
    if (bytes[pos] !== 0xff) {
      pos++;
      continue;
    }
    while (pos < bytes.length && bytes[pos] === 0xff) pos++;
    if (pos >= bytes.length) break;
    const marker = bytes[pos++];
    if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
    if (marker === 0xd9) {
      sawEoi = true;
      break;
    }
    if (pos + 1 >= bytes.length) return false;
    const segLen = (bytes[pos] << 8) | bytes[pos + 1];
    if (segLen < 2 || pos + segLen > bytes.length) return false;
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      if (segLen < 7) return false;
      const h = (bytes[pos + 3] << 8) | bytes[pos + 4];
      const w = (bytes[pos + 5] << 8) | bytes[pos + 6];
      if (w < 1 || h < 1) return false;
      sawSof = true;
    } else if (marker === 0xda) {
      sawSos = true;
      for (let j = bytes.length - 2; j >= pos + segLen; j--) {
        if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
          sawEoi = true;
          break;
        }
      }
      break;
    }
    pos += segLen;
  }
  return sawSof && sawSos && sawEoi;
}

function validPngBytesNext(bytes: Uint8Array): boolean {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 45 || !sig.every((b, i) => bytes[i] === b)) return false;
  let pos = 8;
  let sawIhdr = false;
  let sawIdat = false;
  let sawIend = false;
  while (pos + 12 <= bytes.length) {
    const len = ((bytes[pos] << 24) >>> 0) + (bytes[pos + 1] << 16) + (bytes[pos + 2] << 8) + bytes[pos + 3];
    if (len > bytes.length - pos - 12) return false;
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    if (type === "IHDR") {
      if (len < 13) return false;
      const w = ((bytes[pos + 8] << 24) >>> 0) + (bytes[pos + 9] << 16) + (bytes[pos + 10] << 8) + bytes[pos + 11];
      const h = ((bytes[pos + 12] << 24) >>> 0) + (bytes[pos + 13] << 16) + (bytes[pos + 14] << 8) + bytes[pos + 15];
      if (w < 1 || h < 1) return false;
      sawIhdr = true;
    } else if (type === "IDAT") {
      if (len < 1) return false;
      sawIdat = true;
    } else if (type === "IEND") {
      sawIend = true;
      break;
    }
    pos += 12 + len;
  }
  return sawIhdr && sawIdat && sawIend;
}

function validWebpBytesNext(bytes: Uint8Array): boolean {
  if (bytes.length < 20) return false;
  if (
    bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46 ||
    bytes[8] !== 0x57 || bytes[9] !== 0x45 || bytes[10] !== 0x42 || bytes[11] !== 0x50
  ) return false;
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

function validGifBytesNext(bytes: Uint8Array): boolean {
  if (bytes.length < 14) return false;
  const hdr = String.fromCharCode(...bytes.subarray(0, 6));
  if (hdr !== "GIF87a" && hdr !== "GIF89a") return false;
  const w = bytes[6] | (bytes[7] << 8);
  const h = bytes[8] | (bytes[9] << 8);
  return w > 0 && h > 0 && bytes[bytes.length - 1] === 0x3b;
}

function validAvifBytesNext(bytes: Uint8Array): boolean {
  if (bytes.length < 24) return false;
  const ftypSize = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  if (ftypSize < 16 || ftypSize > bytes.length) return false;
  const boxType = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
  const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (boxType !== "ftyp" || !["avif", "avis", "mif1"].includes(brand)) return false;
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

function matchesRasterSignature(mime: string, bytes: Uint8Array): boolean {
  if (mime === "image/jpeg") return validJpegBytesNext(bytes);
  if (mime === "image/png") return validPngBytesNext(bytes);
  if (mime === "image/webp") return validWebpBytesNext(bytes);
  if (mime === "image/gif") return validGifBytesNext(bytes);
  if (mime === "image/avif") return validAvifBytesNext(bytes);
  return false;
}

function sanitizeSvgBuffer(bytes: Uint8Array): Buffer | null {
  let svgText = Buffer.from(bytes).toString("utf8").trim();
  if (!/<svg[\s>]/i.test(svgText) || !/<\/svg>/i.test(svgText)) return null;
  svgText = svgText
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(?:href|xlink:href)\s*=\s*(?:"\s*(?:javascript|vbscript):[^"]*"|'\s*(?:javascript|vbscript):[^']*')/gi, "");
  if (/<script|foreignObject|\bon[a-z]+\s*=|(?:javascript|vbscript):/i.test(svgText)) {
    return null;
  }
  return Buffer.from(svgText, "utf8");
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 28_500_000) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    if (!sameOriginWriteAllowed(req)) {
      return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
    }
    const session = await getRequestSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let dataUrl = "";
    let mime = "";
    let size = 0;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }
      if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "حجم الصورة يجب أن يكون بين 1 بايت و20 ميجابايت / Max file size is 20MB" },
          { status: 413 }
        );
      }
      mime = file.type.toLowerCase();
      if (!ALLOWED_IMAGE_TYPES.has(mime)) {
        return NextResponse.json(
          { error: "Only JPG, PNG, WebP, GIF, AVIF, and SVG images are allowed" },
          { status: 415 }
        );
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (mime === "image/svg+xml") {
        const cleaned = sanitizeSvgBuffer(bytes);
        if (!cleaned) {
          return NextResponse.json({ error: "Unsafe or invalid SVG image" }, { status: 415 });
        }
        size = cleaned.byteLength;
        dataUrl = `data:image/svg+xml;base64,${cleaned.toString("base64")}`;
      } else {
        size = file.size;
        if (!matchesRasterSignature(mime, bytes)) {
          return NextResponse.json({ error: "Image bytes do not match the declared file type" }, { status: 415 });
        }
        dataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
      }
    } else {
      const body = await req.json();
      dataUrl = String(body.dataUrl || "");
      const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif|avif|svg\+xml));base64,([A-Za-z0-9+/]+=*)$/i);
      if (!match) {
        return NextResponse.json(
          { error: "Only valid JPG, PNG, WebP, GIF, AVIF, and SVG data URLs are allowed" },
          { status: 400 }
        );
      }
      mime = match[1].toLowerCase();
      const padding = match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0;
      size = Math.floor((match[2].length * 3) / 4) - padding;
      const binary = Buffer.from(match[2], "base64");
      if (mime === "image/svg+xml") {
        const cleaned = sanitizeSvgBuffer(binary);
        if (!cleaned) {
          return NextResponse.json({ error: "Unsafe or invalid SVG image" }, { status: 415 });
        }
        size = cleaned.byteLength;
        dataUrl = `data:image/svg+xml;base64,${cleaned.toString("base64")}`;
      } else if (!matchesRasterSignature(mime, binary)) {
        return NextResponse.json({ error: "Image bytes do not match the declared file type" }, { status: 415 });
      }
      if (size <= 0 || size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "حجم الصورة يجب ألا يتجاوز 20 ميجابايت / Max file size is 20MB" },
          { status: 413 }
        );
      }
    }

    const extMap: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/avif": "avif",
      "image/svg+xml": "svg",
    };
    const ext = extMap[mime] || "webp";
    const key = `${Date.now()}-${crypto.randomUUID()}` + `.${ext}`;
    await saveMediaInDb({
      userId: session.username,
      key,
      mime,
      size,
      dataUrl,
    });

    return NextResponse.json(
      {
        ok: true,
        key,
        url: `/api/media/${key}`,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
