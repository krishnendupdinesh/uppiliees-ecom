"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, OrderStatus } from "@/lib/admin/types";
import { api } from "@/lib/api";

export default function OrderStatusSelect({ id, status }: { id: string; status: OrderStatus }) {
  const router = useRouter();
  const [value, setValue] = useState(status);

  async function change(next: OrderStatus) {
    setValue(next);
    try {
      await api(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
      setValue(status);
    }
  }

  return (
    <select
      value={value}
      onChange={(e) => change(e.target.value as OrderStatus)}
      className="rounded-md border border-[#cfdccf] bg-white px-2 py-1 text-sm capitalize"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
