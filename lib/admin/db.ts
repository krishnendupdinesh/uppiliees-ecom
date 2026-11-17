import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { connection } from "next/server";
import pool from "@/lib/db";
import {
  fetchProductsFromDb,
  fetchProductByIdOrSlugFromDb,
  safeNumber,
  calculateSellingPrice,
  slugify,
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
  Category,
  Section,
} from "./types";

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
  const mrp = safeNumber(p.mrp !== undefined && p.mrp !== null ? p.mrp : p.price, 0);
  const discountPercent = safeNumber(p.discount_percent, 0);
  const calculatedSelling = calculateSellingPrice(mrp, discountPercent);
  const sellingPrice = p.selling_price !== undefined && p.selling_price !== null && Number(p.selling_price) >= 0
    ? safeNumber(p.selling_price, calculatedSelling)
    : calculatedSelling;
  const price = safeNumber(sellingPrice, safeNumber(p.price, 0));
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
    discount_percent: discountPercent,
    selling_price: price,
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

export async function getMenuFromDb(): Promise<Section[]> {
  await connection();
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        s.id AS section_id,
        s.name AS section_name,
        s.slug AS section_slug,
        s.sort_order,
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        c.is_active
      FROM sections s
      LEFT JOIN categories c ON c.section_id = s.id AND (c.is_active = TRUE OR c.is_active IS NULL)
      ORDER BY s.sort_order ASC, c.name ASC
    `);

    if (rows.length === 0) {
      return [
        {
          id: 1,
          name: "Herbal & Wellness",
          slug: "herbal-wellness",
          sort_order: 1,
          categories: [
            { id: 1, name: "Pain Relief", slug: "pain-relief" },
            { id: 2, name: "Baby Care", slug: "baby-care" },
            { id: 3, name: "Hair Care", slug: "hair-care" },
            { id: 4, name: "Skin Care", slug: "skin-care" },
            { id: 5, name: "Wellness Powders", slug: "wellness-powders" },
            { id: 6, name: "Home Care", slug: "home-care" },
          ],
        },
        {
          id: 2,
          name: "Kerala Food Products",
          slug: "kerala-food-products",
          sort_order: 2,
          categories: [
            { id: 7, name: "Powders", slug: "powders" },
            { id: 8, name: "Chips & Sweets", slug: "chips-sweets" },
            { id: 9, name: "Pickle, Ghee & Lard", slug: "pickle-ghee-lard" },
            { id: 10, name: "Dried Foods", slug: "dried-foods" },
          ],
        },
        {
          id: 3,
          name: "Handloom",
          slug: "handloom",
          sort_order: 3,
          categories: [
            { id: 11, name: "Sarees", slug: "sarees" },
            { id: 12, name: "Set Mundu", slug: "set-mundu" },
            { id: 13, name: "Dhotis", slug: "dhotis" },
          ],
        },
      ];
    }

    const sectionMap = new Map<number, Section>();
    for (const r of rows) {
      const sId = Number(r.section_id);
      if (!sectionMap.has(sId)) {
        sectionMap.set(sId, {
          id: sId,
          name: String(r.section_name),
          slug: String(r.section_slug),
          sort_order: Number(r.sort_order || 0),
          categories: [],
        });
      }
      if (r.category_id && r.category_name) {
        sectionMap.get(sId)!.categories.push({
          id: Number(r.category_id),
          name: String(r.category_name),
          slug: String(r.category_slug),
        });
      }
    }
    return Array.from(sectionMap.values());
  } catch (err) {
    console.error("getMenuFromDb error:", err);
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  await connection();
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.section_id,
        s.name AS section_name,
        s.slug AS section_slug,
        c.is_active,
        c.image, 
        c.subtitle, 
        c.created_at
      FROM categories c
      LEFT JOIN sections s ON s.id = c.section_id
      WHERE c.is_active = TRUE OR c.is_active IS NULL
      ORDER BY COALESCE(s.sort_order, 1) ASC, c.name ASC
    `);
    return rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      slug: String(r.slug),
      section_id: Number(r.section_id || 1),
      section_name: r.section_name ? String(r.section_name) : undefined,
      section_slug: r.section_slug ? String(r.section_slug) : undefined,
      is_active: r.is_active !== undefined ? Boolean(r.is_active) : true,
      image: r.image ? String(r.image) : null,
      subtitle: r.subtitle ? String(r.subtitle) : null,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    }));
  } catch {
    return [
      { id: 1, name: "Pain Relief", slug: "pain-relief", section_id: 1, is_active: true },
      { id: 2, name: "Baby Care", slug: "baby-care", section_id: 1, is_active: true },
      { id: 3, name: "Hair Care", slug: "hair-care", section_id: 1, is_active: true },
      { id: 4, name: "Skin Care", slug: "skin-care", section_id: 1, is_active: true },
      { id: 5, name: "Wellness Powders", slug: "wellness-powders", section_id: 1, is_active: true },
      { id: 6, name: "Home Care", slug: "home-care", section_id: 1, is_active: true },
      { id: 7, name: "Powders", slug: "powders", section_id: 2, is_active: true },
      { id: 8, name: "Chips & Sweets", slug: "chips-sweets", section_id: 2, is_active: true },
      { id: 9, name: "Pickle, Ghee & Lard", slug: "pickle-ghee-lard", section_id: 2, is_active: true },
      { id: 10, name: "Dried Foods", slug: "dried-foods", section_id: 2, is_active: true },
      { id: 11, name: "Sarees", slug: "sarees", section_id: 3, is_active: true },
      { id: 12, name: "Set Mundu", slug: "set-mundu", section_id: 3, is_active: true },
      { id: 13, name: "Dhotis", slug: "dhotis", section_id: 3, is_active: true },
    ];
  }
}

