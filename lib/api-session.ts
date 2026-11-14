import { NextRequest } from "next/server";
import { SessionPayload, verifySessionToken } from "@/lib/auth";
import { normalizeUsername } from "@/lib/types";

export async function getRequestSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get("taqdom_session")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionOwnsUsername(session: SessionPayload | null, username: string): boolean {
  return Boolean(session?.username) &&
    session?.isTestAccount !== true &&
    normalizeUsername(session!.username) === normalizeUsername(username);
}

export function sameOriginWriteAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    if (originUrl.origin === req.nextUrl.origin) return true;
    const rawHost = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
      .split(",")[0]
      .trim()
      .toLowerCase();
    const proto = (req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", ""))
      .split(",")[0]
      .trim()
      .toLowerCase();
    return Boolean(rawHost) && originUrl.host.toLowerCase() === rawHost && originUrl.protocol === `${proto}:`;
  } catch {
    return false;
  }
}
