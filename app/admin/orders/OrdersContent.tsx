import { connection } from "next/server";
import OrdersClient from "./OrdersClient";
import { getOrders } from "@/lib/admin/db";

export default async function OrdersContent() {
  await connection();
  const orders = (await getOrders()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return <OrdersClient initialOrders={orders} />;
}
