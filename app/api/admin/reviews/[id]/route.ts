import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { deleteAdminReview } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

export async function DELETE(
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
    const success = await deleteAdminReview(id);

    if (!success) {
      return NextResponse.json(
        { error: "Review not found or could not be deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Review deleted successfully.",
      id,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/reviews/:id error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete review." },
      { status: 500 }
    );
  }
}
