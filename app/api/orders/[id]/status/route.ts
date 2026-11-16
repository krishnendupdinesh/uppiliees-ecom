import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "pending",
  "packed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

async function updateStatusHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const status = String(body.status || "").trim().toLowerCase();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid order status. Allowed: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      id,
      status,
      message: "Order status updated successfully.",
    });
  } catch (error: any) {
    console.error("PATCH /api/orders/[id]/status error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update order status." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return updateStatusHandler(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return updateStatusHandler(req, context);
}
