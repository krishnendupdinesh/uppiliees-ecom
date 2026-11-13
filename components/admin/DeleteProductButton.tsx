"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";

export default function DeleteProductButton({
  id,
  name,
  buttonStyle = "icon",
}: {
  id: string;
  name: string;
  buttonStyle?: "icon" | "full";
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  if (buttonStyle === "full") {
    return (
      <button
        type="button"
        onClick={remove}
        disabled={deleting}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/80 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        aria-label={`Delete ${name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>{deleting ? "Deleting..." : "Delete"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={deleting}
      aria-label={`Delete ${name}`}
      title={`Delete ${name}`}
      className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50 cursor-pointer"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
