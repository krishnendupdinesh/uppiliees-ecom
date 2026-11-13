import { NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/admin/db";
import { saveCustomProduct, deleteCustomProduct } from "@/lib/admin/productsStore";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 400 });
  }
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const saved = saveCustomProduct({
      id,
      name: body.name,
      category: body.category_name,
      price: body.price,
      mrp: body.mrp,
      stock: body.stock,
      image: body.image,
      description: body.description,
      featured: body.featured,
    });

    return NextResponse.json(saved);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteCustomProduct(id);
  return NextResponse.json({ success: true });
}

