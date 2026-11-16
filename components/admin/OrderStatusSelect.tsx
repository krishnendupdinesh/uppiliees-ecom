"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, OrderStatus } from "@/lib/admin/types";
import { AlertModal } from "./Modal";
import { api } from "@/lib/api";

export default function OrderStatusSelect({
  id,
  status,
  onStatusUpdated,
}: {
  id: string;
  status: OrderStatus;
  onStatusUpdated?: (newStatus: OrderStatus) => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  async function change(next: OrderStatus) {
    if (next === value) return;
    setValue(next);
    setUpdating(true);
    try {
      await api(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      onStatusUpdated?.(next);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update order status");
      setValue(status);
    } finally {
      setUpdating(false);
    }
  }

  const statusColors: Record<string, string> = {
    pending: "border-amber-300 bg-amber-50 text-amber-900",
    confirmed: "border-blue-300 bg-blue-50 text-blue-900",
    shipped: "border-purple-300 bg-purple-50 text-purple-900",
    delivered: "border-emerald-300 bg-emerald-50 text-emerald-900",
    cancelled: "border-red-300 bg-red-50 text-red-900",
  };

  return (
    <>
      <select
        value={value}
        disabled={updating}
        onChange={(e) => change(e.target.value as OrderStatus)}
        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize outline-none transition cursor-pointer disabled:opacity-50 ${
          statusColors[value] || "border-[#cfdccf] bg-white text-[#052E1D]"
        }`}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <AlertModal
        isOpen={Boolean(errorMessage)}
        onClose={() => setErrorMessage(null)}
        title="Status Update Failed"
        message={errorMessage || ""}
        variant="error"
      />
    </>
  );
}
