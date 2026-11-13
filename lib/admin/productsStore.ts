import fs from "fs";
import path from "path";
import type { Product } from "./types";
import { collections } from "@/data/products";

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products_custom.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, "[]", "utf-8");
  }
}

export function getCustomProducts(): Product[] {
  try {
    ensureFile();
    const raw = fs.readFileSync(PRODUCTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomProduct(p: Partial<Product> & { name: string }): Product {
  ensureFile();
  const list = getCustomProducts();
  const id = p.id || `custom-${Date.now()}`;
  const existingIdx = list.findIndex((item) => item.id === id);

  const productData: Product = {
    id,
    name: p.name,
    category: p.category || "General",
    price: Number(p.price || 0),
    mrp: Number(p.mrp || p.price || 0),
    stock: Number(p.stock ?? 25),
    image: p.image || (p.images && p.images[0]) || "/products/kerala-handloom-sarees.jpg",
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
    description: p.description || "",
    featured: Boolean(p.featured),
    createdAt: p.createdAt || new Date().toISOString(),

    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    benefits: p.benefits || "",
    howToUse: p.howToUse || "",
    ingredients: p.ingredients || "",
    returnPolicy: p.returnPolicy || "",
  };

  if (existingIdx >= 0) {
    list[existingIdx] = productData;
  } else {
    list.unshift(productData);
  }

  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {}
  return productData;
}

export function deleteCustomProduct(id: string): boolean {
  try {
    ensureFile();
    const list = getCustomProducts();
    const filtered = list.filter((p) => p.id !== id);
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

