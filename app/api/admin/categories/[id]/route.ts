import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { updateCategory, deleteCategory } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

// PUT /api/admin/categories/:id
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
    }

    const updated = await updateCategory(id, {
      name,
      section_id: body.section_id !== undefined ? Number(body.section_id) : undefined,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
      image: body.image !== undefined ? (body.image ? String(body.image).trim() : null) : undefined,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/admin/categories/:id error:", error);
    const status = error.message?.includes("already exists")
      ? 400
      : error.message?.includes("not found")
      ? 404
      : 500;
    return NextResponse.json(
      { message: error?.message || "Failed to update category." },
      { status }
    );
  }
}

// DELETE /api/admin/categories/:id
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const result = await deleteCategory(id);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/admin/categories/:id error:", error);
    const isBlock = error.message?.includes("contains");
    const status = isBlock ? 400 : error.message?.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { message: error?.message || "Failed to delete category." },
      { status }
    );
  }
}
