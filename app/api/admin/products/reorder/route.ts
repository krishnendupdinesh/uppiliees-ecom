import { NextRequest, NextResponse, connection } from "next/server";
import pool from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
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
    const rawIds = body.productIds || body.ids || (Array.isArray(body) ? body : []);

    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return NextResponse.json(
        { error: "Valid array of product IDs is required." },
        { status: 400 }
      );
    }

    const productIds = rawIds
      .map((id: any) => Number(id))
      .filter((id: number) => Number.isInteger(id) && id > 0);

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: "Valid numeric product IDs are required." },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (let i = 0; i < productIds.length; i++) {
        const displayOrder = i + 1;
        const pid = productIds[i];
        await conn.execute(
          "UPDATE products SET display_order = ? WHERE id = ?",
          [displayOrder, pid]
        );
      }

      await conn.commit();

      return NextResponse.json({
        message: "Products reordered successfully.",
        count: productIds.length,
      });
    } catch (txErr: any) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error("PUT /api/admin/products/reorder error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update product display order." },
      { status: 500 }
    );
  }
}
