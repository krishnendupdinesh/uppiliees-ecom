"use client";

import React from "react";
import { formatPrice } from "@/lib/format";

export interface PriceBlockProps {
  sellingPrice: number | undefined | null;
  mrp?: number | undefined | null;
  discountPercent?: number | undefined | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  showBadge?: boolean;
}

/**
 * Small reusable component to display:
 * - Selling price (big)
 * - MRP with strikethrough (small, grey)
 * - A label/badge like "20% OFF" (only when discount_percent > 0)
 */
export default function PriceBlock({
  sellingPrice,
  mrp,
  discountPercent,
  size = "md",
  className = "",
  showBadge = true,
}: PriceBlockProps) {
  const safeSelling = Number.isFinite(Number(sellingPrice)) ? Number(sellingPrice) : 0;
  const safeMrp = Number.isFinite(Number(mrp)) ? Number(mrp) : safeSelling;

  // Derive discount percent if not explicitly passed
  let discount = 0;
  if (discountPercent !== undefined && discountPercent !== null && Number.isFinite(Number(discountPercent))) {
    discount = Math.round(Number(discountPercent));
  } else if (safeMrp > safeSelling && safeMrp > 0) {
    discount = Math.round(((safeMrp - safeSelling) / safeMrp) * 100);
  }

  const hasDiscount = discount > 0 && safeMrp > safeSelling;

  // Responsive typography based on size variant
  const sellingTextClass =
    size === "lg"
      ? "text-3xl sm:text-4xl font-bold text-[#063D27]"
      : size === "sm"
      ? "text-sm sm:text-base font-bold text-[#063D27]"
      : "text-base sm:text-lg md:text-xl font-bold text-[#063D27]";

  const mrpTextClass =
    size === "lg"
      ? "text-base sm:text-lg text-gray-400 line-through font-normal"
      : "text-xs sm:text-sm text-gray-400 line-through font-normal";

  const badgeClass =
    size === "lg"
      ? "text-xs sm:text-sm font-bold text-[#063D27] bg-[#C7E900] px-2.5 py-0.5 rounded"
      : "text-[10px] sm:text-[11px] font-semibold text-[#063D27] bg-[#C7E900] px-1.5 py-0.5 rounded";

  return (
    <div className={`flex items-baseline flex-wrap gap-x-2 gap-y-1 ${className}`}>
      {/* Selling price (big) */}
      <span className={sellingTextClass}>{formatPrice(safeSelling)}</span>

      {/* MRP with strikethrough (small, grey) */}
      {hasDiscount && <span className={mrpTextClass}>{formatPrice(safeMrp)}</span>}

      {/* Discount badge (only when discount > 0) */}
      {showBadge && hasDiscount && (
        <span className={badgeClass}>{discount}% OFF</span>
      )}
    </div>
  );
}
