import { NextRequest, NextResponse, connection } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { getProducts } from "@/lib/admin/db";
import { POST as createProductHandler } from "@/app/api/products/route";

export const dynamic = "force-dynamic";

// GET /api/admin/products
export async function GET(req: NextRequest) {
  await connection();
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const products = await getProducts();
    return NextResponse.json({ products });
  } catch (error: any) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to fetch products." },
      { status: 500 }
    );
  }
}

// POST /api/admin/products
export async function POST(req: NextRequest) {
  return createProductHandler(req);
}
