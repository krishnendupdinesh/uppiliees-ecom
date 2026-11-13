"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  async function remove() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  }

  return (
    <button onClick={remove} aria-label={`Delete ${name}`} className="rounded p-1.5 text-red-600 hover:bg-red-50">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
