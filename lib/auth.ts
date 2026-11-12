import { SignJWT, jwtVerify } from "jose";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  }
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

const PBKDF2_CURRENT_ITERATIONS = 600000;
const PBKDF2_LEGACY_ITERATIONS = 100000;
const PBKDF2_SALT_PREFIX = "pbkdf2-sha256$";

function parseStoredPasswordSalt(storedSalt?: string): { saltBytes: Uint8Array; iterations: number } {
  const value = String(storedSalt || "");
  if (value.startsWith(PBKDF2_SALT_PREFIX)) {
    const parts = value.split("$");
    const iterations = Number(parts[1]);
    const hex = parts[2] || "";
    if (![PBKDF2_LEGACY_ITERATIONS, PBKDF2_CURRENT_ITERATIONS].includes(iterations) || !/^[a-f0-9]{32}$/i.test(hex)) {
      throw new Error("Invalid stored password salt.");
    }
    return {
      saltBytes: new Uint8Array(hex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))),
      iterations,
    };
  }
  if (!/^[a-f0-9]{32}$/i.test(value)) {
    throw new Error("Invalid legacy password salt.");
  }
  return {
    saltBytes: new Uint8Array(value.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))),
    iterations: PBKDF2_LEGACY_ITERATIONS,
  };
}

export async function hashPasswordPBKDF2(password: string, storedSalt?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const parsed = storedSalt
    ? parseStoredPasswordSalt(storedSalt)
    : { saltBytes: crypto.getRandomValues(new Uint8Array(16)), iterations: PBKDF2_CURRENT_ITERATIONS };

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
      salt: parsed.saltBytes.slice().buffer as ArrayBuffer,
      iterations: parsed.iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hash = Array.from(new Uint8Array(derivedBits))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const saltHex = Array.from(parsed.saltBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return {
    hash,
    salt: `${PBKDF2_SALT_PREFIX}${parsed.iterations}$${saltHex}`,
  };
}
