import { NextRequest, NextResponse, connection } from "next/server";
import pool from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await connection();
  try {
    const authUser = await getAuthUser(req);
    const body = await req.json().catch(() => ({}));

    const visitorId = String(body.visitor_id || body.visitorId || "").trim();
    if (!visitorId) {
      return NextResponse.json(
        { error: "visitor_id is required" },
        { status: 400 }
      );
    }

    let userId: number | null = null;
    if (authUser && authUser.id) {
      const parsed = Number(authUser.id);
      if (Number.isInteger(parsed) && parsed > 0) {
        userId = parsed;
      }
    } else if (body.user_id) {
      const parsed = Number(body.user_id);
      if (Number.isInteger(parsed) && parsed > 0) {
        userId = parsed;
      }
    }

    await pool.execute(
      `INSERT INTO visitors (visitor_id, user_id, first_seen, last_seen, visit_count)
       VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
       ON DUPLICATE KEY UPDATE
         visit_count = visit_count + 1,
         last_seen = CURRENT_TIMESTAMP,
         user_id = COALESCE(VALUES(user_id), user_id)`,
      [visitorId, userId]
    );

    return NextResponse.json({ success: true, visitorId });
  } catch (error: any) {
    console.error("POST /api/track error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record visitor" },
      { status: 500 }
    );
  }
}
