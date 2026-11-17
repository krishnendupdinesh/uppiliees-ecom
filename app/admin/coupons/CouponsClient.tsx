"use client";

import { useState } from "react";
import { Plus, Tag, Edit3, Trash2, CheckCircle, XCircle, Percent, IndianRupee } from "lucide-react";
import Modal, { ConfirmModal, AlertModal } from "@/components/admin/Modal";
import type { Coupon } from "@/lib/admin/types";
import { api } from "@/lib/api";

const inr = (n: unknown) => {
  if (n === undefined || n === null) return "₹0";
  const num = Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  return `₹${safe.toLocaleString("en-IN")}`;
};

interface CouponFormData {
  id?: number;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number | string;
  min_order_amount: number | string;
  max_discount: number | string;
  usage_limit: number | string;
  expires_at: string;
  is_active: boolean;
}

const EMPTY_FORM: CouponFormData = {
  code: "",
  discount_type: "percentage",
  discount_value: "",
  min_order_amount: 0,
  max_discount: "",
  usage_limit: "",
  expires_at: "",
  is_active: true,
};

export default function CouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    message: string;
    variant?: "success" | "error";
  } | null>(null);

  function openCreateModal() {
    setFormData(EMPTY_FORM);
    setIsEditing(false);
    setFormModalOpen(true);
  }

  function openEditModal(c: Coupon) {
    setFormData({
      id: c.id,
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount,
      max_discount: c.max_discount ?? "",
      usage_limit: c.usage_limit ?? "",
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : "",
      is_active: c.is_active,
    });
    setIsEditing(true);
    setFormModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.code.trim()) {
      setAlertInfo({ title: "Validation Error", message: "Coupon code is required.", variant: "error" });
      return;
    }
    const val = Number(formData.discount_value);
    if (!Number.isFinite(val) || val <= 0) {
      setAlertInfo({ title: "Validation Error", message: "Valid discount value is required.", variant: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: val,
        min_order_amount: Number(formData.min_order_amount) || 0,
        max_discount: formData.max_discount ? Number(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
      };

      if (isEditing && formData.id) {
        const updated = await api<Coupon>(`/api/admin/coupons/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setCoupons((prev) => prev.map((c) => (c.id === formData.id ? updated : c)));
        setAlertInfo({ title: "Coupon Updated", message: `Coupon "${payload.code}" updated.`, variant: "success" });
      } else {
        const created = await api<Coupon>("/api/admin/coupons", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setCoupons((prev) => [created, ...prev]);
        setAlertInfo({ title: "Coupon Created", message: `Coupon "${payload.code}" created.`, variant: "success" });
      }

      setFormModalOpen(false);
    } catch (err: any) {
      setAlertInfo({ title: "Error", message: err.message || "Failed to save coupon.", variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingCoupon) return;
    setIsDeleting(true);
    try {
      await api(`/api/admin/coupons/${deletingCoupon.id}`, { method: "DELETE" });
      setCoupons((prev) => prev.filter((c) => c.id !== deletingCoupon.id));
      setDeletingCoupon(null);
      setAlertInfo({ title: "Coupon Deleted", message: "Coupon code removed successfully.", variant: "success" });
    } catch (err: any) {
      setAlertInfo({ title: "Delete Error", message: err.message || "Failed to delete coupon.", variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleActive(c: Coupon) {
    try {
      const nextActive = !c.is_active;
      await api(`/api/admin/coupons/${c.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: nextActive }),
      });
      setCoupons((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, is_active: nextActive } : item))
      );
    } catch (err: any) {
      setAlertInfo({ title: "Update Error", message: err.message || "Failed to update coupon status.", variant: "error" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#052E1D]">
            Coupons ({coupons.length})
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#5b6b60]">
            Manage discount codes, percentage and flat discounts, usage limits, and expiration dates.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07552F] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#052E1D] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add coupon
        </button>
      </div>

      {/* Coupons Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E6EFE3] bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E6EFE3] bg-[#F5F8F4] text-[#052E1D]">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Code</th>
              <th className="px-5 py-3.5 font-semibold">Discount</th>
              <th className="px-5 py-3.5 font-semibold">Min Order</th>
              <th className="px-5 py-3.5 font-semibold">Usage Limit</th>
              <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Expires</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EFE3]">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-[#5b6b60]">
                  <Tag className="mx-auto h-8 w-8 text-[#8BA894] mb-2" />
                  <p className="font-medium text-[#052E1D]">No discount coupons created</p>
                  <p className="text-xs text-[#8BA894] mt-0.5">
                    Click &quot;Add coupon&quot; to offer special promotions to your customers.
                  </p>
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="transition hover:bg-[#F9FCF7]/70">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-sm tracking-wide text-[#07552F] bg-[#EBF3E8] px-2.5 py-1 rounded-md border border-[#d6e5d2]">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-[#052E1D]">
                      {c.discount_type === "percentage" ? `${c.discount_value}% OFF` : inr(c.discount_value)}
                    </span>
                    {c.max_discount ? (
                      <span className="text-xs text-[#5b6b60] block mt-0.5">
                        up to {inr(c.max_discount)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-[#5b6b60]">
                    {c.min_order_amount > 0 ? inr(c.min_order_amount) : "No minimum"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#5b6b60]">
                    <span className="font-semibold text-[#052E1D]">{c.used_count || 0}</span>
                    {c.usage_limit ? ` / ${c.usage_limit} used` : " used (unlimited)"}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-[#5b6b60]">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-IN") : "Never"}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer ${
                        c.is_active
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      title="Click to toggle Active / Inactive"
                    >
                      {c.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {c.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="rounded-lg p-1.5 text-[#07552F] hover:bg-[#E6EFE3] transition cursor-pointer"
                        title="Edit coupon"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCoupon(c)}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete coupon"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── CREATE / EDIT COUPON MODAL ───────────────────────── */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={isEditing ? `Edit Coupon "${formData.code}"` : "Create New Coupon"}
        size="md"
        footer={
          <>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setFormModalOpen(false)}
              className="rounded-lg border border-[#cfdccf] bg-white px-4 py-2 text-xs font-semibold text-[#052E1D] hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="coupon-form"
              disabled={isSubmitting}
              className="rounded-lg bg-[#07552F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#052E1D] transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Coupon"}
            </button>
          </>
        }
      >
        <form id="coupon-form" onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#052E1D] mb-1">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. FESTIVE20"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="w-full rounded-lg border border-[#cfdccf] bg-white px-3 py-2 font-mono text-sm uppercase text-[#052E1D] outline-none focus:border-[#07552F]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#052E1D] mb-1">
                Discount Type
              </label>
              <select
                value={formData.discount_type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, discount_type: e.target.value as any }))
                }
                className="w-full rounded-lg border border-[#cfdccf] bg-white px-3 py-2 text-sm text-[#052E1D] outline-none focus:border-[#07552F]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Flat Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#052E1D] mb-1">
                Value *
              </label>
              <input
                type="number"
                required
                min={1}
                step="0.01"
                placeholder={formData.discount_type === "percentage" ? "10%" : "₹100"}
                value={formData.discount_value}
                onChange={(e) => setFormData((prev) => ({ ...prev, discount_value: e.target.value }))}
                className="w-full rounded-lg border border-[#cfdccf] bg-white px-3 py-2 text-sm text-[#052E1D] outline-none focus:border-[#07552F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#052E1D] mb-1">
                Min Order (₹)
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={formData.min_order_amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, min_order_amount: e.target.value }))
                }
                className="w-full rounded-lg border border-[#cfdccf] bg-white px-3 py-2 text-sm text-[#052E1D] outline-none focus:border-[#07552F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#052E1D] mb-1">
                Max Discount (₹)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Optional cap"
                value={formData.max_discount}
                onChange={(e) => setFormData((prev) => ({ ...prev, max_discount: e.target.value }))}
                className="w-full rounded-lg border border-[#cfdccf] bg-white px-3 py-2 text-sm text-[#052E1D] outline-none focus:border-[#07552F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#052E1D] mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                min={1}
                placeholder="Unlimited if empty"
                value={formData.usage_limit}
                onChange={(e) => setFormData((prev) => ({ ...prev, usage_limit: e.target.value }))}
                className="w-full rounded-lg border border-[#cfdccf] bg-white px-3 py-2 text-sm text-[#052E1D] outline-none focus:border-[#07552F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#052E1D] mb-1">
                Expires On
              </label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData((prev) => ({ ...prev, expires_at: e.target.value }))}
                className="w-full rounded-lg border border-[#cfdccf] bg-white px-3 py-2 text-sm text-[#052E1D] outline-none focus:border-[#07552F]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active_cb"
              checked={formData.is_active}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 rounded accent-[#07552F]"
            />
            <label htmlFor="is_active_cb" className="text-sm text-[#052E1D] cursor-pointer">
              Coupon is active and can be used by customers
            </label>
          </div>
        </form>
      </Modal>

      {/* ── DELETE CONFIRMATION MODAL ─────────────────────────── */}
      <ConfirmModal
        isOpen={Boolean(deletingCoupon)}
        onClose={() => setDeletingCoupon(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Coupon"
        message={
          <div>
            <p>
              Are you sure you want to delete coupon code <strong>&quot;{deletingCoupon?.code}&quot;</strong>?
            </p>
            <p className="mt-2 text-xs text-red-600">
              Customers will no longer be able to use this coupon at checkout.
            </p>
          </div>
        }
        confirmText="Delete Coupon"
        danger={true}
        loading={isDeleting}
      />

      {/* ── ALERT MODAL ────────────────────────────────────────── */}
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
