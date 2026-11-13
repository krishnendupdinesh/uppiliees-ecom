"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/data/products";

export default function ProductImage({
  product,
  autoChange = true,
}: {
  product: Product & { images?: string[]; image?: string };
  autoChange?: boolean;
}) {
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [activeIdx, setActiveIdx] = useState(0);

  // Gather up to 4 images
  const defaultMain = (product as any).image || `/products/${product.slug}.jpg`;
  const rawList: string[] = Array.isArray((product as any).images) && (product as any).images.length > 0
    ? (product as any).images
    : [defaultMain];

  // Filter empty and take up to 4
  const validImages = rawList.filter(Boolean).slice(0, 4);
  const images = validImages.length > 0 ? validImages : [defaultMain];

  // Auto-changing slideshow for Product Card when there are multiple photos
  useEffect(() => {
    if (!autoChange || images.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % images.length);
    }, 2800); // changes smoothly every 2.8 seconds

    return () => clearInterval(timer);
  }, [autoChange, images.length]);

  const currentSrc = images[activeIdx] || defaultMain;
  const isFailed = failed[activeIdx];

  return (
    <div className="relative aspect-square bg-[#F4F8F1] flex items-center justify-center overflow-hidden">
      {isFailed ? (
        <span className="px-4 text-center text-sm font-medium text-[#07552F]">
          {product.name}
        </span>
      ) : (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={`${product.name} image ${activeIdx + 1}`}
          onError={() => setFailed((f) => ({ ...f, [activeIdx]: true }))}
          className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-105"
        />
      )}

      {/* Subtle indicator dots on product card if multiple photos */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-xs">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIdx ? "w-3 bg-white" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