export async function getAdminCategories(): Promise<Category[]> {
  await connection();
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.section_id,
        s.name AS section_name,
        s.slug AS section_slug,
        c.is_active,
        c.image, 
        c.subtitle, 
        c.created_at,
        COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN sections s ON s.id = c.section_id
      LEFT JOIN products p ON c.id = p.category_id AND (p.is_active = TRUE OR p.is_active IS NULL)
      GROUP BY c.id, c.name, c.slug, c.section_id, s.name, s.slug, c.is_active, c.image, c.subtitle, c.created_at, s.sort_order
      ORDER BY COALESCE(s.sort_order, 1) ASC, c.name ASC
    `);
    return rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      slug: String(r.slug),
      section_id: Number(r.section_id || 1),
      section_name: r.section_name ? String(r.section_name) : undefined,
      section_slug: r.section_slug ? String(r.section_slug) : undefined,
      is_active: r.is_active !== undefined ? Boolean(r.is_active) : true,
      image: r.image ? String(r.image) : null,
      subtitle: r.subtitle ? String(r.subtitle) : null,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      product_count: Number(r.product_count || 0),
    }));
  } catch {
    return getCategories();
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

// Generates a unique slug for a category
async function generateUniqueCategorySlug(name: string, excludeId?: number): Promise<string> {
  const baseSlug = slugify(name) || `category-${Date.now()}`;
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    let sql = "SELECT id FROM categories WHERE slug = ?";
    const params: any[] = [candidate];
    if (excludeId !== undefined) {
      sql += " AND id != ?";
      params.push(excludeId);
    }
    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    if (rows.length === 0) return candidate;
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
}

// Creates a new category (validates unique name and auto-makes slug)
export async function createCategory(data: {
  name: string;
  section_id?: number;
  is_active?: boolean;
  image?: string | null;
}): Promise<Category> {
  await connection();
  const name = String(data.name || "").trim();
  if (!name) {
    throw new Error("Category name is required");
  }

  // Check unique name
  const [existing] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1",
    [name]
  );
  if (existing.length > 0) {
    throw new Error("A category with this name already exists");
  }

  const slug = await generateUniqueCategorySlug(name);
  const sectionId = Number(data.section_id) || 1;
  const isActive = data.is_active !== undefined ? Boolean(data.is_active) : true;
  const image = data.image ? String(data.image).trim() : null;

  let insertId = 0;
  try {
    const [res] = await pool.execute<ResultSetHeader>(
      "INSERT INTO categories (name, slug, section_id, is_active, image) VALUES (?, ?, ?, ?, ?)",
      [name, slug, sectionId, isActive, image]
    );
    insertId = res.insertId;
  } catch {
    const [res] = await pool.execute<ResultSetHeader>(
      "INSERT INTO categories (name, slug, image) VALUES (?, ?, ?)",
      [name, slug, image]
    );
    insertId = res.insertId;
  }

  return {
    id: insertId,
    name,
    slug,
    section_id: sectionId,
    is_active: isActive,
    image,
    product_count: 0,
  };
}

// Updates an existing category
export async function updateCategory(
  id: number | string,
  data: {
    name: string;
    section_id?: number;
    is_active?: boolean;
    image?: string | null;
  }
): Promise<Category> {
  await connection();
  const catId = Number(id);
  const name = String(data.name || "").trim();
  if (!name) {
    throw new Error("Category name is required");
  }

  // Check category exists
  const [existing] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM categories WHERE id = ? LIMIT 1",
    [catId]
  );
  if (existing.length === 0) {
    throw new Error("Category not found");
  }

  // Check unique name
  const [duplicate] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1",
    [name, catId]
  );
  if (duplicate.length > 0) {
    throw new Error("A category with this name already exists");
  }

  let slug = existing[0].slug;
  if (name.toLowerCase() !== existing[0].name.toLowerCase()) {
    slug = await generateUniqueCategorySlug(name, catId);
  }

  const image = data.image !== undefined ? (data.image ? String(data.image).trim() : null) : existing[0].image;
  const sectionId = data.section_id !== undefined ? Number(data.section_id) : (existing[0].section_id || 1);
  const isActive = data.is_active !== undefined ? Boolean(data.is_active) : (existing[0].is_active !== undefined ? Boolean(existing[0].is_active) : true);

  try {
    await pool.execute(
      "UPDATE categories SET name = ?, slug = ?, section_id = ?, is_active = ?, image = ? WHERE id = ?",
      [name, slug, sectionId, isActive, image, catId]
    );
  } catch {
    await pool.execute(
      "UPDATE categories SET name = ?, slug = ?, image = ? WHERE id = ?",
      [name, slug, image, catId]
    );
  }

  return {
    id: catId,
    name,
    slug,
    section_id: sectionId,
    is_active: isActive,
    image,
  };
}

// Deletes a category (blocks delete if products exist)
export async function deleteCategory(id: number | string): Promise<{ success: boolean; message: string }> {
  await connection();
  const catId = Number(id);

  // Check if category exists
  const [existing] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM categories WHERE id = ? LIMIT 1",
    [catId]
  );
  if (existing.length === 0) {
    throw new Error("Category not found");
  }

  // Check if products exist in this category
  const [prodRows] = await pool.execute<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM products WHERE category_id = ?",
    [catId]
  );
  const count = Number(prodRows[0]?.count || 0);
  if (count > 0) {
    throw new Error(
      `Cannot delete category because it contains ${count} product${count === 1 ? "" : "s"}. Please delete or reassign products first.`
    );
  }

  await pool.execute("DELETE FROM categories WHERE id = ?", [catId]);
  return { success: true, message: "Category deleted successfully" };
}
