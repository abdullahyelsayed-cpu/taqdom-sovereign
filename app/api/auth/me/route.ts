import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getDraftPortfolio } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("taqdom_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  const portfolio = await getDraftPortfolio(session.username);
  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      username: session.username,
      isTestAccount: session.isTestAccount,
    },
    portfolio,
  });
}
