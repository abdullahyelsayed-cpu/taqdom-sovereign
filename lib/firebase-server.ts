// lib/firebase-server.ts — Verifies Firebase ID tokens via Google public JWKS using WebCrypto RS256

import { RESERVED_USERNAMES, normalizeUsername } from "./types";

export const DEFAULT_FIREBASE_PROJECT_ID = "inspirational-terra-rtn3v";
const GOOGLE_SECURETOKEN_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

const encoder = new TextEncoder();

interface RsaJwk {
  kid?: string;
  kty?: string;
  [key: string]: unknown;
}

let cachedJwks: { keys: Map<string, JsonWebKey>; expiresAt: number } = {
  keys: new Map(),
  expiresAt: 0,
};

function decodeBase64UrlToBytes(input: string): Uint8Array {
  const normalized = String(input || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeBase64UrlJson<T = Record<string, unknown>>(input: string): T {
  const bytes = decodeBase64UrlToBytes(input);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

function parseMaxAge(cacheControl: string | null): number {
  const match = String(cacheControl || "").match(/max-age=(\d+)/i);
  const sec = match ? Number(match[1]) : 3600;
  return Number.isFinite(sec) && sec > 60 ? sec : 3600;
}

async function getFirebasePublicJwk(kid: string, forceRefresh = false): Promise<JsonWebKey | null> {
  const now = Date.now();
  if (!forceRefresh && cachedJwks.expiresAt > now && cachedJwks.keys.has(kid)) {
    return cachedJwks.keys.get(kid) || null;
  }

  const res = await fetch(GOOGLE_SECURETOKEN_JWKS_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Unable to load Google public JWKS (${res.status})`);
  }
  const body = (await res.json()) as { keys?: RsaJwk[] };
  const keys = Array.isArray(body?.keys) ? body.keys : [];
  const nextMap = new Map<string, JsonWebKey>();
  for (const key of keys) {
    if (key?.kid && key?.kty === "RSA") {
      nextMap.set(key.kid, key as JsonWebKey);
    }
  }
  const maxAgeMs = parseMaxAge(res.headers.get("cache-control")) * 1000;
  cachedJwks = {
    keys: nextMap,
    expiresAt: now + maxAgeMs,
  };
  return nextMap.get(kid) || null;
}

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: true;
  name: string;
  picture: string;
  provider: string;
}

export async function verifyFirebaseIdToken(
  idToken: string,
  projectId = DEFAULT_FIREBASE_PROJECT_ID
): Promise<VerifiedFirebaseUser> {
  const raw = String(idToken || "").trim();
  if (!raw || raw.length > 8192) {
    throw new Error("Invalid Firebase ID token length");
  }
  const parts = raw.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed Firebase ID token");
  }

  let header: { alg?: string; kid?: string };
  let payload: {
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    auth_time?: number;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    firebase?: { sign_in_provider?: string };
  };

  try {
    header = decodeBase64UrlJson(parts[0]);
    payload = decodeBase64UrlJson(parts[1]);
  } catch {
    throw new Error("Unreadable Firebase ID token payload");
  }

  if (header?.alg !== "RS256" || typeof header?.kid !== "string" || !header.kid) {
    throw new Error("Unsupported Firebase token signing algorithm");
  }

  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  const nowSec = Math.floor(Date.now() / 1000);

  if (payload?.aud !== projectId) {
    throw new Error("Firebase token audience mismatch");
  }
  if (payload?.iss !== expectedIssuer) {
    throw new Error("Firebase token issuer mismatch");
  }
  if (typeof payload?.sub !== "string" || payload.sub.length < 1 || payload.sub.length > 128) {
    throw new Error("Invalid Firebase token subject");
  }
  if (typeof payload?.exp !== "number" || payload.exp <= nowSec) {
    throw new Error("Firebase ID token has expired");
  }
  if (typeof payload?.iat !== "number" || payload.iat > nowSec + 300) {
    throw new Error("Firebase ID token issued in the future");
  }
  if (
    payload?.auth_time !== undefined &&
    (typeof payload.auth_time !== "number" || payload.auth_time > nowSec + 300)
  ) {
    throw new Error("Firebase ID token auth_time is invalid");
  }

  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    throw new Error("Google account must provide a valid email address");
  }
  if (payload?.email_verified !== true) {
    throw new Error("Google account email is not verified");
  }

  let jwk = await getFirebasePublicJwk(header.kid, false);
  if (!jwk) {
    jwk = await getFirebasePublicJwk(header.kid, true);
  }
  if (!jwk) {
    throw new Error("Matching Google signing key not found");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signedData = encoder.encode(`${parts[0]}.${parts[1]}`);
  const signatureBytes = decodeBase64UrlToBytes(parts[2]);
  const validSignature = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signatureBytes as BufferSource,
    signedData
  );
  if (!validSignature) {
    throw new Error("Invalid Firebase token cryptographic signature");
  }

  const pictureRaw = typeof payload?.picture === "string" ? payload.picture.trim() : "";
  const safePicture = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//i.test(pictureRaw)
    ? pictureRaw.slice(0, 500)
    : "";

  return {
    uid: payload.sub,
    email,
    emailVerified: true,
    name: typeof payload?.name === "string" ? payload.name.trim().slice(0, 80) : "",
    picture: safePicture,
    provider: String(payload?.firebase?.sign_in_provider || "google.com"),
  };
}

export async function suggestAvailableUsername(
  identity: { displayName: string; email: string; uid: string },
  isTakenFn: (candidate: string) => Promise<boolean> | boolean
): Promise<string> {
  const emailLocal = String(identity.email || "").split("@")[0] || "";
  const baseCandidate =
    normalizeUsername(emailLocal.replace(/[._+]+/g, "-")) ||
    normalizeUsername(String(identity.displayName || "").replace(/\s+/g, "-")) ||
    "creator";

  let base = baseCandidate.replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
  if (base.length < 3 || RESERVED_USERNAMES.has(base)) {
    base = `creator-${base}`.replace(/-+$/g, "");
  }
  if (base.length > 22) {
    base = base.slice(0, 22).replace(/-+$/g, "");
  }
  if (base.length < 3) {
    base = "creator";
  }

  if (!RESERVED_USERNAMES.has(base) && !(await isTakenFn(base))) {
    return base;
  }

  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(`${identity.uid}:${identity.email}`))
  );
  const shortHex = Array.from(digest.slice(0, 3), (b) => b.toString(16).padStart(2, "0")).join("");

  const candidates = [
    `${base.slice(0, 23)}-${shortHex.slice(0, 4)}`,
    `${base.slice(0, 21)}-${shortHex}`,
  ];
  for (let i = 2; i < 20; i++) {
    candidates.push(`${base.slice(0, 22)}-${i}${shortHex.slice(0, 2)}`);
  }

  for (const candidate of candidates) {
    const clean = candidate.replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
    if (clean.length >= 3 && clean.length <= 30 && !RESERVED_USERNAMES.has(clean)) {
      if (!(await isTakenFn(clean))) return clean;
    }
  }

  return `creator-${crypto.randomUUID().slice(0, 8)}`;
}
