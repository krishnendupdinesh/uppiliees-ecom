import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { getContactMessages } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") || undefined;

    const messages = await getContactMessages(status);
    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("GET /api/admin/messages error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch contact messages." },
      { status: 500 }
    );
  }
}
