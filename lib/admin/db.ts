import type { RowDataPacket, ResultSetHeader } from "mysql2";
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
import type {
  Order,
  OrderStatus,
  Product,
  ReviewItem,
  RegisteredUser,
  VisitorAnalytics,
  Coupon,
  ContactMessage,
} from "./types";

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
      isGuest: Boolean(o.is_guest || !o.user_id),
      customerType: (o.is_guest || !o.user_id) ? "Guest" : "Registered",
      customerName: o.customerName || o.guest_name || "Guest",
      email: o.email || o.guest_email || "",
      phone: o.phone || o.guest_phone || "",
      address: o.shipping_address || o.address || "",
      items: (o.items || []).map((i: any) => ({
        name: i.name,
        qty: safeNumber(i.quantity ?? i.qty, 1),
        price: safeNumber(i.price, 0),
      })),
      total: safeNumber(o.total, 0),
      status: (o.status as OrderStatus) || "pending",
      paymentStatus: o.payment_status || "pending",
      createdAt: o.createdAt || o.created_at || "",
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
    const baseStats = await fetchAdminStatsFromDb();

    // Check visitors and low stock counts
    let visitorsToday = 0;
    let totalVisitors = 0;
    try {
      const [visRows] = await pool.execute<RowDataPacket[]>(
        `SELECT
           COUNT(*) AS totalVisitors,
           COALESCE(SUM(CASE WHEN DATE(last_seen) = CURDATE() THEN 1 ELSE 0 END), 0) AS visitorsToday
         FROM visitors`
      );
      totalVisitors = Number(visRows[0]?.totalVisitors || 0);
      visitorsToday = Number(visRows[0]?.visitorsToday || 0);
    } catch {
      // ignore
    }

    let lowStockCount = 0;
    try {
      const [pRows] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) AS lowStock FROM products WHERE stock <= 5"
      );
      lowStockCount = Number(pRows[0]?.lowStock || 0);
    } catch {
      // ignore
    }

    return {
      ...baseStats,
      lowStockCount: lowStockCount || (baseStats as any).lowStockCount || 0,
      totalVisitors,
      visitorsToday,
    };
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
      totalVisitors: 0,
      visitorsToday: 0,
    };
  }
}

