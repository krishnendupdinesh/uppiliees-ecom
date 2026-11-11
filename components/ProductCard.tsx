import Link from "next/link";
import type { ReactNode } from "react";
import type { Product } from "@/data/products";
import { formatPrice, getDiscount } from "@/lib/format";
import ProductImage from "./ProductImage";
import WishlistButton from "./WishlistButton";

type Props = {
  product: Product;
  href: string; // where the card goes when clicked (the product page)
  footer?: ReactNode; // optional area under the card, e.g. the cart button
};

/* Used on the listing pages and in "You may also like" */
export default function ProductCard({ product, href, footer }: Props) {
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

  return (
    <div className="group relative flex flex-col border border-gray-200 rounded-md overflow-hidden bg-white hover:shadow-lg transition">
      {/* Image + text are one big link to the product page */}
      <Link href={href} className="flex flex-col flex-1">
        <div className="relative">
          <ProductImage product={product} />

          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-[#C7E900] text-[#063D27] text-[11px] font-semibold px-2 py-0.5 rounded">
              {discount}% off
            </span>
          )}
        </div>

        <div className="p-3.5">
          <p className="text-xs sm:text-sm text-[#4D9A18] font-semibold">{product.category}</p>
          <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 min-h-[2.75rem] mt-1 leading-snug">{product.name}</h3>

          <div className="flex items-center flex-wrap gap-x-2 mt-2.5">
            <span className="text-base sm:text-lg font-bold text-[#063D27]">{formatPrice(product.price)}</span>
            <span className="text-xs sm:text-sm font-normal text-gray-400 line-through">{formatPrice(product.mrp)}</span>
          </div>
        </div>
      </Link>

      {/* Wishlist button */}
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton item={wishlistItem} />
      </div>

      {/* Outside the link, so clicking the button doesn't open the page */}
      {footer && <div className="px-3 pb-3">{footer}</div>}
    </div>
  );
}
