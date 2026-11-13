import Link from "next/link";
import { Plus } from "lucide-react";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import { getProducts } from "@/lib/admin/db";

const inr = (n: number | undefined | null) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default async function ProductsContent() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#052E1D]">Products</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-[#07552F] px-4 py-2 text-sm font-medium text-white hover:bg-[#052E1D]"
        >
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#E6EFE3] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#E6EFE3] text-[#052E1D]">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EFE3]">
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#5b6b60]">
                  No products found. Click &quot;Add product&quot; to create one.
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-[#052E1D]">
                  <Link href={`/admin/products/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#5b6b60]">{p.category}</td>
                <td className="px-4 py-3 text-[#052E1D]">{inr(p.price)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.stock <= 5 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {p.stock} in stock
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="rounded-md border border-[#E6EFE3] px-2.5 py-1 text-xs text-[#052E1D] hover:bg-[#F5F8F4]"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

