"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  Sparkles,
  AlertCircle,
  Package,
  Upload,
  FileText,
  HelpCircle,
  Plus,
  Trash2,
} from "lucide-react";
import type { Product } from "@/lib/admin/types";
import { api } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";

type Props = { product?: Product };

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);

  const [form, setForm] = useState({
    name: product?.name ?? "",
    category_id: product?.category_id ?? 1,
    category_name: product?.category ?? "",
    subcategory: product?.subcategory ?? product?.category ?? "",
    price: product?.price ?? 0,
    mrp: product?.mrp ?? 0,
    stock: product?.stock ?? 25,
    in_stock: product?.in_stock ?? (product ? product.stock > 0 : true),
    image: product?.image ?? "",
    publicId: product?.publicId ?? "",
    images: (product?.images && product.images.length > 0 ? product.images : [product?.image ?? ""]).slice(0, 4),
    imagePublicIds: (product?.imagePublicIds && product.imagePublicIds.length > 0
      ? product.imagePublicIds
      : [product?.publicId ?? ""]
    ).slice(0, 4),
    description: product?.description ?? "",
    featured: product?.featured ?? false,

    // Multiple Sizes and separate pricing
    sizes: (product?.sizes && product.sizes.length > 0
      ? product.sizes
      : []
    ) as { size: string; price: number; mrp?: number; stock?: number }[],

    // Rich descriptive sections
    benefits: product?.benefits ?? "",
    howToUse: product?.howToUse ?? "",
    ingredients: product?.ingredients ?? "",
    returnPolicy: product?.returnPolicy ?? "",
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

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // Handle Cloudinary image upload completion for a specific photo slot
  const handleImageUploaded = (idx: number, url: string, publicId: string) => {
    setForm((prev) => {
      const updatedImages = [...(prev.images || [])];
      const updatedPublicIds = [...(prev.imagePublicIds || [])];
      updatedImages[idx] = url;
      updatedPublicIds[idx] = publicId;

      return {
        ...prev,
        images: updatedImages,
        imagePublicIds: updatedPublicIds,
        ...(idx === 0 ? { image: url, publicId } : {}),
      };
    });
  };

  // Handle clearing/removing a photo slot
  const handleImageRemoved = (idx: number) => {
    setForm((prev) => {
      const updatedImages = [...(prev.images || [])];
      const updatedPublicIds = [...(prev.imagePublicIds || [])];
      updatedImages[idx] = "";
      updatedPublicIds[idx] = "";

      return {
        ...prev,
        images: updatedImages,
        imagePublicIds: updatedPublicIds,
        ...(idx === 0
          ? { image: updatedImages[1] || "", publicId: updatedPublicIds[1] || "" }
          : {}),
      };
    });
  };

  const handleFileUpload = (field: "description" | "benefits" | "howToUse" | "ingredients" | "returnPolicy") => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (typeof text === "string") {
          set(field, text);
        }
      };
      reader.readAsText(file);
      // Reset input value so re-uploading the same file triggers change
      e.target.value = "";
    };
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const selectedCat = categories.find((c) => c.id === Number(form.category_id));
      const imageList = (form.images || []).map((s) => s.trim()).filter(Boolean);
      const publicIdList = (form.imagePublicIds || []).map((s) => (s || "").trim());
      const primaryImage = imageList[0] || form.image.trim() || undefined;
      const primaryPublicId = publicIdList[0] || form.publicId.trim() || undefined;

      const validSizes = (form.sizes || [])
        .filter((s) => s.size.trim())
        .map((s) => ({
          size: s.size.trim(),
          price: Number(s.price),
          mrp: s.mrp ? Number(s.mrp) : Number(s.price),
          stock: s.stock !== undefined ? Number(s.stock) : Number(form.stock),
        }));

      const payload = {
        name: form.name.trim(),
        category_id: Number(form.category_id),
        category_name: selectedCat?.name || form.category_name || "General",
        subcategory: (form.subcategory || selectedCat?.name || form.category_name || "General").trim(),
        price: validSizes.length > 0 ? validSizes[0].price : Number(form.price || 0),
        mrp: validSizes.length > 0 ? (validSizes[0].mrp || validSizes[0].price) : Number(form.mrp || form.price || 0),
        stock: form.in_stock ? Number(form.stock ?? 0) : 0,
        in_stock: Boolean(form.in_stock) && Number(form.stock ?? 0) > 0,
        image: primaryImage,
        image_url: primaryImage,
        publicId: primaryPublicId,
        image_public_id: primaryPublicId,
        images: imageList.length > 0 ? imageList : primaryImage ? [primaryImage] : [],
        imagePublicIds: publicIdList,
        description: form.description.trim() || undefined,
        featured: Boolean(form.featured),

        sizes: validSizes,
        benefits: form.benefits.trim() || undefined,
        howToUse: form.howToUse.trim() || undefined,
        ingredients: form.ingredients.trim() || undefined,
        returnPolicy: form.returnPolicy.trim() || undefined,
      };

      const requestBody = JSON.stringify(payload);

      if (product) {
        await api(`/api/products/${product.id}`, {
          method: "PUT",
          body: requestBody,
        });
      } else {
        await api("/api/products", {
          method: "POST",
          body: requestBody,
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
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-[#052E1D]";

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Top action header */}
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

      {/* Main Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
        {/* Left Column: Essential & Detailed Specifications */}
        <div className="space-y-6">
          {/* General Information Card */}
          <div className="space-y-5 rounded-2xl border border-[#E6EFE3] bg-white p-5 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-[#052E1D] border-b border-[#F0F5EE] pb-3">
              Basic Product Details
            </h2>

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
                  onChange={(e) => {
                    const nextStock = Number(e.target.value);
                    setForm((f) => ({
                      ...f,
                      stock: nextStock,
                      in_stock: nextStock > 0 ? f.in_stock : false,
                    }));
                  }}
                  className={inputClass}
                />
              </div>
            </div>

            {/* In Stock / Out of Stock Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-[#E6EFE3] bg-[#F9FCF8] px-4 py-3">
              <div>
                <span className="text-sm font-bold text-[#052E1D]">
                  Stock Availability Status
                </span>
                <p className="text-xs text-[#5b6b60]">
                  Mark this product as In Stock or Out of Stock on the store.
                </p>
              </div>
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.in_stock && form.stock > 0)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm((f) => ({
                      ...f,
                      in_stock: checked,
                      stock: checked && f.stock <= 0 ? 25 : f.stock,
                    }));
                  }}
                  className="h-4 w-4 rounded border-[#cfdccf] text-[#07552F] focus:ring-[#07552F]"
                />
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    form.in_stock && form.stock > 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {form.in_stock && form.stock > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Default / Base Selling Price (₹) *</label>
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
                <label className={labelClass}>Default / Base MRP (₹)</label>
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

            {/* Sizes & Separate Prices Section */}
            <div className="rounded-xl border border-[#E6EFE3] bg-[#F9FCF8] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#052E1D]">Product Sizes & Separate Prices</h3>
                  <p className="text-xs text-[#5b6b60]">
                    Add specific sizes/weights (e.g. 100ml, 250ml, 500ml, Small, XL) with their own prices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = [
                      ...(form.sizes || []),
                      { size: "", price: form.price || 0, mrp: form.mrp || form.price || 0, stock: form.stock || 25 },
                    ];
                    set("sizes", next);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#07552F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#052E1D] transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Size
                </button>
              </div>

              {form.sizes && form.sizes.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {form.sizes.map((s, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 rounded-lg border border-[#cfdccf]/70 bg-white p-2.5 shadow-2xs"
                    >
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#5b6b60] block mb-1">
                          Size / Variant
                        </label>
                        <input
                          placeholder="e.g. 100ml, 500g, M"
                          value={s.size}
                          onChange={(e) => {
                            const updated = [...form.sizes];
                            updated[idx].size = e.target.value;
                            set("sizes", updated);
                          }}
                          className="w-full rounded-md border border-[#cfdccf] px-2.5 py-1.5 text-xs text-[#052E1D] outline-none focus:border-[#07552F]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#5b6b60] block mb-1">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Selling Price"
                          value={s.price}
                          onChange={(e) => {
                            const updated = [...form.sizes];
                            updated[idx].price = Number(e.target.value);
                            set("sizes", updated);
                          }}
                          className="w-full rounded-md border border-[#cfdccf] px-2.5 py-1.5 text-xs text-[#052E1D] outline-none focus:border-[#07552F]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#5b6b60] block mb-1">
                          MRP (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Original MRP"
                          value={s.mrp ?? s.price}
                          onChange={(e) => {
                            const updated = [...form.sizes];
                            updated[idx].mrp = Number(e.target.value);
                            set("sizes", updated);
                          }}
                          className="w-full rounded-md border border-[#cfdccf] px-2.5 py-1.5 text-xs text-[#052E1D] outline-none focus:border-[#07552F]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.sizes.filter((_, i) => i !== idx);
                          set("sizes", updated);
                        }}
                        className="mt-4 rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                        title="Remove size"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#cfdccf] p-3 text-center text-xs text-[#5b6b60]">
                  No custom sizes added. The product will use the base price. Click <strong>&quot;Add Size&quot;</strong> to add sizes with individual prices.
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>Overview / Short Description</label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-[#cfdccf] bg-white px-2.5 py-1 text-xs font-semibold text-[#07552F] hover:bg-[#F5F8F4] cursor-pointer shadow-2xs transition">
                  <Upload className="h-3.5 w-3.5" /> Upload File (.txt / .md)
                  <input
                    type="file"
                    accept=".txt,.md,.text"
                    onChange={handleFileUpload("description")}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Brief summary of the product..."
                className={inputClass}
              />
            </div>
          </div>

          {/* Rich Content Tabs (Benefits, How to Use, Ingredients, Return Policy) */}
          <div className="space-y-6 rounded-2xl border border-[#E6EFE3] bg-white p-5 sm:p-7 shadow-xs">
            <div className="border-b border-[#F0F5EE] pb-3">
              <h2 className="text-base font-bold text-[#052E1D]">
                Product Page Information Tabs
              </h2>
              <p className="mt-1 text-xs text-[#5b6b60]">
                Enter text directly or click &quot;Upload file&quot; to import from any <code>.txt</code> or <code>.md</code> document. These sections will show up on the live product detail page.
              </p>
            </div>

            {/* 1. Benefits */}
            <div className="rounded-xl border border-[#EBF2E7] bg-[#FBFDF9] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#07552F] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07552F]/10 text-xs">1</span>
                  Benefits
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-[#cfdccf] bg-white px-2.5 py-1 text-xs font-semibold text-[#07552F] hover:bg-[#F5F8F4] cursor-pointer shadow-2xs">
                  <Upload className="h-3.5 w-3.5" /> Upload File
                  <input
                    type="file"
                    accept=".txt,.md,.text"
                    onChange={handleFileUpload("benefits")}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                rows={3}
                value={form.benefits}
                onChange={(e) => set("benefits", e.target.value)}
                placeholder="Enter each benefit on a new line (e.g. Relieves joint pain, 100% Herbal...)"
                className={inputClass}
              />
            </div>

            {/* 2. How to Use */}
            <div className="rounded-xl border border-[#EBF2E7] bg-[#FBFDF9] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#07552F] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07552F]/10 text-xs">2</span>
                  How to Use
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-[#cfdccf] bg-white px-2.5 py-1 text-xs font-semibold text-[#07552F] hover:bg-[#F5F8F4] cursor-pointer shadow-2xs">
                  <Upload className="h-3.5 w-3.5" /> Upload File
                  <input
                    type="file"
                    accept=".txt,.md,.text"
                    onChange={handleFileUpload("howToUse")}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                rows={3}
                value={form.howToUse}
                onChange={(e) => set("howToUse", e.target.value)}
                placeholder="Instructions on dosage, application, or directions of use..."
                className={inputClass}
              />
            </div>

            {/* 3. Ingredients / Care */}
            <div className="rounded-xl border border-[#EBF2E7] bg-[#FBFDF9] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#07552F] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07552F]/10 text-xs">3</span>
                  Ingredients / Material
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-[#cfdccf] bg-white px-2.5 py-1 text-xs font-semibold text-[#07552F] hover:bg-[#F5F8F4] cursor-pointer shadow-2xs">
                  <Upload className="h-3.5 w-3.5" /> Upload File
                  <input
                    type="file"
                    accept=".txt,.md,.text"
                    onChange={handleFileUpload("ingredients")}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                rows={3}
                value={form.ingredients}
                onChange={(e) => set("ingredients", e.target.value)}
                placeholder="List ingredients or herbal composition, fabric details, etc..."
                className={inputClass}
              />
            </div>

            {/* 4. Return Policy */}
            <div className="rounded-xl border border-[#EBF2E7] bg-[#FBFDF9] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#07552F] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07552F]/10 text-xs">4</span>
                  Return Policy
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-[#cfdccf] bg-white px-2.5 py-1 text-xs font-semibold text-[#07552F] hover:bg-[#F5F8F4] cursor-pointer shadow-2xs">
                  <Upload className="h-3.5 w-3.5" /> Upload File
                  <input
                    type="file"
                    accept=".txt,.md,.text"
                    onChange={handleFileUpload("returnPolicy")}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                rows={3}
                value={form.returnPolicy}
                onChange={(e) => set("returnPolicy", e.target.value)}
                placeholder="Custom return, replacement, or warranty policy for this product..."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Visuals & Badges */}
        <div className="space-y-5">
          {/* 4 Photos Setup & Live Previews */}
          <div className="rounded-2xl border border-[#E6EFE3] bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F5EE] pb-2">
              <label className={labelClass}>Product Photos (Up to 4)</label>
              <span className="text-[11px] font-semibold text-[#07552F]">
                4 Angles / Views
              </span>
            </div>

            {/* Main Primary Image Preview */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F5F8F4] border border-[#E6EFE3] flex items-center justify-center">
              {form.images[0] || form.image ? (
                <img
                  src={form.images[0] || form.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#8BA894] p-4 text-center">
                  <Package className="h-10 w-10 mb-2 stroke-1" />
                  <span className="text-xs">No primary photo set</span>
                </div>
              )}
            </div>

            {/* Inputs & Cloudinary Upload Components for 4 Photos */}
            <div className="space-y-4">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="rounded-xl border border-[#EBF2E7] bg-[#FBFDF9] p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#052E1D]">
                      Photo #{idx + 1} {idx === 0 && "(Cover / Main)"}
                    </span>
                  </div>

                  {/* Reusable Cloudinary ImageUpload component */}
                  <ImageUpload
                    initialUrl={form.images[idx] || ""}
                    initialPublicId={form.imagePublicIds?.[idx] || ""}
                    onUploaded={(url, publicId) => handleImageUploaded(idx, url, publicId)}
                    onRemoved={() => handleImageRemoved(idx)}
                  />

                  <input
                    value={form.images[idx] || ""}
                    onChange={(e) => {
                      const updated = [...(form.images || [])];
                      updated[idx] = e.target.value;
                      set("images", updated);
                      if (idx === 0) set("image", e.target.value);
                    }}
                    placeholder={`Or paste image URL (e.g. https://res.cloudinary.com/...)`}
                    className={inputClass}
                  />
                </div>
              ))}

              <p className="pt-1 text-[11px] text-[#8BA894]">
                Click <strong>&quot;Upload Image&quot;</strong> to upload directly to Cloudinary (max 5 MB), or paste a URL/local path.
              </p>
            </div>
          </div>

          {/* Visibility & Feature Badge */}
          <div className="rounded-2xl border border-[#E6EFE3] bg-white p-5 shadow-xs">
            <label className={labelClass}>Visibility & Highlighting</label>
            <label className="mt-3 flex items-start gap-3 cursor-pointer">
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
                  Promote on homepage showcase and category top spots.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
