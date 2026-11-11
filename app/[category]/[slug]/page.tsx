import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ProductActions from "@/components/ProductActions";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import ProductTabs, { type ProductTab } from "@/components/ProductTabs";
import WishlistButton from "@/components/WishlistButton";

import {
  collections,
  findProduct,
  productHref,
  type Collection,
  type Product,
} from "@/data/products";

import { formatPrice, getDiscount } from "@/lib/format";
import { api } from "@/lib/api";

type Params = Promise<{ category: string; slug: string }>;

type ProductGroup = "wellness" | "food" | "handloom";

type ProductInfo = {
  overview?: string;
  ingredients?: string[];
  highlights?: string[];
  benefits?: string[];
  usage?: string[];
  careInstructions?: string[];
};

// SEO headings and product categories from the UPPILIEES catalogue.
const seoProducts: Record<string, { heading: string; group: ProductGroup }> = {
  "changalam-paranda-pain-relief-oil": {
    heading: "Changalam Paranda Herbal Pain Relief Oil",
    group: "wellness",
  },
  "babyglow-baby-massage-oil": {
    heading: "BabyGlow Natural Baby Massage Oil",
    group: "wellness",
  },
  "pulari-herbal-hair-growth-oil": {
    heading: "PULARI Herbal Hair Growth Oil",
    group: "wellness",
  },
  "glow-plus-fairness-powder": {
    heading: "Glow Plus Herbal Fairness Powder",
    group: "wellness",
  },
  "glow-plus-skin-brightening-cream": {
    heading: "Glow Plus Skin Brightening Moisturizing Cream",
    group: "wellness",
  },
  "sankhu-puspam-face-wash": {
    heading: "Sankhu Puspam Herbal Face Wash",
    group: "wellness",
  },
  "glow-plus-lip-care-cream": {
    heading: "Glow Plus Lip Care Cream",
    group: "wellness",
  },
  "baby-glow-urukku-velichenna": {
    heading: "Homemade Baby Glow Virgin Coconut Oil",
    group: "wellness",
  },
  "painoplus-pain-relief-balm": {
    heading: "PainoPlus Changalam Paranda Pain Relief Balm",
    group: "wellness",
  },
  "stretch-ease-stretch-mark-cream": {
    heading: "Stretch Ease Stretch Mark Care Cream",
    group: "wellness",
  },
  "ojas-boost-herbal-powder": {
    heading: "Ojas Boost Herbal Wellness Powder",
    group: "wellness",
  },
  "ashwagandha-powder": {
    heading: "Natural Ashwagandha Herbal Powder",
    group: "wellness",
  },
  "naikuruna-powder": {
    heading: "Natural Naikuruna Herbal Powder",
    group: "wellness",
  },
  "kalonji-black-seed-oil": {
    heading: "Pure Kalonji Black Seed Oil for Hair Care",
    group: "wellness",
  },
  "mozi-out-herbal-mosquito-repellent": {
    heading: "MOZI OUT Herbal Mosquito Repellent",
    group: "wellness",
  },

  "kannan-kaya-powder": {
    heading: "Traditional Kerala Kannan Kaya Powder",
    group: "food",
  },
  "kannan-kaya-dried-chips": {
    heading: "Traditional Kannan Kaya Dried Banana Chips",
    group: "food",
  },
  "homemade-banana-powder": {
    heading: "Homemade Natural Banana Powder",
    group: "food",
  },
  "banana-dried-chips": {
    heading: "Traditional Kerala Dried Banana Chips",
    group: "food",
  },
  "ragi-powder": {
    heading: "Natural Ragi Finger Millet Powder",
    group: "food",
  },
  "homemade-sambar-powder": {
    heading: "Homemade Kerala Style Sambar Powder",
    group: "food",
  },
  "banana-figs": {
    heading: "Traditional Kerala Banana Figs",
    group: "food",
  },
  "homemade-prawns-pickle": {
    heading: "Homemade Kerala Style Prawns Pickle",
    group: "food",
  },
  "homemade-pure-cow-ghee": {
    heading: "Homemade Pure Cow Ghee",
    group: "food",
  },
  "homemade-pork-lard": {
    heading: "Homemade Pure Pork Lard",
    group: "food",
  },

  "kerala-handloom-sarees": {
    heading: "Traditional Kerala Handloom Sarees",
    group: "handloom",
  },
  "kerala-handloom-set-mundu": {
    heading: "Traditional Kerala Handloom Set Mundu",
    group: "handloom",
  },
  "kerala-handloom-dhotis": {
    heading: "Traditional Kerala Handloom Dhotis",
    group: "handloom",
  },
};

// Add verified product-specific information here. It feeds the tabs.
const productInformation: Record<string, ProductInfo> = {
  // "ashwagandha-powder": {
  //   overview: "Verified product description.",
  //   ingredients: ["Verified ingredient"],
  //   highlights: ["Verified highlight"],
  //   benefits: ["Verified benefit"],
  //   usage: ["Manufacturer usage instructions"],
  // },
};

const groupNames: Record<ProductGroup, string> = {
  wellness: "Herbal, Beauty & Wellness",
  food: "Traditional Kerala Food",
  handloom: "Traditional Handloom",
};

