"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Edit3, Filter, Package, Trash2 } from "lucide-react";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import type { Product } from "@/lib/admin/types";

const inr = (n: number | undefined | null) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function ProductListClient({ initialProducts }: { initialProducts: Product[] }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  const categories = ["all", ...Array.from(new Set(initialProducts.map((p) => p.category)))];

  const filtered = initialProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#052E1D]">Products</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#5b6b60]">
            Manage store catalog, update pricing, edit inventory, and add new items.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07552F] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#052E1D] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-[#E6EFE3] bg-white p-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8BA894]" />
          <input
            type="text"
            placeholder="Search products or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#cfdccf]/70 bg-white py-2 pl-9 pr-3 text-sm text-[#052E1D] placeholder-[#8BA894] outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#8BA894] hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-[#cfdccf]/70 bg-white px-3 py-2 text-sm text-[#052E1D] outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Card List with Prominent Edit & Delete Buttons */}
      <div className="grid gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[#E6EFE3] bg-white p-8 text-center text-[#5b6b60]">
            <Package className="mx-auto h-8 w-8 text-[#8BA894]" />
            <p className="mt-2 text-sm">No products match your search.</p>
          </div>
        ) : (
          filtered.map((p) => {
            const hasValidImg = p.image && !imgErrorMap[p.id];
            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-xl border border-[#E6EFE3] bg-white p-3.5 shadow-xs transition hover:border-[#07552F]/40"
              >
                {/* Main product row */}
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#EBF3E8] border border-[#d6e5d2] flex items-center justify-center">
                    {hasValidImg ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                        onError={() => setImgErrorMap((m) => ({ ...m, [p.id]: true }))}
                      />
                    ) : (
                      <Package className="h-7 w-7 text-[#07552F]/60" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[#052E1D] leading-snug line-clamp-2">
                      {p.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#5b6b60]">{p.category}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-base font-bold text-[#07552F]">{inr(p.price)}</span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          p.stock <= 5 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.stock} in stock
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explicit, Full-width Action Buttons for Mobile */}
                <div className="mt-3.5 flex items-center gap-2 border-t border-[#F0F5EE] pt-3">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#07552F] py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#052E1D] active:scale-[0.98]"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit Product
                  </Link>

                  <DeleteProductButton id={p.id} name={p.name} buttonStyle="full" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop & Tablet Table View */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-[#E6EFE3] bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E6EFE3] bg-[#F5F8F4] text-[#052E1D]">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Product</th>
              <th className="px-5 py-3.5 font-semibold">Category</th>
              <th className="px-5 py-3.5 font-semibold">Price</th>
              <th className="px-5 py-3.5 font-semibold">Stock</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EFE3]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[#5b6b60]">
                  <Package className="mx-auto h-8 w-8 text-[#8BA894]" />
                  <p className="mt-2 text-sm">No products found matching your filter.</p>
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const hasValidImg = p.image && !imgErrorMap[p.id];
                return (
                  <tr key={p.id} className="transition hover:bg-[#F9FCF7]/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#EBF3E8] border border-[#d6e5d2] flex items-center justify-center">
                          {hasValidImg ? (
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="44px"
                              onError={() => setImgErrorMap((m) => ({ ...m, [p.id]: true }))}
                            />
                          ) : (
                            <Package className="h-5 w-5 text-[#07552F]/60" />
                          )}
                        </div>
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="font-medium text-[#052E1D] hover:text-[#07552F] hover:underline"
                        >
                          {p.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#5b6b60]">{p.category}</td>
                    <td className="px-5 py-3.5 font-semibold text-[#052E1D]">{inr(p.price)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.stock <= 5 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.stock} in stock
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfdccf] bg-white px-3 py-1.5 text-xs font-semibold text-[#07552F] shadow-2xs transition hover:bg-[#07552F] hover:text-white"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </Link>
                        <DeleteProductButton id={p.id} name={p.name} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