// ── REVIEWS MANAGEMENT ──────────────────────────────────────────
export async function getAdminReviews(options?: {
  productId?: string;
  rating?: number;
  search?: string;
}): Promise<ReviewItem[]> {
  await connection();
  try {
    let sql = `
      SELECT
        r.id,
        r.product_id,
        r.user_id,
        COALESCE(r.user_name, u.name, 'Guest') AS user_name,
        r.rating,
        r.comment,
        r.created_at,
        p.name AS product_name,
        p.slug AS product_slug,
        u.email AS user_email
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.productId && options.productId !== "all") {
      sql += " AND (r.product_id = ? OR p.slug = ?)";
      params.push(options.productId, options.productId);
    }

    if (options?.rating && options.rating > 0) {
      sql += " AND r.rating = ?";
      params.push(options.rating);
    }

    if (options?.search && options.search.trim()) {
      const term = `%${options.search.trim().toLowerCase()}%`;
      sql += " AND (LOWER(r.comment) LIKE ? OR LOWER(r.user_name) LIKE ? OR LOWER(p.name) LIKE ?)";
      params.push(term, term, term);
    }

    sql += " ORDER BY r.created_at DESC";

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

    return rows.map((r) => ({
      id: Number(r.id),
      product_id: Number(r.product_id),
      product_name: String(r.product_name || "Unknown Product"),
      product_slug: String(r.product_slug || ""),
      user_id: r.user_id ? Number(r.user_id) : null,
      user_name: String(r.user_name || "Guest"),
      user_email: r.user_email ? String(r.user_email) : undefined,
      rating: safeNumber(r.rating, 5),
      comment: String(r.comment || ""),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
    }));
  } catch (err) {
    console.error("getAdminReviews DB error:", err);
    return [];
  }
}

export async function deleteAdminReview(id: number | string): Promise<boolean> {
  await connection();
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      "DELETE FROM reviews WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  } catch (err) {
    console.error("deleteAdminReview DB error:", err);
    return false;
  }
}

// ── REGISTERED USERS MANAGEMENT ─────────────────────────────────
export async function getRegisteredUsers(search?: string): Promise<RegisteredUser[]> {
  await connection();
  try {
    let sql = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.is_blocked,
        u.created_at,
        COUNT(o.id) AS orders_count,
        COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) AS total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.role = 'customer'
    `;
    const params: any[] = [];

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      sql += " AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(COALESCE(u.phone, '')) LIKE ?)";
      params.push(term, term, term);
    }

    sql += `
      GROUP BY u.id, u.name, u.email, u.phone, u.role, u.is_blocked, u.created_at
      ORDER BY u.created_at DESC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

    return rows.map((r) => ({
      id: r.id,
      name: String(r.name),
      email: String(r.email),
      phone: String(r.phone || ""),
      role: String(r.role),
      is_blocked: Boolean(r.is_blocked),
      orders: safeNumber(r.orders_count, 0),
      spent: safeNumber(r.total_spent, 0),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
    }));
  } catch (err) {
    console.error("getRegisteredUsers DB error:", err);
    return [];
  }
}

export async function getUserWithOrderHistory(userId: string | number) {
  await connection();
  try {
    const [userRows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, name, email, phone, role, is_blocked, created_at FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (userRows.length === 0) return null;

    const user = userRows[0];
    const [orders] = await pool.execute<RowDataPacket[]>(
      `SELECT id, total, status, payment_status, created_at, shipping_address, address
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return {
      id: user.id,
      name: String(user.name),
      email: String(user.email),
      phone: String(user.phone || ""),
      role: String(user.role),
      is_blocked: Boolean(user.is_blocked),
      created_at: user.created_at ? new Date(user.created_at).toISOString() : "",
      orders: orders.map((o) => ({
        id: String(o.id),
        total: safeNumber(o.total, 0),
        status: o.status as OrderStatus,
        paymentStatus: o.payment_status || "pending",
        createdAt: o.created_at ? new Date(o.created_at).toISOString() : "",
        address: String(o.shipping_address || o.address || ""),
      })),
    };
  } catch (err) {
    console.error("getUserWithOrderHistory DB error:", err);
    return null;
  }
}

export async function toggleUserBlock(userId: string | number, nextBlocked?: boolean): Promise<boolean> {
  await connection();
  try {
    if (nextBlocked === undefined) {
      const [u] = await pool.execute<RowDataPacket[]>(
        "SELECT is_blocked FROM users WHERE id = ? LIMIT 1",
        [userId]
      );
      if (u.length === 0) return false;
      nextBlocked = !Boolean(u[0].is_blocked);
    }

    await pool.execute("UPDATE users SET is_blocked = ? WHERE id = ?", [
      Boolean(nextBlocked),
      userId,
    ]);
    return true;
  } catch (err) {
    console.error("toggleUserBlock DB error:", err);
    return false;
  }
}

