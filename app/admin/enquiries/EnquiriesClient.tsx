"use client";

import { useState } from "react";
import {
  Mail,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  Phone,
  MessageSquare,
  Send,
  User,
} from "lucide-react";
import Modal, { ConfirmModal, AlertModal } from "@/components/admin/Modal";
import type { ContactMessage } from "@/lib/admin/types";
import { api } from "@/lib/api";

export default function EnquiriesClient({
  initialMessages,
}: {
  initialMessages: ContactMessage[];
}) {
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Modal states
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<ContactMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    message: string;
    variant?: "success" | "error";
  } | null>(null);

  // Filter messages
  const filtered = messages.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.phone && m.phone.toLowerCase().includes(q)) ||
      m.message.toLowerCase().includes(q) ||
      (m.topic && m.topic.toLowerCase().includes(q))
    );
  });

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  // View message & mark as read
  async function handleViewMessage(m: ContactMessage) {
    setSelectedMessage(m);
    if (m.status === "unread") {
      try {
        await api(`/api/admin/messages/${m.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "read" }),
        });
        setMessages((prev) =>
          prev.map((item) => (item.id === m.id ? { ...item, status: "read" } : item))
        );
      } catch {
        // Safe to ignore background status sync error
      }
    }
  }

  // Update status (e.g. replied)
  async function handleUpdateStatus(id: number, nextStatus: "unread" | "read" | "replied") {
    try {
      await api(`/api/admin/messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: nextStatus } : m))
      );
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (err: any) {
      setAlertInfo({ title: "Error", message: err.message || "Failed to update message status.", variant: "error" });
    }
  }

  // Confirm delete message
  async function handleDeleteConfirm() {
    if (!deletingMessage) return;
    setIsDeleting(true);
    try {
      await api(`/api/admin/messages/${deletingMessage.id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== deletingMessage.id));
      if (selectedMessage && selectedMessage.id === deletingMessage.id) {
        setSelectedMessage(null);
      }
      setDeletingMessage(null);
      setAlertInfo({ title: "Enquiry Deleted", message: "Customer enquiry removed.", variant: "success" });
    } catch (err: any) {
      setAlertInfo({ title: "Delete Error", message: err.message || "Failed to delete enquiry.", variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  }

  const statusBadges: Record<string, string> = {
    unread: "bg-amber-100 text-amber-900 border border-amber-200",
    read: "bg-blue-100 text-blue-900 border border-blue-200",
    replied: "bg-emerald-100 text-emerald-900 border border-emerald-200",
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#052E1D]">
            Customer Enquiries ({messages.length})
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#5b6b60]">
            Inbox for inquiries and questions submitted through the store contact form.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E6EFE3] bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl bg-[#F5F8F4] p-1 border border-[#E6EFE3]">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#07552F] text-white shadow-xs"
                : "text-[#5b6b60] hover:text-[#052E1D]"
            }`}
          >
            All ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("unread")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === "unread"
                ? "bg-[#07552F] text-white shadow-xs"
                : "text-[#5b6b60] hover:text-[#052E1D]"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("replied")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === "replied"
                ? "bg-[#07552F] text-white shadow-xs"
                : "text-[#5b6b60] hover:text-[#052E1D]"
            }`}
          >
            Replied ({messages.filter((m) => m.status === "replied").length})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8BA894]" />
          <input
            type="text"
            placeholder="Search enquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#cfdccf]/70 bg-white py-1.5 pl-9 pr-3 text-xs sm:text-sm text-[#052E1D] placeholder-[#8BA894] outline-none transition focus:border-[#07552F]"
          />
        </div>
      </div>

      {/* Messages Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E6EFE3] bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E6EFE3] bg-[#F5F8F4] text-[#052E1D]">
            <tr>
              <th className="px-5 py-3.5 font-semibold">From</th>
              <th className="px-5 py-3.5 font-semibold">Topic</th>
              <th className="px-5 py-3.5 font-semibold">Message Preview</th>
              <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Received</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EFE3]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[#5b6b60]">
                  <Mail className="mx-auto h-8 w-8 text-[#8BA894] mb-2" />
                  <p className="font-medium text-[#052E1D]">No enquiries found</p>
                  <p className="text-xs text-[#8BA894] mt-0.5">
                    Messages sent from the Contact page will appear here.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr
                  key={m.id}
                  className={`transition hover:bg-[#F9FCF7]/70 cursor-pointer ${
                    m.status === "unread" ? "bg-amber-50/30 font-medium" : ""
                  }`}
                  onClick={() => handleViewMessage(m)}
                >
                  <td className="px-5 py-3.5 max-w-[200px]">
                    <div className="font-semibold text-[#052E1D] truncate">{m.name}</div>
                    <div className="text-xs text-[#5b6b60] truncate">{m.email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#5b6b60] whitespace-nowrap">
                    {m.topic || "General Enquiry"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-700 max-w-[280px]">
                    <p className="line-clamp-2 leading-relaxed">{m.message}</p>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-[#5b6b60]">
                    {m.created_at
                      ? new Date(m.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        statusBadges[m.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td
                    className="px-5 py-3.5 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleViewMessage(m)}
                        className="rounded-lg p-1.5 text-[#07552F] hover:bg-[#E6EFE3] transition cursor-pointer"
                        title="View enquiry"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingMessage(m)}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete enquiry"
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

      {/* ── VIEW MESSAGE MODAL ───────────────────────────────── */}
      <Modal
        isOpen={Boolean(selectedMessage)}
        onClose={() => setSelectedMessage(null)}
        title={selectedMessage?.topic || "Customer Enquiry"}
        subtitle={
          selectedMessage?.created_at
            ? `Received on ${new Date(selectedMessage.created_at).toLocaleString("en-IN")}`
            : undefined
        }
        size="lg"
        footer={
          <>
            {selectedMessage && (
              <>
                <a
                  href={`mailto:${selectedMessage.email}?subject=Reply regarding your enquiry: ${selectedMessage.topic || "UPPILIEES"}`}
                  onClick={() => handleUpdateStatus(selectedMessage.id, "replied")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#07552F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#052E1D] transition cursor-pointer shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" /> Reply via Email
                </a>

                {selectedMessage.status !== "replied" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedMessage.id, "replied")}
                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    Mark as Replied
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => setSelectedMessage(null)}
              className="rounded-lg border border-[#cfdccf] bg-white px-4 py-2 text-xs font-semibold text-[#052E1D] hover:bg-gray-50 transition cursor-pointer"
            >
              Close
            </button>
          </>
        }
      >
        {selectedMessage && (
          <div className="space-y-4">
            {/* Sender card */}
            <div className="rounded-xl border border-[#E6EFE3] bg-[#F5F8F4] p-3.5 text-xs grid sm:grid-cols-3 gap-2.5">
              <div>
                <span className="text-[#5b6b60] flex items-center gap-1">
                  <User className="h-3 w-3" /> Name
                </span>
                <p className="font-semibold text-sm text-[#052E1D] mt-0.5">{selectedMessage.name}</p>
              </div>

              <div>
                <span className="text-[#5b6b60] flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </span>
                <p className="font-semibold text-xs text-[#052E1D] mt-0.5 truncate" title={selectedMessage.email}>
                  {selectedMessage.email}
                </p>
              </div>

              <div>
                <span className="text-[#5b6b60] flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </span>
                <p className="font-semibold text-xs text-[#052E1D] mt-0.5">
                  {selectedMessage.phone || "Not provided"}
                </p>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#052E1D]/70 block mb-1.5">
                Message Content
              </span>
              <div className="rounded-xl border border-[#E6EFE3] bg-white p-4 text-sm text-[#052E1D] leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── DELETE CONFIRM MODAL ─────────────────────────────── */}
      <ConfirmModal
        isOpen={Boolean(deletingMessage)}
        onClose={() => setDeletingMessage(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Enquiry"
        message={
          <div>
            <p>
              Are you sure you want to delete this enquiry from{" "}
              <strong>{deletingMessage?.name}</strong>?
            </p>
            <p className="mt-2 text-xs text-red-600">
              This message will be removed from your inbox permanently.
            </p>
          </div>
        }
        confirmText="Delete Message"
        danger={true}
        loading={isDeleting}
      />

      {/* ── ALERT MODAL ────────────────────────────────────────── */}
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
