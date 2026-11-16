"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { api } from "@/lib/api";

interface ReviewItem {
  id: number | string;
  product_id: number | string;
  user_id?: number | string | null;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductReviews({
  productId,
  slug,
}: {
  productId: number | string;
  slug: string;
}) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    api<{ reviews: ReviewItem[] }>(`/api/reviews?slug=${encodeURIComponent(slug)}&productId=${encodeURIComponent(String(productId))}`)
      .then((res) => {
        if (Array.isArray(res?.reviews)) {
          setReviews(res.reviews);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId, slug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSuccess("");

    if (!comment.trim()) {
      setError("Please write a brief review comment.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await api<ReviewItem>("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId,
          slug,
          rating,
          name: name.trim() || undefined,
          comment: comment.trim(),
        }),
      });
      setReviews((prev) => [created, ...prev]);
      setComment("");
      setSuccess("Thank you! Your review has been posted.");
    } catch (err: any) {
      setError(err.message || "Could not submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-16 border-t border-gray-200 pt-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#063D27] mb-6">
        Customer Reviews ({reviews.length})
      </h2>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-[#E6EFE3] bg-[#F4F8F1]/60 p-6 text-sm text-gray-600">
              No reviews yet for this product. Be the first to share your experience!
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-[#E6EFE3] bg-white p-4 sm:p-5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-[#063D27]">
                    {rev.user_name || "Customer"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {rev.created_at
                      ? new Date(rev.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                    />
                  ))}
                </div>

                <p className="mt-2.5 text-sm text-gray-700 leading-relaxed">
                  {rev.comment}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add Review Form */}
        <div className="rounded-xl border border-[#E6EFE3] bg-[#F4F8F1] p-5 h-fit">
          <h3 className="text-lg font-bold text-[#063D27]">Write a Review</h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#063D27] mb-1">
                Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      size={20}
                      className={
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#063D27] mb-1">
                Your Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-md border border-[#cfdccf] bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#07552F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#063D27] mb-1">
                Your Review *
              </label>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your feedback about this product..."
                className="w-full rounded-md border border-[#cfdccf] bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#07552F]"
              />
            </div>

            {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
            {success && <p className="text-xs font-semibold text-[#07552F]">{success}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[#07552F] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#063D27] transition disabled:opacity-60 cursor-pointer"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

