import { NextRequest, NextResponse } from "next/server";
import { incrementPortfolioView } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username || "layla");
    const views = await incrementPortfolioView(username);
    return NextResponse.json({ ok: true, views });
  } catch {
    return NextResponse.json({ ok: false, views: 0 }, { status: 400 });
  }
}
