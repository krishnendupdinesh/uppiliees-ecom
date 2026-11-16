import Link from "next/link";
import { connection } from "next/server";
import { AlertTriangle, Users, Eye, ShoppingCart, UserCheck, UserX } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import VisitorChart from "@/components/admin/VisitorChart";
import {
  getAdminStats,
  getOrders,
  getProducts,
  getVisitorAnalytics,
} from "@/lib/admin/db";

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default async function DashboardContent() {
  await connection();
  const [products, orders, stats, analytics] = await Promise.all([
    getProducts(),
    getOrders(),
    getAdminStats(),
    getVisitorAnalytics(),
  ]);

  const computedRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const revenue = Number((stats as any)?.revenue ?? computedRevenue);
  const totalOrdersCount = Number((stats as any)?.totalOrders ?? orders.length);
  const totalProductsCount = Number((stats as any)?.productsCount ?? products.length);
  const totalUsersCount = Number(analytics?.registeredUsers ?? (stats as any)?.usersCount ?? 0);
  const guestOrdersCount = Number(analytics?.guestOrders ?? (stats as any)?.guestOrdersCount ?? 0);
  const registeredOrdersCount = Number(analytics?.registeredOrders ?? 0);

  const totalVisitors = Number(analytics?.totalVisitors ?? (stats as any)?.totalVisitors ?? 0);
  const guestVisitors = Number(analytics?.guestVisitors ?? 0);
  const visitorsToday = Number(analytics?.visitorsToday ?? (stats as any)?.visitorsToday ?? 0);

  const pending = orders.filter((o) => o.status === "pending").length;
  const lowStock = products.filter((p) => p.stock <= 5);
  const outOfStock = products.filter((p) => p.stock === 0 || !p.in_stock);

  const recent = orders
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#052E1D]">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#5b6b60]">
            Overview of store performance, visitor analytics, inventory alerts, and recent orders.
          </p>
        </div>
      </div>

      {/* ── LOW STOCK ALERT BANNER ────────────────────────── */}
      {lowStock.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-950">
                Low Stock Alert ({lowStock.length} {lowStock.length === 1 ? "product" : "products"})
              </h2>
              <p className="text-xs text-amber-800">
                {outOfStock.length > 0 && (
                  <span className="font-semibold text-red-700 mr-1.5">
                    {outOfStock.length} completely out of stock.
                  </span>
                )}
                {lowStock.length - outOfStock.length > 0 && (
                  <span>
                    {lowStock.length - outOfStock.length} items have 5 or fewer units left.
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link
            href="/admin/products"
            className="rounded-lg bg-amber-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition whitespace-nowrap"
          >
            Review inventory
          </Link>
        </div>
      )}

      {/* ── VISITOR ANALYTICS CARDS (Requirement 4) ──────────── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#052E1D]/70 mb-3">
          Visitor Analytics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-[#E6EFE3] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#5b6b60] mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Visitors</span>
              <Eye className="h-4 w-4 text-[#07552F]" />
            </div>
            <div className="text-2xl font-bold text-[#052E1D]">{totalVisitors.toLocaleString()}</div>
            <div className="text-[11px] text-[#5b6b60] mt-1">Unique visitor sessions tracked</div>
          </div>

          <div className="rounded-xl border border-[#E6EFE3] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#5b6b60] mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">Guest Visitors</span>
              <UserX className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-[#052E1D]">{guestVisitors.toLocaleString()}</div>
            <div className="text-[11px] text-amber-800 mt-1">Non-logged-in visitors</div>
          </div>

          <div className="rounded-xl border border-[#E6EFE3] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#5b6b60] mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered Users</span>
              <UserCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-[#052E1D]">{totalUsersCount.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-800 mt-1">Verified customer accounts</div>
          </div>

          <div className="rounded-xl border border-[#E6EFE3] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#5b6b60] mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">Visitors Today</span>
              <Users className="h-4 w-4 text-[#07552F]" />
            </div>
            <div className="text-2xl font-bold text-[#052E1D]">{visitorsToday.toLocaleString()}</div>
            <div className="text-[11px] text-[#5b6b60] mt-1">Active visits since midnight</div>
          </div>

          <div className="rounded-xl border border-[#E6EFE3] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#5b6b60] mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">Orders Ratio</span>
              <ShoppingCart className="h-4 w-4 text-[#07552F]" />
            </div>
            <div className="text-lg font-bold text-[#052E1D]">
              {guestOrdersCount} <span className="text-xs font-normal text-[#5b6b60]">guest</span> /{" "}
              {registeredOrdersCount} <span className="text-xs font-normal text-[#5b6b60]">reg</span>
            </div>
            <div className="text-[11px] text-[#5b6b60] mt-1">Guest vs Registered orders</div>
          </div>
        </div>
      </div>

      {/* ── VISITOR CHART ────────────────────────────────────── */}
      <VisitorChart initialHistory={analytics?.history || []} />

      {/* ── STORE STATS ──────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#052E1D]/70 mb-3">
          Store Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Revenue" value={inr(revenue)} hint="Excludes cancelled orders" />
          <StatCard label="Total Orders" value={totalOrdersCount} hint={`${pending} waiting to be packed`} />
          <StatCard label="Store Products" value={totalProductsCount} hint={`${lowStock.length} need restocking`} />
          <StatCard
            label="Total Customers"
            value={totalUsersCount}
            hint={`${guestOrdersCount} non-registered guest orders`}
          />
        </div>
      </div>

      {/* ── RECENT ORDERS & RESTOCKING GRIDS ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[#E6EFE3] bg-white p-5 shadow-xs">
          <div className="mb-3.5 flex items-center justify-between border-b border-[#E6EFE3] pb-3">
            <div>
              <h2 className="font-semibold text-[#052E1D]">Recent Orders</h2>
              <p className="text-xs text-[#5b6b60]">Latest transactions placed on the store</p>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-[#07552F] hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-[#5b6b60] py-6 text-center">
              No orders yet. Orders will appear here as customers check out.
            </p>
          ) : (
            <ul className="divide-y divide-[#E6EFE3]">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium text-[#052E1D]">
                      #{o.id} · {o.customerName}
                    </div>
                    <div className="text-xs text-[#8BA894]">
                      {o.isGuest ? "Guest Order" : "Registered User"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[#052E1D]">{inr(o.total)}</div>
                    <div className="text-xs capitalize text-[#5b6b60]">{o.status}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-[#E6EFE3] bg-white p-5 shadow-xs">
          <div className="mb-3.5 flex items-center justify-between border-b border-[#E6EFE3] pb-3">
            <div>
              <h2 className="font-semibold text-[#052E1D]">Needs Restocking</h2>
              <p className="text-xs text-[#5b6b60]">Products with 5 or fewer items remaining</p>
            </div>
            <Link href="/admin/products" className="text-xs font-semibold text-[#07552F] hover:underline">
              Manage stock
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-[#5b6b60] py-6 text-center">
              Every product has healthy stock levels (more than 5 units).
            </p>
          ) : (
            <ul className="divide-y divide-[#E6EFE3]">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="hover:underline font-medium text-[#052E1D]">
                    {p.name}
                  </Link>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.stock === 0
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {p.stock === 0 ? "Out of stock" : `${p.stock} units left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
