import { api } from "@/lib/api";
import { getStoredOrders, updateStoredOrderStatus } from "@/lib/db";
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
    if (res?.products && Array.isArray(res.products)) {
      return res.products.map((p) => ({
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
    }
  } catch {
    // Backend API not reachable; fall through
  }

  // Static catalog + custom products
  try {
    const { collections } = await import("@/data/products");
    const { getCustomProducts } = await import("./productsStore");
    const custom = getCustomProducts();

    const staticList = collections.flatMap((c) =>
      c.products.map((p) => ({
        id: `${c.slug}-${p.id}`,
        name: p.name,
        category: p.category || c.title,
        price: p.price,
        mrp: p.mrp || p.price,
        stock: 25,
        image: `/products/${p.slug}.jpg`,
        description: p.description || "",
        featured: true,
        createdAt: new Date().toISOString(),
      }))
    );

    // Merge: custom items override static items if matching id, or appear at top
    const combined = [...custom];
    for (const item of staticList) {
      if (!combined.some((c) => c.id === item.id)) {
        combined.push(item);
      }
    }

    return combined;
  } catch {
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
    if (Array.isArray(res) && res.length > 0) {
      return res.map((o) => ({
        id: String(o.id),
        customerName: o.customer_name || o.customerName,
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
        createdAt: o.created_at || o.createdAt || new Date().toISOString(),
      }));
    }
  } catch {
    // Backend API not reachable; read from local stored orders
  }

  const localOrders = getStoredOrders();
  return localOrders.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    email: o.email,
    phone: o.phone,
    address: o.address,
    items: o.items.map((i) => ({
      name: i.name,
      qty: Number(i.qty),
      price: Number(i.price),
    })),
    total: Number(o.total),
    status: o.status as OrderStatus,
    createdAt: o.createdAt,
  }));
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  try {
    await api(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return true;
  } catch (err) {
    const ok = updateStoredOrderStatus(id, status);
    return ok;
  }
}

export async function getAdminStats() {
  try {
    return await api("/admin/stats");
  } catch (err) {
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
    return [];
  }
}
