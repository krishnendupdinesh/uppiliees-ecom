import { connection } from "next/server";
import CouponsClient from "./CouponsClient";
import { getCoupons } from "@/lib/admin/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Discount Coupons | Uppilies Admin" };

export default async function AdminCouponsPage() {
  await connection();
  const coupons = await getCoupons();

  return <CouponsClient initialCoupons={coupons} />;
}
