"use client";

import { useState } from "react";
import Image from "next/image";
import WishlistButton from "@/components/WishlistButton";
import type { Product } from "@/data/products";

type Props = {
  product: Product & { images?: string[]; image?: string };
  discount?: number;
  wishlistHref: string;
};

export default function ProductGallery({ product, discount = 0, wishlistHref }: Props) {
  const defaultMain = (product as any).image || `/products/${product.slug}.jpg`;
  
  // Extract up to 4 images
  const rawList: string[] = Array.isArray((product as any).images) && (product as any).images.length > 0
    ? (product as any).images
    : [defaultMain];

  const validImages = rawList.filter(Boolean).slice(0, 4);
  const images = validImages.length > 0 ? validImages : [defaultMain];

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [failedImgs, setFailedImgs] = useState<Record<number, boolean>>({});

  const currentImage = images[selectedIdx] || defaultMain;
  const isFailed = failedImgs[selectedIdx];

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
      {/* Side Thumbnails (small on side on tablet/desktop, horizontal below on small screens) */}
      {images.length > 1 && (
        <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 w-full sm:w-20 shrink-0">
          {images.map((img, idx) => {
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
                {thumbFailed ? (
                  <div className="flex h-full w-full items-center justify-center bg-[#F4F8F1] text-[11px] font-semibold text-[#07552F]">
                    #{idx + 1}
                  </div>
                ) : (
                  <img
                    src={img}
                    alt={`${product.name} thumb ${idx + 1}`}
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
      <div className="relative flex-1 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 aspect-square flex items-center justify-center shadow-xs">
        {isFailed ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <span className="text-base font-semibold text-[#07552F]">{product.name}</span>
            <span className="text-xs text-gray-400 mt-1">Image #{selectedIdx + 1}</span>
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

