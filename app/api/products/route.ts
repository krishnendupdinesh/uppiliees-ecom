import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/admin/db";
import { saveCustomProduct } from "@/lib/admin/productsStore";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const saved = saveCustomProduct({
      name: body.name,
      category: body.category_name || "General",
      price: body.price,
      mrp: body.mrp,
      stock: body.stock,
      image: body.image,
      description: body.description,
      featured: body.featured,
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create product" }, { status: 500 });
  }
}

