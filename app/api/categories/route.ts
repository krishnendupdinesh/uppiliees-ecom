import { NextResponse, connection } from "next/server";
import { getCategories } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

// GET /api/categories - Public: returns all active categories
export async function GET() {
  await connection();
  try {
    const categories = await getCategories();
    return NextResponse.json(categories, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error: any) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to fetch categories." },
      { status: 500 }
    );
  }
}
