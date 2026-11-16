import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export interface AuthTokenPayload {
  id: number | string;
  name: string;
  email: string;
  role: "admin" | "customer";
  exp?: number;
}

const DEFAULT_SECRET = "supersecretjwtkey_change_in_production_123456";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getJwtSecret(): string {
  return process.env.JWT_SECRET || DEFAULT_SECRET;
}

// Sign a JWT using Web Crypto HMAC-SHA256
export async function signJwt(payload: Omit<AuthTokenPayload, "exp">): Promise<string> {
  const secret = getJwtSecret();
  const enc = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE,
  };

  const toBase64Url = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const headerB64 = toBase64Url(header);
  const payloadB64 = toBase64Url(fullPayload);
  const data = enc.encode(`${headerB64}.${payloadB64}`);

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", key, data);
  const sigB64 = Buffer.from(sigBuffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

// Verify a JWT using Web Crypto HMAC-SHA256
export async function verifyJwt(token: string): Promise<AuthTokenPayload | null> {
  try {
    const secret = getJwtSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const rawSig = Buffer.from(
      signatureB64.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    );
    const data = enc.encode(`${headerB64}.${payloadB64}`);
    const valid = await crypto.subtle.verify("HMAC", key, rawSig, data);
    if (!valid) return null;

    const payloadJson = Buffer.from(
      payloadB64.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    const payload = JSON.parse(payloadJson) as AuthTokenPayload;

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Attach an httpOnly auth cookie to a NextResponse
export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

// Clear the httpOnly auth cookie on logout
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}

// Get current logged-in user from request cookie or Next.js server cookies()
export async function getAuthUser(req?: NextRequest): Promise<AuthTokenPayload | null> {
  try {
    let token: string | undefined;
    if (req) {
      token = req.cookies.get("token")?.value;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value;
    }
    if (!token) return null;
    return await verifyJwt(token);
  } catch {
    return null;
  }
}

// Check if the request is from an authenticated admin
export async function requireAdminUser(req?: NextRequest): Promise<AuthTokenPayload | null> {
  const user = await getAuthUser(req);
  if (!user || user.role !== "admin") return null;
  return user;
}

