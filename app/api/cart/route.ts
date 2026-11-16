import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { safeNumber } from "@/lib/products-db";

// Helper to resolve numeric product ID from an id or slug
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
      `SELECT ci.id AS cart_item_id, ci.product_id, ci.quantity,
              p.name, p.slug, p.price, p.mrp, p.image_url
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?
       ORDER BY ci.created_at DESC`,
      [user.id]
    );

    const items = rows.map((r) => {
      const price = safeNumber(r.price, 0);
      const mrp = safeNumber(r.mrp, price);
      return {
        id: r.product_id,
        product_id: r.product_id,
        name: r.name,
        price,
        originalPrice: mrp > price ? mrp : undefined,
        image: r.image_url || `/products/${r.slug}.jpg`,
        alt: r.name,
        href: `/products/${r.slug}`,
        qty: Math.max(1, Number(r.quantity || 1)),
      };
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch cart items." },
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

    const qty = Math.floor(safeNumber(body.quantity ?? body.qty, 1));
    const mode = body.mode === "set" ? "set" : "add";

    if (mode === "set" && qty <= 0) {
      await pool.execute(
        "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?",
        [user.id, productId]
      );
      return NextResponse.json({ success: true, removed: true });
    }

    if (mode === "set") {
      await pool.execute(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
        [user.id, productId, Math.min(10, Math.max(1, qty))]
      );
    } else {
      await pool.execute(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = LEAST(10, quantity + VALUES(quantity))`,
        [user.id, productId, Math.min(10, Math.max(1, qty))]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update cart." },
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
        // No JSON body provided -> clear all cart items for this user
      }
    }

    if (rawProductId) {
      const productId = await resolveProductId(rawProductId);
      if (productId) {
        await pool.execute(
          "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?",
          [user.id, productId]
        );
      }
    } else {
      await pool.execute("DELETE FROM cart_items WHERE user_id = ?", [user.id]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/cart error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to remove item from cart." },
      { status: 500 }
    );
  }
}

