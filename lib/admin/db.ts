import type { RowDataPacket } from "mysql2";
import { connection } from "next/server";
import pool from "@/lib/db";
import {
  fetchProductsFromDb,
  fetchProductByIdOrSlugFromDb,
  safeNumber,
} from "@/lib/products-db";
import {
  fetchAllOrdersFromDb,
  fetchAdminStatsFromDb,
} from "@/lib/orders-db";
import type { Order, OrderStatus, Product } from "./types";

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface AdminUserRecord {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  role: string;
  isGuest: boolean;
  orders: number;
  spent: number;
  createdAt: string;
}

function mapDbProductToAdmin(p: any): Product {
  const price = safeNumber(p.price, 0);
  const mrp = safeNumber(p.mrp, price);
  const stock = safeNumber(p.stock, 0);
  const inStock = p.in_stock !== undefined ? Boolean(p.in_stock) && stock > 0 : stock > 0;
  const isActive = p.is_active !== undefined ? Boolean(p.is_active) : true;
  const displayOrder = safeNumber(p.display_order, 0);

  const validImages = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const mainImage = validImages[0] || p.image_url || p.image || "";

  return {
    id: String(p.id),
    name: p.name || "",
    slug: p.slug || "",
    category: p.category_name || p.category || "Herbal & Beauty",
    category_id: p.category_id ? Number(p.category_id) : undefined,
    subcategory: p.subcategory || p.category || "",
    price,
    mrp,
    stock,
    in_stock: inStock,
    is_active: isActive,
    display_order: displayOrder,
    tags: p.tags || "",
    image: mainImage,
    publicId: p.image_public_id || p.publicId || "",
    images: validImages,
    imagePublicIds: Array.isArray(p.imagePublicIds)
      ? p.imagePublicIds
      : mainImage && (p.image_public_id || p.publicId)
      ? [p.image_public_id || p.publicId]
      : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    description: p.description || "",
    benefits: p.benefits || "",
    howToUse: p.howToUse || p.how_to_use || "",
    ingredients: p.ingredients || "",
    returnPolicy: p.returnPolicy || p.return_policy || "",
    featured: Boolean(p.featured),
    createdAt: p.created_at
      ? new Date(p.created_at).toISOString()
      : "",
  };
}

export async function getCategories(): Promise<Category[]> {
  await connection();
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, name, slug FROM categories ORDER BY id ASC"
    );
    return rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      slug: String(r.slug),
    }));
  } catch {
    return [
      { id: 1, name: "Herbal & Beauty", slug: "herbal-beauty" },
      { id: 2, name: "Traditional Food", slug: "traditional-foods" },
      { id: 3, name: "Handloom", slug: "handloom" },
    ];
  }
}

export async function getProducts(): Promise<Product[]> {
  await connection();
  try {
    const rows = await fetchProductsFromDb({ includeInactive: true });
    return rows.map(mapDbProductToAdmin);
  } catch (err) {
    console.error("getProducts DB error:", err);
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  await connection();
  try {
    const p = await fetchProductByIdOrSlugFromDb(id, { includeInactive: true });
    if (!p) return null;
    return mapDbProductToAdmin(p);
  } catch (err) {
    console.error("getProduct DB error:", err);
    return null;
  }
}

export async function getOrders(): Promise<Order[]> {
  await connection();
  try {
    const rows = await fetchAllOrdersFromDb();
    return rows.map((o: any) => ({
      id: String(o.id),
      userId: o.user_id,
      isGuest: Boolean(o.is_guest),
      customerType: o.is_guest ? "Non-registered" : "Registered",
      customerName: o.customerName,
      email: o.email || "",
      phone: o.phone || "",
      address: o.shipping_address || o.address || "",
      items: (o.items || []).map((i: any) => ({
        name: i.name,
        qty: safeNumber(i.quantity ?? i.qty, 1),
        price: safeNumber(i.price, 0),
      })),
      total: safeNumber(o.total, 0),
      status: (o.status as OrderStatus) || "pending",
      paymentStatus: o.payment_status || "pending",
      createdAt: o.createdAt || "",
    }));
  } catch (err) {
    console.error("getOrders DB error:", err);
    return [];
  }
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  try {
    await pool.execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    return true;
  } catch {
    return false;
  }
}

export async function getAdminStats() {
  await connection();
  try {
    return await fetchAdminStatsFromDb();
  } catch {
    return {
      totalOrders: 0,
      revenue: 0,
      productsCount: 0,
      usersCount: 0,
      users: 0,
      guestOrdersCount: 0,
      orderCount: 0,
      pendingCount: 0,
      productCount: 0,
      lowStockCount: 0,
    };
  }
}

export async function getUsersAndCustomers(): Promise<AdminUserRecord[]> {
  await connection();
  try {
    // 1. Registered users from users table
    const [userRows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
              COUNT(o.id) AS orders_count,
              COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) AS total_spent
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       WHERE u.role = 'customer'
       GROUP BY u.id, u.name, u.email, u.phone, u.role, u.created_at
       ORDER BY u.created_at DESC`
    );

    const registered: AdminUserRecord[] = userRows.map((u) => ({
      id: `user-${u.id}`,
      name: String(u.name),
      email: String(u.email),
      phone: String(u.phone || ""),
      role: "Registered",
      isGuest: false,
      orders: safeNumber(u.orders_count, 0),
      spent: safeNumber(u.total_spent, 0),
      createdAt: u.created_at ? new Date(u.created_at).toISOString() : "",
    }));

    // 2. Guest orders (where user_id IS NULL -> non-registered users)
    const [guestRows] = await pool.execute<RowDataPacket[]>(
      `SELECT guest_name, guest_email, guest_phone,
              COUNT(id) AS orders_count,
              COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) AS total_spent,
              MAX(created_at) AS last_order_at
       FROM orders
       WHERE user_id IS NULL
       GROUP BY guest_name, guest_email, guest_phone
       ORDER BY last_order_at DESC`
    );

    const registeredEmails = new Set(registered.map((r) => r.email.toLowerCase()));
    const guests: AdminUserRecord[] = guestRows
      .filter((g) => !registeredEmails.has(String(g.guest_email || "").toLowerCase()))
      .map((g, idx) => ({
        id: `guest-${idx}-${g.guest_email || "anon"}`,
        name: `${g.guest_name || "Guest"} (Non-registered)`,
        email: String(g.guest_email || ""),
        phone: String(g.guest_phone || ""),
        role: "Non-registered",
        isGuest: true,
        orders: safeNumber(g.orders_count, 0),
        spent: safeNumber(g.total_spent, 0),
        createdAt: g.last_order_at
          ? new Date(g.last_order_at).toISOString()
          : "",
      }));

    return [...registered, ...guests];
  } catch (err) {
    console.error("getUsersAndCustomers DB error:", err);
    return [];
  }
}
