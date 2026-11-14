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

function matchesRasterSignature(mime: string, bytes: Uint8Array): boolean {
  if (mime === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= 8 && signature.every((byte, index) => bytes[index] === byte);
  }
  if (mime === "image/webp") {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  if (mime === "image/gif") {
    const hdr = String.fromCharCode(...bytes.slice(0, 6));
    return hdr === "GIF87a" || hdr === "GIF89a";
  }
  if (mime === "image/avif") {
    const ftyp = String.fromCharCode(...bytes.slice(4, 8));
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    return bytes.length >= 12 && ftyp === "ftyp" && ["avif", "avis", "mif1"].includes(brand);
  }
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
