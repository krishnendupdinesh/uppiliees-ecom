import { NextRequest, NextResponse, connection } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { safeNumber } from "@/lib/products-db";
import { fetchAllOrdersFromDb, fetchUserOrdersFromDb } from "@/lib/orders-db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const authUser = await getAuthUser(req);
    const body = await req.json();

    const guestName = String(body.guest_name || body.name || authUser?.name || "").trim();
    const guestEmail = String(body.guest_email || body.email || authUser?.email || "")
      .trim()
      .toLowerCase();
    const guestPhone = String(body.guest_phone || body.phone || "").trim();
    const shippingAddress = String(
      body.shipping_address || body.address || ""
    ).trim();
    const items = Array.isArray(body.items) ? body.items : [];
    const paymentMethod = String(body.paymentMethod || "cod").toLowerCase();
    const paymentStatus =
      body.payment_status || (paymentMethod === "razorpay" ? "paid" : "pending");

    if (!guestName || !guestEmail || !guestPhone || !shippingAddress) {
      return NextResponse.json(
        { error: "Name, email, phone, and shipping address are required." },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item." },
        { status: 400 }
      );
    }

    // Resolve user_id: NULL for guest orders (or if admin places a test guest order)
    let userId: number | null = null;
    if (authUser && authUser.role === "customer" && !body.isGuest) {
      const parsedId = Number(authUser.id);
      if (Number.isInteger(parsedId) && parsedId > 0) {
        userId = parsedId;
      }
    }

    // Normalize items and calculate total safely
    let calculatedTotal = 0;
    const normalizedItems: {
      productId: number | null;
      name: string;
      price: number;
      quantity: number;
    }[] = [];

    for (const item of items) {
      const itemName = String(item.name || "").trim();
      const itemPrice = safeNumber(item.price, 0);
      const itemQty = Math.max(1, Math.floor(safeNumber(item.quantity ?? item.qty, 1)));

      if (!itemName) {
        return NextResponse.json(
          { error: "Each order item must have a valid name." },
          { status: 400 }
        );
      }

      // Resolve product_id in database if possible
      let productId: number | null = null;
      const rawPid = item.product_id ?? item.id;
      if (rawPid !== undefined && rawPid !== null) {
        const numericPid = Number(String(rawPid).split("-")[0]);
        if (Number.isInteger(numericPid) && numericPid > 0) {
          const [pRows] = await connection.execute<RowDataPacket[]>(
            "SELECT id FROM products WHERE id = ? LIMIT 1",
            [numericPid]
          );
          if (pRows[0]) productId = Number(pRows[0].id);
        }
      }
      if (!productId) {
        const cleanBaseName = itemName.replace(/\s*\([^)]*\)\s*$/, "").trim();
        const [pRows] = await connection.execute<RowDataPacket[]>(
          "SELECT id FROM products WHERE name = ? OR slug = ? LIMIT 1",
          [cleanBaseName, item.slug || ""]
        );
        if (pRows[0]) productId = Number(pRows[0].id);
      }

      calculatedTotal += itemPrice * itemQty;
      normalizedItems.push({
        productId,
        name: itemName,
        price: itemPrice,
        quantity: itemQty,
      });
    }

    await connection.beginTransaction();

    // Insert into orders table (user_id is NULL for guest orders)
    const [orderRes] = await connection.execute<ResultSetHeader>(
      `INSERT INTO orders (
        user_id, guest_name, guest_email, guest_phone,
        shipping_address, total, status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        userId,
        guestName,
        guestEmail,
        guestPhone,
        shippingAddress,
        Number(calculatedTotal.toFixed(2)),
        paymentStatus,
      ]
    );

    const orderId = orderRes.insertId;

    // Insert order items and decrement stock
    for (const item of normalizedItems) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.name, item.price, item.quantity]
      );

      if (item.productId) {
        await connection.execute(
          `UPDATE products
           SET stock = GREATEST(0, stock - ?),
               in_stock = CASE WHEN GREATEST(0, stock - ?) > 0 THEN TRUE ELSE FALSE END
           WHERE id = ?`,
          [item.quantity, item.quantity, item.productId]
        );
      }
    }

    // Clear database cart for logged-in customer
    if (userId) {
      await connection.execute("DELETE FROM cart_items WHERE user_id = ?", [userId]);
    }

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        id: orderId,
        total: Number(calculatedTotal.toFixed(2)),
        status: "pending",
        payment_status: paymentStatus,
        is_guest: userId === null,
        message: "Order placed successfully.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    await connection.rollback();
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create order." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function GET(req: NextRequest) {
  await connection();
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin sees all orders (including guest orders labeled as Non-registered)
    if (authUser.role === "admin") {
      const orders = await fetchAllOrdersFromDb();
      return NextResponse.json(orders);
    }

    // Logged-in customer sees their own orders
    const myOrders = await fetchUserOrdersFromDb(authUser.id, authUser.email);
    return NextResponse.json(myOrders);
  } catch (error: any) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch orders." },
      { status: 500 }
    );
  }
}
