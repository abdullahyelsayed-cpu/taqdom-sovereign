import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { publishPortfolioInDb, unpublishPortfolioInDb } from "@/lib/db";
import { PortfolioData, normalizeUsername, validateUsername } from "@/lib/types";
import { getRequestSession, sameOriginWriteAllowed, sessionOwnsUsername } from "@/lib/api-session";

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: "Missing portfolio data" }, { status: 400 });
    }
    const validation = validateUsername(portfolio.username);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reasonAr || validation.reasonEn || "Invalid username" },
        { status: 400 }
      );
    }
    if (!sessionOwnsUsername(session, validation.normalized)) {
      return NextResponse.json({ error: "You cannot publish this portfolio" }, { status: 403 });
    }

    const published = await publishPortfolioInDb({
      ...portfolio,
      username: validation.normalized,
    });

    try {
      revalidatePath(`/portfolio/${published.username}`);
      revalidatePath("/sitemap.xml");
    } catch {
      // Ignore revalidation outside a Next.js request context.
    }

    return NextResponse.json(
      {
        ok: true,
        portfolio: published,
        subdomainUrl: `https://${published.username}.taqdom.me`,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to publish" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!sameOriginWriteAllowed(req)) {
      return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
    }
    const session = await getRequestSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const uParam = req.nextUrl.searchParams.get("u");
    const body = await req.json().catch(() => ({}));
    const username = normalizeUsername(String(uParam || body.username || ""));
    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }
    if (!sessionOwnsUsername(session, username)) {
      return NextResponse.json({ error: "You cannot unpublish this portfolio" }, { status: 403 });
    }

    const unpublished = await unpublishPortfolioInDb(username);
    try {
      revalidatePath(`/portfolio/${username}`);
      revalidatePath("/sitemap.xml");
    } catch {
      // Ignore revalidation outside a Next.js request context.
    }
    return NextResponse.json({ ok: unpublished, username }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to unpublish" },
      { status: 500 }
    );
  }
}
