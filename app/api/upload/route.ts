import { NextRequest, NextResponse } from "next/server";
import { saveMediaInDb } from "@/lib/db";
import { getRequestSession, sameOriginWriteAllowed } from "@/lib/api-session";

const MAX_IMAGE_BYTES = 1_400_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 1_950_000) {
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
      const requestedUsername = String(formData.get("username") || "");
      if (requestedUsername && requestedUsername.toLowerCase() !== session.username.toLowerCase()) {
        return NextResponse.json({ error: "You can only upload to your own portfolio" }, { status: 403 });
      }
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }
      if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "حجم الصورة يجب أن يكون بين 1 بايت و1.4 ميجابايت / Max file size is 1.4MB" },
          { status: 413 }
        );
      }
      mime = file.type.toLowerCase();
      if (!ALLOWED_IMAGE_TYPES.has(mime)) {
        return NextResponse.json({ error: "Only JPG, PNG, and WebP images are allowed" }, { status: 415 });
      }
      size = file.size;
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!matchesRasterSignature(mime, bytes)) {
        return NextResponse.json({ error: "Image bytes do not match the declared file type" }, { status: 415 });
      }
      dataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
    } else {
      const body = await req.json();
      if (body.username && String(body.username).toLowerCase() !== session.username.toLowerCase()) {
        return NextResponse.json({ error: "You can only upload to your own portfolio" }, { status: 403 });
      }
      dataUrl = String(body.dataUrl || "");
      const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/i);
      if (!match) {
        return NextResponse.json({ error: "Only valid JPG, PNG, and WebP data URLs are allowed" }, { status: 400 });
      }
      mime = match[1].toLowerCase();
      const padding = match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0;
      size = Math.floor((match[2].length * 3) / 4) - padding;
      const binary = Buffer.from(match[2], "base64");
      if (!matchesRasterSignature(mime, binary)) {
        return NextResponse.json({ error: "Image bytes do not match the declared file type" }, { status: 415 });
      }
      if (size <= 0 || size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "حجم الصورة يجب ألا يتجاوز 1.4 ميجابايت / Max file size is 1.4MB" },
          { status: 413 }
        );
      }
    }

    const ext = mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : "webp";
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
