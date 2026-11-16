import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { getRegisteredUsers } from "@/lib/admin/db";

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
    const search = searchParams.get("search") || undefined;

    const users = await getRegisteredUsers(search);

    return NextResponse.json({
      totalUsers: users.length,
      users,
    });
  } catch (error: any) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch users." },
      { status: 500 }
    );
  }
}
