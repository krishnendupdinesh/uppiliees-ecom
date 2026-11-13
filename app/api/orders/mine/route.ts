import { NextRequest, NextResponse } from "next/server";
import { getStoredOrders } from "@/lib/db";

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

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allOrders = getStoredOrders();
  const mine = allOrders
    .filter((o) => o.email.toLowerCase() === user.email.toLowerCase())
    .map((o) => ({
      id: o.id,
      date: o.createdAt,
      status: o.status,
      total: o.total,
      items: o.items.map((i) => ({ name: i.name, qty: i.qty })),
    }));

  return NextResponse.json(mine);
}

