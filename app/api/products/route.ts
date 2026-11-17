import { NextRequest, NextResponse, connection } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireAdminUser } from "@/lib/auth";
import {
  fetchProductsFromDb,
  fetchProductByIdOrSlugFromDb,
  generateUniqueSlug,
  safeNumber,
  calculateSellingPrice,
} from "@/lib/products-db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connection();
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") || undefined;
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("search") || undefined;
    const wantInactive = searchParams.get("includeInactive") === "true";

    // Only allow includeInactive if requester is an admin
    let includeInactive = false;
    if (wantInactive) {
      const admin = await requireAdminUser(req);
      includeInactive = Boolean(admin);
    }

    const products = await fetchProductsFromDb({
      category,
      featured,
      search,
      includeInactive,
    });
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

    // Validation: mrp must be a number greater than 0
    const rawMrp = Number(body.mrp !== undefined ? body.mrp : body.price);
    if (!Number.isFinite(rawMrp) || rawMrp <= 0) {
      return NextResponse.json(
        { error: "MRP must be a number greater than 0." },
        { status: 400 }
      );
    }

    // Validation: discount_percent must be between 0 and 100
    const rawDiscount = body.discount_percent !== undefined ? Number(body.discount_percent) : 0;
    if (!Number.isFinite(rawDiscount) || rawDiscount < 0 || rawDiscount > 100) {
      return NextResponse.json(
        { error: "Discount percent must be between 0 and 100." },
        { status: 400 }
      );
    }

    const mrp = Math.round(rawMrp * 100) / 100;
    const discountPercent = Math.round(rawDiscount * 100) / 100;
    const sellingPrice = calculateSellingPrice(mrp, discountPercent);
    const price = sellingPrice;

    const stock = Math.max(0, Math.floor(safeNumber(body.stock, 25)));
    const inStock =
      body.in_stock !== undefined
        ? Boolean(body.in_stock) && stock > 0
        : stock > 0;
    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : true;

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

    // New products are placed at the top (display_order = 1) by default
    let finalDisplayOrder = 1;
    if (body.display_order !== undefined && Number(body.display_order) > 0) {
      finalDisplayOrder = Math.max(1, Math.floor(safeNumber(body.display_order, 1)));
    } else {
      try {
        await pool.execute(
          "UPDATE products SET display_order = display_order + 1 WHERE category_id <=> ?",
          [categoryId]
        );
      } catch {
        // Safe fallback
      }
    }

    const slug = await generateUniqueSlug(body.slug || name);
    const subcategory = String(body.subcategory || body.category_name || "").trim() || null;
    const description = body.description ? String(body.description).trim() : null;
    const tags = body.tags ? String(body.tags).trim() : null;
    const featured = Boolean(body.featured);

    // Gather uploaded images and publicIds (never store non-existent /products/*.jpg placeholders)
    const rawImages: string[] = Array.isArray(body.images)
      ? body.images.map((s: any) => String(s || "").trim())
      : [];
    const rawPublicIds: string[] = Array.isArray(body.imagePublicIds)
      ? body.imagePublicIds.map((s: any) => String(s || "").trim())
      : [];

    const imageEntries: { url: string; publicId: string | null }[] = [];
    for (let i = 0; i < rawImages.length; i++) {
      const url = rawImages[i];
      if (url && !url.startsWith("/products/")) {
        imageEntries.push({
          url,
          publicId: rawPublicIds[i] || null,
        });
      }
    }

    const fallbackImageUrl = String(body.image_url || body.image || "").trim();
    const fallbackPublicId = String(body.image_public_id || body.publicId || "").trim() || null;
    if (
      imageEntries.length === 0 &&
      fallbackImageUrl &&
      !fallbackImageUrl.startsWith("/products/")
    ) {
      imageEntries.push({ url: fallbackImageUrl, publicId: fallbackPublicId });
    }

    const primaryImageUrl = imageEntries[0]?.url || null;
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
        mrp, discount_percent, selling_price, price,
        stock, in_stock, is_active, display_order, tags,
        image_url, image_public_id, sizes_json,
        benefits, how_to_use, ingredients, return_policy, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        categoryId,
        subcategory,
        description,
        mrp,
        discountPercent,
        sellingPrice,
        price,
        stock,
        inStock,
        isActive,
        finalDisplayOrder,
        tags,
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
    for (let i = 0; i < imageEntries.length; i++) {
      await pool.execute(
        "INSERT INTO product_images (product_id, image_url, public_id, sort_order) VALUES (?, ?, ?, ?)",
        [productId, imageEntries[i].url, imageEntries[i].publicId, i]
      );
    }

    const created = await fetchProductByIdOrSlugFromDb(String(productId), {
      includeInactive: true,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create product." },
      { status: 500 }
    );
  }
}
