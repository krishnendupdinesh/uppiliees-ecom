import { NextRequest, NextResponse, connection } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";
import { getCoupons } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const coupons = await getCoupons();
    return NextResponse.json({ coupons });
  } catch (error: any) {
    console.error("GET /api/admin/coupons error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch coupons." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await connection();
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim().toUpperCase();
    const discountType = body.discount_type === "fixed" ? "fixed" : "percentage";
    const discountValue = Number(body.discount_value);
    const minOrderAmount = Number(body.min_order_amount || 0);
    const maxDiscount = body.max_discount ? Number(body.max_discount) : null;
    const usageLimit = body.usage_limit ? Number(body.usage_limit) : null;
    const expiresAt = body.expires_at || null;
    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : true;

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return NextResponse.json(
        { error: "Valid discount value is required." },
        { status: 400 }
      );
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM coupons WHERE code = ? LIMIT 1",
      [code]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A coupon with this code already exists." },
        { status: 409 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO coupons (
        code, discount_type, discount_value, min_order_amount,
        max_discount, usage_limit, expires_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount,
        usageLimit,
        expiresAt,
        isActive,
      ]
    );

    const [created] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM coupons WHERE id = ?",
      [result.insertId]
    );

    return NextResponse.json(created[0], { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/coupons error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create coupon." },
      { status: 500 }
    );
  }
}
