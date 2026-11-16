import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { safeNumber } from "@/lib/products-db";

export const dynamic = "force-dynamic";

async function resolveProductId(rawId: unknown): Promise<number | null> {
  if (rawId === undefined || rawId === null) return null;
  const str = String(rawId).trim();
  const num = Number(str.split("-")[0]);
  if (Number.isInteger(num) && num > 0) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM products WHERE id = ? LIMIT 1",
      [num]
    );
    if (rows[0]) return Number(rows[0].id);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM products WHERE slug = ? OR name = ? LIMIT 1",
    [str, str]
  );
  return rows[0] ? Number(rows[0].id) : null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT wi.id AS wishlist_item_id, wi.product_id,
              p.name, p.slug, p.description, p.price, p.mrp, p.image_url
       FROM wishlist_items wi
       JOIN products p ON wi.product_id = p.id
       WHERE wi.user_id = ?
       ORDER BY wi.created_at DESC`,
      [user.id]
    );

    const items = rows.map((r) => {
      const price = safeNumber(r.price, 0);
      const mrp = safeNumber(r.mrp, price);
      return {
        id: r.product_id,
        product_id: r.product_id,
        name: r.name,
        description: r.description || undefined,
        price,
        originalPrice: mrp > price ? mrp : undefined,
        image: r.image_url || `/products/${r.slug}.jpg`,
        alt: r.name,
        href: `/products/${r.slug}`,
      };
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("GET /api/wishlist error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch wishlist." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const productId = await resolveProductId(body.productId ?? body.product_id ?? body.id);
    if (!productId) {
      return NextResponse.json(
        { error: "Valid product is required." },
        { status: 400 }
      );
    }

    await pool.execute(
      "INSERT IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)",
      [user.id, productId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/wishlist error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to add to wishlist." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let rawProductId: unknown = req.nextUrl.searchParams.get("productId");
    if (!rawProductId) {
      try {
        const body = await req.json();
        rawProductId = body.productId ?? body.product_id ?? body.id;
      } catch {
        // Clear all wishlist items if no body/query param
      }
    }

    if (rawProductId) {
      const productId = await resolveProductId(rawProductId);
      if (productId) {
        await pool.execute(
          "DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?",
          [user.id, productId]
        );
      }
    } else {
      await pool.execute("DELETE FROM wishlist_items WHERE user_id = ?", [user.id]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/wishlist error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to remove from wishlist." },
      { status: 500 }
    );
  }
}

