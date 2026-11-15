import { NextRequest, NextResponse } from "next/server";
import { saveMediaInDb } from "@/lib/db";
import { getRequestSession, sameOriginWriteAllowed } from "@/lib/api-session";
import {
  ALLOWED_IMAGE_MIME_SET,
  EXT_BY_MIME,
  normalizeAndValidateImagePayload,
  normalizeImageMime,
  validRasterBytes,
} from "@/cloudflare/media-utils.mjs";

const MAX_IMAGE_BYTES = 20_000_000;
const ALLOWED_IMAGE_TYPES = ALLOWED_IMAGE_MIME_SET;

function matchesRasterSignature(mime: string, bytes: Uint8Array): boolean {
  return validRasterBytes(normalizeImageMime(mime), bytes);
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

    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    const rawInputs: Array<{
      bytes?: Uint8Array;
      mime?: string;
      dataUrl?: string;
      base64?: string;
      svg?: string;
      sourceUrl?: string;
    }> = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      for (const [, val] of formData.entries()) {
        if (val instanceof Blob) {
          if (val.size <= 0 || val.size > MAX_IMAGE_BYTES) {
            return NextResponse.json(
              { error: "حجم الصورة يجب أن يكون بين 1 بايت و20 ميجابايت / Max file size is 20MB" },
              { status: 413 }
            );
          }
          const ab = await val.arrayBuffer();
          rawInputs.push({
            bytes: new Uint8Array(ab),
            mime: val.type || "",
          });
        }
      }
      if (!rawInputs.length) {
        const strDataUrl = typeof formData.get("dataUrl") === "string" ? String(formData.get("dataUrl")) : "";
        const strBase64 = typeof formData.get("base64") === "string" ? String(formData.get("base64")) : "";
        if (strDataUrl || strBase64) {
          rawInputs.push({
            dataUrl: strDataUrl,
            base64: strBase64,
            mime: typeof formData.get("mime") === "string" ? String(formData.get("mime")) : "",
          });
        }
      }
      if (!rawInputs.length) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }
    } else if (
      contentType.startsWith("image/") ||
      contentType.startsWith("application/octet-stream") ||
      contentType.startsWith("binary/octet-stream")
    ) {
      const ab = await req.arrayBuffer();
      if (ab.byteLength <= 0 || ab.byteLength > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "حجم الصورة يجب أن يكون بين 1 بايت و20 ميجابايت / Max file size is 20MB" },
          { status: 413 }
        );
      }
      rawInputs.push({
        bytes: new Uint8Array(ab),
        mime: contentType.split(";")[0].trim(),
      });
    } else {
      const body = await req.json();
      const batch = [body?.files, body?.images, body?.items].find((arr) => Array.isArray(arr) && arr.length > 0);
      if (batch) {
        for (const item of batch) {
          if (typeof item === "string") {
            rawInputs.push(item.startsWith("data:") ? { dataUrl: item } : { sourceUrl: item });
          } else if (item && typeof item === "object") {
            rawInputs.push({
              dataUrl: String(item.dataUrl || ""),
              base64: String(item.base64 || ""),
              mime: String(item.mime || item.mime_type || ""),
              svg: typeof item.svg === "string" ? item.svg : "",
              sourceUrl: String(item.sourceUrl || item.url || ""),
            });
          }
        }
      } else {
        rawInputs.push({
          dataUrl: String(body?.dataUrl || ""),
          base64: String(body?.base64 || ""),
          mime: String(body?.mime || ""),
          svg: typeof body?.svg === "string" ? body.svg : "",
          sourceUrl: String(body?.sourceUrl || body?.url || ""),
        });
      }
    }

    if (rawInputs.length > 20) {
      return NextResponse.json({ error: "Upload up to 20 images per request" }, { status: 400 });
    }

    const savedItems: Array<{ key: string; mime: string; size: number; url: string }> = [];
    for (const item of rawInputs) {
      let validated;
      try {
        validated = await normalizeAndValidateImagePayload(item);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Invalid image payload";
        const status = /20MB/i.test(msg) ? 413 : /SVG|truncated|corrupt|bytes/i.test(msg) ? 415 : 400;
        return NextResponse.json({ error: msg }, { status });
      }
      if (!ALLOWED_IMAGE_TYPES.has(validated.mime) || !matchesRasterSignature(validated.mime, validated.bytes) && validated.mime !== "image/svg+xml") {
        return NextResponse.json({ error: "Image bytes do not match the declared file type" }, { status: 415 });
      }
      const extMap: Record<string, string> = EXT_BY_MIME;
      const ext = extMap[validated.mime] || "webp";
      const key = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const cleanDataUrl = `data:${validated.mime};base64,${validated.base64}`;
      await saveMediaInDb({
        userId: session.username,
        key,
        mime: validated.mime,
        size: validated.size,
        dataUrl: cleanDataUrl,
      });
      savedItems.push({
        key,
        mime: validated.mime,
        size: validated.size,
        url: `/api/media/${key}`,
      });
    }

    const first = savedItems[0];
    return NextResponse.json(
      {
        ok: true,
        key: first.key,
        mime: first.mime,
        size: first.size,
        url: first.url,
        count: savedItems.length,
        items: savedItems,
        urls: savedItems.map((it) => it.url),
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
