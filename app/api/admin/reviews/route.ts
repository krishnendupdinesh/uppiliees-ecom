import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { getAdminReviews } from "@/lib/admin/db";

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
    const productId = searchParams.get("productId") || undefined;
    const ratingStr = searchParams.get("rating");
    const rating = ratingStr ? Number(ratingStr) : undefined;
    const search = searchParams.get("search") || undefined;

    const reviews = await getAdminReviews({ productId, rating, search });
    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error("GET /api/admin/reviews error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch reviews." },
      { status: 500 }
    );
  }
}
