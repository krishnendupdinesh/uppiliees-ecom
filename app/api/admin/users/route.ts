import { NextRequest, NextResponse, connection } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";
import { safeNumber } from "@/lib/products-db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connection();
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
              COUNT(o.id) AS orders_count,
              COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) AS total_spent
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       GROUP BY u.id, u.name, u.email, u.phone, u.role, u.created_at
       ORDER BY u.created_at DESC`
    );

    const users = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone || "",
      role: r.role,
      orders: safeNumber(r.orders_count, 0),
      spent: safeNumber(r.total_spent, 0),
      created_at: r.created_at,
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch users." },
      { status: 500 }
    );
  }
}

