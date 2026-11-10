import { NextRequest, NextResponse } from "next/server";
import { getMediaFromDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const media = await getMediaFromDb(key);
  if (!media || !media.dataUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  const base64Idx = media.dataUrl.indexOf("base64,");
  if (base64Idx === -1) {
    return new NextResponse("Invalid media", { status: 400 });
  }

  const base64Data = media.dataUrl.slice(base64Idx + 7);
  const binary = Buffer.from(base64Data, "base64");

  return new NextResponse(binary, {
    status: 200,
    headers: {
      "Content-Type": media.mime || "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
