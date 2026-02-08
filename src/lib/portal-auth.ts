import { randomBytes, scrypt, timingSafeEqual, createHmac } from "crypto";

const PASSWORD_LENGTH = 12;
const PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SCRYPT_KEYLEN = 64;
const SALT_LENGTH = 16;
const SESSION_DURATION_MS = 60 * 60 * 1000; // 60 minutes

/**
 * Generate a cryptographically secure password of given length.
 * Characters: [A-Za-z0-9]
 */
export function generatePassword(length: number = PASSWORD_LENGTH): string {
  const bytes = randomBytes(length * 2);
  let result = "";
  for (let i = 0; i < bytes.length && result.length < length; i++) {
    const idx = bytes[i] % PASSWORD_CHARS.length;
    // Reject biased values to ensure uniform distribution
    if (bytes[i] < Math.floor(256 / PASSWORD_CHARS.length) * PASSWORD_CHARS.length) {
      result += PASSWORD_CHARS[idx];
    }
  }
  // If rejection sampling didn't produce enough chars, generate more
  while (result.length < length) {
    const extra = randomBytes(2);
    for (let i = 0; i < extra.length && result.length < length; i++) {
      if (extra[i] < Math.floor(256 / PASSWORD_CHARS.length) * PASSWORD_CHARS.length) {
        result += PASSWORD_CHARS[extra[i] % PASSWORD_CHARS.length];
      }
    }
  }
  return result;
}

/**
 * Hash a password using crypto.scrypt with a random salt.
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hash = await new Promise<string>((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString("hex"));
    });
  });
  return { hash, salt };
}

/**
 * Verify a password against a stored hash and salt.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  const storedHash = Buffer.from(hash, "hex");
  if (derived.length !== storedHash.length) return false;
  return timingSafeEqual(derived, storedHash);
}

/**
 * Get the signing secret for session tokens.
 * Prefers PORTAL_SESSION_SECRET, falls back to SUPABASE_SERVICE_ROLE_KEY.
 */
export function getSigningSecret(): string {
  const secret = process.env.PORTAL_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("PORTAL_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  if (!process.env.PORTAL_SESSION_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[portal-auth] PORTAL_SESSION_SECRET not set, using SUPABASE_SERVICE_ROLE_KEY as fallback");
  }
  return secret;
}

/**
 * Create an HMAC-signed session token for portal password verification.
 * Token format: base64url(payload).base64url(signature)
 */
export function createSessionToken(linkId: string): string {
  const secret = getSigningSecret();
  const exp = Date.now() + SESSION_DURATION_MS;
  const payload = Buffer.from(JSON.stringify({ linkId, exp })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verify an HMAC-signed session token.
 * Returns the linkId if valid, null otherwise.
 */
export function verifySessionToken(token: string): { linkId: string } | null {
  try {
    const secret = getSigningSecret();
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expectedSig = createHmac("sha256", secret).update(payload).digest("base64url");
    const sigBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expectedSig, "base64url");
    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.linkId || !data.exp || typeof data.exp !== "number") return null;
    if (Date.now() > data.exp) return null;

    return { linkId: data.linkId };
  } catch {
    return null;
  }
}
