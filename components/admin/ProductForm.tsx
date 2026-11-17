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
  ChevronDown,
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

// Reusable FormField wrapper (sentence case, 13px 500 slate-700, whitespace-nowrap label, optional hint)
function FormField({
  label,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col min-w-0 ${className}`}>
      <label className="text-[13px] font-medium text-slate-700 mb-1.5 flex items-center gap-1 whitespace-nowrap truncate">
        <span className="truncate">{label}</span>
        {required && <span className="text-red-500 font-semibold">*</span>}
      </label>
      <div className="relative w-full">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

// Simple toggle switch component replacing plain checkboxes
function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#07552F]/20 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-[#07552F]" : "bg-slate-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

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
    "w-full h-[44px] px-3.5 bg-white border border-slate-200 rounded-[10px] text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/15 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Top action header */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#07552F] mb-3 transition cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to products
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {product ? "Edit product" : "New product"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {product
                ? "Update product details, pricing, stock, and media."
                : "Create and publish a new handcrafted Kerala product."}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="h-[42px] rounded-[10px] border border-slate-200 bg-white px-4 text-xs sm:text-sm font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={saving || success || uploadingImages}
              type="submit"
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] bg-[#07552F] px-5 sm:px-6 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#052E1D] disabled:opacity-60 cursor-pointer"
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
          <div className="space-y-5 rounded-[16px] border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Basic Product Details
            </h2>

            {/* Product title & Slug Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <FormField label="Product title" required>
                <input
                  required
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Traditional Kerala Handloom Saree"
                  className={inputClass}
                />
              </FormField>

              <FormField label="URL slug (optional)">
                <input
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="e.g. kerala-handloom-sarees"
                  className={inputClass}
                />
              </FormField>
            </div>

            {/* Category / Subcategory / Display Order Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <FormField label="Category" required>
                <div className="relative w-full">
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
                    className={`${inputClass} appearance-none pr-9 cursor-pointer`}
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
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </FormField>

              <FormField label="Subcategory">
                <input
                  value={form.subcategory}
                  onChange={(e) => set("subcategory", e.target.value)}
                  placeholder="e.g. Skin Care, Powders"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Display order">
                <input
                  type="number"
                  min="0"
                  value={form.display_order}
                  onChange={(e) => set("display_order", Number(e.target.value))}
                  className={inputClass}
                />
              </FormField>
            </div>

            {/* Pricing Section: 4 equal columns on desktop, horizontal baseline, single hint line */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                <FormField label="MRP (₹)" required>
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
                </FormField>

                <FormField label="Discount (%)">
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
                </FormField>

                <FormField label="Selling price (₹)">
                  <div className="flex items-center h-[44px] px-3.5 bg-[#F4F8F1] border border-slate-200 rounded-[10px] text-sm font-semibold text-[#07552F] select-none cursor-default">
                    <span className="text-slate-500 font-normal mr-1">₹</span>
                    <span>
                      {Number(liveSellingPrice || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </FormField>

                <FormField label="Stock units" required>
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
                </FormField>
              </div>
              <p className="text-[12px] text-slate-500 flex items-center gap-1.5 pt-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#07552F]" />
                MRP - discount % = selling price
              </p>
            </div>

            {/* Status Toggles: In/Out of Stock & Show/Hide on Website with ToggleSwitch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between min-h-[72px] p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="min-w-0 pr-3">
                  <span className="text-sm font-semibold text-slate-900 block truncate">
                    Stock availability
                  </span>
                  <span className="text-xs text-slate-500 block truncate">
                    In stock or out of stock
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      form.in_stock && form.stock > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {form.in_stock && form.stock > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                  <ToggleSwitch
                    checked={Boolean(form.in_stock && form.stock > 0)}
                    onChange={(checked) => {
                      setForm((f) => ({
                        ...f,
                        in_stock: checked,
                        stock: checked && f.stock <= 0 ? 25 : f.stock,
                      }));
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between min-h-[72px] p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="min-w-0 pr-3">
                  <span className="text-sm font-semibold text-slate-900 block truncate">
                    Website visibility
                  </span>
                  <span className="text-xs text-slate-500 block truncate">
                    Show or hide on store
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      form.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
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
                  <ToggleSwitch
                    checked={Boolean(form.is_active)}
                    onChange={(checked) => set("is_active", checked)}
                  />
                </div>
              </div>
            </div>

            {/* Tags Input (full width) */}
            <FormField label="Tags (comma separated)">
              <input
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="e.g. 100% Herbal & Ayurvedic, Fast-acting relief, Zero preservatives"
                className={inputClass}
              />
            </FormField>

            {/* Sizes & Separate Prices Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Product Sizes & Separate Prices
                  </h3>
                  <p className="text-xs text-slate-500">
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
                      className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs"
                    >
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 block mb-1">
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
                          className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-[8px] text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#07552F]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-600 block mb-1">
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
                          className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-[8px] text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#07552F]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-600 block mb-1">
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
                          className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-[8px] text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#07552F]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.sizes.filter((_, i) => i !== idx);
                          set("sizes", updated);
                        }}
                        className="mt-5 rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                        title="Remove size"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500">
                  No custom sizes added. The product will use the base price.
                </div>
              )}
            </div>

            {/* Overview / Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-slate-700">
                  Overview / Description
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-[#07552F] hover:bg-slate-50 cursor-pointer shadow-2xs transition">
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
                className="w-full p-3.5 bg-white border border-slate-200 rounded-[10px] text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/15 resize-y"
              />
            </div>
          </div>

          {/* Rich Content Tabs (Benefits, How to Use, Ingredients, Return Policy) */}
          <div className="space-y-6 rounded-[16px] border border-slate-200 bg-white p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Product Page Information Tabs
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Enter text directly (one point per line) for the product detail page tabs.
              </p>
            </div>

            {/* 1. Benefits */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#07552F] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07552F]/10 text-xs font-bold">
                    1
                  </span>
                  Benefits
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-[#07552F] hover:bg-slate-50 cursor-pointer shadow-2xs">
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
                className="w-full p-3 bg-white border border-slate-200 rounded-[10px] text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/15 resize-y"
              />
            </div>

            {/* 2. How to Use */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#07552F] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07552F]/10 text-xs font-bold">
                    2
                  </span>
                  How to Use
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-[#07552F] hover:bg-slate-50 cursor-pointer shadow-2xs">
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
                className="w-full p-3 bg-white border border-slate-200 rounded-[10px] text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/15 resize-y"
              />
            </div>

            {/* 3. Ingredients / Care */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#07552F] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07552F]/10 text-xs font-bold">
                    3
                  </span>
                  Ingredients / Material & Care
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-[#07552F] hover:bg-slate-50 cursor-pointer shadow-2xs">
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
                className="w-full p-3 bg-white border border-slate-200 rounded-[10px] text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/15 resize-y"
              />
            </div>

            {/* 4. Return Policy */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#07552F] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07552F]/10 text-xs font-bold">
                    4
                  </span>
                  Return Policy
                </label>
                <label className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-[#07552F] hover:bg-slate-50 cursor-pointer shadow-2xs">
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
                className="w-full p-3 bg-white border border-slate-200 rounded-[10px] text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/15 resize-y"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Image Cloudinary Uploader & Highlights */}
        <div className="space-y-6">
          <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Product images ({imageItems.length})
              </h2>
              <span className="text-xs font-medium text-[#07552F]">
                Cloudinary upload
              </span>
            </div>

            {/* Main Primary Image Preview */}
            <div className="relative aspect-square w-full overflow-hidden rounded-[12px] bg-slate-50 border border-slate-200 flex items-center justify-center">
              {imageItems[0]?.url ? (
                <>
                  <img
                    src={optimizeCloudinaryUrl(imageItems[0].url, 600)}
                    alt="Main product preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-[#07552F] px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs">
                    <Star className="h-3 w-3 fill-current" /> Main Image
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-[#07552F]/70 p-4 text-center">
                  <Package className="h-10 w-10 mb-2 stroke-1" />
                  <span className="text-xs font-medium">
                    {form.name || "No product image uploaded yet"}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Shows clean placeholder on store until uploaded
                  </span>
                </div>
              )}
            </div>

            {/* Multi-file Upload Button: fixed height, dashed border, centered icon & text on one line */}
            <div>
              <label
                className={`w-full h-11 inline-flex items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-[#07552F]/40 bg-[#F9FCF8] px-4 text-xs sm:text-sm font-medium text-[#07552F] transition hover:border-[#07552F] hover:bg-[#F0F7EE] whitespace-nowrap ${
                  uploadingImages ? "pointer-events-none opacity-60" : "cursor-pointer"
                }`}
              >
                {uploadingImages ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span className="truncate">{uploadProgressText || "Uploading..."}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 shrink-0" />
                    <span className="truncate">Upload images (max 5 MB)</span>
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
                <p className="text-[11px] font-medium text-slate-500">
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
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[8px] border border-slate-200 bg-slate-50">
                        <img
                          src={optimizeCloudinaryUrl(item.url, 160)}
                          alt={`Product photo ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
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
                              className="inline-flex items-center gap-1 rounded-md border border-[#07552F]/30 bg-white px-2 py-0.5 text-[11px] font-medium text-[#07552F] hover:bg-[#07552F] hover:text-white transition cursor-pointer"
                              title="Make this the main image"
                            >
                              <Star className="h-3 w-3" /> Set as Main
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, -1)}
                            className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            disabled={idx === imageItems.length - 1}
                            onClick={() => handleMoveImage(idx, 1)}
                            className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
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

          {/* Featured Highlighting Card with ToggleSwitch */}
          <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Homepage highlighting
            </h2>
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Featured / Best seller
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Feature this product in the homepage Best Sellers showcase.
                </p>
              </div>
              <ToggleSwitch
                checked={Boolean(form.featured)}
                onChange={(checked) => set("featured", checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar for convenient submission */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[16px] border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#07552F] cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to products
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="h-[42px] rounded-[10px] border border-slate-200 bg-white px-4 text-xs sm:text-sm font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={saving || success || uploadingImages}
            type="submit"
            className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] bg-[#07552F] px-5 sm:px-6 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#052E1D] disabled:opacity-60 cursor-pointer"
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
