"use client";

import { useState } from "react";
import WishlistButton from "@/components/WishlistButton";
import type { Product } from "@/data/products";
import { optimizeCloudinaryUrl } from "@/lib/format";

type Props = {
  product: Product & { images?: string[]; image?: string };
  discount?: number;
  wishlistHref: string;
};

export default function ProductGallery({ product, discount = 0, wishlistHref }: Props) {
  const rawMain = (product as any).image || "";
  const rawList: string[] =
    Array.isArray((product as any).images) && (product as any).images.length > 0
      ? (product as any).images
      : rawMain
      ? [rawMain]
      : [];

  // Show ALL uploaded images in the product detail gallery
  const images = rawList.map((img) => optimizeCloudinaryUrl(img, 900)).filter(Boolean);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [failedImgs, setFailedImgs] = useState<Record<number, boolean>>({});

  const currentImage = images[selectedIdx] || "";
  const isFailed = !currentImage || Boolean(failedImgs[selectedIdx]);

  const wishlistItem = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.mrp > product.price ? product.mrp : undefined,
    image: currentImage,
    alt: product.name,
    href: wishlistHref,
  };

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4 items-start">
      {/* Side Thumbnails (shown when product has multiple images) */}
      {images.length > 1 && (
        <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 w-full sm:w-20 shrink-0">
          {rawList
            .filter((u) => Boolean(optimizeCloudinaryUrl(u, 200)))
            .map((rawUrl, idx) => {
              const thumbSrc = optimizeCloudinaryUrl(rawUrl, 200);
              const isSelected = idx === selectedIdx;
              const thumbFailed = failedImgs[idx];

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#07552F] ring-2 ring-[#07552F]/20 shadow-xs scale-102"
                      : "border-gray-200 hover:border-gray-400 opacity-75 hover:opacity-100"
                  }`}
                  title={`View image ${idx + 1}`}
                >
                  {thumbFailed || !thumbSrc ? (
                    <div className="flex h-full w-full items-center justify-center bg-[#F4F8F1] text-[11px] font-semibold text-[#07552F]">
                      #{idx + 1}
                    </div>
                  ) : (
                    <img
                      src={thumbSrc}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      onError={() => setFailedImgs((m) => ({ ...m, [idx]: true }))}
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
              );
            })}
        </div>
      )}

      {/* Main Big Image Preview */}
      <div className="relative w-full sm:flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-[#F4F8F1] aspect-square flex items-center justify-center shadow-xs">
        {isFailed ? (
          <div className="flex flex-col items-center justify-center p-6 text-center select-none">
            <span className="text-base sm:text-lg font-semibold text-[#07552F]">
              {product.name}
            </span>
          </div>
        ) : (
          <img
            key={currentImage}
            src={currentImage}
            alt={product.name}
            onError={() => setFailedImgs((m) => ({ ...m, [selectedIdx]: true }))}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-4 left-4 bg-[#C7E900] text-[#063D27] font-bold text-sm px-3 py-1.5 rounded-lg shadow-2xs">
            {discount}% OFF
          </span>
        )}

        {/* Wishlist Button */}
        <div className="absolute top-4 right-4 z-10">
          <WishlistButton item={wishlistItem} size={24} />
        </div>
      </div>
    </div>
  );
}
