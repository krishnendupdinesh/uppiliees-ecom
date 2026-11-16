import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import { getOrders } from "@/lib/admin/db";

export default async function OrdersContent() {
  const orders = (await getOrders()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#052E1D]">Orders</h1>
      <div className="overflow-x-auto rounded-lg border border-[#E6EFE3] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#E6EFE3] text-[#052E1D]">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EFE3]">
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#5b6b60]">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#052E1D]">#{o.id}</div>
                  <div className="text-xs text-[#8BA894]">
                    {new Date(o.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#052E1D]">{o.customerName}</span>
                    {o.isGuest && (
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        Non-registered
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#5b6b60]">{o.email}</div>
                  <div className="text-xs text-[#5b6b60]">{o.phone}</div>
                  <div className="text-xs text-[#5b6b60]">{o.address}</div>
                </td>
                <td className="px-4 py-3">
                  {o.items.map((i, idx) => (
                    <div key={idx}>
                      {i.qty} × {i.name} (₹{Number(i.price || 0).toLocaleString("en-IN")})
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3 font-medium">
                  ₹{Number(o.total || 0).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusSelect id={o.id} status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
