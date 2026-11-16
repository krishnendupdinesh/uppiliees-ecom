import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export interface DbProductImage {
  id: number;
  product_id: number;
  image_url: string;
  public_id: string | null;
  sort_order: number;
}

// Safely parse a number and default to fallback (0) to prevent undefined/NaN price errors
export function safeNumber(val: unknown, fallback = 0): number {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

// Convert a product title into a clean URL-safe slug
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Generate a unique slug in the products table
export async function generateUniqueSlug(baseName: string, excludeId?: number): Promise<string> {
  const baseSlug = slugify(baseName) || `product-${Date.now()}`;
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    let sql = "SELECT id FROM products WHERE slug = ?";
    const params: any[] = [candidate];
    if (excludeId !== undefined) {
      sql += " AND id != ?";
      params.push(excludeId);
    }
    const [existing] = await pool.execute<RowDataPacket[]>(sql, params);
    if (existing.length === 0) {
      return candidate;
    }
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
}

// Format a database product row and its product_images rows into a unified object
export function formatProductRow(row: RowDataPacket, imageRows: DbProductImage[] = []) {
  const price = safeNumber(row.price, 0);
  const mrp = safeNumber(row.mrp, price) >= price ? safeNumber(row.mrp, price) : price;
  const stock = safeNumber(row.stock, 0);
  const inStockFlag = row.in_stock !== undefined ? Boolean(row.in_stock) : true;
  const inStock = inStockFlag && stock > 0;

  const sortedImages = [...imageRows].sort((a, b) => a.sort_order - b.sort_order);
  const imagesFromTable = sortedImages.map((img) => img.image_url).filter(Boolean);
  const publicIdsFromTable = sortedImages.map((img) => img.public_id || "");

  const defaultImg = row.image_url || `/products/${row.slug}.jpg`;
  const images = imagesFromTable.length > 0 ? imagesFromTable : [defaultImg];
  const imagePublicIds =
    publicIdsFromTable.length > 0 ? publicIdsFromTable : [row.image_public_id || ""];

  const primaryImage = images[0] || defaultImg;
  const primaryPublicId = imagePublicIds[0] || row.image_public_id || "";

  let sizes: { size: string; price: number; mrp?: number; stock?: number }[] = [];
  if (row.sizes_json) {
    try {
      const parsed = JSON.parse(row.sizes_json);
      if (Array.isArray(parsed)) {
        sizes = parsed.map((s: any) => ({
          size: String(s.size || ""),
          price: safeNumber(s.price, price),
          mrp: safeNumber(s.mrp, safeNumber(s.price, price)),
          stock: safeNumber(s.stock, stock),
        }));
      }
    } catch {
      sizes = [];
    }
  }

  const categoryName = row.category_name || "Herbal & Beauty";
  const categorySlug = row.category_slug || "herbal-beauty";
  const subcategory = row.subcategory || categoryName;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category_id: row.category_id,
    category_name: categoryName,
    category_slug: categorySlug,
    subcategory,
    category: subcategory,
    description: row.description || "",
    price,
    mrp,
    stock,
    in_stock: inStock,
    image_url: primaryImage,
    image: primaryImage,
    image_public_id: primaryPublicId,
    publicId: primaryPublicId,
    images,
    imagePublicIds,
    product_images: sortedImages,
    sizes,
    benefits: row.benefits || "",
    howToUse: row.how_to_use || "",
    how_to_use: row.how_to_use || "",
    ingredients: row.ingredients || "",
    returnPolicy: row.return_policy || "",
    return_policy: row.return_policy || "",
    featured: Boolean(row.featured),
    created_at: row.created_at,
  };
}

// Fetch all products from TiDB with optional category, featured, or search filters
export async function fetchProductsFromDb(options?: {
  category?: string;
  featured?: boolean;
  search?: string;
}) {
  const category = (options?.category || "").trim().toLowerCase();
  const search = (options?.search || "").trim().toLowerCase();
  const featured = options?.featured;

  let sql = `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (category && category !== "all" && category !== "products" && category !== "shop") {
    if (
      category === "traditional-foods" ||
      category === "traditional-food" ||
      category === "kerala-food" ||
      category === "food"
    ) {
      sql += " AND (c.slug IN ('traditional-foods', 'traditional-food') OR LOWER(c.name) LIKE ?)";
      params.push("%food%");
    } else if (category === "herbal-beauty" || category === "herbal-beauty-wellness") {
      sql += " AND (c.slug = 'herbal-beauty' OR LOWER(c.name) LIKE ?)";
      params.push("%herbal%");
    } else if (category === "handloom") {
      sql += " AND (c.slug = 'handloom' OR LOWER(c.name) LIKE ?)";
      params.push("%handloom%");
    } else {
      sql += " AND (c.slug = ? OR LOWER(c.name) = ? OR LOWER(p.subcategory) = ?)";
      params.push(category, category, category);
    }
  }

  if (featured) {
    sql += " AND p.featured = TRUE";
  }

  if (search) {
    sql += " AND (LOWER(p.name) LIKE ? OR LOWER(p.subcategory) LIKE ? OR LOWER(c.name) LIKE ?)";
    const likeTerm = `%${search}%`;
    params.push(likeTerm, likeTerm, likeTerm);
  }

  sql += " ORDER BY p.id ASC";

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  if (rows.length === 0) return [];

  const productIds = rows.map((r) => r.id);
  const placeholders = productIds.map(() => "?").join(",");
  const [imgRows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, image_url, public_id, sort_order
     FROM product_images
     WHERE product_id IN (${placeholders})
     ORDER BY sort_order ASC, id ASC`,
    productIds
  );

  const imagesByProductId = new Map<number, DbProductImage[]>();
  for (const img of imgRows) {
    const pid = Number(img.product_id);
    const list = imagesByProductId.get(pid) || [];
    list.push({
      id: Number(img.id),
      product_id: pid,
      image_url: String(img.image_url),
      public_id: img.public_id ? String(img.public_id) : null,
      sort_order: Number(img.sort_order || 0),
    });
    imagesByProductId.set(pid, list);
  }

  return rows.map((row) => formatProductRow(row, imagesByProductId.get(Number(row.id)) || []));
}

// Fetch a single product by ID or slug from TiDB
export async function fetchProductByIdOrSlugFromDb(idOrSlug: string) {
  const clean = String(idOrSlug || "").trim();
  if (!clean) return null;

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.slug = ? OR CAST(p.id AS CHAR) = ?
     LIMIT 1`,
    [clean, clean]
  );

  if (rows.length === 0) return null;

  const productRow = rows[0];
  const [imgRows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, image_url, public_id, sort_order
     FROM product_images
     WHERE product_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [productRow.id]
  );

  const images: DbProductImage[] = imgRows.map((img) => ({
    id: Number(img.id),
    product_id: Number(img.product_id),
    image_url: String(img.image_url),
    public_id: img.public_id ? String(img.public_id) : null,
    sort_order: Number(img.sort_order || 0),
  }));

  return formatProductRow(productRow, images);
}

