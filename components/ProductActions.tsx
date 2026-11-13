"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/data/products";
import { addToCart, getCart, updateCartItemQty, CART_EVENT } from "@/lib/cart";
import { setBuyNowItem } from "@/lib/buyNow";
import { formatPrice } from "@/lib/format";
import CartControl from "./CartControl";

export type ProductSizeVariant = {
  size: string;
  price: number;
  mrp?: number;
  stock?: number;
};

export default function ProductActions({
  product,
  href,
  showBuyNow = true,
  customSizes = [],
  onSizeChange,
}: {
  product?: Product;
  href?: string;
  showBuyNow?: boolean;
  customSizes?: ProductSizeVariant[];
  onSizeChange?: (sizeVariant: ProductSizeVariant) => void;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(0);
  const [selectedQty, setSelectedQty] = useState(1);

  // Variant support for Handloom products
  const isHandloom =
    product?.category === "Sarees" ||
    product?.category === "Set Mundu" ||
    product?.category === "Dhotis" ||
    (product?.slug && product.slug.includes("handloom"));

  const colors = isHandloom ? ["Kasavu Gold", "Silver Zari", "Traditional Off-White"] : [];
  
  // Custom sizes configured by admin or handloom fallback sizes
  const hasCustomSizes = customSizes && customSizes.length > 0;
  const sizes = hasCustomSizes
    ? customSizes.map((s) => s.size)
    : product?.category === "Dhotis"
    ? ["Double (4.0m)", "Single (2.0m)"]
    : product?.category === "Set Mundu"
    ? ["Standard (2.0m x 2.8m)", "Double Kasavu"]
    : product?.category === "Sarees"
    ? ["Standard with Blouse (6.25m)"]
    : [];

  const [selectedColor, setSelectedColor] = useState<string>(colors[0] || "");
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || "");
  const [variantError, setVariantError] = useState("");

  const currentSizeObj = hasCustomSizes ? customSizes[selectedSizeIndex] : undefined;
  const currentPrice = currentSizeObj ? currentSizeObj.price : product?.price || 0;
  const currentMrp = currentSizeObj ? (currentSizeObj.mrp || currentSizeObj.price) : product?.mrp || currentPrice;
  const isOutOfStock = currentSizeObj?.stock !== undefined ? currentSizeObj.stock === 0 : (product as any)?.stock === 0;

  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
    if (hasCustomSizes && customSizes[0]) {
      onSizeChange?.(customSizes[0]);
    }
  }, [sizes.length]);

  const selectSizeVariant = (s: string, index: number) => {
    setSelectedSize(s);
    setSelectedSizeIndex(index);
    setVariantError("");
    if (hasCustomSizes && customSizes[index]) {
      onSizeChange?.(customSizes[index]);
    }
  };

  useEffect(() => {
    if (!product) return;
    const sync = () => {
      const items = getCart();
      const match = items.find((i) => String(i.id) === String(product.id));
      setQuantity(match ? match.qty : 0);
    };

    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [product]);

  const handleAdd = () => {
    if (!product) {
      setQuantity((q) => q + 1);
      return;
    }
    if (isHandloom && (!selectedColor || !selectedSize)) {
      setVariantError("Please select color and size options first.");
      return;
    }
    setVariantError("");
    addToCart(
      {
        id: hasCustomSizes ? `${product.id}-${selectedSize}` : product.id,
        name: selectedSize ? `${product.name} (${selectedSize})` : product.name,
        price: currentPrice,
        originalPrice: currentMrp > currentPrice ? currentMrp : undefined,
        image: (product as any).image || `/products/${product.slug}.jpg`,
        alt: product.name,
        href: href || `/products/${product.slug}`,
      },
      selectedQty || 1
    );
  };

  const handleRemove = () => {
    if (!product) {
      setQuantity((q) => Math.max(0, q - 1));
      return;
    }
    const cartItemId = hasCustomSizes ? `${product.id}-${selectedSize}` : product.id;
    updateCartItemQty(cartItemId, quantity - 1);
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;
    if (isHandloom && (!selectedColor || !selectedSize)) {
      setVariantError("Please select color and size options first.");
      return;
    }
    setVariantError("");

    setBuyNowItem({
      id: hasCustomSizes ? `${product.id}-${selectedSize}` : product.id,
      name: selectedSize ? `${product.name} (${selectedSize})` : product.name,
      price: currentPrice,
      originalPrice: currentMrp > currentPrice ? currentMrp : undefined,
      image: (product as any).image || `/products/${product.slug}.jpg`,
      alt: product.name,
      href: href || `/products/${product.slug}`,
      qty: selectedQty >= 1 ? selectedQty : 1,
      slug: product.slug,
      selectedColor: selectedColor || undefined,
      selectedSize: selectedSize || undefined,
    });

    router.push("/checkout");
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Dynamic Size & Price Selection Picker */}
      {hasCustomSizes ? (
        <div className="space-y-3 p-4 bg-[#F4F8F1] rounded-xl border border-[#E6EFE3]">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#063D27] uppercase tracking-wider">
              Select Size / Option:
            </label>
            <span className="text-xs font-semibold text-[#07552F]">
              Active: {selectedSize} (₹{currentPrice})
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {customSizes.map((variant, idx) => {
              const isSelected = idx === selectedSizeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSizeVariant(variant.size, idx)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#07552F] text-white border-[#07552F] shadow-sm scale-102"
                      : "bg-white text-[#183629] border-gray-300 hover:border-[#07552F] hover:bg-[#F9FCF7]"
                  }`}
                >
                  <span className="font-bold text-sm">{variant.size}</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={isSelected ? "text-[#C7E900] font-bold" : "text-[#07552F] font-bold"}>
                      {formatPrice(variant.price)}
                    </span>
                    {variant.mrp && variant.mrp > variant.price && (
                      <span className={`line-through text-[11px] ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                        {formatPrice(variant.mrp)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : isHandloom ? (
        /* Handloom Variant Pickers */
        <div className="space-y-3 p-3.5 bg-[#F4F8F1] rounded-lg border border-[#E6EFE3]">
          {colors.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#063D27] uppercase tracking-wider mb-1.5">
                Select Color / Zari:
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelectedColor(c);
                      setVariantError("");
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      selectedColor === c
                        ? "bg-[#07552F] text-white shadow-sm"
                        : "bg-white text-[#183629] border border-gray-300 hover:border-[#07552F]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#063D27] uppercase tracking-wider mb-1.5">
                Select Length / Size:
              </label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s, idx) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => selectSizeVariant(s, idx)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      selectedSize === s
                        ? "bg-[#07552F] text-white shadow-sm"
                        : "bg-white text-[#183629] border border-gray-300 hover:border-[#07552F]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {variantError && (
            <p className="text-xs font-semibold text-[#B3261E]">{variantError}</p>
          )}
        </div>
      ) : null}

      {/* Quantity Selector on Product Page */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-[#183629]">Quantity:</span>
        <div className="flex items-center border border-[#07552F] rounded-md overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
            className="px-3 py-1.5 text-sm font-bold text-[#07552F] hover:bg-[#F4F8F1] transition cursor-pointer"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="px-3 py-1.5 text-sm font-bold text-[#07552F] min-w-[2.5rem] text-center">
            {selectedQty}
          </span>
          <button
            type="button"
            onClick={() => setSelectedQty((q) => Math.min(10, q + 1))}
            className="px-3 py-1.5 text-sm font-bold text-[#07552F] hover:bg-[#F4F8F1] transition cursor-pointer"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Desktop / In-page Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {/* Add to Cart - Outline/Secondary */}
        <div className="w-full sm:flex-1">
          {quantity > 0 ? (
            <CartControl
              quantity={quantity}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-md border-2 border-[#07552F] bg-white px-4 text-sm font-bold text-[#07552F] hover:bg-[#F4F8F1] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Add to Cart
            </button>
          )}
        </div>

        {/* Buy Now - Solid Primary */}
        {showBuyNow && (
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="w-full sm:flex-1 inline-flex h-12 items-center justify-center rounded-md bg-[#07552F] px-4 text-sm font-bold text-white shadow-md hover:bg-[#063D27] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isOutOfStock ? "Out of Stock" : "Buy Now"}
          </button>
        )}
      </div>

      {/* Sticky Mobile Bar for Mobile Viewports */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6EFE3] px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex sm:hidden items-center gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={handleAdd}
          disabled={isOutOfStock}
          className="flex-1 inline-flex h-11 items-center justify-center rounded-md border-2 border-[#07552F] bg-white px-2 text-xs font-bold text-[#07552F] active:bg-[#F4F8F1] disabled:opacity-50 cursor-pointer"
        >
          {quantity > 0 ? `In Bag (${quantity}) +` : "Add to Cart"}
        </button>

        {showBuyNow && (
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 inline-flex h-11 items-center justify-center rounded-md bg-[#07552F] px-2 text-xs font-bold text-white shadow-md active:bg-[#063D27] disabled:opacity-50 cursor-pointer"
          >
            {isOutOfStock ? "Out of Stock" : "Buy Now"}
          </button>
        )}
      </div>
    </div>
  );
}