// ── VISITOR ANALYTICS ───────────────────────────────────────────
export async function getVisitorAnalytics(): Promise<VisitorAnalytics> {
  await connection();
  try {
    const [visRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS totalVisitors,
         COALESCE(SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END), 0) AS guestVisitors,
         COALESCE(SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END), 0) AS registeredVisitors,
         COALESCE(SUM(CASE WHEN DATE(last_seen) = CURDATE() THEN 1 ELSE 0 END), 0) AS visitorsToday
       FROM visitors`
    );

    const [userRows] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) AS registeredUsers FROM users WHERE role = 'customer'"
    );

    const [orderRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END), 0) AS guestOrders,
         COALESCE(SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END), 0) AS registeredOrders,
         COUNT(*) AS totalOrders
       FROM orders`
    );

    const [histRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         DATE_FORMAT(last_seen, '%Y-%m-%d') AS date,
         COUNT(*) AS count,
         COALESCE(SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END), 0) AS guestCount,
         COALESCE(SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END), 0) AS registeredCount
       FROM visitors
       WHERE last_seen >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE_FORMAT(last_seen, '%Y-%m-%d')
       ORDER BY date ASC`
    );

    const v = visRows[0] || {};
    const u = userRows[0] || {};
    const o = orderRows[0] || {};

    return {
      totalVisitors: safeNumber(v.totalVisitors, 0),
      guestVisitors: safeNumber(v.guestVisitors, 0),
      registeredVisitors: safeNumber(v.registeredVisitors, 0),
      visitorsToday: safeNumber(v.visitorsToday, 0),
      registeredUsers: safeNumber(u.registeredUsers, 0),
      guestOrders: safeNumber(o.guestOrders, 0),
      registeredOrders: safeNumber(o.registeredOrders, 0),
      totalOrders: safeNumber(o.totalOrders, 0),
      history: histRows.map((r) => ({
        date: String(r.date),
        count: safeNumber(r.count, 0),
        guestCount: safeNumber(r.guestCount, 0),
        registeredCount: safeNumber(r.registeredCount, 0),
      })),
    };
  } catch (err) {
    console.error("getVisitorAnalytics DB error:", err);
    return {
      totalVisitors: 0,
      guestVisitors: 0,
      registeredVisitors: 0,
      visitorsToday: 0,
      registeredUsers: 0,
      guestOrders: 0,
      registeredOrders: 0,
      totalOrders: 0,
      history: [],
    };
  }
}

// ── COUPONS MANAGEMENT ──────────────────────────────────────────
export async function getCoupons(): Promise<Coupon[]> {
  await connection();
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM coupons ORDER BY created_at DESC"
    );
    return rows.map((c) => ({
      id: Number(c.id),
      code: String(c.code),
      discount_type: c.discount_type === "fixed" ? "fixed" : "percentage",
      discount_value: safeNumber(c.discount_value, 0),
      min_order_amount: safeNumber(c.min_order_amount, 0),
      max_discount: c.max_discount ? safeNumber(c.max_discount, 0) : null,
      usage_limit: c.usage_limit ? Number(c.usage_limit) : null,
      used_count: safeNumber(c.used_count, 0),
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString() : null,
      is_active: Boolean(c.is_active),
      created_at: c.created_at ? new Date(c.created_at).toISOString() : "",
    }));
  } catch (err) {
    console.error("getCoupons DB error:", err);
    return [];
  }
}

// ── CUSTOMER ENQUIRIES / MESSAGES ──────────────────────────────
export async function getContactMessages(status?: string): Promise<ContactMessage[]> {
  await connection();
  try {
    let sql = "SELECT * FROM contact_messages WHERE 1=1";
    const params: any[] = [];
    if (status && status !== "all") {
      sql += " AND status = ?";
      params.push(status);
    }
    sql += " ORDER BY created_at DESC";

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    return rows.map((m) => ({
      id: Number(m.id),
      name: String(m.name),
      email: String(m.email),
      phone: m.phone ? String(m.phone) : null,
      topic: m.topic ? String(m.topic) : null,
      message: String(m.message || ""),
      status: (m.status as "unread" | "read" | "replied") || "unread",
      created_at: m.created_at ? new Date(m.created_at).toISOString() : "",
    }));
  } catch (err) {
    console.error("getContactMessages DB error:", err);
    return [];
  }
}

// Legacy combined customers function kept for backward compatibility
export async function getUsersAndCustomers(): Promise<AdminUserRecord[]> {
  await connection();
  try {
    const registered = await getRegisteredUsers();
    const mappedReg: AdminUserRecord[] = registered.map((u) => ({
      id: `user-${u.id}`,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: "Registered",
      isGuest: false,
      orders: u.orders,
      spent: u.spent,
      createdAt: u.created_at,
    }));

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

    const regEmails = new Set(registered.map((r) => r.email.toLowerCase()));
    const guests: AdminUserRecord[] = guestRows
      .filter((g) => !regEmails.has(String(g.guest_email || "").toLowerCase()))
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

    return [...mappedReg, ...guests];
  } catch (err) {
    console.error("getUsersAndCustomers DB error:", err);
    return [];
  }
}
