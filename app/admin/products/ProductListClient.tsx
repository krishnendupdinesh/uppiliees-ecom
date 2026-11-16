"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit3,
  Filter,
  Package,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Check,
  X,
  Save,
} from "lucide-react";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import Modal, { ConfirmModal, AlertModal } from "@/components/admin/Modal";
import type { Product } from "@/lib/admin/types";
import { optimizeCloudinaryUrl } from "@/lib/format";
import { api } from "@/lib/api";

const inr = (n: number | undefined | null) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function ProductListClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── REORDER MODE STATE ─────────────────────────────────────────
  const [isReordering, setIsReordering] = useState(false);
  const [reorderList, setReorderList] = useState<Product[]>([]);
  const [isSavingReorder, setIsSavingReorder] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [moveToInputs, setMoveToInputs] = useState<Record<string, string>>({});

  // ── MODALS STATE ───────────────────────────────────────────────
  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    message: string;
    variant?: "success" | "error";
  } | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const categories = [
    "all",
    ...Array.from(
      new Set([
        "Herbal & Beauty",
        "Traditional Food",
        "Handloom",
        ...products.map((p) => p.category).filter(Boolean),
      ])
    ),
  ];

  // Enter Reorder mode: filter products by category and sort by display_order
  function startReorder() {
    const list = products
      .filter((p) => selectedCategory === "all" || p.category === selectedCategory)
      .slice()
      .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999));
    setReorderList(list);
    setIsReordering(true);
  }

  function cancelReorder() {
    setIsReordering(false);
    setReorderList([]);
    setMoveToInputs({});
  }

  // Move product up by 1 position
  function moveUp(index: number) {
    if (index === 0) return;
    const nextList = [...reorderList];
    const item = nextList.splice(index, 1)[0];
    nextList.splice(index - 1, 0, item);
    setReorderList(nextList);
  }

  // Move product down by 1 position
  function moveDown(index: number) {
    if (index === reorderList.length - 1) return;
    const nextList = [...reorderList];
    const item = nextList.splice(index, 1)[0];
    nextList.splice(index + 1, 0, item);
    setReorderList(nextList);
  }

  // Move product to an explicit 1-based position (e.g. move position 15 to 1)
  function moveToPosition(index: number, targetPos: number) {
    if (!Number.isFinite(targetPos)) return;
    const cleanTarget = Math.max(1, Math.min(reorderList.length, Math.floor(targetPos))) - 1;
    if (cleanTarget === index) return;

    const nextList = [...reorderList];
    const item = nextList.splice(index, 1)[0];
    nextList.splice(cleanTarget, 0, item);
    setReorderList(nextList);
  }

  // HTML5 Drag and drop handlers
  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
  }

  function handleDrop(targetIndex: number) {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }
    const nextList = [...reorderList];
    const item = nextList.splice(draggedIndex, 1)[0];
    nextList.splice(targetIndex, 0, item);
    setReorderList(nextList);
    setDraggedIndex(null);
  }

  // Save the reordered list to backend PUT /api/admin/products/reorder
  async function saveReorderedOrder() {
    setIsSavingReorder(true);
    try {
      const productIds = reorderList.map((p) => p.id);
      await api("/api/admin/products/reorder", {
        method: "PUT",
        body: JSON.stringify({ productIds }),
      });

      // Update local products state with new display_order
      setProducts((prev) => {
        const orderMap = new Map<string, number>();
        productIds.forEach((id, idx) => orderMap.set(String(id), idx + 1));

        return prev
          .map((p) => {
            const newOrder = orderMap.get(String(p.id));
            return newOrder !== undefined ? { ...p, display_order: newOrder } : p;
          })
          .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999));
      });

      setIsReordering(false);
      setShowSaveConfirm(false);
      setAlertInfo({
        title: "Order Saved",
        message: "Product display order has been saved successfully and is live on the store.",
        variant: "success",
      });
    } catch (err: any) {
      setAlertInfo({
        title: "Error",
        message: err.message || "Failed to save product order.",
        variant: "error",
      });
    } finally {
      setIsSavingReorder(false);
    }
  }

  // Quick toggle for Show / Hide on Website (is_active)
  async function handleToggleActive(p: Product) {
    const nextActive = !(p.is_active ?? true);
    setTogglingId(p.id);
    try {
      await api(`/api/products/${p.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: nextActive }),
      });
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, is_active: nextActive } : item))
      );
    } catch (err: any) {
      setAlertInfo({
        title: "Error",
        message: err.message || "Failed to update visibility status.",
        variant: "error",
      });
    } finally {
      setTogglingId(null);
    }
  }

  // Filtered products list for view mode
  const filtered = products.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
      (p.slug && p.slug.toLowerCase().includes(q));

    const matchesCat = selectedCategory === "all" || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === "in_stock") {
      matchesStock = Boolean(p.in_stock && p.stock > 0);
    } else if (stockFilter === "low_stock") {
      matchesStock = p.stock > 0 && p.stock <= 5;
    } else if (stockFilter === "out_of_stock") {
      matchesStock = !p.in_stock || p.stock <= 0;
    }

    return matchesSearch && matchesCat && matchesStock;
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#052E1D]">
            Products ({isReordering ? reorderList.length : filtered.length})
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#5b6b60]">
            {isReordering
              ? "Reorder mode active: drag items, move up/down, or jump to position to control product order on the store."
              : "Manage store catalog, update pricing, edit inventory, upload images, and control display position."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isReordering ? (
            <>
              <button
                type="button"
                onClick={cancelReorder}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#cfdccf] bg-white px-3.5 py-2 text-xs font-semibold text-[#052E1D] hover:bg-gray-50 transition cursor-pointer"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowSaveConfirm(true)}
                disabled={isSavingReorder}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#07552F] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#052E1D] transition cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> Save Order
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startReorder}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#07552F] bg-[#F5F8F4] px-3.5 py-2 text-xs font-semibold text-[#07552F] shadow-xs hover:bg-[#E6EFE3] transition cursor-pointer"
              >
                <ArrowUpDown className="h-4 w-4" /> Reorder Products
              </button>
              <Link
                href="/admin/products/new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07552F] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#052E1D] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" /> Add product
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── REORDER MODE VIEW ──────────────────────────────────── */}
      {isReordering ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E6EFE3] bg-white p-3.5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#052E1D]">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  const nextCat = e.target.value;
                  const list = products
                    .filter((p) => nextCat === "all" || p.category === nextCat)
                    .slice()
                    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999));
                  setReorderList(list);
                }}
                className="rounded-lg border border-[#cfdccf] bg-white px-3 py-1.5 text-xs font-semibold text-[#052E1D] outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-[#5b6b60]">
              Showing {reorderList.length} products. Items at the top appear first on the customer shop pages.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E6EFE3] bg-white shadow-xs">
            <div className="divide-y divide-[#E6EFE3]">
              {reorderList.map((p, index) => {
                const thumbUrl = optimizeCloudinaryUrl(p.image, 80);
                const isDragging = draggedIndex === index;

                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors ${
                      isDragging ? "bg-emerald-50 opacity-50" : "hover:bg-[#F5F8F4]/60"
                    }`}
                  >
                    {/* Left: Drag Handle, Position Badge, Thumbnail & Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-700 p-1"
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-5 w-5" />
                      </div>

                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E6EFE3] text-xs font-bold text-[#052E1D]">
                        #{index + 1}
                      </span>

                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#EBF3E8] border border-[#d6e5d2]">
                        {thumbUrl ? (
                          <Image src={thumbUrl} alt={p.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <Package className="h-5 w-5 m-auto text-[#07552F]/60" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[#052E1D] truncate max-w-xs sm:max-w-md">
                          {p.name}
                        </div>
                        <div className="text-xs text-[#5b6b60]">
                          {p.category} · {inr(p.price)}
                        </div>
                      </div>
                    </div>

                    {/* Right: Step Controls (Up, Down, Jump to Position) */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        title="Move Up"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#cfdccf] bg-white text-[#052E1D] hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === reorderList.length - 1}
                        title="Move Down"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#cfdccf] bg-white text-[#052E1D] hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>

                      <div className="flex items-center gap-1 ml-2">
                        <span className="text-[11px] text-[#5b6b60]">Move to:</span>
                        <input
                          type="number"
                          min={1}
                          max={reorderList.length}
                          placeholder={String(index + 1)}
                          value={moveToInputs[p.id] || ""}
                          onChange={(e) =>
                            setMoveToInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const pos = Number(moveToInputs[p.id]);
                              if (pos) moveToPosition(index, pos);
                            }
                          }}
                          className="h-8 w-14 rounded-lg border border-[#cfdccf] bg-white px-2 text-center text-xs text-[#052E1D] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const pos = Number(moveToInputs[p.id]);
                            if (pos) moveToPosition(index, pos);
                          }}
                          className="h-8 rounded-lg bg-[#07552F] px-2.5 text-xs font-semibold text-white hover:bg-[#052E1D] transition cursor-pointer"
                        >
                          Go
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ── STANDARD VIEW MODE ───────────────────────────────── */
        <>
          {/* Filter and Search Bar */}
          <div className="grid gap-2.5 rounded-xl border border-[#E6EFE3] bg-white p-3 sm:grid-cols-[1fr_auto_auto] shadow-xs">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8BA894]" />
              <input
                type="text"
                placeholder="Search products by name, slug, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#cfdccf]/70 bg-white py-2 pl-9 pr-3 text-sm text-[#052E1D] placeholder-[#8BA894] outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-[#cfdccf]/70 bg-white px-3 py-2 text-sm text-[#052E1D] outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Filter (Requirement 7) */}
            <div className="relative">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="w-full rounded-lg border border-[#cfdccf]/70 bg-white px-3 py-2 text-sm text-[#052E1D] outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20 cursor-pointer"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock (&gt; 5)</option>
                <option value="low_stock">Low Stock (≤ 5)</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="grid gap-3 md:hidden">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-[#E6EFE3] bg-white p-8 text-center text-[#5b6b60]">
                <Package className="mx-auto h-8 w-8 text-[#8BA894]" />
                <p className="mt-2 text-sm">No products match your filter.</p>
              </div>
            ) : (
              filtered.map((p) => {
                const thumbUrl = optimizeCloudinaryUrl(p.image, 120);
                const hasValidImg = Boolean(thumbUrl) && !imgErrorMap[p.id];
                const isActive = p.is_active ?? true;

                return (
                  <div
                    key={p.id}
                    className="overflow-hidden rounded-xl border border-[#E6EFE3] bg-white p-3.5 shadow-xs transition hover:border-[#07552F]/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#EBF3E8] border border-[#d6e5d2] flex items-center justify-center">
                        {hasValidImg ? (
                          <Image
                            src={thumbUrl}
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
                        <p className="mt-0.5 text-xs text-[#5b6b60]">
                          {p.category}
                          {p.subcategory && p.subcategory !== p.category ? ` • ${p.subcategory}` : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-base font-bold text-[#07552F]">{inr(p.price)}</span>
                          {/* Stock Badges */}
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              !p.in_stock || p.stock <= 0
                                ? "bg-red-100 text-red-700"
                                : p.stock <= 5
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {!p.in_stock || p.stock <= 0
                              ? "Out of stock"
                              : p.stock <= 5
                              ? `Low stock (${p.stock})`
                              : `${p.stock} in stock`}
                          </span>

                          {/* Toggle Active Badge */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(p)}
                            disabled={togglingId === p.id}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold cursor-pointer ${
                              isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {isActive ? "Visible" : "Hidden (Draft)"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-center gap-2 border-t border-[#F0F5EE] pt-3">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#07552F] py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#052E1D] active:scale-[0.98]"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit Product
                      </Link>

                      <DeleteProductButton
                        id={p.id}
                        name={p.name}
                        buttonStyle="full"
                        onDeleted={(delId) =>
                          setProducts((prev) => prev.filter((item) => item.id !== delId))
                        }
                      />
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
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EFE3]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[#5b6b60]">
                      <Package className="mx-auto h-8 w-8 text-[#8BA894]" />
                      <p className="mt-2 text-sm">No products found matching your filter.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const thumbUrl = optimizeCloudinaryUrl(p.image, 120);
                    const hasValidImg = Boolean(thumbUrl) && !imgErrorMap[p.id];
                    const isActive = p.is_active ?? true;

                    return (
                      <tr key={p.id} className="transition hover:bg-[#F9FCF7]/70">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#EBF3E8] border border-[#d6e5d2] flex items-center justify-center">
                              {hasValidImg ? (
                                <Image
                                  src={thumbUrl}
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
                            <div className="min-w-0">
                              <Link
                                href={`/admin/products/${p.id}`}
                                className="font-medium text-[#052E1D] hover:text-[#07552F] hover:underline block truncate max-w-xs"
                              >
                                {p.name}
                              </Link>
                              {p.subcategory && (
                                <span className="text-xs text-[#8BA894]">{p.subcategory}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[#5b6b60]">{p.category}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-[#052E1D]">{inr(p.price)}</span>
                          {p.mrp > p.price && (
                            <span className="ml-1.5 text-xs text-[#8BA894] line-through">
                              {inr(p.mrp)}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              !p.in_stock || p.stock <= 0
                                ? "bg-red-100 text-red-700"
                                : p.stock <= 5
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {!p.in_stock || p.stock <= 0
                              ? "Out of stock"
                              : p.stock <= 5
                              ? `Low stock (${p.stock})`
                              : `${p.stock} in stock`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(p)}
                            disabled={togglingId === p.id}
                            title="Click to toggle Visible / Hidden (draft)"
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                              isActive
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {isActive ? (
                              <>
                                <Eye className="h-3.5 w-3.5" /> Visible
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3.5 w-3.5" /> Hidden (Draft)
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfdccf] bg-white px-3 py-1.5 text-xs font-semibold text-[#07552F] shadow-2xs transition hover:bg-[#07552F] hover:text-white"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Edit
                            </Link>
                            <DeleteProductButton
                              id={p.id}
                              name={p.name}
                              onDeleted={(delId) =>
                                setProducts((prev) => prev.filter((item) => item.id !== delId))
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CONFIRM SAVE ORDER MODAL ──────────────────────────── */}
      <ConfirmModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={saveReorderedOrder}
        title="Save Product Order"
        message={
          <div>
            <p>
              Are you sure you want to save this new product display order?
            </p>
            <p className="mt-2 text-xs text-[#5b6b60]">
              The products on customer-facing catalog pages will immediately reflect this arrangement.
            </p>
          </div>
        }
        confirmText="Save New Order"
        loading={isSavingReorder}
      />

      {/* ── ALERT MODAL ───────────────────────────────────────── */}
      <AlertModal
        isOpen={Boolean(alertInfo)}
        onClose={() => setAlertInfo(null)}
        title={alertInfo?.title}
        message={alertInfo?.message || ""}
        variant={alertInfo?.variant}
      />
    </div>
  );
}
