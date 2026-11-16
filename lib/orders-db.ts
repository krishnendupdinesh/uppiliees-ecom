import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { safeNumber } from "@/lib/products-db";

export async function attachItemsToOrders(orderRows: RowDataPacket[]) {
  if (!orderRows || orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const placeholders = orderIds.map(() => "?").join(",");

  const [itemRows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, order_id, product_id, name, price, quantity
     FROM order_items
     WHERE order_id IN (${placeholders})
     ORDER BY id ASC`,
    orderIds
  );

  const itemsByOrder = new Map<number, any[]>();
  for (const item of itemRows) {
    const oid = Number(item.order_id);
    const list = itemsByOrder.get(oid) || [];
    const price = safeNumber(item.price, 0);
    const qty = Math.max(1, Math.floor(safeNumber(item.quantity, 1)));
    list.push({
      id: item.id,
      product_id: item.product_id,
      name: item.name,
      price,
      quantity: qty,
      qty,
    });
    itemsByOrder.set(oid, list);
  }

  return orderRows.map((row) => {
    const isGuest = row.user_id === null || row.user_id === undefined;
    const rawName = String(row.user_name || row.guest_name || "Guest").trim();
    const customerLabel = isGuest
      ? rawName.toLowerCase().includes("non-registered")
        ? rawName
        : `${rawName} (Non-registered)`
      : rawName;

    const total = safeNumber(row.total, 0);
    const shippingAddress = String(row.shipping_address || row.address || "");
    const createdAtIso = row.created_at
      ? new Date(row.created_at).toISOString()
      : new Date().toISOString();

    return {
      id: String(row.id),
      user_id: row.user_id ?? null,
      is_guest: isGuest,
      isGuest,
      customer_type: isGuest ? "Non-registered" : "Registered",
      customerName: customerLabel,
      customer_name: customerLabel,
      guest_name: row.guest_name || null,
      guest_email: row.guest_email || row.user_email || "",
      guest_phone: row.guest_phone || row.user_phone || "",
      email: row.guest_email || row.user_email || "",
      phone: row.guest_phone || row.user_phone || "",
      shipping_address: shippingAddress,
      address: shippingAddress,
      total,
      status: (row.status || "pending") as
        | "pending"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled",
      payment_status: row.payment_status || "pending",
      created_at: createdAtIso,
      createdAt: createdAtIso,
      date: createdAtIso,
      items: itemsByOrder.get(Number(row.id)) || [],
    };
  });
}

export async function fetchAllOrdersFromDb() {
  const [orderRows] = await pool.execute<RowDataPacket[]>(
    `SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     ORDER BY o.created_at DESC, o.id DESC`
  );
  return attachItemsToOrders(orderRows);
}

export async function fetchUserOrdersFromDb(userId: number | string, userEmail?: string) {
  const email = (userEmail || "").trim().toLowerCase();
  const [orderRows] = await pool.execute<RowDataPacket[]>(
    `SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.user_id = ? OR (? != '' AND LOWER(o.guest_email) = ?)
     ORDER BY o.created_at DESC, o.id DESC`,
    [userId, email, email]
  );
  return attachItemsToOrders(orderRows);
}

export async function fetchAdminStatsFromDb() {
  const [[orderStats]] = await pool.execute<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS totalOrders,
       COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) AS revenue,
       COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pendingCount,
       COALESCE(SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END), 0) AS guestOrdersCount
     FROM orders`
  );

  const [[productStats]] = await pool.execute<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS productsCount,
       COALESCE(SUM(CASE WHEN stock <= 5 THEN 1 ELSE 0 END), 0) AS lowStockCount
     FROM products`
  );

  const [[userStats]] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS usersCount FROM users WHERE role = 'customer'`
  );

  const totalOrders = safeNumber(orderStats?.totalOrders, 0);
  const revenue = safeNumber(orderStats?.revenue, 0);
  const productsCount = safeNumber(productStats?.productsCount, 0);
  const usersCount = safeNumber(userStats?.usersCount, 0);
  const pendingCount = safeNumber(orderStats?.pendingCount, 0);
  const lowStockCount = safeNumber(productStats?.lowStockCount, 0);
  const guestOrdersCount = safeNumber(orderStats?.guestOrdersCount, 0);

  return {
    totalOrders,
    revenue,
    productsCount,
    usersCount,
    users: usersCount,
    guestOrdersCount,
    orderCount: totalOrders,
    productCount: productsCount,
    pendingCount,
    lowStockCount,
  };
}

