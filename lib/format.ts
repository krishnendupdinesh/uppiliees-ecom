import type { Product } from "@/data/products";

// Safe INR currency formatter: treats undefined, null, or NaN as 0
export function inr(val: unknown): string {
  if (val === undefined || val === null) return "₹0";
  const num = Number(val);
  const safe = Number.isFinite(num) ? num : 0;
  return "₹" + safe.toLocaleString("en-IN");
}

export const formatPrice = (n: unknown): string => inr(n);

// Returns discount percentage (from discount_percent or calculated from mrp & selling_price)
export const getDiscount = (p?: (Partial<Product> & { discount_percent?: number; selling_price?: number }) | null) => {
  if (p?.discount_percent !== undefined && p.discount_percent !== null) {
    const d = Number(p.discount_percent);
    if (Number.isFinite(d) && d > 0) return Math.round(d);
  }
  const selling = Number(p?.selling_price ?? p?.price ?? 0);
  const mrp = Number(p?.mrp ?? selling);
  if (!Number.isFinite(selling) || !Number.isFinite(mrp) || mrp <= 0 || mrp <= selling) {
    return 0;
  }
  return Math.round(((mrp - selling) / mrp) * 100);
};

// Optimize Cloudinary image URLs with f_auto, q_auto, and a sensible width for fast delivery
export function optimizeCloudinaryUrl(url?: string | null, width = 500): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Ignore legacy non-existent local product paths so the UI shows the clean placeholder
  if (trimmed.startsWith("/products/")) return "";

  if (trimmed.includes("res.cloudinary.com") && trimmed.includes("/image/upload/")) {
    if (trimmed.includes("/image/upload/f_auto")) {
      return trimmed;
    }
    return trimmed.replace(
      "/image/upload/",
      `/image/upload/f_auto,q_auto,w_${width},c_limit/`
    );
  }

  return trimmed;
}
