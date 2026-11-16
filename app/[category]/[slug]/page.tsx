import { redirect } from "next/navigation";
import { connection } from "next/server";
import { fetchProductByIdOrSlugFromDb } from "@/lib/products-db";
import { findProduct, findProductBySlug } from "@/data/products";

export const dynamic = "force-dynamic";

type Params = Promise<{ category: string; slug: string }>;

export default async function LegacyProductRedirectPage({ params }: { params: Params }) {
  await connection();
  const { category, slug } = await params;

  try {
    const dbProduct = await fetchProductByIdOrSlugFromDb(slug);
    if (dbProduct) {
      redirect(`/products/${dbProduct.slug}`);
    }
  } catch {
    // Fallback to static lookup if needed
  }

  const found = findProduct(category, slug) || findProductBySlug(slug);
  if (!found) {
    redirect("/shop");
  }
  redirect(`/products/${found.product.slug}`);
}
