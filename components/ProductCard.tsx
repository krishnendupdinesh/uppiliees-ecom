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
import PriceBlock from "./PriceBlock";

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
  showBuyNow = true,
}: Props) {
  const router = useRouter();
  const sellingPrice = Number.isFinite(Number(product.selling_price))
    ? Number(product.selling_price)
    : Number.isFinite(Number(product.price))
    ? Number(product.price)
    : 0;
  const safeMrp = Number.isFinite(Number(product.mrp)) ? Number(product.mrp) : sellingPrice;
  const discount = product.discount_percent !== undefined && Number.isFinite(Number(product.discount_percent))
    ? Math.round(Number(product.discount_percent))
    : getDiscount({ ...product, selling_price: sellingPrice });

  const wishlistItem = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: sellingPrice,
    originalPrice: safeMrp > sellingPrice ? safeMrp : undefined,
    image: (product as any).image || "",
    alt: product.name,
    href,
  };

  const isOutOfStock =
    (product as any)?.in_stock === false ||
    ((product as any)?.stock !== undefined && Number((product as any)?.stock) <= 0);

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
        price: sellingPrice,
        originalPrice: safeMrp > sellingPrice ? safeMrp : undefined,
        image: (product as any).image || "",
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
      price: sellingPrice,
      originalPrice: safeMrp > sellingPrice ? safeMrp : undefined,
      image: (product as any).image || "",
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
              {discount}% OFF
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

          <div className="mt-auto pt-2">
            <PriceBlock
              sellingPrice={sellingPrice}
              mrp={safeMrp}
              discountPercent={discount}
              size="sm"
              showBadge={true}
            />
          </div>
        </div>
      </Link>

      {/* Wishlist button */}
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton item={wishlistItem} />
      </div>

      {/* Footer / Buttons Area */}
      {footer ? (
        <div className="p-2 sm:p-2.5 md:p-3 pt-0">{footer}</div>
      ) : showBuyNow ? (
        <div className="p-2 sm:p-2.5 md:p-3 pt-0 flex flex-row items-center gap-1.5 sm:gap-2">
          {/* Buy Now: Solid Primary (Left) */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 min-w-0 inline-flex h-8 sm:h-9 items-center justify-center bg-[#07552F] hover:bg-[#063D27] text-white rounded-md px-2.5 sm:px-3 lg:px-3 xl:px-3.5 text-[11px] sm:text-xs font-semibold whitespace-nowrap shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <span>{isOutOfStock ? "Sold Out" : "Buy Now"}</span>
          </button>

          {/* Add to Cart: Outline / Secondary (Right) */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex-1 min-w-0 inline-flex h-8 sm:h-9 items-center justify-center border border-[#07552F] bg-white text-[#07552F] hover:bg-[#F4F8F1] rounded-md px-2.5 sm:px-3 lg:px-3 xl:px-3.5 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition disabled:opacity-50 cursor-pointer"
          >
            Add to Cart
          </button>
        </div>
      ) : null}
    </div>
  );
}
