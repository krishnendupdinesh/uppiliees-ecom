import { NextRequest, NextResponse } from "next/server";
import { saveStoredOrder, getStoredOrders } from "@/lib/db";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, address, items, total, isGuest } = body;

    if (!name || !email || !phone || !address) {
      return NextResponse.json({ error: "Missing required contact or shipping details." }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item." }, { status: 400 });
    }

    // Save order in database
    const savedOrder = saveStoredOrder({
      customerName: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      items: items.map((i: any) => ({
        name: i.name,
        qty: Number(i.qty) || 1,
        price: Number(i.price) || 0,
      })),
      total: Number(total) || 0,
      isGuest: Boolean(isGuest),
    });

    return NextResponse.json({
      success: true,
      id: savedOrder.id,
      total: savedOrder.total,
      message: "Order placed successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create order" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // If user is authenticated customer, return their orders; if admin, return all
  const token = req.cookies.get("token")?.value;
  const secret = process.env.JWT_SECRET || "supersecretjwtkey_change_in_production_123456";
  const user = token ? await verifyJwt(token, secret) : null;

  const allOrders = getStoredOrders();

  if (user?.role === "admin") {
    return NextResponse.json(allOrders);
  }

  if (user?.email) {
    const userOrders = allOrders.filter((o) => o.email.toLowerCase() === user.email.toLowerCase());
    return NextResponse.json(userOrders);
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

