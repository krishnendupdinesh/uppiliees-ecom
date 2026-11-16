import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { safeNumber } from "@/lib/products-db";

export const dynamic = "force-dynamic";

async function resolveProductId(productIdOrSlug: string): Promise<number | null> {
  const clean = String(productIdOrSlug || "").trim();
  if (!clean) return null;

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM products WHERE slug = ? OR CAST(id AS CHAR) = ? LIMIT 1",
    [clean, clean]
  );
  return rows[0] ? Number(rows[0].id) : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const rawTarget =
      searchParams.get("productId") ||
      searchParams.get("product_id") ||
      searchParams.get("slug") ||
      "";

    const productId = await resolveProductId(rawTarget);
    if (!productId) {
      return NextResponse.json({ reviews: [] });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT r.id, r.product_id, r.user_id,
              COALESCE(u.name, r.user_name, 'Customer') AS user_name,
              r.rating, r.comment, r.created_at
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC, r.id DESC`,
      [productId]
    );

    const reviews = rows.map((r) => ({
      id: r.id,
      product_id: r.product_id,
      user_id: r.user_id,
      user_name: r.user_name || "Customer",
      rating: Math.min(5, Math.max(1, Math.round(safeNumber(r.rating, 5)))),
      comment: r.comment || "",
      created_at: r.created_at,
    }));

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch reviews." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const body = await req.json();

    const rawTarget = String(
      body.productId ?? body.product_id ?? body.slug ?? ""
    ).trim();
    const productId = await resolveProductId(rawTarget);

    if (!productId) {
      return NextResponse.json(
        { error: "Valid product is required to submit a review." },
        { status: 400 }
      );
    }

    const rating = Math.round(safeNumber(body.rating, 5));
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }

    const comment = String(body.comment || "").trim();
    if (comment.length < 2) {
      return NextResponse.json(
        { error: "Please enter a review comment." },
        { status: 400 }
      );
    }

    const userId =
      authUser && Number.isInteger(Number(authUser.id)) && Number(authUser.id) > 0
        ? Number(authUser.id)
        : null;
    const userName =
      authUser?.name || String(body.user_name || body.name || "Customer").trim() || "Customer";

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [productId, userId, userName, rating, comment]
    );

    return NextResponse.json(
      {
        id: result.insertId,
        product_id: productId,
        user_id: userId,
        user_name: userName,
        rating,
        comment,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit review." },
      { status: 500 }
    );
  }
}

