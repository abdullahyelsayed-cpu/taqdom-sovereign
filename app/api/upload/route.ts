import { NextRequest, NextResponse } from "next/server";
import { saveMediaInDb } from "@/lib/db";
import { getRequestSession, sameOriginWriteAllowed } from "@/lib/api-session";

const MAX_IMAGE_BYTES = 1_600_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  try {
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
          { error: "حجم الصورة يجب أن يكون بين 1 بايت و1.5 ميجا / Max file size is 1.5MB" },
          { status: 413 }
        );
      }
      mime = file.type.toLowerCase();
      if (!ALLOWED_IMAGE_TYPES.has(mime)) {
        return NextResponse.json({ error: "Only JPG, PNG, and WebP images are allowed" }, { status: 415 });
      }
      size = file.size;
      const bytes = Buffer.from(await file.arrayBuffer());
      dataUrl = `data:${mime};base64,${bytes.toString("base64")}`;
    } else {
      const body = await req.json();
      dataUrl = String(body.dataUrl || "");
      const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/i);
      if (!match) {
        return NextResponse.json({ error: "Only valid JPG, PNG, and WebP data URLs are allowed" }, { status: 400 });
      }
      mime = match[1].toLowerCase();
      size = Math.floor((match[2].length * 3) / 4);
      if (size <= 0 || size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "حجم الصورة يجب ألا يتجاوز 1.5 ميجا / Max file size is 1.5MB" },
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
        dataUrl,
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
