import { getOrders } from "@/lib/admin/db";

export default async function CustomersPage() {
  const orders = await getOrders();
  const map = new Map<string, { name: string; email: string; phone: string; orders: number; spent: number }>();
  for (const o of orders) {
    const c = map.get(o.email) ?? { name: o.customerName, email: o.email, phone: o.phone, orders: 0, spent: 0 };
    c.orders += 1;
    if (o.status !== "cancelled") c.spent += o.total;
    map.set(o.email, c);
  }
  const customers = [...map.values()].sort((a, b) => b.spent - a.spent);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#052E1D]">Customers</h1>
      <div className="overflow-x-auto rounded-lg border border-[#E6EFE3] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#E6EFE3] text-[#052E1D]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Total spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EFE3]">
            {customers.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[#5b6b60]">Customers appear after their first order.</td></tr>
            )}
            {customers.map((c) => (
              <tr key={c.email}>
                <td className="px-4 py-3 font-medium text-[#052E1D]">{c.name}</td>
                <td className="px-4 py-3 text-[#5b6b60]">{c.email}<br />{c.phone}</td>
                <td className="px-4 py-3">{c.orders}</td>
                <td className="px-4 py-3">₹{c.spent.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}