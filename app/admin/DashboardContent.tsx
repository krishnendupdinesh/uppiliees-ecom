import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import { getOrders, getProducts } from "@/lib/admin/db";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function DashboardContent() {
  const [products, orders] = await Promise.all([getProducts(), getOrders()]);
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const lowStock = products.filter((p) => p.stock <= 5);
  const recent = orders.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-[#052E1D]">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={inr(revenue)} hint="Excludes cancelled orders" />
        <StatCard label="Orders" value={orders.length} hint={`${pending} waiting to be packed`} />
        <StatCard label="Products" value={products.length} />
        <StatCard label="Low stock" value={lowStock.length} hint="5 units or fewer" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-[#E6EFE3] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-[#052E1D]">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-[#07552F] hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-[#5b6b60]">No orders yet. They appear here as customers check out.</p>
          ) : (
            <ul className="divide-y divide-[#E6EFE3]">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{o.id} · {o.customerName}</span>
                  <span className="text-[#5b6b60]">{inr(o.total)} · <span className="capitalize">{o.status}</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-[#E6EFE3] bg-white p-5">
          <h2 className="mb-3 font-medium text-[#052E1D]">Needs restocking</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-[#5b6b60]">Every product has more than 5 units in stock.</p>
          ) : (
            <ul className="divide-y divide-[#E6EFE3]">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="hover:underline">{p.name}</Link>
                  <span className={p.stock === 0 ? "font-medium text-red-600" : "text-amber-700"}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
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

