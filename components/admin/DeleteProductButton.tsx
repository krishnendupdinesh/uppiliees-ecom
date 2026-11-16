"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmModal, AlertModal } from "./Modal";
import { api } from "@/lib/api";

export default function DeleteProductButton({
  id,
  name,
  buttonStyle = "icon",
  onDeleted,
}: {
  id: string;
  name: string;
  buttonStyle?: "icon" | "full";
  onDeleted?: (id: string) => void;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      setShowConfirm(false);
      onDeleted?.(id);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {buttonStyle === "full" ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/80 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          aria-label={`Delete ${name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>{deleting ? "Deleting..." : "Delete"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={deleting}
          aria-label={`Delete ${name}`}
          title={`Delete ${name}`}
          className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50 cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={
          <div>
            <p>
              Are you sure you want to delete <strong>&quot;{name}&quot;</strong>?
            </p>
            <p className="mt-2 text-xs text-red-600">
              This action cannot be undone and will delete the product and its images.
            </p>
          </div>
        }
        confirmText="Delete Product"
        danger={true}
        loading={deleting}
      />

      {/* Error Alert Modal */}
      <AlertModal
        isOpen={Boolean(errorMessage)}
        onClose={() => setErrorMessage(null)}
        title="Delete Error"
        message={errorMessage || ""}
        variant="error"
      />
    </>
  );
}
