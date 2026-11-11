"use client";

import { useState } from "react";
import type { Product } from "@/data/products";

/* Shows the product name on a soft green box if the image is missing */
export default function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  const src = (product as any).image || `/products/${product.slug}.jpg`;

  return (
    <div className="aspect-square bg-[#F4F8F1] flex items-center justify-center overflow-hidden">
      {failed ? (
        <span className="px-4 text-center text-sm font-medium text-[#07552F]">{product.name}</span>
      ) : (
        <img
          src={src}
          alt={product.name}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
      )}
    </div>
  );
}