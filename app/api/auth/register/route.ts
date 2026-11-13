import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, saveUser, hashPassword } from "@/lib/db";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Please enter your full name (at least 2 characters)." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    // Disallow registering with the admin email
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@uppiliees.com").toLowerCase();
    if (email.trim().toLowerCase() === adminEmail) {
      return NextResponse.json({ error: "This email address is reserved." }, { status: 400 });
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const newUser = saveUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      passwordHash,
    });

    const jwtSecret = process.env.JWT_SECRET || "supersecretjwtkey_change_in_production_123456";
    const token = await signJwt(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: "customer", // always customer
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      jwtSecret
    );

    const response = NextResponse.json({
      success: true,
      role: "customer",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
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
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to register account" }, { status: 500 });
  }
}

