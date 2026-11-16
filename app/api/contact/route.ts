import { NextRequest, NextResponse, connection } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await connection();
  try {
    const body = await req.json().catch(() => ({}));

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = body.phone ? String(body.phone).trim() : null;
    const topic = body.topic ? String(body.topic).trim() : null;
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO contact_messages (name, email, phone, topic, message, status)
       VALUES (?, ?, ?, ?, ?, 'unread')`,
      [name, email, phone, topic, message]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been sent. We'll get back to you soon.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit contact enquiry." },
      { status: 500 }
    );
  }
}
