import { NextRequest, NextResponse, connection } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { safeNumber } from "@/lib/products-db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await connection();
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim().toUpperCase();
    const orderTotal = safeNumber(body.total || body.orderTotal, 0);

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM coupons WHERE code = ? AND is_active = TRUE LIMIT 1",
      [code]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or inactive coupon code." },
        { status: 404 }
      );
    }

    const coupon = rows[0];

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This coupon code has expired." },
        { status: 400 }
      );
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json(
        { error: "This coupon code has reached its usage limit." },
        { status: 400 }
      );
    }

    // Check min order
    const minOrder = safeNumber(coupon.min_order_amount, 0);
    if (orderTotal < minOrder) {
      return NextResponse.json(
        {
          error: `Minimum order amount of ₹${minOrder.toLocaleString("en-IN")} required for this coupon.`,
        },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    const discountVal = safeNumber(coupon.discount_value, 0);

    if (coupon.discount_type === "percentage") {
      discountAmount = (orderTotal * discountVal) / 100;
      if (coupon.max_discount && Number(coupon.max_discount) > 0) {
        discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
      }
    } else {
      discountAmount = Math.min(orderTotal, discountVal);
    }

    discountAmount = Math.max(0, Math.round(discountAmount * 100) / 100);
    const newTotal = Math.max(0, Math.round((orderTotal - discountAmount) * 100) / 100);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: discountVal,
      discountAmount,
      newTotal,
      message: `Coupon "${coupon.code}" applied successfully!`,
    });
  } catch (error: any) {
    console.error("POST /api/coupons/validate error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to validate coupon." },
      { status: 500 }
    );
  }
}
