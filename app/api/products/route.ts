import { NextRequest, NextResponse, connection } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";
import {
  fetchProductsFromDb,
  fetchProductByIdOrSlugFromDb,
  generateUniqueSlug,
  safeNumber,
} from "@/lib/products-db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connection();
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") || undefined;
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("search") || undefined;

    const products = await fetchProductsFromDb({ category, featured, search });
    return NextResponse.json({ products });
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch products." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Protect admin route on the server
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    const price = safeNumber(body.price, 0);
    const mrp = safeNumber(body.mrp, price) >= price ? safeNumber(body.mrp, price) : price;
    const stock = Math.max(0, Math.floor(safeNumber(body.stock, 25)));
    const inStock =
      body.in_stock !== undefined
        ? Boolean(body.in_stock) && stock > 0
        : stock > 0;

    // Resolve category_id
    let categoryId: number | null = body.category_id ? Number(body.category_id) : null;
    if (!categoryId && body.category_name) {
      const [catRows] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM categories WHERE LOWER(name) = LOWER(?) OR slug = LOWER(?) LIMIT 1",
        [String(body.category_name).trim(), String(body.category_name).trim()]
      );
      if (catRows[0]) {
        categoryId = Number(catRows[0].id);
      }
    }

    const slug = await generateUniqueSlug(body.slug || name);
    const subcategory = String(body.subcategory || body.category_name || "").trim() || null;
    const description = body.description ? String(body.description).trim() : null;
    const featured = Boolean(body.featured);

    // Gather images and publicIds
    const rawImages: string[] = Array.isArray(body.images)
      ? body.images.map((s: any) => String(s || "").trim())
      : [];
    const rawPublicIds: string[] = Array.isArray(body.imagePublicIds)
      ? body.imagePublicIds.map((s: any) => String(s || "").trim())
      : [];

    const imageEntries: { url: string; publicId: string | null }[] = [];
    for (let i = 0; i < rawImages.length; i++) {
      if (rawImages[i]) {
        imageEntries.push({
          url: rawImages[i],
          publicId: rawPublicIds[i] || null,
        });
      }
    }

    const fallbackImageUrl = String(body.image_url || body.image || "").trim();
    const fallbackPublicId = String(body.image_public_id || body.publicId || "").trim() || null;
    if (imageEntries.length === 0 && fallbackImageUrl) {
      imageEntries.push({ url: fallbackImageUrl, publicId: fallbackPublicId });
    }

    const primaryImageUrl = imageEntries[0]?.url || `/products/${slug}.jpg`;
    const primaryPublicId = imageEntries[0]?.publicId || null;

    const sizesJson = Array.isArray(body.sizes) ? JSON.stringify(body.sizes) : null;
    const benefits = body.benefits ? String(body.benefits).trim() : null;
    const howToUse = (body.howToUse ?? body.how_to_use)
      ? String(body.howToUse ?? body.how_to_use).trim()
      : null;
    const ingredients = body.ingredients ? String(body.ingredients).trim() : null;
    const returnPolicy = (body.returnPolicy ?? body.return_policy)
      ? String(body.returnPolicy ?? body.return_policy).trim()
      : null;

    // Insert into products table
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO products (
        name, slug, category_id, subcategory, description,
        price, mrp, stock, in_stock, image_url, image_public_id,
        sizes_json, benefits, how_to_use, ingredients, return_policy, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        categoryId,
        subcategory,
        description,
        price,
        mrp,
        stock,
        inStock,
        primaryImageUrl,
        primaryPublicId,
        sizesJson,
        benefits,
        howToUse,
        ingredients,
        returnPolicy,
        featured,
      ]
    );

    const productId = result.insertId;

    // Save image_url and public_id rows in product_images table
    const entriesToInsert =
      imageEntries.length > 0
        ? imageEntries
        : [{ url: primaryImageUrl, publicId: primaryPublicId }];

    for (let i = 0; i < entriesToInsert.length; i++) {
      await pool.execute(
        "INSERT INTO product_images (product_id, image_url, public_id, sort_order) VALUES (?, ?, ?, ?)",
        [productId, entriesToInsert[i].url, entriesToInsert[i].publicId, i]
      );
    }

    const created = await fetchProductByIdOrSlugFromDb(String(productId));
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create product." },
      { status: 500 }
    );
  }
}
