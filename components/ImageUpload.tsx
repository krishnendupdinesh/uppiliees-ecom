"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Upload, Loader2, AlertCircle, Trash2 } from "lucide-react";

type ImageUploadProps = {
  // Callback fired when an image finishes uploading to Cloudinary
  onUploaded: (url: string, publicId: string) => void;
  // Optional existing image URL and publicId (useful when editing a product)
  initialUrl?: string;
  initialPublicId?: string;
  // Optional callback when the user removes/clears the image
  onRemoved?: () => void;
};

export default function ImageUpload({
  onUploaded,
  initialUrl = "",
  initialPublicId = "",
  onRemoved,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl);
  const [publicId, setPublicId] = useState<string>(initialPublicId);
  const [uploading, setUploading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Keep preview in sync if parent updates initialUrl / initialPublicId
  useEffect(() => {
    setPreviewUrl(initialUrl);
  }, [initialUrl]);

  useEffect(() => {
    setPublicId(initialPublicId);
  }, [initialPublicId]);

  // Handle file selection and upload to /api/upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous error and start loading
    setError("");
    setUploading(true);

    try {
      // 1. Put the selected file into FormData
      const formData = new FormData();
      formData.append("file", file);

      // 2. Send POST request to our Next.js upload route
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image.");
      }

      // 3. If a previous Cloudinary image existed, clean it up in the background
      if (publicId && publicId !== data.publicId) {
        fetch("/api/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        }).catch(() => {});
      }

      // 4. Update local preview state and notify parent component
      setPreviewUrl(data.url);
      setPublicId(data.publicId);
      onUploaded(data.url, data.publicId);
    } catch (err: any) {
      setError(err?.message || "Something went wrong while uploading.");
    } finally {
      setUploading(false);
      // Reset input so selecting the same file again still triggers onChange
      e.target.value = "";
    }
  }

  // Optional helper to delete the uploaded image from Cloudinary and clear preview
  async function handleRemove() {
    setError("");
    setDeleting(true);

    try {
      if (publicId) {
        await fetch("/api/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        });
      }
      setPreviewUrl("");
      setPublicId("");
      onRemoved?.();
    } catch (err: any) {
      setError(err?.message || "Failed to remove image.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* File input button and optional remove button */}
      <div className="flex items-center gap-2">
        <label
          className={`inline-flex items-center gap-1.5 rounded-lg border border-[#cfdccf] bg-white px-3 py-1.5 text-xs font-semibold text-[#07552F] shadow-2xs transition hover:bg-[#F5F8F4] ${
            uploading || deleting ? "pointer-events-none opacity-60" : "cursor-pointer"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              <span>{previewUrl ? "Change Image" : "Upload Image"}</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading || deleting}
            className="hidden"
          />
        </label>

        {previewUrl && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={deleting}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{deleting ? "Removing..." : "Remove"}</span>
          </button>
        )}
      </div>

      {/* Error state message */}
      {error && (
        <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded image preview */}
      {previewUrl && (
        <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-[#cfdccf] bg-[#F5F8F4]">
          <Image
            src={previewUrl}
            alt="Uploaded preview"
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
      )}
    </div>
  );
}

