"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Star, Trash2, Eye, Filter, RefreshCw, MessageSquare } from "lucide-react";
import Modal, { ConfirmModal, AlertModal } from "@/components/admin/Modal";
import type { ReviewItem } from "@/lib/admin/types";
import { api } from "@/lib/api";

export default function ReviewsClient({
  initialReviews,
  productsList,
}: {
  initialReviews: ReviewItem[];
  productsList: { id: number | string; name: string }[];
}) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Modals state
  const [viewingReview, setViewingReview] = useState<ReviewItem | null>(null);
  const [deletingReview, setDeletingReview] = useState<ReviewItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; variant?: "success" | "error" } | null>(null);

  // Filter reviews
  const filtered = reviews.filter((r) => {
    const matchesProduct =
      selectedProduct === "all" || String(r.product_id) === String(selectedProduct);
    const matchesRating =
      selectedRating === "all" || String(r.rating) === String(selectedRating);
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.comment.toLowerCase().includes(q) ||
      r.user_name.toLowerCase().includes(q) ||
      r.product_name.toLowerCase().includes(q);

    return matchesProduct && matchesRating && matchesSearch;
  });

  // Handle Review Deletion
  async function handleDeleteConfirm() {
    if (!deletingReview) return;
    setIsDeleting(true);
    try {
      await api(`/api/admin/reviews/${deletingReview.id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((item) => item.id !== deletingReview.id));
      setDeletingReview(null);
      setAlertInfo({
        title: "Review Deleted",
        message: "The customer review has been permanently removed.",
        variant: "success",
      });
    } catch (err: any) {
      setAlertInfo({
        title: "Error",
        message: err.message || "Failed to delete review.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#052E1D]">
            Reviews ({filtered.length})
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#5b6b60]">
            Manage and moderate customer product reviews and ratings.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 rounded-xl border border-[#E6EFE3] bg-white p-3 sm:grid-cols-[1fr_200px_160px] shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8BA894]" />
          <input
            type="text"
            placeholder="Search reviews by comment, product, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#cfdccf]/70 bg-white py-2 pl-9 pr-3 text-sm text-[#052E1D] placeholder-[#8BA894] outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20"
          />
        </div>

        {/* Filter by Product */}
        <div className="relative">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full rounded-lg border border-[#cfdccf]/70 bg-white py-2 px-3 text-sm text-[#052E1D] outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20 cursor-pointer"
          >
            <option value="all">All Products</option>
            {productsList.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Rating */}
        <div className="relative">
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="w-full rounded-lg border border-[#cfdccf]/70 bg-white py-2 px-3 text-sm text-[#052E1D] outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20 cursor-pointer"
          >
            <option value="all">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
            <option value="3">⭐⭐⭐ (3 Stars)</option>
            <option value="2">⭐⭐ (2 Stars)</option>
            <option value="1">⭐ (1 Star)</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E6EFE3] bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#E6EFE3]/80 text-[#052E1D]">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Comment</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Date</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EFE3]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#5b6b60]">
                  <MessageSquare className="mx-auto h-8 w-8 text-[#8BA894] mb-2" />
                  <p className="font-medium text-[#052E1D]">No reviews found</p>
                  <p className="text-xs text-[#8BA894] mt-0.5">
                    Reviews submitted on product pages will appear here.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((rev) => (
                <tr key={rev.id} className="hover:bg-[#F5F8F4]/50 transition-colors">
                  {/* Product */}
                  <td className="px-4 py-3 font-medium text-[#052E1D] max-w-[200px]">
                    {rev.product_slug ? (
                      <Link
                        href={`/products/${rev.product_slug}`}
                        target="_blank"
                        className="hover:underline text-[#07552F] font-semibold line-clamp-2"
                        title={rev.product_name}
                      >
                        {rev.product_name}
                      </Link>
                    ) : (
                      <span className="line-clamp-2">{rev.product_name}</span>
                    )}
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#052E1D]">{rev.user_name || "Guest"}</div>
                    {rev.user_email ? (
                      <div className="text-xs text-[#5b6b60]">{rev.user_email}</div>
                    ) : (
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        Guest
                      </span>
                    )}
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-200"
                          }
                        />
                      ))}
                      <span className="ml-1 text-xs font-semibold text-[#052E1D]">
                        {rev.rating}.0
                      </span>
                    </div>
                  </td>

                  {/* Comment */}
                  <td className="px-4 py-3 text-gray-700 max-w-[320px]">
                    <p className="line-clamp-2 text-xs sm:text-sm leading-relaxed">
                      {rev.comment}
                    </p>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-[#5b6b60]">
                    {rev.created_at
                      ? new Date(rev.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingReview(rev)}
                        className="rounded-lg p-1.5 text-[#07552F] hover:bg-[#E6EFE3] transition cursor-pointer"
                        title="View review details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingReview(rev)}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete review"
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

      {/* ── MODALS ────────────────────────────────────────────── */}
      {/* 1. View Review Details Modal */}
      <Modal
        isOpen={Boolean(viewingReview)}
        onClose={() => setViewingReview(null)}
        title="Review Details"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                const target = viewingReview;
                setViewingReview(null);
                setDeletingReview(target);
              }}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer"
            >
              Delete Review
            </button>
            <button
              type="button"
              onClick={() => setViewingReview(null)}
              className="rounded-lg bg-[#07552F] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#052E1D] transition cursor-pointer"
            >
              Close
            </button>
          </>
        }
      >
        {viewingReview && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#052E1D]/70">
                Product
              </span>
              <p className="font-semibold text-base text-[#052E1D]">
                {viewingReview.product_name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#F5F8F4] p-3 text-xs">
              <div>
                <span className="text-[#5b6b60]">Customer</span>
                <p className="font-semibold text-[#052E1D]">{viewingReview.user_name || "Guest"}</p>
                {viewingReview.user_email && (
                  <p className="text-[#5b6b60]">{viewingReview.user_email}</p>
                )}
              </div>
              <div>
                <span className="text-[#5b6b60]">Date</span>
                <p className="font-semibold text-[#052E1D]">
                  {viewingReview.created_at
                    ? new Date(viewingReview.created_at).toLocaleString("en-IN")
                    : "—"}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#052E1D]/70">
                Rating
              </span>
              <div className="mt-1 flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    className={
                      star <= viewingReview.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    }
                  />
                ))}
                <span className="ml-1 text-sm font-bold text-[#052E1D]">
                  {viewingReview.rating} out of 5 stars
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#052E1D]/70">
                Review Comment
              </span>
              <div className="mt-1 rounded-lg border border-[#E6EFE3] bg-white p-3.5 text-sm text-[#052E1D] leading-relaxed whitespace-pre-wrap">
                {viewingReview.comment}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingReview)}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Review"
        message={
          <div>
            <p>
              Are you sure you want to delete this review by{" "}
              <strong>{deletingReview?.user_name || "Guest"}</strong> for{" "}
              <strong>{deletingReview?.product_name}</strong>?
            </p>
            <p className="mt-2 text-xs text-red-600">
              This review will immediately be removed from the store product page and cannot be undone.
            </p>
          </div>
        }
        confirmText="Delete Review"
        danger={true}
        loading={isDeleting}
      />

      {/* 3. Feedback Alert Modal */}
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
