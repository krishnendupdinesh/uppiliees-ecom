import { NextRequest, NextResponse, connection } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const [existingRows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM coupons WHERE id = ? LIMIT 1",
      [id]
    );

    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: "Coupon not found." },
        { status: 404 }
      );
    }

    const current = existingRows[0];
    const code = body.code ? String(body.code).trim().toUpperCase() : current.code;
    const discountType = body.discount_type || current.discount_type;
    const discountValue =
      body.discount_value !== undefined ? Number(body.discount_value) : current.discount_value;
    const minOrderAmount =
      body.min_order_amount !== undefined ? Number(body.min_order_amount) : current.min_order_amount;
    const maxDiscount =
      body.max_discount !== undefined
        ? body.max_discount
          ? Number(body.max_discount)
          : null
        : current.max_discount;
    const usageLimit =
      body.usage_limit !== undefined
        ? body.usage_limit
          ? Number(body.usage_limit)
          : null
        : current.usage_limit;
    const expiresAt = body.expires_at !== undefined ? body.expires_at : current.expires_at;
    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : current.is_active;

    await pool.execute(
      `UPDATE coupons SET
        code = ?,
        discount_type = ?,
        discount_value = ?,
        min_order_amount = ?,
        max_discount = ?,
        usage_limit = ?,
        expires_at = ?,
        is_active = ?
       WHERE id = ?`,
      [
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount,
        usageLimit,
        expiresAt,
        isActive,
        id,
      ]
    );

    const [updated] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM coupons WHERE id = ?",
      [id]
    );

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("PUT /api/admin/coupons/:id error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update coupon." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const [result] = await pool.execute<ResultSetHeader>(
      "DELETE FROM coupons WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Coupon not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Coupon deleted successfully.",
      id,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/coupons/:id error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete coupon." },
      { status: 500 }
    );
  }
}
