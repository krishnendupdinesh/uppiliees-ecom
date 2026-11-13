import type { Product } from "@/data/products";

export const formatPrice = (n: number) => "₹" + n.toLocaleString("en-IN");

export const getDiscount = (p: Product) => Math.round(((p.mrp - p.price) / p.mrp) * 100);