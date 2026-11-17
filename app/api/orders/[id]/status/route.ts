import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  isValidOrderStatus,
} from "@/lib/order-status";

export const dynamic = "force-dynamic";

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
    const rawStatus = String(body.status || "").trim().toLowerCase();

    // 1. Validate status against canonical ORDER_STATUSES
    if (!isValidOrderStatus(rawStatus)) {
      return NextResponse.json(
        {
          error: `Invalid order status: "${body.status}". Allowed statuses: ${ORDER_STATUSES.map(
            (s) => `${s} (${ORDER_STATUS_LABELS[s]})`
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const nextStatus = rawStatus;

    // 2. Fetch current order
    const [orderRows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, status FROM orders WHERE id = ?",
      [id]
    );

    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const currentStatus = String(orderRows[0].status || "").trim().toLowerCase();

    // 3. Handle Cancelled status transitions safely
    if (currentStatus === "cancelled") {
      if (nextStatus === "cancelled") {
        return NextResponse.json({
          success: true,
          id,
          status: "cancelled",
          message: "Order is already cancelled.",
        });
      }
      return NextResponse.json(
        {
          error:
            "Order is cancelled and stock was restored. Changing status out of cancelled is blocked to prevent stock discrepancies.",
        },
        { status: 400 }
      );
    }

    // 4. Moving to cancelled: restore stock once (never twice)
    if (nextStatus === "cancelled") {
      // Update order status first
      await pool.execute<ResultSetHeader>(
        "UPDATE orders SET status = 'cancelled' WHERE id = ?",
        [id]
      );

      // Fetch items and restore stock
      const [items] = await pool.execute<RowDataPacket[]>(
        "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
        [id]
      );

      for (const item of items) {
        const pId = Number(item.product_id);
        const qty = Number(item.quantity || 0);
        if (pId && qty > 0) {
          await pool.execute(
            `UPDATE products
             SET stock = stock + ?,
                 in_stock = TRUE
             WHERE id = ?`,
            [qty, pId]
          );
        }
      }

      return NextResponse.json({
        success: true,
        id,
        status: "cancelled",
        message: "Order cancelled and item stock restored successfully.",
      });
    }

    // 5. Standard transition between active statuses
    await pool.execute<ResultSetHeader>(
      "UPDATE orders SET status = ? WHERE id = ?",
      [nextStatus, id]
    );

    return NextResponse.json({
      success: true,
      id,
      status: nextStatus,
      message: `Order status updated to ${ORDER_STATUS_LABELS[nextStatus]}.`,
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
