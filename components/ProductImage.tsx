"use client";

import { useState } from "react";
import type { Product } from "@/data/products";
import { optimizeCloudinaryUrl } from "@/lib/format";

export default function ProductImage({
  product,
}: {
  product: Product & { images?: string[]; image?: string };
  autoChange?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  // Main image is the first image in product.images or product.image
  const rawMain =
    (Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : product.image) || "";

  // Optimize Cloudinary URL for listing thumbnails (f_auto, q_auto, w_500)
  const mainSrc = optimizeCloudinaryUrl(rawMain, 500);

  return (
    <div className="relative aspect-square bg-[#F4F8F1] flex items-center justify-center overflow-hidden">
      {!mainSrc || failed ? (
        <span className="px-4 text-center text-sm font-medium text-[#07552F] select-none">
          {product.name}
        </span>
      ) : (
        <img
          key={mainSrc}
          src={mainSrc}
          alt={product.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-105"
        />
      )}
    </div>
  );
}
