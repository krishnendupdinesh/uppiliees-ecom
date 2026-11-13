import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db";

async function verifyJwt(token: string, secret: string): Promise<any | null> {
  try {
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

    const b64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const rawSig = Uint8Array.from(atob(b64 + pad), (c) => c.charCodeAt(0));
    const data = enc.encode(`${headerB64}.${payloadB64}`);
    const valid = await crypto.subtle.verify("HMAC", key, rawSig, data);
    if (!valid) return null;

    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const secret = process.env.JWT_SECRET || "supersecretjwtkey_change_in_production_123456";

  const user = token ? await verifyJwt(token, secret) : null;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "admin") {
    return NextResponse.json({
      id: "admin-master",
      name: "Administrator",
      email: user.email || "admin@uppiliees.com",
      role: "admin",
      addresses: [],
    });
  }

  // Look up customer in local store to get up-to-date name/phone
  const stored = findUserByEmail(user.email || "");

  return NextResponse.json({
    id: user.id || stored?.id,
    name: stored?.name || user.name || "Customer",
    email: user.email,
    phone: stored?.phone || user.phone || "",
    role: "customer",
    addresses: [],
  });
}
