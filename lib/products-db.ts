import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import {
  handloom,
  herbalBeauty,
  traditionalFoods,
  allProducts,
  type Collection,
  type Product,
} from "@/data/products";

export interface DbProductImage {
  id: number;
  product_id: number;
  image_url: string;
  public_id: string | null;
  sort_order: number;
}

// Safely parse a number and default to fallback (0) to prevent undefined/NaN price errors
export function safeNumber(val: unknown, fallback = 0): number {
  if (val === undefined || val === null) return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

// Calculates selling_price = mrp - (mrp * discount_percent / 100), rounded to 2 decimals
export function calculateSellingPrice(mrp: number, discountPercent: number): number {
  const m = safeNumber(mrp, 0);
  const d = safeNumber(discountPercent, 0);
  if (m <= 0) return 0;
  const price = m - (m * d / 100);
  return Math.max(0, Math.round(price * 100) / 100);
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

// Clean an image URL (strip legacy non-existent /products/*.jpg placeholder paths)
function cleanImageUrl(rawUrl: unknown): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith("/products/")) return "";
  return trimmed;
}

// Format a database product row and its product_images rows into a unified object
export function formatProductRow(row: RowDataPacket, imageRows: DbProductImage[] = []) {
  const mrp = safeNumber(row.mrp !== undefined && row.mrp !== null ? row.mrp : row.price, 0);
  const discountPercent = safeNumber(row.discount_percent, 0);
  const calculatedSelling = calculateSellingPrice(mrp, discountPercent);
  const sellingPrice = row.selling_price !== undefined && row.selling_price !== null && Number(row.selling_price) >= 0
    ? safeNumber(row.selling_price, calculatedSelling)
    : calculatedSelling;
  const price = safeNumber(sellingPrice, safeNumber(row.price, 0));
  const stock = safeNumber(row.stock, 0);
  const inStockFlag = row.in_stock !== undefined ? Boolean(row.in_stock) : true;
  const inStock = inStockFlag && stock > 0;
  const isActive = row.is_active !== undefined && row.is_active !== null ? Boolean(row.is_active) : true;
  const displayOrder = safeNumber(row.display_order, 0);

  // Sort images by sort_order ASC and filter out empty or fake placeholder paths
  const sortedImages = [...imageRows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((img) => Boolean(cleanImageUrl(img.image_url)));

  const imagesFromTable = sortedImages.map((img) => cleanImageUrl(img.image_url));
  const publicIdsFromTable = sortedImages.map((img) => img.public_id || "");

  const rowMainImg = cleanImageUrl(row.image_url);
  const images =
    imagesFromTable.length > 0
      ? imagesFromTable
      : rowMainImg
      ? [rowMainImg]
      : [];
  const imagePublicIds =
    publicIdsFromTable.length > 0
      ? publicIdsFromTable
      : rowMainImg
      ? [row.image_public_id || ""]
      : [];

  const primaryImage = images[0] || "";
  const primaryPublicId = imagePublicIds[0] || "";

  let sizes: { size: string; price: number; selling_price?: number; mrp?: number; discount_percent?: number; stock?: number }[] = [];
  if (row.sizes_json) {
    try {
      const parsed = JSON.parse(row.sizes_json);
      if (Array.isArray(parsed)) {
        sizes = parsed.map((s: any) => {
          const sMrp = safeNumber(s.mrp, safeNumber(s.price, mrp));
          const sDiscount = safeNumber(s.discount_percent !== undefined ? s.discount_percent : discountPercent, 0);
          const sSelling = s.selling_price !== undefined
            ? safeNumber(s.selling_price, calculateSellingPrice(sMrp, sDiscount))
            : calculateSellingPrice(sMrp, sDiscount);
          return {
            size: String(s.size || ""),
            price: sSelling,
            selling_price: sSelling,
            mrp: sMrp,
            discount_percent: sDiscount,
            stock: safeNumber(s.stock, stock),
          };
        });
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
    section_id: row.section_id,
    section_name: row.section_name,
    section_slug: row.section_slug,
    subcategory,
    category: subcategory,
    description: row.description || "",
    price,
    mrp,
    discount_percent: discountPercent,
    selling_price: price,
    stock,
    in_stock: inStock,
    is_active: isActive,
    display_order: displayOrder,
    tags: row.tags || "",
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

// Fetch all products from TiDB with optional category, featured, search, or includeInactive filters
export async function fetchProductsFromDb(options?: {
  category?: string;
  featured?: boolean;
  search?: string;
  includeInactive?: boolean;
}) {
  const category = (options?.category || "").trim().toLowerCase();
  const search = (options?.search || "").trim().toLowerCase();
  const featured = options?.featured;
  const includeInactive = Boolean(options?.includeInactive);

  let sql = `
    SELECT 
      p.*, 
      c.name AS category_name, 
      c.slug AS category_slug,
      c.section_id,
      s.name AS section_name,
      s.slug AS section_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN sections s ON c.section_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (!includeInactive) {
    sql += " AND (p.is_active = TRUE OR p.is_active IS NULL)";
  }

  const isSpecificCategory =
    Boolean(category) && category !== "all" && category !== "products" && category !== "shop";

  if (isSpecificCategory) {
    if (
      category === "traditional-foods" ||
      category === "traditional-food" ||
      category === "kerala-food-products" ||
      category === "kerala-food"
    ) {
      sql += " AND (s.slug = 'kerala-food-products' OR c.slug IN ('traditional-foods', 'traditional-food') OR LOWER(c.name) LIKE ? OR LOWER(s.name) LIKE ?)";
      params.push("%food%", "%food%");
    } else if (category === "herbal-beauty" || category === "herbal-wellness" || category === "herbal-beauty-wellness") {
      sql += " AND (s.slug = 'herbal-wellness' OR c.slug = 'herbal-beauty' OR LOWER(c.name) LIKE ? OR LOWER(s.name) LIKE ?)";
      params.push("%herbal%", "%herbal%");
    } else if (category === "handloom") {
      sql += " AND (s.slug = 'handloom' OR c.slug = 'handloom' OR LOWER(c.name) LIKE ? OR LOWER(s.name) LIKE ?)";
      params.push("%handloom%", "%handloom%");
    } else {
      sql += " AND (c.slug = ? OR LOWER(c.name) = ? OR LOWER(p.subcategory) = ? OR s.slug = ? OR LOWER(s.name) = ?)";
      params.push(category, category, category, category, category);
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

  // Sort by display_order ASC (and category_id ASC when listing all products across categories)
  if (isSpecificCategory) {
    sql += " ORDER BY COALESCE(p.display_order, 9999) ASC, p.id ASC";
  } else {
    sql += " ORDER BY COALESCE(p.category_id, 99) ASC, COALESCE(p.display_order, 9999) ASC, p.id ASC";
  }

  let rows: RowDataPacket[] = [];
  try {
    const [res] = await pool.execute<RowDataPacket[]>(sql, params);
    rows = res;
  } catch (err: any) {
    // If sections table or columns do not exist yet (before migration runs), fallback safely
    if (
      err &&
      (err.code === "ER_NO_SUCH_TABLE" ||
        err.message?.includes("sections") ||
        err.message?.includes("Unknown column"))
    ) {
      console.warn("⚠️ Database table/column not found. Falling back to basic products query:", err.message);
      const fallbackSql = `
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1 ${!includeInactive ? "AND (p.is_active = TRUE OR p.is_active IS NULL)" : ""}
        ORDER BY p.id ASC
      `;
      const [fallbackRows] = await pool.execute<RowDataPacket[]>(fallbackSql);
      rows = fallbackRows;
    } else {
      throw err;
    }
  }
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
export async function fetchProductByIdOrSlugFromDb(
  idOrSlug: string,
  options?: { includeInactive?: boolean }
) {
  const clean = String(idOrSlug || "").trim();
  if (!clean) return null;

  const includeInactive = Boolean(options?.includeInactive);
  let sql = `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE (p.slug = ? OR CAST(p.id AS CHAR) = ?)
  `;
  if (!includeInactive) {
    sql += " AND (p.is_active = TRUE OR p.is_active IS NULL)";
  }
  sql += " LIMIT 1";

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [clean, clean]);

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

// Fetch a complete Collection object (title, subtitle, priceRanges, products sorted by display_order) from TiDB
export async function fetchCollectionFromDb(
  slug: "herbal-beauty" | "traditional-foods" | "handloom" | "products"
): Promise<Collection> {
  const baseCollection =
    slug === "herbal-beauty"
      ? herbalBeauty
      : slug === "traditional-foods"
      ? traditionalFoods
      : slug === "handloom"
      ? handloom
      : allProducts;

  try {
    const dbRows = await fetchProductsFromDb({
      category: slug === "products" ? undefined : slug,
      includeInactive: false,
    });

    const mappedProducts: Product[] = dbRows.map((p) => {
      const selling = safeNumber(p.selling_price ?? p.price, 0);
      const mrp = safeNumber(p.mrp, selling);
      const discount = safeNumber(p.discount_percent, 0);
      const sectionSlug = p.section_slug || (
        slug === "herbal-beauty" ? "herbal-wellness" :
        slug === "traditional-foods" ? "kerala-food-products" :
        slug === "handloom" ? "handloom" : ""
      );
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.subcategory || p.category_name || "General",
        subcategory: p.subcategory || p.category_name,
        category_id: p.category_id,
        category_name: p.category_name,
        category_slug: p.category_slug,
        section_id: p.section_id,
        section_name: p.section_name,
        section_slug: sectionSlug,
        price: selling,
        selling_price: selling,
        mrp,
        discount_percent: discount,
        description: p.description || undefined,
        collectionSlug: sectionSlug || p.category_slug || (slug === "products" ? "shop" : slug),
        image: p.image_url || p.image || "",
        images: Array.isArray(p.images) ? p.images : [],
        stock: p.stock !== undefined ? p.stock : 25,
        in_stock: p.in_stock !== undefined ? p.in_stock : true,
      };
    });

    return {
      slug: baseCollection.slug,
      title: baseCollection.title,
      subtitle: baseCollection.subtitle,
      priceRanges: baseCollection.priceRanges,
      products: mappedProducts,
    };
  } catch (err) {
    console.error(`Error loading collection "${slug}" from database:`, err);
    return {
      ...baseCollection,
      products: [],
    };
  }
}
