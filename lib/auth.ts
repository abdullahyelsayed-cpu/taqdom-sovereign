import { SignJWT, jwtVerify } from "jose";

const DEFAULT_SECRET = "taqdom-sovereign-royal-secret-key-2026-egypt";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  username: string;
  isTestAccount?: boolean;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload || typeof payload.username !== "string") return null;
    return {
      userId: String(payload.userId || ""),
      email: String(payload.email || ""),
      username: String(payload.username),
      isTestAccount: Boolean(payload.isTestAccount),
    };
  } catch {
    return null;
  }
}

export async function hashPasswordPBKDF2(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const saltBytes = saltHex
    ? new Uint8Array(saltHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const saltArray = Array.from(saltBytes);

  return {
    hash: hashArray.map((b) => b.toString(16).padStart(2, "0")).join(""),
    salt: saltArray.map((b) => b.toString(16).padStart(2, "0")).join(""),
  };
}
