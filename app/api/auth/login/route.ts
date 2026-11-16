import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { signJwt, setAuthCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Look up user in TiDB using parameterized query
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, name, email, phone, password_hash, role FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    let userRow = rows[0];

    // If admin logs in with env credentials and hasn't been seeded yet, create admin row in TiDB
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    if (!userRow && adminEmail && email === adminEmail && password === adminPassword) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const [ins] = await pool.execute<ResultSetHeader>(
        "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'admin')",
        ["Uppiliees Admin", adminEmail, "9876543210", passwordHash]
      );
      userRow = {
        id: ins.insertId,
        name: "Uppiliees Admin",
        email: adminEmail,
        phone: "9876543210",
        password_hash: passwordHash,
        role: "admin",
      } as RowDataPacket;
    }

    if (!userRow) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Verify password hash with bcrypt
    const isValid = await bcrypt.compare(password, userRow.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const safeUser = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      phone: userRow.phone || "",
      role: (userRow.role === "admin" ? "admin" : "customer") as "admin" | "customer",
    };

    const token = await signJwt({
      id: safeUser.id,
      name: safeUser.name,
      email: safeUser.email,
      role: safeUser.role,
    });

    const response = NextResponse.json({
      success: true,
      role: safeUser.role,
      user: safeUser,
    });

    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to log in." },
      { status: 500 }
    );
  }
}
