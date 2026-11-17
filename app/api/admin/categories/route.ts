import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { getAdminCategories, createCategory } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

// GET /api/admin/categories
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const categories = await getAdminCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to fetch categories." },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
    }

    const category = await createCategory({
      name,
      section_id: body.section_id !== undefined ? Number(body.section_id) : 1,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      image: body.image ? String(body.image).trim() : null,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/categories error:", error);
    const status = error.message?.includes("already exists") ? 400 : 500;
    return NextResponse.json(
      { message: error?.message || "Failed to create category." },
      { status }
    );
  }
}
