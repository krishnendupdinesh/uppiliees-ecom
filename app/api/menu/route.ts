import { NextResponse, connection } from "next/server";
import { getMenuFromDb } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

// GET /api/menu - Public: returns sections with their active categories
export async function GET() {
  await connection();
  try {
    const menu = await getMenuFromDb();
    return NextResponse.json(menu, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error: any) {
    console.error("GET /api/menu error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to fetch menu." },
      { status: 500 }
    );
  }
}
