"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  Sparkles,
  AlertCircle,
  Package,
  Upload,
  Plus,
  Trash2,
  Star,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Product } from "@/lib/admin/types";
import { api } from "@/lib/api";
import { optimizeCloudinaryUrl } from "@/lib/format";

type Props = { product?: Product };

type UploadedImageItem = {
  url: string;
  publicId: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<
    { id: number; name: string; slug: string; section_name?: string }[]
  >([]);

  // Image uploader state (one or many images)
  const initialImageItems: UploadedImageItem[] = (() => {
    const urls = Array.isArray(product?.images) ? product!.images.filter(Boolean) : [];
    const pids = Array.isArray(product?.imagePublicIds) ? product!.imagePublicIds : [];
    if (urls.length > 0) {
      return urls.map((u, idx) => ({
        url: u,
        publicId: pids[idx] || "",
      }));
    }
    if (product?.image) {
      return [{ url: product.image, publicId: product.publicId || "" }];
    }
    return [];
  })();

  const [imageItems, setImageItems] = useState<UploadedImageItem[]>(initialImageItems);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);

  const initialMrp = product?.mrp ? Number(product.mrp) : product?.price ? Number(product.price) : 0;
  const initialDiscount = product?.discount_percent !== undefined ? Number(product.discount_percent) : 0;

  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    category_id: product?.category_id ?? 1,
    category_name: product?.category ?? "",
    subcategory: product?.subcategory ?? "",
    mrp: initialMrp,
    discount_percent: initialDiscount,
    price: product?.selling_price ?? product?.price ?? initialMrp,
    stock: product?.stock ?? 25,
    in_stock: product?.in_stock ?? (product ? product.stock > 0 : true),
    is_active: product?.is_active ?? true,
    display_order: product?.display_order ?? 0,
    tags: product?.tags ?? "",
    description: product?.description ?? "",
    featured: product?.featured ?? false,

    // Multiple Sizes and separate pricing
    sizes: (product?.sizes && product.sizes.length > 0
      ? product.sizes
      : []) as { size: string; price: number; mrp?: number; stock?: number }[],

    // Rich descriptive sections
    benefits: product?.benefits ?? "",
    howToUse: product?.howToUse ?? "",
    ingredients: product?.ingredients ?? "",
    returnPolicy: product?.returnPolicy ?? "",
  });

  // Live calculated selling price: mrp - (mrp * discount_percent / 100), rounded to 2 decimals
  const liveSellingPrice = Math.max(
    0,
    Math.round(
      (Number(form.mrp || 0) - (Number(form.mrp || 0) * Number(form.discount_percent || 0)) / 100) * 100
    ) / 100
  );

  useEffect(() => {
    api<any[]>("/api/categories")
      .then((cats) => {
        setCategories(cats);
        if (product && cats.length > 0) {
          const match = cats.find(
            (c) =>
              c.id === Number(product.category_id) ||
              c.slug === product.category ||
              c.name === product.category
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

  // Handle selecting one or multiple image files and uploading to /api/upload
  async function handleMultiImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setUploadError("");

    // Validate all selected files first
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setUploadError(`"${file.name}" is not a valid image file.`);
        e.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`"${file.name}" exceeds the 5 MB size limit.`);
        e.target.value = "";
        return;
      }
    }

    setUploadingImages(true);
    const newlyUploaded: UploadedImageItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Uploading image ${i + 1} of ${files.length} (${file.name})...`);

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        newlyUploaded.push({
          url: data.url,
          publicId: data.publicId || "",
        });
      }

      setImageItems((prev) => [...prev, ...newlyUploaded]);
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload one or more images.");
    } finally {
      setUploadingImages(false);
      setUploadProgressText("");
      e.target.value = "";
    }
  }

  // Choose which image is the Main image (move to index 0)
  function handleSetMainImage(idx: number) {
    if (idx <= 0 || idx >= imageItems.length) return;
    setImageItems((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(idx, 1);
      next.unshift(chosen);
      return next;
    });
  }

  // Reorder images (move up/earlier or down/later)
  function handleMoveImage(idx: number, direction: -1 | 1) {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= imageItems.length) return;
    setImageItems((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  }

  // Remove an image and delete it from Cloudinary via /api/delete-image
  async function handleRemoveImage(idx: number) {
    const item = imageItems[idx];
    if (!item) return;

    setUploadError("");
    setDeletingIdx(idx);

    try {
      if (item.publicId) {
        const res = await fetch("/api/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: item.publicId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to delete image from Cloudinary.");
        }
      }
      setImageItems((prev) => prev.filter((_, i) => i !== idx));
    } catch (err: any) {
      setUploadError(err?.message || "Could not remove image.");
    } finally {
      setDeletingIdx(null);
    }
  }

  const handleFileUpload = (
    field: "description" | "benefits" | "howToUse" | "ingredients" | "returnPolicy"
  ) => {
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
      e.target.value = "";
    };
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const mrpVal = Number(form.mrp);
      if (!Number.isFinite(mrpVal) || mrpVal <= 0) {
        setError("MRP must be a number greater than 0.");
        setSaving(false);
        return;
      }

      const discountVal = Number(form.discount_percent || 0);
      if (!Number.isFinite(discountVal) || discountVal < 0 || discountVal > 100) {
        setError("Discount percent must be between 0 and 100.");
        setSaving(false);
        return;
      }

      const selectedCat = categories.find((c) => c.id === Number(form.category_id));
      const cleanImages = imageItems.filter((item) => item.url.trim().length > 0);
      const imageList = cleanImages.map((item) => item.url.trim());
      const publicIdList = cleanImages.map((item) => (item.publicId || "").trim());
      const primaryImage = imageList[0] || undefined;
      const primaryPublicId = publicIdList[0] || undefined;

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
        slug: form.slug.trim() || undefined,
        category_id: Number(form.category_id),
        category_name: selectedCat?.name || form.category_name || "Herbal & Beauty",
        subcategory: (
          form.subcategory ||
          selectedCat?.name ||
          form.category_name ||
          "General"
        ).trim(),
        mrp: mrpVal,
        discount_percent: discountVal,
        selling_price: liveSellingPrice,
        price: liveSellingPrice,
        stock: Number(form.stock ?? 0),
        in_stock: Boolean(form.in_stock) && Number(form.stock ?? 0) > 0,
        is_active: Boolean(form.is_active),
        display_order: Number(form.display_order || 0),
        tags: form.tags.trim() || undefined,
        image: primaryImage,
        image_url: primaryImage,
        publicId: primaryPublicId,
        image_public_id: primaryPublicId,
        images: imageList,
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
        await api(`/api/admin/products/${product.id}`, {
          method: "PUT",
          body: requestBody,
        });
      } else {
        await api("/api/admin/products", {
          method: "POST",
          body: requestBody,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Could not save the product. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#cfdccf]/80 bg-white px-4 py-2.5 text-sm text-[#052E1D] outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-[#052E1D] mb-1";

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Top action header */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5b6b60] hover:text-[#07552F] mb-3 transition cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to products
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#052E1D]">
              {product ? "Edit product" : "New product"}
            </h1>
            <p className="text-xs text-[#5b6b60] mt-0.5">
              {product
                ? "Update product details, pricing, stock, and media."
                : "Create and publish a new handcrafted Kerala product."}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="rounded-xl border border-[#cfdccf] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#052E1D] transition hover:bg-[#F5F8F4] cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={saving || success || uploadingImages}
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07552F] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#052E1D] disabled:opacity-60 cursor-pointer"
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
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Product saved successfully! Redirecting to products list...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Essential & Detailed Specifications */}
        <div className="space-y-6">
          {/* General Information Card */}
          <div className="space-y-5 rounded-2xl border border-[#E6EFE3] bg-white p-5 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-[#052E1D] border-b border-[#F0F5EE] pb-3">
              Basic Product Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
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

              <div>
                <label className={labelClass}>URL Slug (Auto-generated if empty)</label>
                <input
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="e.g. kerala-handloom-sarees"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Category *</label>
                <select
                  value={form.category_id}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const found = categories.find((c) => c.id === id);
                    setForm((f) => ({
                      ...f,
                      category_id: id,
                      category_name: found?.name || "",
                    }));
                  }}
                  className={inputClass}
                >
                  {Object.entries(
                    categories.reduce((acc, cat) => {
                      const sec = cat.section_name || "Categories";
                      if (!acc[sec]) acc[sec] = [];
                      acc[sec].push(cat);
                      return acc;
                    }, {} as Record<string, typeof categories>)
                  ).map(([sectionName, cats]) => (
                    <optgroup key={sectionName} label={sectionName}>
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Subcategory / Group</label>
                <input
                  value={form.subcategory}
                  onChange={(e) => set("subcategory", e.target.value)}
                  placeholder="e.g. Skin Care, Powders, Dried Foods"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={form.display_order}
                  onChange={(e) => set("display_order", Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Pricing Section: MRP + Discount % = Selling Price (Read Only), plus Stock */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClass}>MRP / Original Price (₹) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="e.g. 1000"
                  value={form.mrp === 0 && !product ? "" : form.mrp}
                  onChange={(e) => set("mrp", e.target.value === "" ? "" : Number(e.target.value))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Discount % (0 to 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 20"
                  value={form.discount_percent === 0 ? "0" : form.discount_percent || ""}
                  onChange={(e) => set("discount_percent", e.target.value === "" ? "" : Number(e.target.value))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Selling Price (₹) [Read Only]</label>
                <input
                  type="number"
                  readOnly
                  disabled
                  value={liveSellingPrice}
                  className={`${inputClass} bg-[#F4F8F1] cursor-not-allowed font-bold text-[#07552F]`}
                />
                <p className="mt-1 text-[11px] text-[#5b6b60]">
                  MRP - discount % = selling price
                </p>
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

            {/* Status Toggles: In/Out of Stock & Show/Hide on Website */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-[#E6EFE3] bg-[#F9FCF8] px-4 py-3">
                <div>
                  <span className="text-sm font-bold text-[#052E1D] block">
                    Stock Availability
                  </span>
                  <span className="text-xs text-[#5b6b60]">
                    In Stock or Out of Stock
                  </span>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
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

              <div className="flex items-center justify-between rounded-xl border border-[#E6EFE3] bg-[#F9FCF8] px-4 py-3">
                <div>
                  <span className="text-sm font-bold text-[#052E1D] block">
                    Website Visibility
                  </span>
                  <span className="text-xs text-[#5b6b60]">
                    Show or hide on store
                  </span>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_active)}
                    onChange={(e) => set("is_active", e.target.checked)}
                    className="h-4 w-4 rounded border-[#cfdccf] text-[#07552F] focus:ring-[#07552F]"
                  />
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                      form.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {form.is_active ? (
                      <>
                        <Eye className="h-3 w-3" /> Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" /> Hidden
                      </>
                    )}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className={labelClass}>Tags / Highlights (comma-separated)</label>
              <input
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="e.g. 100% Herbal & Ayurvedic, Fast-acting relief, Zero preservatives"
                className={inputClass}
              />
            </div>

            {/* Sizes & Separate Prices Section */}
            <div className="rounded-xl border border-[#E6EFE3] bg-[#F9FCF8] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#052E1D]">
                    Product Sizes & Separate Prices
                  </h3>
                  <p className="text-xs text-[#5b6b60]">
                    Add specific sizes/weights (e.g. 100ml, 250ml, 500g, Standard) with their own prices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = [
                      ...(form.sizes || []),
                      {
                        size: "",
                        price: form.price || 0,
                        mrp: form.mrp || form.price || 0,
                        stock: form.stock || 25,
                      },
                    ];
                    set("sizes", next);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#07552F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#052E1D] transition cursor-pointer shrink-0"
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
                        className="mt-4 rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                        title="Remove size"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#cfdccf] p-3 text-center text-xs text-[#5b6b60]">
                  No custom sizes added. The product will use the base price.
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>Overview / Description</label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-[#cfdccf] bg-white px-2.5 py-1 text-xs font-semibold text-[#07552F] hover:bg-[#F5F8F4] cursor-pointer shadow-2xs transition">
                  <Upload className="h-3.5 w-3.5" /> Import (.txt / .md)
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
                Enter text directly (one point per line) for the product detail page tabs.
              </p>
            </div>

            {/* 1. Benefits */}
            <div className="rounded-xl border border-[#EBF2E7] bg-[#FBFDF9] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#07552F] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07552F]/10 text-xs">
                    1
                  </span>
                  Benefits
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-[#cfdccf] bg-white px-2.5 py-1 text-xs font-semibold text-[#07552F] hover:bg-[#F5F8F4] cursor-pointer shadow-2xs">
                  <Upload className="h-3.5 w-3.5" /> Import File
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
                placeholder="Enter each benefit on a new line..."
                className={inputClass}
              />
            </div>

            {/* 2. How to Use */}
            <div className="rounded-xl border border-[#EBF2E7] bg-[#FBFDF9] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#07552F] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07552F]/10 text-xs">
                    2
                  </span>
                  How to Use
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-[#cfdccf] bg-white px-2.5 py-1 text-xs font-semibold text-[#07552F] hover:bg-[#F5F8F4] cursor-pointer shadow-2xs">
                  <Upload className="h-3.5 w-3.5" /> Import File
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
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07552F]/10 text-xs">
                    3
                  </span>
                  Ingredients / Material & Care
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-[#cfdccf] bg-white px-2.5 py-1 text-xs font-semibold text-[#07552F] hover:bg-[#F5F8F4] cursor-pointer shadow-2xs">
                  <Upload className="h-3.5 w-3.5" /> Import File
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
                placeholder="List ingredients, herbal composition, or handloom care instructions..."
                className={inputClass}
              />
            </div>

            {/* 4. Return Policy */}
            <div className="rounded-xl border border-[#EBF2E7] bg-[#FBFDF9] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#07552F] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07552F]/10 text-xs">
                    4
                  </span>
                  Return Policy
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-[#cfdccf] bg-white px-2.5 py-1 text-xs font-semibold text-[#07552F] hover:bg-[#F5F8F4] cursor-pointer shadow-2xs">
                  <Upload className="h-3.5 w-3.5" /> Import File
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
                placeholder="Return or replacement policy for this product..."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Image Cloudinary Uploader & Highlights */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#E6EFE3] bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F5EE] pb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#052E1D]">
                Product Images ({imageItems.length})
              </label>
              <span className="text-[11px] font-semibold text-[#07552F]">
                Cloudinary Upload
              </span>
            </div>

            {/* Main Primary Image Preview */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F4F8F1] border border-[#E6EFE3] flex items-center justify-center">
              {imageItems[0]?.url ? (
                <>
                  <img
                    src={optimizeCloudinaryUrl(imageItems[0].url, 600)}
                    alt="Main product preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-[#07552F] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                    <Star className="h-3 w-3 fill-current" /> Main Image
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-[#07552F]/70 p-4 text-center">
                  <Package className="h-10 w-10 mb-2 stroke-1" />
                  <span className="text-xs font-medium">
                    {form.name || "No product image uploaded yet"}
                  </span>
                  <span className="text-[11px] text-[#8BA894] mt-0.5">
                    Shows clean placeholder on store until uploaded
                  </span>
                </div>
              )}
            </div>

            {/* Multi-file Upload Button */}
            <div>
              <label
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#07552F]/40 bg-[#F9FCF8] px-4 py-3 text-xs sm:text-sm font-semibold text-[#07552F] transition hover:border-[#07552F] hover:bg-[#F0F7EE] ${
                  uploadingImages ? "pointer-events-none opacity-60" : "cursor-pointer"
                }`}
              >
                {uploadingImages ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{uploadProgressText || "Uploading to Cloudinary..."}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Upload Image(s) (One or Many, max 5 MB)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadingImages}
                  onChange={handleMultiImageSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Error Message */}
            {uploadError && (
              <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Uploaded Images List with Set Main, Reorder, and Remove */}
            {imageItems.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <p className="text-[11px] font-medium text-[#5b6b60]">
                  First image (#1) is shown on listing pages. All images appear in the product detail gallery.
                </p>

                {imageItems.map((item, idx) => {
                  const isMain = idx === 0;
                  const isDeleting = deletingIdx === idx;

                  return (
                    <div
                      key={`${item.url}-${idx}`}
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition ${
                        isMain
                          ? "border-[#07552F] bg-[#F4F8F1]"
                          : "border-[#E6EFE3] bg-white"
                      }`}
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#cfdccf] bg-[#F5F8F4]">
                        <img
                          src={optimizeCloudinaryUrl(item.url, 160)}
                          alt={`Product photo ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#052E1D]">
                            Image #{idx + 1}
                          </span>
                          {isMain && (
                            <span className="rounded-full bg-[#07552F] px-2 py-0.5 text-[10px] font-bold text-white">
                              Main
                            </span>
                          )}
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          {!isMain && (
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(idx)}
                              className="inline-flex items-center gap-1 rounded-md border border-[#07552F]/30 bg-white px-2 py-0.5 text-[11px] font-semibold text-[#07552F] hover:bg-[#07552F] hover:text-white transition cursor-pointer"
                              title="Make this the main image"
                            >
                              <Star className="h-3 w-3" /> Set as Main
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, -1)}
                            className="rounded-md border border-gray-200 bg-white p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            disabled={idx === imageItems.length - 1}
                            onClick={() => handleMoveImage(idx, 1)}
                            className="rounded-md border border-gray-200 bg-white p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                            title="Move down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleRemoveImage(idx)}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 transition cursor-pointer"
                        title="Remove image and delete from Cloudinary"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Featured Highlighting Card */}
          <div className="rounded-2xl border border-[#E6EFE3] bg-white p-5 shadow-xs">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#052E1D]">
              Homepage Highlighting
            </label>
            <label className="mt-3 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#cfdccf] text-[#07552F] focus:ring-[#07552F]"
              />
              <div>
                <span className="text-sm font-semibold text-[#052E1D] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Featured / Best Seller
                </span>
                <p className="text-xs text-[#5b6b60] mt-0.5">
                  Feature this product in the homepage Best Sellers showcase.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Bottom action bar for convenient submission */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#E6EFE3] bg-white p-4 sm:p-5 shadow-xs">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5b6b60] hover:text-[#07552F] cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to products
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="rounded-xl border border-[#cfdccf] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#052E1D] transition hover:bg-[#F5F8F4] cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={saving || success || uploadingImages}
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07552F] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#052E1D] disabled:opacity-60 cursor-pointer"
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
    </form>
  );
}
