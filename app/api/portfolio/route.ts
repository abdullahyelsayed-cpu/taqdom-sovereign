import { NextRequest, NextResponse } from "next/server";
import {
  getAllPublishedPortfolios,
  getDraftPortfolio,
  getPublishedPortfolio,
  saveDraftPortfolio,
} from "@/lib/db";
import { PortfolioData, validateUsername } from "@/lib/types";
import { getRequestSession, sameOriginWriteAllowed, sessionOwnsUsername } from "@/lib/api-session";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("all") === "1") {
    const portfolios = await getAllPublishedPortfolios();
    return NextResponse.json({ portfolios });
  }

  const rawUsername = req.nextUrl.searchParams.get("u") || "";
  const username = rawUsername || "layla";
  const mode = req.nextUrl.searchParams.get("mode") || "published";

  if (mode === "draft") {
    const session = await getRequestSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!sessionOwnsUsername(session, username)) {
      return NextResponse.json({ error: "You cannot access this draft" }, { status: 403 });
    }
  }

  const portfolio = mode === "draft"
    ? await getDraftPortfolio(username)
    : await getPublishedPortfolio(username);

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }
  return NextResponse.json(
    { portfolio },
    { headers: mode === "draft" ? { "Cache-Control": "private, no-store" } : undefined }
  );
}

export async function PUT(req: NextRequest) {
  try {
    if (!sameOriginWriteAllowed(req)) {
      return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
    }
    const session = await getRequestSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const portfolio = body.portfolio as PortfolioData;
    if (!portfolio || !portfolio.username) {
      return NextResponse.json({ error: "Missing portfolio payload" }, { status: 400 });
    }
    const validation = validateUsername(portfolio.username);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reasonAr || validation.reasonEn || "Invalid username" }, { status: 400 });
    }
    if (!sessionOwnsUsername(session, validation.normalized)) {
      return NextResponse.json({ error: "You cannot modify this portfolio" }, { status: 403 });
    }

    const saved = await saveDraftPortfolio({ ...portfolio, username: validation.normalized });
    return NextResponse.json({ ok: true, portfolio: saved }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save draft" },
      { status: 500 }
    );
  }
}
