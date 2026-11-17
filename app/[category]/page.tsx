import { notFound } from "next/navigation";
import { connection } from "next/server";
import UppilieesProductListing from "@/components/UppilieesProductListing";
import { fetchProductsFromDb, safeNumber } from "@/lib/products-db";
import type { Collection, Product } from "@/data/products";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

type Params = Promise<{ category: string }>;

export default async function DynamicCategoryPage({ params }: { params: Params }) {
  await connection();
  const { category: slug } = await params;

  // Reserved non-category routes should not be caught here
  if (
    ["api", "admin", "cart", "checkout", "login", "register", "account", "shop", "products"].includes(
      slug.toLowerCase()
    )
  ) {
    notFound();
  }

  // Look up category in the database
  let categoryName = "";
  let categorySubtitle = "Authentic handcrafted Kerala products";

  try {
    const [catRows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, name, slug, subtitle FROM categories WHERE slug = ? OR LOWER(name) = ? LIMIT 1",
      [slug, slug.replace(/-/g, " ")]
    );
    if (catRows.length > 0) {
      categoryName = String(catRows[0].name);
      if (catRows[0].subtitle) {
        categorySubtitle = String(catRows[0].subtitle);
      }
    }
  } catch (err) {
    console.error("Dynamic category lookup error:", err);
  }

  // Fetch products belonging to this category
  const dbRows = await fetchProductsFromDb({
    category: slug,
    includeInactive: false,
  });

  if (!categoryName && dbRows.length === 0) {
    notFound();
  }

  const title = categoryName || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const mappedProducts: Product[] = dbRows.map((p) => {
    const selling = safeNumber(p.selling_price ?? p.price, 0);
    const mrp = safeNumber(p.mrp, selling);
    const discount = safeNumber(p.discount_percent, 0);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.subcategory || p.category_name || title,
      price: selling,
      selling_price: selling,
      mrp,
      discount_percent: discount,
      description: p.description || undefined,
      collectionSlug: p.category_slug || slug,
      image: p.image_url || p.image || "",
      images: Array.isArray(p.images) ? p.images : [],
      stock: p.stock !== undefined ? Number(p.stock) : 25,
      in_stock: p.in_stock !== undefined ? Boolean(p.in_stock) : true,
    };
  });

  const collection: Collection = {
    slug,
    title,
    subtitle: categorySubtitle,
    priceRanges: [
      { label: "Under ₹300", min: 0, max: 299 },
      { label: "₹300 - ₹500", min: 300, max: 500 },
      { label: "Above ₹500", min: 501, max: 999999 },
    ],
    products: mappedProducts,
  };

  return <UppilieesProductListing collection={collection} />;
}
