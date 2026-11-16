import type { Product } from "@/data/products";

export const formatPrice = (n: number | undefined | null) => {
  const safe = Number(n ?? 0);
  const valid = Number.isFinite(safe) ? safe : 0;
  return "₹" + valid.toLocaleString("en-IN");
};

export const getDiscount = (p?: Partial<Product> | null) => {
  const price = Number(p?.price ?? 0);
  const mrp = Number(p?.mrp ?? price);
  if (!Number.isFinite(price) || !Number.isFinite(mrp) || mrp <= 0 || mrp <= price) {
    return 0;
  }
  return Math.round(((mrp - price) / mrp) * 100);
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
