import { redirect } from "next/navigation";
import { findProduct, findProductBySlug } from "@/data/products";

export const instant = false;

type Params = Promise<{ category: string; slug: string }>;

export default async function LegacyProductRedirectPage({ params }: { params: Params }) {
  const { category, slug } = await params;
  const found = findProduct(category, slug) || findProductBySlug(slug);
  if (!found) {
    redirect("/products");
  }
  redirect(`/products/${found.product.slug}`);
}
