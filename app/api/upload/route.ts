import { NextRequest, NextResponse } from "next/server";
import { saveMediaInDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let dataUrl = "";
    let mime = "image/webp";
    let size = 0;
    let userId = "anonymous";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }
      if (file.size > 1_600_000) {
        return NextResponse.json(
          { error: "حجم الصورة يتجاوز الحد الأقصى (1.5 ميجا) / Max file size is 1.5MB" },
          { status: 413 }
        );
      }
      mime = file.type || "image/webp";
      size = file.size;
      const buf = Buffer.from(await file.arrayBuffer());
      dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
      userId = String(formData.get("username") || "anonymous");
    } else {
      const body = await req.json();
      dataUrl = String(body.dataUrl || "");
      if (!dataUrl.startsWith("data:image/")) {
        return NextResponse.json({ error: "Invalid image dataUrl" }, { status: 400 });
      }
      const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      mime = match ? match[1] : String(body.mime || "image/webp");
      size = Math.round((dataUrl.length * 3) / 4);
      if (size > 1_600_000) {
        return NextResponse.json(
          { error: "حجم الصورة يتجاوز الحد الأقصى (1.5 ميجا) / Max file size is 1.5MB" },
          { status: 413 }
        );
      }
      userId = String(body.username || "anonymous");
    }

    const ext = mime.includes("png") ? "png" : mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "webp";
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    await saveMediaInDb({
      userId,
      key,
      mime,
      size,
      dataUrl,
    });

    return NextResponse.json({
      ok: true,
      key,
      url: `/api/media/${key}`,
      dataUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