export function generateStaticParams() {
  return collections.flatMap((collection) =>
    collection.products.map((product) => ({
      category: collection.slug,
      slug: product.slug,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { category, slug } = await params;
  let name = "";
  let description = "";

  try {
    const apiProduct = await api<any>(`/products/${slug}`);
    if (apiProduct) {
      name = apiProduct.name;
      description = apiProduct.description || "";
    }
  } catch {
    const found = findProduct(category, slug);
    if (found) {
      name = found.product.name;
      description = found.product.description || "";
    }
  }

  if (!name) {
    return { title: "Product Not Found" };
  }

  const seo = seoProducts[slug];

  return {
    title: seo?.heading ?? name,
    description: description || `Explore ${name} at UPPILIEES.`,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { category, slug } = await params;

  let product: Product | null = null;
  let collection: Collection | null = null;

  try {
    const apiProduct = await api<any>(`/products/${slug}`);
    if (apiProduct) {
      const catSlug = apiProduct.category_slug || category;
      product = {
        id: apiProduct.id,
        name: apiProduct.name,
        slug: apiProduct.slug,
        category: apiProduct.category_name || apiProduct.category || "General",
        price: Number(apiProduct.price),
        mrp: Number(apiProduct.mrp),
        description: apiProduct.description || undefined,
        collectionSlug: catSlug,
      };
      (product as any).image = apiProduct.image;
      collection =
        collections.find((c) => c.slug === category || c.slug === catSlug) || {
          slug: catSlug,
          title: apiProduct.category_name || "Products",
          subtitle: "",
          products: [product],
          priceRanges: [],
        };
    }
  } catch {
    // fall back to static data
  }

  if (!product || !collection) {
    const found = findProduct(category, slug);
    if (!found) notFound();
    collection = found.collection;
    product = found.product;
  }

  const discount = getDiscount(product);
  const seo = seoProducts[slug];

  const group: ProductGroup =
    seo?.group ??
    (collection.slug.includes("handloom")
      ? "handloom"
      : collection.slug.includes("food")
        ? "food"
        : "wellness");

  const info = productInformation[slug] ?? {};

  // Related products
  let others: Product[] = [];
  try {
    const relatedRes = await api<{ products: any[] }>(
      `/products?category=${encodeURIComponent(collection.slug)}&limit=10`
    );
    if (relatedRes?.products) {
      others = relatedRes.products
        .filter((item) => String(item.id) !== String(product!.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category_name || p.category || "General",
          price: Number(p.price),
          mrp: Number(p.mrp),
          description: p.description || undefined,
          collectionSlug: p.category_slug || collection!.slug,
          image: p.image,
        }));
    }
  } catch {
    others = collection.products.filter((item) => item.id !== product!.id);
  }

  const related = others.slice(0, 8);

  // Tabs under the Add to Cart button
  const tabs: ProductTab[] = [
    {
      id: "how",
      label: group === "handloom" ? "How to Wear" : "How to use",
      paragraphs: info.usage?.length
        ? info.usage
        : ["Please refer to the product packaging for usage instructions."],
    },
    {
      id: "benefit",
      label: "Benefits",
      paragraphs: info.benefits?.length
        ? info.benefits
        : info.highlights?.length
          ? info.highlights
          : [
              info.overview ||
                product.description ||
                `Discover ${product.name} from the UPPILIEES ${groupNames[group]} collection.`,
            ],
    },
    group === "handloom"
      ? {
          id: "care",
          label: "Care",
          paragraphs: info.careInstructions?.length
            ? info.careInstructions
            : ["Please refer to the fabric and product care instructions."],
        }
      : {
          id: "ingredients",
          label: "Ingredients",
          paragraphs: info.ingredients?.length
            ? [info.ingredients.join(", ")]
            : [
                "Please refer to the product packaging for verified ingredients and composition.",
              ],
        },
    {
      id: "returns",
      label: "Return Policy",
      // Replace with your real policy text
      paragraphs: ["Add your store's return and exchange policy here."],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
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
          {/* Image */}
          <div className="relative h-fit">
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <ProductImage product={product} />

              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-[#C7E900] text-[#063D27] font-bold text-sm px-3 py-2 rounded">
                  {discount}% OFF
                </span>
              )}

              <div className="absolute top-4 right-4 z-10">
                <WishlistButton
                  item={{
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    originalPrice:
                      product.mrp > product.price ? product.mrp : undefined,
                    image:
                      (product as any).image || `/products/${product.slug}.jpg`,
                    alt: product.name,
                    href: productHref(collection, product),
                  }}
                  size={24}
                />
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#4D9A18]">
              {groupNames[group]}
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#063D27] mt-3 leading-tight">
              {seo?.heading ?? product.name}
            </h1>

            {(info.overview || product.description) && (
              <p className="text-gray-600 leading-relaxed mt-5">
                {info.overview || product.description}
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
            <div className="mt-8">
              <ProductActions
                product={product}
                href={productHref(collection, product)}
              />
            </div>

            {/* Tabs */}
            <ProductTabs tabs={tabs} />
          </div>
        </section>

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
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}