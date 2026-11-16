import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { signJwt, setAuthCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function ensureUsersTableExists() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50) NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_users_role (role)
    )
  `);
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body.", message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required.", message: "Email and password are required." },
        { status: 400 }
      );
    }

    // Look up user in TiDB using SELECT * to remain compatible even if optional columns (like phone) vary
    let rows: RowDataPacket[];
    try {
      const [result] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM users WHERE email = ? LIMIT 1",
        [email]
      );
      rows = result;
    } catch (dbErr: any) {
      if (dbErr?.code === "ER_NO_SUCH_TABLE") {
        await ensureUsersTableExists();
        rows = [];
      } else {
        throw dbErr;
      }
    }

    let userRow = rows[0];

    // If admin logs in with env credentials and hasn't been seeded yet, create admin row in TiDB
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    if (!userRow && adminEmail && email === adminEmail && password === adminPassword) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const [ins] = await pool.execute<ResultSetHeader>(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
        ["Uppiliees Admin", adminEmail, passwordHash]
      );
      userRow = {
        id: ins.insertId,
        name: "Uppiliees Admin",
        email: adminEmail,
        phone: "",
        password_hash: passwordHash,
        role: "admin",
      } as RowDataPacket;
    }

    if (!userRow || !userRow.password_hash) {
      return NextResponse.json(
        { error: "Invalid email or password.", message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Verify password hash with bcrypt
    const isValid = await bcrypt.compare(password, String(userRow.password_hash));
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password.", message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (userRow.is_blocked) {
      return NextResponse.json(
        {
          error: "Your account has been blocked. Please contact support.",
          message: "Your account has been blocked. Please contact support.",
        },
        { status: 403 }
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
    console.error("[POST /api/auth/login] Error:", {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      stack: error?.stack,
    });

    const safeMessage =
      error?.message && !String(error.message).toLowerCase().includes("password")
        ? String(error.message)
        : "Database or authentication error while logging in.";

    return NextResponse.json(
      {
        error: safeMessage,
        message: safeMessage,
        code: error?.code || "LOGIN_ERROR",
      },
      { status: 500 }
    );
  }
}
