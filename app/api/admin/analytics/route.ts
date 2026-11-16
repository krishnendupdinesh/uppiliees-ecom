import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { getVisitorAnalytics } from "@/lib/admin/db";

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

    const analytics = await getVisitorAnalytics();
    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch visitor analytics." },
      { status: 500 }
    );
  }
}
