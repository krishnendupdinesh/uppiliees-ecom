import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import ProductActions from "@/components/ProductActions";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import { collections, findProduct, productHref } from "@/data/products";
import { formatPrice, getDiscount } from "@/lib/format";

type Params = Promise<{ category: string; slug: string }>;

// Builds one page for every product at build time: /herbal-beauty/ashwagandha-powder, ...
export function generateStaticParams() {
  return collections.flatMap((collection) =>
    collection.products.map((product) => ({ category: collection.slug, slug: product.slug }))
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, slug } = await params;
  const found = findProduct(category, slug);
  return { title: found ? found.product.name : "Product not found" };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { category, slug } = await params;
  const found = findProduct(category, slug);
  if (!found) notFound();

  const { collection, product } = found;
  const discount = getDiscount(product);

  // Other products: same sub-category first, then the rest of the collection
  const others = collection.products.filter((p) => p.id !== product.id);
  const related = [
    ...others.filter((p) => p.category === product.category),
    ...others.filter((p) => p.category !== product.category),
  ].slice(0, 8);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href={`/${collection.slug}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#07552F] mb-6"
        >
          <ChevronLeft size={16} />
          Back to {collection.title}
        </Link>

        {/* Product details */}
        <section className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div className="group relative border border-gray-200 rounded-md overflow-hidden">
            <ProductImage product={product} />
            {discount > 0 && (
              <span className="absolute top-3 left-3 bg-[#C7E900] text-[#063D27] text-xs font-semibold px-2.5 py-1 rounded">
                {discount}% off
              </span>
            )}
          </div>

          <div>
            <p className="text-sm text-[#4D9A18] font-medium">{product.category}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#063D27] mt-1">{product.name}</h1>

            <div className="flex items-baseline flex-wrap gap-x-3 mt-4">
              <span className="text-3xl font-semibold text-[#063D27]">{formatPrice(product.price)}</span>
              <span className="text-gray-400 line-through">{formatPrice(product.mrp)}</span>
            </div>
            {discount > 0 && (
              <p className="text-sm text-[#4D9A18] mt-1">You save {formatPrice(product.mrp - product.price)}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>

            {product.description && <p className="text-gray-600 mt-6 leading-relaxed">{product.description}</p>}

            <div className="mt-6">
              <ProductActions />
            </div>

            <dl className="mt-8 border-t border-gray-200 text-sm">
              <div className="flex justify-between py-3 border-b border-gray-200">
                <dt className="text-gray-500">Collection</dt>
                <dd className="font-medium">{collection.title}</dd>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200">
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium">{product.category}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Other products */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold text-[#063D27] mb-4">You may also like</h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} href={productHref(collection, item)} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}