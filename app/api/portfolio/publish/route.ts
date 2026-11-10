import { NextRequest, NextResponse } from "next/server";
import { publishPortfolioInDb } from "@/lib/db";
import { PortfolioData, validateUsername } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const portfolio = body.portfolio as PortfolioData;
    if (!portfolio || !portfolio.username) {
      return NextResponse.json({ error: "Missing portfolio data" }, { status: 400 });
    }
    const val = validateUsername(portfolio.username);
    if (!val.valid) {
      return NextResponse.json(
        { error: val.reasonAr || val.reasonEn || "Invalid username" },
        { status: 400 }
      );
    }

    const published = await publishPortfolioInDb({
      ...portfolio,
      username: val.normalized,
    });

    return NextResponse.json({
      ok: true,
      portfolio: published,
      subdomainUrl: `https://${published.username}.taqdom.me`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to publish" },
      { status: 500 }
    );
  }
}
