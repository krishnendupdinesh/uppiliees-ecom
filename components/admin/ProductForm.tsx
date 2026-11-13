"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/admin/types";
import { api } from "@/lib/api";

type Props = { product?: Product };

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    category_id: 1,
    price: product?.price ?? 0,
    mrp: product?.mrp ?? 0,
    stock: product?.stock ?? 0,
    image: product?.image ?? "",
    description: product?.description ?? "",
    featured: product?.featured ?? false,
  });

  useEffect(() => {
    api<any[]>("/categories")
      .then((cats) => {
        setCategories(cats);
        if (product && cats.length > 0) {
          const match = cats.find((c) => c.slug === product.category || c.name === product.category);
          if (match) setForm((f) => ({ ...f, category_id: match.id }));
        } else if (cats.length > 0) {
          setForm((f) => ({ ...f, category_id: cats[0].id }));
        }
      })
      .catch(() => {});
  }, [product]);

  const set = (k: string, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name,
        category_id: Number(form.category_id),
        price: Number(form.price),
        mrp: Number(form.mrp),
        stock: Number(form.stock),
        image: form.image || undefined,
        description: form.description || undefined,
        featured: Boolean(form.featured),
      };

      if (product) {
        await api(`/products/${product.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not save the product");
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full rounded-md border border-[#cfdccf] bg-white px-3 py-2 text-sm outline-none focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20";
  const label = "mb-1 block text-sm font-medium text-[#052E1D]";

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-lg border border-[#E6EFE3] bg-white p-6">
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div>
        <label className={label}>Product name</label>
        <input
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className={input}
          placeholder="e.g. Pure Virgin Coconut Oil"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Category</label>
          <select
            value={form.category_id}
            onChange={(e) => set("category_id", Number(e.target.value))}
            className={input}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Stock units</label>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => set("stock", Number(e.target.value))}
            className={input}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Selling price (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => set("price", Number(e.target.value))}
            className={input}
          />
        </div>
        <div>
          <label className={label}>MRP (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={form.mrp}
            onChange={(e) => set("mrp", Number(e.target.value))}
            className={input}
          />
        </div>
      </div>

      <div>
        <label className={label}>Image URL or path</label>
        <input
          value={form.image}
          onChange={(e) => set("image", e.target.value)}
          placeholder="/products/sample.jpg"
          className={input}
        />
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={input}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[#052E1D]">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => set("featured", e.target.checked)}
          className="rounded border-[#cfdccf] text-[#07552F] focus:ring-[#07552F]"
        />
        Feature this product on the home page
      </label>

      <div className="flex gap-3 pt-2">
        <button
          disabled={saving}
          type="submit"
          className="rounded-md bg-[#07552F] px-5 py-2 text-sm font-medium text-white hover:bg-[#052E1D] disabled:opacity-60"
        >
          {saving ? "Saving..." : product ? "Update product" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-[#cfdccf] px-5 py-2 text-sm font-medium text-[#052E1D] hover:bg-[#F5F8F4]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
