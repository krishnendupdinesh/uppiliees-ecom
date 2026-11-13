"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check, Sparkles, AlertCircle, Package } from "lucide-react";
import type { Product } from "@/lib/admin/types";
import { api } from "@/lib/api";

type Props = { product?: Product };

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);

  const [form, setForm] = useState({
    name: product?.name ?? "",
    category_id: 1,
    category_name: product?.category ?? "",
    price: product?.price ?? 0,
    mrp: product?.mrp ?? 0,
    stock: product?.stock ?? 25,
    image: product?.image ?? "",
    description: product?.description ?? "",
    featured: product?.featured ?? false,
  });

  useEffect(() => {
    api<any[]>("/api/categories")
      .then((cats) => {
        setCategories(cats);
        if (product && cats.length > 0) {
          const match = cats.find(
            (c) => c.slug === product.category || c.name === product.category
          );
          if (match) {
            setForm((f) => ({ ...f, category_id: match.id, category_name: match.name }));
          }
        } else if (cats.length > 0) {
          setForm((f) => ({ ...f, category_id: cats[0].id, category_name: cats[0].name }));
        }
      })
      .catch(() => {});
  }, [product]);

  const set = (k: string, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const selectedCat = categories.find((c) => c.id === Number(form.category_id));
      const payload = {
        name: form.name.trim(),
        category_id: Number(form.category_id),
        category_name: selectedCat?.name || form.category_name || "General",
        price: Number(form.price),
        mrp: Number(form.mrp || form.price),
        stock: Number(form.stock),
        image: form.image.trim() || undefined,
        description: form.description.trim() || undefined,
        featured: Boolean(form.featured),
      };

      if (product) {
        await api(`/api/products/${product.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err.message || "Could not save the product. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#cfdccf]/80 bg-white px-4 py-2.5 text-sm text-[#052E1D] outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20";
  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#052E1D]";

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Top action header for convenience */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#07552F] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to products
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="rounded-xl border border-[#cfdccf] bg-white px-4 py-2.5 text-sm font-medium text-[#052E1D] transition hover:bg-[#F5F8F4]"
          >
            Cancel
          </button>
          <button
            disabled={saving || success}
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07552F] px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#052E1D] disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              "Saving..."
            ) : success ? (
              <>
                <Check className="h-4 w-4" /> Saved!
              </>
            ) : product ? (
              "Update Product"
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Column: Essential Details */}
        <div className="space-y-5 rounded-2xl border border-[#E6EFE3] bg-white p-5 sm:p-7 shadow-xs">
          <div>
            <label className={labelClass}>Product Title *</label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Traditional Kerala Handloom Saree"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category *</label>
              <select
                value={form.category_id}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const found = categories.find((c) => c.id === id);
                  setForm((f) => ({ ...f, category_id: id, category_name: found?.name || "" }));
                }}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Available Stock Units *</label>
              <input
                type="number"
                min="0"
                required
                value={form.stock}
                onChange={(e) => set("stock", Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Selling Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => set("price", Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Original MRP (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.mrp}
                onChange={(e) => set("mrp", Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Product Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the material, benefits, or traditional craftsmanship..."
              className={inputClass}
            />
          </div>
        </div>

        {/* Right Column: Image & Settings */}
        <div className="space-y-5">
          {/* Image Card & Live Preview */}
          <div className="rounded-2xl border border-[#E6EFE3] bg-white p-5 shadow-xs space-y-4">
            <label className={labelClass}>Product Image</label>
            
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F5F8F4] border border-[#E6EFE3] flex items-center justify-center">
              {form.image ? (
                <Image
                  src={form.image}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#8BA894] p-4 text-center">
                  <Package className="h-10 w-10 mb-2 stroke-1" />
                  <span className="text-xs">No image provided</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-[#5b6b60] mb-1 block">Image URL or Local Path</label>
              <input
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
                placeholder="/products/sample.jpg"
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-[#8BA894]">
                Accepts local paths (e.g. <code>/products/...jpg</code>) or remote web URLs.
              </p>
            </div>
          </div>

          {/* Visibility & Feature */}
          <div className="rounded-2xl border border-[#E6EFE3] bg-white p-5 shadow-xs">
            <label className={labelClass}>Badges & Visibility</label>
            <label className="mt-2 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#cfdccf] text-[#07552F] focus:ring-[#07552F]"
              />
              <div>
                <span className="text-sm font-semibold text-[#052E1D] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Featured Product
                </span>
                <p className="text-xs text-[#5b6b60] mt-0.5">
                  Highlight this product on the homepage bestsellers and collection showcases.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
