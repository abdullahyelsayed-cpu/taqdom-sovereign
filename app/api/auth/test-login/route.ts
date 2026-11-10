import { NextResponse } from "next/server";
import { resetTestAccountInDb } from "@/lib/db";
import { signSessionToken } from "@/lib/auth";

export async function POST() {
  const portfolio = await resetTestAccountInDb();
  const user = {
    id: "user-test-sovereign",
    email: "test@taqdom.me",
    username: "test",
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
