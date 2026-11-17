"use client";

import { useState, useEffect } from "react";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  getOrderStatusColor,
  type OrderStatus,
} from "@/lib/order-status";
import { AlertModal } from "./Modal";
import { api } from "@/lib/api";
import { Check } from "lucide-react";

export default function OrderStatusSelect({
  id,
  status,
  onStatusUpdated,
}: {
  id: string;
  status: OrderStatus;
  onStatusUpdated?: (newStatus: OrderStatus) => void;
}) {
  const [value, setValue] = useState<OrderStatus>(status);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Keep local value synced if parent status changes
  useEffect(() => {
    setValue(status);
  }, [status]);

  async function change(next: OrderStatus) {
    if (next === value || updating) return;

    const previousStatus = value;
    // Optimistically update
    setValue(next);
    setUpdating(true);
    setJustSaved(false);

    try {
      // Send lowercase value to API
      const res = await api(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next.toLowerCase() }),
      });

      // Update parent without page reload
      onStatusUpdated?.(next);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err: any) {
      // On failure, keep/revert old status and show error
      setValue(previousStatus);
      setErrorMessage(err.message || "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="relative inline-flex items-center">
        <select
          value={value.toLowerCase()}
          disabled={updating || value === "cancelled"}
          onChange={(e) => change(e.target.value.toLowerCase() as OrderStatus)}
          className={`h-7 rounded-lg border px-2.5 py-0.5 text-xs font-semibold outline-none transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${getOrderStatusColor(
            value
          )}`}
          title={
            value === "cancelled"
              ? "Cancelled orders cannot be reopened."
              : `Change status (currently ${ORDER_STATUS_LABELS[value] || value})`
          }
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s} className="bg-white text-slate-900 font-normal py-1">
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {justSaved && (
        <span
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 animate-fade-in"
          title="Status saved"
        >
          <Check className="h-3 w-3 text-emerald-600" />
          <span>Saved</span>
        </span>
      )}

      {/* Alert Modal for Full Error Message Display */}
      <AlertModal
        isOpen={Boolean(errorMessage)}
        onClose={() => setErrorMessage(null)}
        title="Status Update Failed"
        message={
          <div className="space-y-1.5 break-words">
            <p>{errorMessage}</p>
          </div>
        }
        variant="error"
      />
    </div>
  );
}
