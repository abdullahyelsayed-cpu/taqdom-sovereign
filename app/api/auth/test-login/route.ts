import { NextResponse } from "next/server";
import { resetShowcaseAccountInDb } from "@/lib/db";
import { signSessionToken } from "@/lib/auth";

export async function POST() {
  const portfolio = await resetShowcaseAccountInDb();
  const user = {
    id: "user-layla",
    email: "layla@taqdom.me",
    username: "layla",
    isFlagshipAccount: true,
  };

  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    username: user.username,
    isTestAccount: false,
  });

  const res = NextResponse.json({
    ok: true,
    user,
    portfolio,
  });

  res.cookies.set("taqdom_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
