"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  FolderTree,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Modal, { ConfirmModal, AlertModal } from "@/components/admin/Modal";
import type { Category } from "@/lib/admin/types";
import { api } from "@/lib/api";

const SECTIONS = [
  { id: 1, name: "Herbal & Wellness" },
  { id: 2, name: "Kerala Food Products" },
  { id: 3, name: "Handloom" },
];

type CategoryFormData = {
  id?: number;
  name: string;
  section_id: number;
  is_active: boolean;
  image: string;
};

const EMPTY_FORM: CategoryFormData = {
  name: "",
  section_id: 1,
  is_active: true,
  image: "",
};

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [search, setSearch] = useState("");

  // Modal & Form States
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggling status state
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Alert Modal
  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    message: string;
    variant?: "success" | "error";
  } | null>(null);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    (c.section_name && c.section_name.toLowerCase().includes(search.toLowerCase()))
  );

  function openCreateModal() {
    setFormData(EMPTY_FORM);
    setFormError("");
    setIsEditing(false);
    setFormModalOpen(true);
  }

  function openEditModal(cat: Category) {
    setFormData({
      id: cat.id,
      name: cat.name,
      section_id: cat.section_id || 1,
      is_active: cat.is_active !== undefined ? cat.is_active : true,
      image: cat.image || "",
    });
    setFormError("");
    setIsEditing(true);
    setFormModalOpen(true);
  }

  // Handle uploading image to Cloudinary via /api/upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    try {
      setUploadingImage(true);
      setFormError("");

      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await api<{ url: string }>("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (res?.url) {
        setFormData((prev) => ({ ...prev, image: res.url }));
      }
    } catch (err: any) {
      setFormError(err?.message || "Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  // Save (Create or Update) Category
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = formData.name.trim();

    if (!name) {
      setFormError("Category name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      if (isEditing && formData.id) {
        // Update existing category
        const updated = await api<Category>(`/api/admin/categories/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name,
            section_id: formData.section_id,
            is_active: formData.is_active,
            image: formData.image.trim() || null,
          }),
        });

        const sectionObj = SECTIONS.find((s) => s.id === formData.section_id);

        setCategories((prev) =>
          prev.map((c) =>
            c.id === formData.id
              ? {
                  ...c,
                  ...updated,
                  section_id: formData.section_id,
                  section_name: sectionObj?.name || c.section_name,
                  is_active: formData.is_active,
                }
              : c
          )
        );

        setFormModalOpen(false);
        setAlertInfo({
          title: "Category Updated",
          message: `Category "${name}" was updated successfully.`,
          variant: "success",
        });
      } else {
        // Create new category
        const created = await api<Category>("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify({
            name,
            section_id: formData.section_id,
            is_active: formData.is_active,
            image: formData.image.trim() || null,
          }),
        });

        const sectionObj = SECTIONS.find((s) => s.id === formData.section_id);

        setCategories((prev) => [
          ...prev,
          {
            ...created,
            section_id: formData.section_id,
            section_name: sectionObj?.name,
            is_active: formData.is_active,
            product_count: 0,
          },
        ]);

        setFormModalOpen(false);
        setAlertInfo({
          title: "Category Created",
          message: `Category "${name}" was created successfully.`,
          variant: "success",
        });
      }
    } catch (err: any) {
      setFormError(err?.message || "Failed to save category. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Toggle active/inactive status directly from the table
  async function handleToggleActive(cat: Category) {
    const nextState = !cat.is_active;
    try {
      setTogglingId(cat.id);
      await api(`/api/admin/categories/${cat.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: cat.name,
          section_id: cat.section_id,
          is_active: nextState,
          image: cat.image,
        }),
      });

      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: nextState } : c))
      );
    } catch (err: any) {
      setAlertInfo({
        title: "Action Failed",
        message: err?.message || "Failed to change category status.",
        variant: "error",
      });
    } finally {
      setTogglingId(null);
    }
  }

  // Delete Category
  async function handleDeleteConfirm() {
    if (!deletingCategory) return;

    try {
      setIsDeleting(true);
      await api(`/api/admin/categories/${deletingCategory.id}`, {
        method: "DELETE",
      });

      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      const deletedName = deletingCategory.name;
      setDeletingCategory(null);

      setAlertInfo({
        title: "Category Deleted",
        message: `Category "${deletedName}" was removed successfully.`,
        variant: "success",
      });
    } catch (err: any) {
      setDeletingCategory(null);
      setAlertInfo({
        title: "Cannot Delete Category",
        message:
          err?.message ||
          "Cannot delete category with associated products. Reassign or delete products first.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#052E1D]">Categories</h1>
          <p className="text-xs text-[#5b6b60] mt-0.5">
            Manage store categories, assign them to sections, and control store visibility.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#07552F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#052E1D] cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8BA894]" />
          <input
            type="text"
            placeholder="Search categories by name or section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#cfdccf]/80 bg-[#F9FCF8] py-2 pl-10 pr-4 text-sm text-[#052E1D] placeholder:text-[#8BA894] outline-none transition focus:border-[#07552F] focus:bg-white focus:ring-2 focus:ring-[#07552F]/20"
          />
        </div>

        <div className="text-xs font-medium text-[#5b6b60]">
          Showing {filteredCategories.length} of {categories.length} categories
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-hidden rounded-2xl border border-[#cfdccf]/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#cfdccf]/70 bg-[#F4F8F1] text-xs font-semibold uppercase tracking-wider text-[#052E1D]">
              <tr>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Section</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Products</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EFE3]">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#5b6b60]">
                    <FolderTree className="mx-auto h-8 w-8 text-[#8BA894]/60 mb-2" />
                    <p className="font-medium text-[#052E1D]">No categories found</p>
                    <p className="text-xs mt-1">
                      {search ? "Try adjusting your search query." : "Click 'Add Category' to create your first category."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const sectionName =
                    cat.section_name ||
                    SECTIONS.find((s) => s.id === cat.section_id)?.name ||
                    "Herbal & Wellness";

                  return (
                    <tr key={cat.id} className="transition hover:bg-[#F9FCF7]/70">
                      {/* Category Image & Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#EBF3E8] border border-[#d6e5d2] flex items-center justify-center">
                            {cat.image ? (
                              <Image
                                src={cat.image}
                                alt={cat.name}
                                fill
                                className="object-cover"
                                sizes="44px"
                              />
                            ) : (
                              <FolderTree className="h-5 w-5 text-[#07552F]/60" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-[#052E1D] block truncate">
                              {cat.name}
                            </span>
                            <span className="text-xs text-[#8BA894] font-mono block truncate">
                              /{cat.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Section */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#EBF3E8] text-[#07552F] border border-[#d6e5d2]">
                          {sectionName}
                        </span>
                      </td>

                      {/* Active Toggle Switch */}
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat)}
                          disabled={togglingId === cat.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer border ${
                            cat.is_active
                              ? "bg-[#C7E900]/25 text-[#07552F] border-[#4D9A18]/40 hover:bg-[#C7E900]/40"
                              : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                          }`}
                          title="Click to toggle store visibility"
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              cat.is_active ? "bg-[#4D9A18]" : "bg-gray-400"
                            }`}
                          />
                          <span>{cat.is_active ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      {/* Products Count */}
                      <td className="px-5 py-3.5 text-[#5b6b60] text-xs font-medium">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {cat.product_count || 0} items
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#cfdccf] bg-white text-[#5b6b60] transition hover:border-[#07552F] hover:text-[#07552F] cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingCategory(cat)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#cfdccf] bg-white text-[#5b6b60] transition hover:border-red-400 hover:text-red-600 cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => !isSubmitting && setFormModalOpen(false)}
        title={isEditing ? "Edit Category" : "Add New Category"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Category Name */}
          <div>
            <label className="block text-xs font-semibold text-[#052E1D] mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ayurvedic Tea, Pain Relief"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-[#cfdccf]/80 bg-[#F9FCF8] px-3.5 py-2.5 text-sm text-[#052E1D] outline-none transition focus:border-[#07552F] focus:bg-white focus:ring-2 focus:ring-[#07552F]/20"
            />
            <p className="text-[11px] text-[#8BA894] mt-1">
              Slug will be automatically generated from the category name.
            </p>
          </div>

          {/* Section Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-[#052E1D] mb-1.5">
              Section (Top Menu) *
            </label>
            <select
              value={formData.section_id}
              onChange={(e) => setFormData({ ...formData, section_id: Number(e.target.value) })}
              className="w-full rounded-xl border border-[#cfdccf]/80 bg-[#F9FCF8] px-3.5 py-2.5 text-sm text-[#052E1D] outline-none transition focus:border-[#07552F] focus:bg-white focus:ring-2 focus:ring-[#07552F]/20 cursor-pointer"
            >
              {SECTIONS.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#8BA894] mt-1">
              Select which navbar menu this category belongs under.
            </p>
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F4F8F1] border border-[#cfdccf]/60">
            <input
              type="checkbox"
              id="category_is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded accent-[#07552F] cursor-pointer"
            />
            <label htmlFor="category_is_active" className="text-xs font-semibold text-[#052E1D] cursor-pointer select-none">
              Active (Visible in store and navbar)
            </label>
          </div>

          {/* Optional Category Image */}
          <div>
            <label className="block text-xs font-semibold text-[#052E1D] mb-1.5">
              Category Image (Optional)
            </label>

            {formData.image ? (
              <div className="relative mb-2 h-32 w-full overflow-hidden rounded-xl border border-[#cfdccf] bg-[#F4F8F1]">
                <Image
                  src={formData.image}
                  alt="Category preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: "" })}
                  className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80 transition"
                >
                  Remove
                </button>
              </div>
            ) : null}

            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cfdccf] p-4 hover:border-[#07552F] cursor-pointer bg-[#F9FCF8] transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
              {uploadingImage ? (
                <div className="flex items-center gap-2 text-xs text-[#07552F]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading to Cloudinary...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#5b6b60]">
                  <Upload className="h-4 w-4 text-[#8BA894]" />
                  <span>Click to upload image (JPG, PNG, WebP)</span>
                </div>
              )}
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6EFE3]">
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl border border-[#cfdccf] bg-white px-4 py-2 text-xs font-semibold text-[#5b6b60] hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingImage}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#07552F] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#052E1D] transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEditing ? "Save Changes" : "Create Category"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingCategory)}
        onClose={() => !isDeleting && setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={
          deletingCategory?.product_count && deletingCategory.product_count > 0
            ? `Cannot delete "${deletingCategory?.name}" because it currently has ${deletingCategory.product_count} product(s) assigned to it. Please reassign or delete the products first.`
            : `Are you sure you want to delete the category "${deletingCategory?.name}"? This action cannot be undone.`
        }
        confirmText="Delete Category"
        danger={true}
        loading={isDeleting}
      />

      {/* Alert / Feedback Modal */}
      {alertInfo && (
        <AlertModal
          isOpen={Boolean(alertInfo)}
          onClose={() => setAlertInfo(null)}
          title={alertInfo.title}
          message={alertInfo.message}
        />
      )}
    </div>
  );
}
