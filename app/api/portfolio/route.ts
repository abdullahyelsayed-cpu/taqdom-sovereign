import { NextRequest, NextResponse } from "next/server";
import { getDraftPortfolio, getPublishedPortfolio, saveDraftPortfolio } from "@/lib/db";
import { PortfolioData } from "@/lib/types";

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u") || "test";
  const mode = req.nextUrl.searchParams.get("mode") || "published";
  const portfolio =
    mode === "draft" ? await getDraftPortfolio(u) : await getPublishedPortfolio(u);

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }
  return NextResponse.json({ portfolio });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const portfolio = body.portfolio as PortfolioData;
    if (!portfolio || !portfolio.username) {
      return NextResponse.json({ error: "Missing portfolio payload" }, { status: 400 });
    }
    const saved = await saveDraftPortfolio(portfolio);
    return NextResponse.json({ ok: true, portfolio: saved });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save draft" },
      { status: 500 }
    );
  }
}
