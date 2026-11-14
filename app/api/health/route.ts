import { NextResponse } from "next/server";
import { getAllPublishedPortfolios } from "@/lib/db";
import { hashPasswordPBKDF2 } from "@/lib/auth";

export async function GET() {
  try {
    const portfolios = await getAllPublishedPortfolios();
    const dbOk = Array.isArray(portfolios);
    const hasAuthSecret =
      typeof process.env.AUTH_SECRET === "string" &&
      process.env.AUTH_SECRET.trim().length >= 32;
    const probe = await hashPasswordPBKDF2(
      "TaqdomHealthProbe#2026!",
      "pbkdf2-sha256$600000$00112233445566778899aabbccddeeff"
    );
    const pbkdf2Ok = Boolean(
      probe?.hash &&
        probe.hash.length === 64 &&
        probe?.salt?.startsWith("pbkdf2-sha256$600000$")
    );
    const ok = dbOk && hasAuthSecret && pbkdf2Ok;
    return NextResponse.json(
      {
        ok,
        status: ok ? "healthy" : "degraded",
        checks: {
          db: dbOk,
          authSecret: hasAuthSecret,
          pbkdf2: pbkdf2Ok,
        },
      },
      { status: ok ? 200 : 503 }
    );
  } catch (err) {
    console.error("Taqdom local health check failed:", err);
    return NextResponse.json({ ok: false, status: "error" }, { status: 503 });
  }
}
