import { NextRequest, NextResponse, connection } from "next/server";
import type { ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const status = String(body.status || "read").toLowerCase();

    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE contact_messages SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Message not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id,
      status,
      message: "Message status updated successfully.",
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/messages/:id error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update message status." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const [result] = await pool.execute<ResultSetHeader>(
      "DELETE FROM contact_messages WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Message not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Message deleted successfully.",
      id,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/messages/:id error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete message." },
      { status: 500 }
    );
  }
}
