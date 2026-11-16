import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { fetchAdminStatsFromDb } from "@/lib/orders-db";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const stats = await fetchAdminStatsFromDb();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch admin statistics." },
      { status: 500 }
    );
  }
}

