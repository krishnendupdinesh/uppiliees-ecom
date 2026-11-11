import { api } from "@/lib/api";
import type { Order, OrderStatus, Product } from "./types";

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await api<Category[]>("/categories");
  } catch {
    return [];
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await api<{ products: any[] }>("/products?limit=1000");
    return (res.products || []).map((p) => ({
      id: String(p.id),
      name: p.name,
      category: p.category_slug || p.category_name || "products",
      price: Number(p.price),
      mrp: Number(p.mrp),
      stock: Number(p.stock),
      image: p.image || "",
      description: p.description || "",
      featured: Boolean(p.featured),
      createdAt: p.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error("Failed to fetch products from backend:", err);
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.id === id) || null;
}

export async function getOrders(): Promise<Order[]> {
  try {
    const res = await api<any[]>("/orders");
    return (res || []).map((o) => ({
      id: String(o.id),
      customerName: o.customer_name,
      email: o.email,
      phone: o.phone,
      address: o.address,
      items: (o.items || []).map((i: any) => ({
        name: i.name,
        qty: Number(i.qty),
        price: Number(i.price),
      })),
      total: Number(o.total),
      status: o.status as OrderStatus,
      createdAt: o.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error("Failed to fetch orders from backend:", err);
    return [];
  }
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  try {
    await api(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return true;
  } catch (err) {
    console.error("Failed to update order status:", err);
    return false;
  }
}

export async function getAdminStats() {
  try {
    return await api("/admin/stats");
  } catch (err) {
    console.error("Failed to fetch admin stats:", err);
    return {
      revenue: 0,
      orderCount: 0,
      pendingCount: 0,
      productCount: 0,
      lowStockCount: 0,
      recentOrders: [],
    };
  }
}

export async function getAdminCustomers() {
  try {
    return await api("/admin/customers");
  } catch (err) {
    console.error("Failed to fetch admin customers:", err);
    return [];
  }
}
