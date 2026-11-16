import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import ProductActions from "@/components/ProductActions";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import ProductTabs, { type ProductTab } from "@/components/ProductTabs";
import ProductReviews from "@/components/ProductReviews";

import {
  collections,
  productHref,
  type Collection,
  type Product,
} from "@/data/products";

import { formatPrice, getDiscount } from "@/lib/format";
import {
  fetchProductByIdOrSlugFromDb,
  fetchProductsFromDb,
  safeNumber,
} from "@/lib/products-db";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

type ProductGroup = "wellness" | "food" | "handloom";

const groupNames: Record<ProductGroup, string> = {
  wellness: "Herbal, Beauty & Wellness",
  food: "Traditional Kerala Food",
  handloom: "Traditional Handloom",
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  await connection();
  const { slug } = await params;

  try {
    const dbProduct = await fetchProductByIdOrSlugFromDb(slug);
    if (dbProduct) {
      return {
        title: dbProduct.name,
        description: dbProduct.description || `Explore ${dbProduct.name} at UPPILIEES.`,
      };
    }
  } catch (err) {
    console.error("Metadata DB lookup error:", err);
  }

  return { title: "Product Not Found" };
}

export default async function ProductPage({ params }: { params: Params }) {
  await connection();
  const { slug } = await params;

  let apiProduct: any = null;
  try {
    apiProduct = await fetchProductByIdOrSlugFromDb(slug);
  } catch (err) {
    console.error("Product page DB fetch error:", err);
  }

  if (!apiProduct) {
    notFound();
  }

  const catSlug = apiProduct.category_slug || "herbal-beauty";
  const safePrice = safeNumber(apiProduct.price, 0);
  const safeMrp = safeNumber(apiProduct.mrp, safePrice);

  const product: Product = {
    id: apiProduct.id,
    name: apiProduct.name,
    slug: apiProduct.slug,
    category: apiProduct.subcategory || apiProduct.category_name || "General",
    price: safePrice,
    mrp: safeMrp,
    description: apiProduct.description || undefined,
    collectionSlug: catSlug,
    image: apiProduct.image_url || apiProduct.image || "",
    images: Array.isArray(apiProduct.images) ? apiProduct.images : [],
    stock: apiProduct.stock,
    in_stock: apiProduct.in_stock,
  };

  const collection: Collection =
    collections.find((c) => c.slug === catSlug) || {
      slug: catSlug,
      title: apiProduct.category_name || "Products",
      subtitle: "",
      products: [product],
      priceRanges: [],
    };

  const discount = getDiscount(product);

  const group: ProductGroup = collection.slug.includes("handloom")
    ? "handloom"
    : collection.slug.includes("food")
    ? "food"
    : "wellness";

  // Load related products from the database in the same category (sorted by display_order)
  let others: Product[] = [];
  try {
    const relatedRows = await fetchProductsFromDb({ category: collection.slug });
    others = relatedRows
      .filter((item) => String(item.id) !== String(product.id) && item.slug !== product.slug)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.subcategory || p.category_name || "General",
        price: safeNumber(p.price, 0),
        mrp: safeNumber(p.mrp, safeNumber(p.price, 0)),
        description: p.description || undefined,
        collectionSlug: p.category_slug || collection.slug,
        image: p.image_url || p.image || "",
        images: Array.isArray(p.images) ? p.images : [],
        stock: p.stock,
        in_stock: p.in_stock,
      }));
  } catch (err) {
    console.error("Related products DB fetch error:", err);
  }

  const related = others.slice(0, 8);

  const splitLines = (text?: string | null) =>
    text?.trim()
      ? text
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

  const benefitsList = splitLines(apiProduct.benefits) || [
    "Authentic and pure traditional quality from UPPILIEES.",
    "Carefully crafted following traditional Kerala methods.",
    "No harmful chemicals or artificial preservatives.",
  ];

  const howToUseList = splitLines(apiProduct.howToUse || apiProduct.how_to_use) || [
    "Please refer to the product packaging for directions of use.",
  ];

  const ingredientsList = splitLines(apiProduct.ingredients) || [
    group === "handloom"
      ? "Please refer to the fabric and product care instructions."
      : "Please refer to the product packaging for verified ingredients and composition.",
  ];

  const returnPolicyList = splitLines(apiProduct.returnPolicy || apiProduct.return_policy) || [
    "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
  ];

  const tabs: ProductTab[] = [
    {
      id: "benefits",
      label: "Benefits",
      paragraphs: benefitsList,
    },
    {
      id: "how",
      label: "How to Use",
      paragraphs: howToUseList,
    },
    group === "handloom"
      ? {
          id: "care",
          label: "Care",
          paragraphs: ingredientsList,
        }
      : {
          id: "ingredients",
          label: "Ingredients",
          paragraphs: ingredientsList,
        },
    {
      id: "returns",
      label: "Return Policy",
      paragraphs: returnPolicyList,
    },
  ];

  const customSizes = Array.isArray(apiProduct.sizes) ? apiProduct.sizes : [];

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#07552F]">
            Home
          </Link>
          <span>/</span>
          <Link href={`/${collection.slug}`} className="hover:text-[#07552F]">
            {groupNames[group]}
          </Link>
          <span>/</span>
          <span className="text-[#063D27] font-medium">{product.name}</span>
        </nav>

        {/* Main Product */}
        <section className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Gallery with Small Side Images & Big Preview */}
          <div className="relative h-fit">
            <ProductGallery
              product={product}
              discount={discount}
              wishlistHref={productHref(collection, product)}
            />
          </div>

          {/* Product Information */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#4D9A18]">
              {groupNames[group]}
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#063D27] mt-3 leading-tight">
              {product.name}
            </h1>

            {product.description && (
              <p className="text-gray-600 leading-relaxed mt-5">
                {product.description}
              </p>
            )}

            {/* Price */}
            <div className="flex items-center flex-wrap gap-3 mt-6">
              <span className="text-3xl sm:text-4xl font-bold text-[#063D27]">
                {formatPrice(product.price)}
              </span>

              {product.mrp > product.price && (
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.mrp)}
                </span>
              )}

              {discount > 0 && (
                <span className="text-sm font-bold text-green-800 bg-green-100 px-3 py-1 rounded-full">
                  {discount}% OFF
                </span>
              )}
            </div>

            {discount > 0 && (
              <p className="text-sm font-semibold text-[#4D9A18] mt-2">
                You save {formatPrice(product.mrp - product.price)}
              </p>
            )}

            <p className="text-sm text-gray-500 mt-2">
              Inclusive of applicable taxes
            </p>

            {/* Actions */}
            <div className="mt-6">
              <ProductActions
                product={product}
                href={productHref(collection, product)}
                showBuyNow={true}
                customSizes={customSizes}
              />
            </div>

            {/* Key Benefits Bullet Section */}
            {benefitsList.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-[#F4F8F1] border border-[#E6EFE3]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#063D27] mb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4D9A18]" />
                  Key Benefits
                </h3>
                <ul className="space-y-2">
                  {benefitsList.map((benefit: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#183629]">
                      <svg
                        className="w-4 h-4 text-[#4D9A18] shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tabs */}
            <ProductTabs tabs={tabs} />
          </div>
        </section>

        {/* Customer Reviews */}
        <ProductReviews productId={product.id} slug={product.slug} />

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#063D27] mb-6">
              You May Also Like
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  href={productHref(collection, item)}
                  showBuyNow={true}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
