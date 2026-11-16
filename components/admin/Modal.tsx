"use client";

import React, { useEffect, useRef } from "react";
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  showCloseButton?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-4xl",
};

/**
 * Reusable modal component matching the Uppiliees Admin UI.
 * Handles Esc key, backdrop click, body scroll lock, and mobile responsiveness.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        ref={modalRef}
        className={`relative z-10 w-full ${sizeClasses[size] || "max-w-md"} transform overflow-hidden rounded-2xl border border-[#E6EFE3] bg-white shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between border-b border-[#E6EFE3] bg-[#F5F8F4] px-5 py-4">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-[#052E1D]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs text-[#5b6b60]">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="ml-3 rounded-lg p-1.5 text-[#5b6b60] hover:bg-[#E6EFE3] hover:text-[#052E1D] transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="max-h-[calc(88vh-8rem)] overflow-y-auto px-5 py-5 text-sm text-gray-700">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-[#E6EFE3] bg-[#F5F8F4]/70 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Standard confirmation modal for dangerous or important actions (deletes, reorders, blocks).
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      size="sm"
      showCloseButton={!loading}
      title={
        <div className="flex items-center gap-2">
          {danger ? (
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-[#07552F] shrink-0" />
          )}
          <span>{title}</span>
        </div>
      }
      footer={
        <>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg border border-[#cfdccf] bg-white px-4 py-2 text-xs font-semibold text-[#052E1D] hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition cursor-pointer shadow-xs disabled:opacity-50 ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#07552F] hover:bg-[#052E1D]"
            }`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </>
      }
    >
      <div className="py-2 text-sm text-[#052E1D]/90">{message}</div>
    </Modal>
  );
}

/**
 * Reusable AlertModal for success, error, and notice messages to replace browser alert().
 */
export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  variant = "info",
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: React.ReactNode;
  variant?: "success" | "error" | "info";
}) {
  const icon =
    variant === "success" ? (
      <CheckCircle className="h-6 w-6 text-emerald-600" />
    ) : variant === "error" ? (
      <AlertTriangle className="h-6 w-6 text-red-600" />
    ) : (
      <Info className="h-6 w-6 text-[#07552F]" />
    );

  const defaultTitle =
    variant === "success"
      ? "Success"
      : variant === "error"
      ? "Notice"
      : "Information";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-[#07552F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#052E1D] transition cursor-pointer"
        >
          OK
        </button>
      }
    >
      <div className="flex items-start gap-3.5 py-1">
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div>
          <h4 className="font-semibold text-[#052E1D] text-base mb-1">
            {title || defaultTitle}
          </h4>
          <div className="text-sm text-[#5b6b60] leading-relaxed">{message}</div>
        </div>
      </div>
    </Modal>
  );
}
