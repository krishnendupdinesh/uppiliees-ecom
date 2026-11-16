import { getUsersAndCustomers } from "@/lib/admin/db";

export default async function CustomersContent() {
  const customers = await getUsersAndCustomers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#052E1D]">Customers &amp; Users</h1>
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
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#5b6b60]">
                  Customers appear after registering or placing their first order.
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-[#052E1D]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{c.name}</span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        c.isGuest
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {c.isGuest ? "Non-registered" : "Registered"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#5b6b60]">
                  {c.email}
                  {c.phone ? (
                    <>
                      <br />
                      {c.phone}
                    </>
                  ) : null}
                </td>
                <td className="px-4 py-3">{c.orders}</td>
                <td className="px-4 py-3">
                  ₹{Number(c.spent || 0).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
