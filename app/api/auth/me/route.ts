import { NextRequest, NextResponse, connection } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connection();
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE id = ? OR email = ? LIMIT 1",
      [authUser.id, authUser.email]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        phone: "",
        role: authUser.role,
        addresses: [],
      });
    }

    const u = rows[0];
    return NextResponse.json({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      role: u.role,
      created_at: u.created_at,
      addresses: [],
    });
  } catch (error: any) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch current user." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const phone = body.phone ? String(body.phone).trim() : null;

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Please enter a valid name." },
        { status: 400 }
      );
    }

    await pool.execute(
      "UPDATE users SET name = ?, phone = ? WHERE id = ?",
      [name, phone, authUser.id]
    );

    return NextResponse.json({
      success: true,
      name,
      phone: phone || "",
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update profile." },
      { status: 500 }
    );
  }
}
