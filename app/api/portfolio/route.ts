import { NextRequest, NextResponse } from "next/server";
import {
  checkUsernameAvailability,
  getAllPublishedPortfolios,
  getDraftPortfolio,
  getPublishedPortfolio,
  saveDraftPortfolio,
  updateUserSettingsInDb,
} from "@/lib/db";
import { signSessionToken } from "@/lib/auth";
import { PortfolioData, normalizeUsername, validateUsername } from "@/lib/types";
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
    const curUsername = normalizeUsername(session.username);
    if (!sessionOwnsUsername(session, curUsername)) {
      return NextResponse.json({ error: "You cannot modify this portfolio" }, { status: 403 });
    }

    if (validation.normalized === curUsername) {
      if (!sessionOwnsUsername(session, validation.normalized)) {
        return NextResponse.json({ error: "You cannot modify this portfolio" }, { status: 403 });
      }
      const saved = await saveDraftPortfolio({ ...portfolio, username: validation.normalized });
      return NextResponse.json({ ok: true, portfolio: saved }, { headers: { "Cache-Control": "private, no-store" } });
    }

    const avail = await checkUsernameAvailability(validation.normalized);
    if (!avail.available) {
      return NextResponse.json(
        { error: avail.reasonAr || avail.reasonEn || "Username already taken" },
        { status: 409 }
      );
    }
    const renamed = await updateUserSettingsInDb({
      currentUsername: curUsername,
      newUsername: validation.normalized,
    });
    if (!renamed) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    const saved = await saveDraftPortfolio({
      ...portfolio,
      username: validation.normalized,
      email: renamed.user.email,
    });
    const token = await signSessionToken({
      userId: renamed.user.id,
      email: renamed.user.email,
      username: renamed.user.username,
      isTestAccount: false,
    });
    const res = NextResponse.json(
      {
        ok: true,
        renamed: true,
        user: {
          id: renamed.user.id,
          email: renamed.user.email,
          username: renamed.user.username,
          isTestAccount: false,
        },
        portfolio: saved,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
    res.cookies.set("taqdom_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https",
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save draft" },
      { status: 500 }
    );
  }
}
