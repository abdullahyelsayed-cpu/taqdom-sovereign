import { NextResponse } from "next/server";
import { resetShowcaseAccountInDb } from "@/lib/db";
import { signSessionToken } from "@/lib/auth";
import { sameOriginWriteAllowed } from "@/lib/api-session";

export async function POST(req: import("next/server").NextRequest) {
  if (!sameOriginWriteAllowed(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const portfolio = await resetShowcaseAccountInDb();
  const user = {
    id: "user-layla",
    email: "layla@taqdom.me",
    username: "layla",
    isFlagshipAccount: true,
    isTestAccount: true,
  };

  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    username: user.username,
    isTestAccount: true,
  });

  const res = NextResponse.json({
    ok: true,
    readOnly: true,
    user,
    portfolio,
  });

  res.cookies.set("taqdom_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
