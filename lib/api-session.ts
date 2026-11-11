import { NextRequest } from "next/server";
import { SessionPayload, verifySessionToken } from "@/lib/auth";
import { normalizeUsername } from "@/lib/types";

export async function getRequestSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get("taqdom_session")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionOwnsUsername(session: SessionPayload | null, username: string): boolean {
  return Boolean(session?.username) && normalizeUsername(session!.username) === normalizeUsername(username);
}

export function sameOriginWriteAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}
