import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { fetchUserOrdersFromDb } from "@/lib/orders-db";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await fetchUserOrdersFromDb(authUser.id, authUser.email);
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("GET /api/orders/mine error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch orders." },
      { status: 500 }
    );
  }
}
