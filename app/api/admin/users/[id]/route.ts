import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { getUserWithOrderHistory, toggleUserBlock } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const user = await getUserWithOrderHistory(id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("GET /api/admin/users/:id error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch user details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const isBlocked = body.is_blocked;

    const success = await toggleUserBlock(id, isBlocked);
    if (!success) {
      return NextResponse.json(
        { error: "User not found or status could not be changed." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id,
      is_blocked: isBlocked,
      message: "User status updated successfully.",
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/users/:id error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update user." },
      { status: 500 }
    );
  }
}
