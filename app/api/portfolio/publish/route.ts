import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { publishPortfolioInDb, unpublishPortfolioInDb } from "@/lib/db";
import { PortfolioData, normalizeUsername, validateUsername } from "@/lib/types";

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

    try {
      revalidatePath(`/portfolio/${published.username}`);
      revalidatePath("/sitemap.xml");
    } catch {
      // ignore if outside request revalidation context
    }

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

export async function DELETE(req: NextRequest) {
  try {
    const uParam = req.nextUrl.searchParams.get("u");
    const body = await req.json().catch(() => ({}));
    const username = normalizeUsername(String(uParam || body.username || ""));
    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }
    const unpublished = await unpublishPortfolioInDb(username);
    try {
      revalidatePath(`/portfolio/${username}`);
      revalidatePath("/sitemap.xml");
    } catch {
      // ignore
    }
    return NextResponse.json({ ok: unpublished, username });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to unpublish" },
      { status: 500 }
    );
  }
}
