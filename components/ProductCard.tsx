"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { Product } from "@/data/products";
import { formatPrice, getDiscount } from "@/lib/format";
import { setBuyNowItem } from "@/lib/buyNow";
import { addToCart as addCartItem } from "@/lib/cart";
import ProductImage from "./ProductImage";
import WishlistButton from "./WishlistButton";

type Props = {
  product: Product;
  href: string; // where the card goes when clicked (the product page)
  footer?: ReactNode; // optional custom footer override
  showBuyNow?: boolean; // optional prop, default false
};

/* Used on listing pages, categories, best sellers, etc. */
export default function ProductCard({
  product,
  href,
  footer,
  showBuyNow = false,
}: Props) {
  const router = useRouter();
  const discount = getDiscount(product);

  const wishlistItem = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.mrp > product.price ? product.mrp : undefined,
    image: (product as any).image || `/products/${product.slug}.jpg`,
    alt: product.name,
    href,
  };

  const isOutOfStock = (product as any)?.stock === 0;

  // Handloom products require variant selection on product page
  const isHandloom =
    product.category === "Sarees" ||
    product.category === "Set Mundu" ||
    product.category === "Dhotis" ||
    (product.slug && product.slug.includes("handloom"));

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isHandloom) {
      router.push(href);
      return;
    }
    addCartItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.mrp > product.price ? product.mrp : undefined,
        image: (product as any).image || `/products/${product.slug}.jpg`,
        alt: product.name,
        href,
      },
      1
    );
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    if (isHandloom) {
      router.push(href);
      return;
    }

    setBuyNowItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.mrp > product.price ? product.mrp : undefined,
      image: (product as any).image || `/products/${product.slug}.jpg`,
      alt: product.name,
      href,
      qty: 1,
      slug: product.slug,
    });

    router.push("/checkout");
  };

  return (
    <div className="group relative flex flex-col border border-gray-200 rounded-md overflow-hidden bg-white hover:shadow-md transition">
      {/* Image + text are one link to the product page */}
      <Link href={href} className="flex flex-col flex-1">
        <div className="relative">
          <ProductImage product={product} />

          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-[#C7E900] text-[#063D27] text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded">
              {discount}% off
            </span>
          )}
        </div>

        <div className="p-2.5 sm:p-3.5 flex flex-col flex-1">
          <p className="text-[11px] sm:text-xs text-[#4D9A18] font-semibold truncate">
            {product.category}
          </p>
          <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 line-clamp-2 h-9 sm:h-10 mt-1 leading-snug">
            {product.name}
          </h3>

          <div className="flex items-center flex-wrap gap-x-1.5 sm:gap-x-2 mt-auto pt-2">
            <span className="text-sm sm:text-base md:text-lg font-bold text-[#063D27]">
              {formatPrice(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-[11px] sm:text-xs md:text-sm font-normal text-gray-400 line-through">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Wishlist button */}
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton item={wishlistItem} />
      </div>

      {/* Footer / Buttons Area */}
      {footer ? (
        <div className="p-2 sm:p-3 pt-0">{footer}</div>
      ) : showBuyNow ? (
        <div className="p-2 sm:p-3 pt-0 flex flex-col xs:flex-row gap-1.5 sm:gap-2">
          {/* Add to Cart: Outline / Secondary */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex-1 inline-flex items-center justify-center border border-[#07552F] text-[#07552F] hover:bg-[#F4F8F1] rounded py-1.5 px-2 text-[11px] sm:text-xs font-bold transition disabled:opacity-50"
          >
            Add to Cart
          </button>

          {/* Buy Now: Solid Primary */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 inline-flex items-center justify-center bg-[#07552F] hover:bg-[#063D27] text-white rounded py-1.5 px-2 text-[11px] sm:text-xs font-bold shadow-sm transition disabled:opacity-50"
          >
            <span className="truncate">{isOutOfStock ? "Sold Out" : "Buy Now"}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
