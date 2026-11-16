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
