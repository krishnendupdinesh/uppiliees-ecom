import { NextRequest, NextResponse, connection } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import { requireAdminUser } from "@/lib/auth";
import {
  fetchProductByIdOrSlugFromDb,
  generateUniqueSlug,
  safeNumber,
} from "@/lib/products-db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  try {
    const { id } = await params;
    const admin = await requireAdminUser(req);
    const product = await fetchProductByIdOrSlugFromDb(id, {
      includeInactive: Boolean(admin),
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error: any) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch product." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Protect admin route on the server
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await fetchProductByIdOrSlugFromDb(id, { includeInactive: true });
    if (!existing) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const body = await req.json();
    const name = body.name !== undefined ? String(body.name).trim() : existing.name;
    if (!name) {
      return NextResponse.json(
        { error: "Product name cannot be empty." },
        { status: 400 }
      );
    }

    const slug =
      body.slug && String(body.slug).trim() && String(body.slug).trim() !== existing.slug
        ? await generateUniqueSlug(String(body.slug).trim(), Number(existing.id))
        : existing.slug;

    const price = body.price !== undefined ? safeNumber(body.price, 0) : existing.price;
    const mrp =
      body.mrp !== undefined
        ? safeNumber(body.mrp, price)
        : safeNumber(existing.mrp, price);
    const stock =
      body.stock !== undefined
        ? Math.max(0, Math.floor(safeNumber(body.stock, 0)))
        : existing.stock;
    const inStock =
      body.in_stock !== undefined
        ? Boolean(body.in_stock) && stock > 0
        : stock > 0;
    const isActive =
      body.is_active !== undefined ? Boolean(body.is_active) : existing.is_active;
    const displayOrder =
      body.display_order !== undefined
        ? Math.max(0, Math.floor(safeNumber(body.display_order, 0)))
        : existing.display_order;

    let categoryId =
      body.category_id !== undefined ? Number(body.category_id) : existing.category_id;
    if (!categoryId && body.category_name) {
      const [catRows] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM categories WHERE LOWER(name) = LOWER(?) OR slug = LOWER(?) LIMIT 1",
        [String(body.category_name).trim(), String(body.category_name).trim()]
      );
      if (catRows[0]) {
        categoryId = Number(catRows[0].id);
      }
    }

    const subcategory =
      body.subcategory !== undefined
        ? String(body.subcategory).trim()
        : existing.subcategory || body.category_name || existing.category_name;
    const description =
      body.description !== undefined ? String(body.description).trim() : existing.description;
    const tags = body.tags !== undefined ? String(body.tags).trim() : existing.tags;
    const featured =
      body.featured !== undefined ? Boolean(body.featured) : existing.featured;

    // Build updated image list (if body.images was provided, use it; otherwise keep existing)
    let imageEntries: { url: string; publicId: string | null }[] = [];
    if (body.images !== undefined) {
      const rawImages: string[] = Array.isArray(body.images)
        ? body.images.map((s: any) => String(s || "").trim())
        : [];
      const rawPublicIds: string[] = Array.isArray(body.imagePublicIds)
        ? body.imagePublicIds.map((s: any) => String(s || "").trim())
        : [];

      for (let i = 0; i < rawImages.length; i++) {
        const url = rawImages[i];
        if (url && !url.startsWith("/products/")) {
          imageEntries.push({
            url,
            publicId: rawPublicIds[i] || null,
          });
        }
      }
    } else if (body.image_url !== undefined || body.image !== undefined) {
      const singleUrl = String(body.image_url ?? body.image ?? "").trim();
      const singlePid =
        String(body.image_public_id ?? body.publicId ?? "").trim() || null;
      if (singleUrl && !singleUrl.startsWith("/products/")) {
        imageEntries.push({ url: singleUrl, publicId: singlePid });
      }
    } else {
      // Preserve existing images when PUT only updates status/stock/etc.
      imageEntries = (existing.product_images || []).map((img: any) => ({
        url: img.image_url,
        publicId: img.public_id || null,
      }));
      if (imageEntries.length === 0 && existing.image_url) {
        imageEntries.push({
          url: existing.image_url,
          publicId: existing.image_public_id || null,
        });
      }
    }

    // Delete any replaced/removed Cloudinary images using uploader.destroy(publicId)
    const newPublicIds = new Set(
      imageEntries.map((e) => e.publicId).filter(Boolean) as string[]
    );
    const oldPublicIds = new Set<string>();
    if (existing.image_public_id) oldPublicIds.add(existing.image_public_id);
    for (const img of existing.product_images || []) {
      if (img.public_id) oldPublicIds.add(img.public_id);
    }

    for (const oldPid of oldPublicIds) {
      if (oldPid && !newPublicIds.has(oldPid)) {
        try {
          await cloudinary.uploader.destroy(oldPid);
        } catch (err) {
          console.error("Failed to destroy old Cloudinary image:", oldPid, err);
        }
      }
    }

    const primaryImageUrl = imageEntries[0]?.url || null;
    const primaryPublicId = imageEntries[0]?.publicId || null;

    const sizesJson =
      body.sizes !== undefined
        ? JSON.stringify(Array.isArray(body.sizes) ? body.sizes : [])
        : JSON.stringify(existing.sizes || []);

    const benefits =
      body.benefits !== undefined ? String(body.benefits).trim() : existing.benefits;
    const howToUse =
      (body.howToUse ?? body.how_to_use) !== undefined
        ? String(body.howToUse ?? body.how_to_use).trim()
        : existing.howToUse;
    const ingredients =
      body.ingredients !== undefined ? String(body.ingredients).trim() : existing.ingredients;
    const returnPolicy =
      (body.returnPolicy ?? body.return_policy) !== undefined
        ? String(body.returnPolicy ?? body.return_policy).trim()
        : existing.returnPolicy;

    await pool.execute(
      `UPDATE products SET
        name = ?, slug = ?, category_id = ?, subcategory = ?, description = ?,
        price = ?, mrp = ?, stock = ?, in_stock = ?, is_active = ?, display_order = ?, tags = ?,
        image_url = ?, image_public_id = ?, sizes_json = ?,
        benefits = ?, how_to_use = ?, ingredients = ?, return_policy = ?, featured = ?
       WHERE id = ?`,
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
        isActive,
        displayOrder,
        tags,
        primaryImageUrl,
        primaryPublicId,
        sizesJson,
        benefits,
        howToUse,
        ingredients,
        returnPolicy,
        featured,
        existing.id,
      ]
    );

    // Replace product_images rows with the updated ordered image list
    await pool.execute("DELETE FROM product_images WHERE product_id = ?", [existing.id]);
    for (let i = 0; i < imageEntries.length; i++) {
      await pool.execute(
        "INSERT INTO product_images (product_id, image_url, public_id, sort_order) VALUES (?, ?, ?, ?)",
        [existing.id, imageEntries[i].url, imageEntries[i].publicId, i]
      );
    }

    const updated = await fetchProductByIdOrSlugFromDb(String(existing.id), {
      includeInactive: true,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update product." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Protect admin route on the server
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await fetchProductByIdOrSlugFromDb(id, { includeInactive: true });
    if (!existing) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // 2. Delete all associated Cloudinary images with uploader.destroy(publicId)
    const publicIdsToDestroy = new Set<string>();
    if (existing.image_public_id) publicIdsToDestroy.add(existing.image_public_id);
    for (const img of existing.product_images || []) {
      if (img.public_id) publicIdsToDestroy.add(img.public_id);
    }

    for (const pid of publicIdsToDestroy) {
      try {
        await cloudinary.uploader.destroy(pid);
      } catch (err) {
        console.error("Cloudinary destroy error for", pid, err);
      }
    }

    // 3. Delete product_images and product from TiDB
    await pool.execute("DELETE FROM product_images WHERE product_id = ?", [existing.id]);
    await pool.execute("DELETE FROM products WHERE id = ?", [existing.id]);

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error: any) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete product." },
      { status: 500 }
    );
  }
}
