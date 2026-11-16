import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { getStoredOrders, updateStoredOrderStatus } from "@/lib/db";
import type { Order, OrderStatus, Product } from "./types";

export interface Category {
  id: number;
  name: string;
  slug: string;
}

// Builds request headers forwarding browser cookies during Next.js server rendering
async function getServerAuthHeaders(): Promise<Record<string, string>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (token) {
      return { Cookie: `token=${token}` };
    }
  } catch {
    // Called outside request scope
  }
  return {};
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await api<Category[]>("/api/categories");
  } catch {
    return [];
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await api<{ products: any[] }>("/api/products?limit=1000");
    if (res?.products && Array.isArray(res.products) && res.products.length > 0) {
      return res.products.map((p) => ({
        id: String(p.id),
        name: p.name,
        category: p.category_name || p.category_slug || p.category || "Herbal & Beauty",
        price: Number(p.price || 0),
        mrp: Number(p.mrp || p.price || 0),
        stock: Number(p.stock ?? 0),
        image: p.image_url || p.image || "",
        images: Array.isArray(p.images) ? p.images : p.image_url ? [p.image_url] : [],
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        description: p.description || "",
        benefits: p.benefits || "",
        howToUse: p.howToUse || p.how_to_use || "",
        ingredients: p.ingredients || "",
        returnPolicy: p.returnPolicy || p.return_policy || "",
        featured: Boolean(p.featured),
        createdAt: p.created_at || p.createdAt || new Date().toISOString(),
      }));
    }
  } catch {
    // Backend API not reachable or empty; fall through to local catalog
  }

  // Static catalog + custom products fallback
  try {
    const { collections } = await import("@/data/products");
    const { getCustomProducts } = await import("./productsStore");
    const custom = getCustomProducts();

    const staticList = collections.flatMap((c) =>
      c.products.map((p) => ({
        id: `${c.slug}-${p.id}`,
        name: p.name,
        category: p.category || c.title,
        price: Number(p.price || 0),
        mrp: Number(p.mrp || p.price || 0),
        stock: 25,
        image: `/products/${p.slug}.jpg`,
        description: p.description || "",
        featured: true,
        createdAt: new Date().toISOString(),
      }))
    );

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
  try {
    const p = await api<any>(`/api/products/${encodeURIComponent(id)}`);
    if (p && p.id) {
      return {
        id: String(p.id),
        name: p.name,
        category: p.category_name || p.category_slug || p.category || "Herbal & Beauty",
        price: Number(p.price || 0),
        mrp: Number(p.mrp || p.price || 0),
        stock: Number(p.stock ?? 0),
        image: p.image_url || p.image || "",
        images: Array.isArray(p.images) ? p.images : p.image_url ? [p.image_url] : [],
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        description: p.description || "",
        benefits: p.benefits || "",
        howToUse: p.howToUse || p.how_to_use || "",
        ingredients: p.ingredients || "",
        returnPolicy: p.returnPolicy || p.return_policy || "",
        featured: Boolean(p.featured),
        createdAt: p.created_at || p.createdAt || new Date().toISOString(),
      };
    }
  } catch {
    // Fall back to list lookup
  }

  const products = await getProducts();
  return products.find((p) => p.id === id) || null;
}

export async function getOrders(): Promise<Order[]> {
  try {
    const headers = await getServerAuthHeaders();
    const res = await api<any[]>("/api/orders", { headers });
    if (Array.isArray(res)) {
      return res.map((o) => {
        const isGuest = o.user_id === null || o.is_guest === true;
        const rawCustomer = o.customer_name || o.customerName || o.guest_name || "Guest";
        const customerLabel = isGuest
          ? rawCustomer.toLowerCase().includes("guest")
            ? rawCustomer
            : `${rawCustomer} (Guest)`
          : rawCustomer;

        return {
          id: String(o.id),
          customerName: customerLabel,
          email: o.email || o.guest_email || "",
          phone: o.phone || o.guest_phone || "",
          address: o.address || "",
          items: (o.items || []).map((i: any) => ({
            name: i.name,
            qty: Number(i.quantity ?? i.qty ?? 1),
            price: Number(i.price || 0),
          })),
          total: Number(o.total || 0),
          status: (o.status as OrderStatus) || "pending",
          createdAt: o.created_at || o.createdAt || new Date().toISOString(),
        };
      });
    }
  } catch {
    // Backend API not reachable; read from local stored orders
  }

  const localOrders = getStoredOrders();
  return localOrders.map((o) => ({
    id: o.id,
    customerName: o.isGuest && !o.customerName.toLowerCase().includes("guest")
      ? `${o.customerName} (Guest)`
      : o.customerName,
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
    const headers = await getServerAuthHeaders();
    await api(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });
    return true;
  } catch {
    return updateStoredOrderStatus(id, status);
  }
}

export async function getAdminStats() {
  try {
    const headers = await getServerAuthHeaders();
    return await api("/api/admin/stats", { headers });
  } catch {
    return {
      totalOrders: 0,
      revenue: 0,
      productsCount: 0,
      orderCount: 0,
      pendingCount: 0,
      productCount: 0,
      lowStockCount: 0,
      recentOrders: [],
    };
  }
}
