import { NextRequest, NextResponse } from "next/server";

// Standard Web Crypto HMAC-SHA256 JWT verifier (compatible with Node and Edge runtimes without external packages)
async function verifyJwt(token: string, secret: string): Promise<{ id: any; role: string; email?: string } | null> {
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

    // Decode base64url to Uint8Array
    const b64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const rawSig = Uint8Array.from(atob(b64 + pad), (c) => c.charCodeAt(0));

    const data = enc.encode(`${headerB64}.${payloadB64}`);
    const valid = await crypto.subtle.verify("HMAC", key, rawSig, data);
    if (!valid) return null;

    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  const secret = process.env.JWT_SECRET || "supersecretjwtkey_change_in_production_123456";

  const user = token ? await verifyJwt(token, secret) : null;

  // 1. Protect /admin routes -> require role === 'admin'
  if (pathname.startsWith("/admin")) {
    if (!user || user.role !== "admin") {
      // Customers or guests trying to access /admin are redirected to home / login
      const targetUrl = new URL("/account", req.url);
      targetUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(targetUrl);
    }
  }

  // 2. Protect /account route -> Block admin from /account. Redirect admin to /admin dashboard!
  if (pathname === "/account" || pathname === "/login") {
    if (user && user.role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/account", "/login"] };
