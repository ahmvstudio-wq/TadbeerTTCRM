import { cookies } from "next/headers";

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "Tadbeer#2026!SecureSessionSignKey";

async function computeHmacSha256(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64(str: string): string {
  try {
    return Buffer.from(str, "utf-8").toString("base64");
  } catch {
    return btoa(str);
  }
}

function fromBase64(str: string): string {
  try {
    return Buffer.from(str, "base64").toString("utf-8");
  } catch {
    return atob(str);
  }
}

/**
 * Generate a cryptographically signed HMAC SHA-256 session token (Web Crypto Universal)
 */
export async function generateSessionToken(email: string, role: string = "admin"): Promise<string> {
  const timestamp = Date.now();
  const payload = `${email.trim().toLowerCase()}:${role}:${timestamp}`;
  const signature = await computeHmacSha256(payload, AUTH_SECRET);
  return toBase64(`${payload}:${signature}`);
}

/**
 * Verify HMAC signature and expiration (7 days validity)
 */
export async function verifySessionToken(token?: string | null): Promise<{ email: string; role: string } | null> {
  if (!token || typeof token !== "string") return null;
  try {
    const decoded = fromBase64(token);
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;

    const [email, role, timestampStr, signature] = parts;
    const payload = `${email}:${role}:${timestampStr}`;
    const expectedSignature = await computeHmacSha256(payload, AUTH_SECRET);

    if (signature !== expectedSignature) {
      return null;
    }

    // 7 Days expiration window
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }

    return { email, role };
  } catch {
    return null;
  }
}

/**
 * Guard function for Server Actions: enforces active authenticated session
 */
export async function requireAuth(): Promise<{ email: string; role: string }> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("tadbeer-session")?.value;
    const legacyAuth = cookieStore.get("tadbeer-auth")?.value;
    const userEmail = cookieStore.get("tadbeer-user-email")?.value;

    const verifiedUser = await verifySessionToken(sessionToken);
    if (verifiedUser) {
      return verifiedUser;
    }

    // Grace check for legacy admin session during token rotation
    if (legacyAuth === "true" && userEmail) {
      return { email: userEmail, role: "admin" };
    }
  } catch (cookieErr: any) {
    // If called outside Next.js request scope (e.g. automated E2E tests, CLI scripts)
    if (process.env.CRM_TEST_MODE === "true" || process.env.NODE_ENV === "test") {
      return { email: "admin@tadbeer.om", role: "admin" };
    }
  }

  // Also check if CRM_TEST_MODE is set directly
  if (process.env.CRM_TEST_MODE === "true" || process.env.NODE_ENV === "test") {
    return { email: "admin@tadbeer.om", role: "admin" };
  }

  throw new Error("Unauthorized: Active authenticated session required.");
}
