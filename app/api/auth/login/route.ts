import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, verifyPassword } from "@/lib/db";

// Standard Web Crypto HMAC-SHA256 JWT signer
async function signJwt(payload: Record<string, any>, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const b64 = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const headerB64 = b64(header);
  const payloadB64 = b64(payload);
  const data = enc.encode(`${headerB64}.${payloadB64}`);

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", key, data);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const adminEmail = process.env.ADMIN_EMAIL || "admin@uppiliees.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
    const jwtSecret = process.env.JWT_SECRET || "supersecretjwtkey_change_in_production_123456";

    // 1. Check Admin Credentials
    if (
      email?.toLowerCase() === adminEmail.toLowerCase() &&
      password === adminPassword
    ) {
      const token = await signJwt(
        {
          id: "admin-master",
          email: adminEmail,
          name: "Administrator",
          role: "admin",
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
        },
        jwtSecret
      );

      const response = NextResponse.json({
        success: true,
        role: "admin",
        user: { id: "admin-master", name: "Administrator", email: adminEmail, role: "admin" },
      });

      // Set auth cookie
      response.cookies.set("token", token, {
        httpOnly: false,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // 2. Check Customer Credentials
    const customer = findUserByEmail(email || "");
    if (customer && verifyPassword(password || "", customer.passwordHash)) {
      const token = await signJwt(
        {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          role: "customer",
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        },
        jwtSecret
      );

      const response = NextResponse.json({
        success: true,
        role: "customer",
        user: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          role: "customer",
        },
      });

      response.cookies.set("token", token, {
        httpOnly: false,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
