import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { signJwt, setAuthCookie } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = body.phone ? String(body.phone).trim() : null;
    const password = String(body.password || "");

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Please enter your full name (at least 2 characters)." },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Disallow registering with the reserved admin email
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@uppiliees.com").trim().toLowerCase();
    if (email === adminEmail) {
      return NextResponse.json(
        { error: "This email address is reserved." },
        { status: 400 }
      );
    }

    // Check if user already exists using parameterized query
    const [existing] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert customer into TiDB
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'customer')",
      [name, email, phone, passwordHash]
    );

    const newUser = {
      id: result.insertId,
      name,
      email,
      phone: phone || "",
      role: "customer" as const,
    };

    const token = await signJwt({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        role: "customer",
        user: newUser,
      },
      { status: 201 }
    );

    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to register account." },
      { status: 500 }
    );
  }
}
