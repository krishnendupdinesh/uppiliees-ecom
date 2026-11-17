"use client";

import { useState } from "react";
import {
  Search,
  Download,
  Eye,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  IndianRupee,
  Package,
} from "lucide-react";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import Modal from "@/components/admin/Modal";
import type { Order, OrderStatus } from "@/lib/admin/types";

const inr = (n: unknown) => {
  if (n === undefined || n === null) return "₹0";
  const num = Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  return `₹${safe.toLocaleString("en-IN")}`;
};

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [customerTypeFilter, setCustomerTypeFilter] = useState<"all" | "registered" | "guest">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Order Details Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter orders
  const filtered = orders.filter((o) => {
    // 1. Customer Type filter (Requirement 5: All / Registered / Guest)
    if (customerTypeFilter === "registered" && o.isGuest) return false;
    if (customerTypeFilter === "guest" && !o.isGuest) return false;

    // 2. Status filter (Requirement 7: Pending, Confirmed, Shipped, Delivered, Cancelled)
    if (statusFilter !== "all" && o.status !== statusFilter) return false;

    // 3. Search query
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      String(o.id).toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q)
    );
  });

  // Handle status update locally
  function handleStatusUpdated(orderId: string, newStatus: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  }

  // Export filtered orders to CSV (Requirement 7)
  function exportOrdersToCsv() {
    if (filtered.length === 0) return;

    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Customer Type",
      "Email",
      "Phone",
      "Shipping Address",
      "Items Count",
      "Items Details",
      "Total Amount (INR)",
      "Order Status",
      "Payment Status",
    ];

    const rows = filtered.map((o) => {
      const itemsSummary = (o.items || [])
        .map((i) => `${i.qty}x ${i.name} (₹${i.price})`)
        .join(" | ");

      return [
        `"#${o.id}"`,
        `"${o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : ""}"`,
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${o.isGuest ? "Guest" : "Registered"}"`,
        `"${o.email}"`,
        `"${o.phone}"`,
        `"${(o.address || "").replace(/"/g, '""')}"`,
        (o.items || []).length,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        o.total,
        `"${o.status}"`,
        `"${o.paymentStatus || "pending"}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#052E1D]">
            Orders ({filtered.length})
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#5b6b60]">
            Review incoming orders, filter by customer type, update delivery statuses, and inspect details.
          </p>
        </div>

        <button
          type="button"
          onClick={exportOrdersToCsv}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#07552F] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#07552F] shadow-xs transition hover:bg-[#F5F8F4] active:scale-[0.98] cursor-pointer"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E6EFE3] bg-white p-3.5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Customer Type Filter (Requirement 5: All / Registered / Guest) */}
          <div className="flex items-center gap-1 rounded-xl bg-[#F5F8F4] p-1 border border-[#E6EFE3]">
            <button
              type="button"
              onClick={() => setCustomerTypeFilter("all")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                customerTypeFilter === "all"
                  ? "bg-[#07552F] text-white shadow-xs"
                  : "text-[#5b6b60] hover:text-[#052E1D]"
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setCustomerTypeFilter("registered")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                customerTypeFilter === "registered"
                  ? "bg-[#07552F] text-white shadow-xs"
                  : "text-[#5b6b60] hover:text-[#052E1D]"
              }`}
            >
              Registered ({orders.filter((o) => !o.isGuest).length})
            </button>
            <button
              type="button"
              onClick={() => setCustomerTypeFilter("guest")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                customerTypeFilter === "guest"
                  ? "bg-[#07552F] text-white shadow-xs"
                  : "text-[#5b6b60] hover:text-[#052E1D]"
              }`}
            >
              Guest ({orders.filter((o) => o.isGuest).length})
            </button>
          </div>

          {/* Status Filter (Requirement 7) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#052E1D]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#cfdccf] bg-white px-3 py-1.5 text-xs font-semibold text-[#052E1D] outline-none transition focus:border-[#07552F] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8BA894]" />
          <input
            type="text"
            placeholder="Search orders by ID (#), customer name, email, phone, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#cfdccf]/70 bg-white py-2 pl-9 pr-3 text-sm text-[#052E1D] placeholder-[#8BA894] outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E6EFE3] bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E6EFE3] bg-[#F5F8F4] text-[#052E1D]">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Order</th>
              <th className="px-5 py-3.5 font-semibold">Customer</th>
              <th className="px-5 py-3.5 font-semibold">Items</th>
              <th className="px-5 py-3.5 font-semibold">Total</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EFE3]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[#5b6b60]">
                  <ShoppingBag className="mx-auto h-8 w-8 text-[#8BA894] mb-2" />
                  <p className="font-medium text-[#052E1D]">No orders match your filter</p>
                  <p className="text-xs text-[#8BA894] mt-0.5">
                    Orders will appear here as customers place purchases on the store.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id} className="align-top hover:bg-[#F9FCF7]/70 transition-colors">
                  {/* Order ID & Date */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-[#052E1D]">#{o.id}</div>
                    <div className="text-xs text-[#8BA894] mt-0.5">
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </div>
                  </td>

                  {/* Customer Information (Requirement 5: Guest orders labelled "Guest", showing name, phone, address) */}
                  <td className="px-5 py-3.5 max-w-[280px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-[#052E1D]">{o.customerName}</span>
                      {o.isGuest ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
                          Guest
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          Registered
                        </span>
                      )}
                    </div>
                    {o.phone && (
                      <div className="text-xs text-[#052E1D] font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3 text-[#8BA894]" /> {o.phone}
                      </div>
                    )}
                    {o.email && (
                      <div className="text-xs text-[#5b6b60] flex items-center gap-1 truncate" title={o.email}>
                        <Mail className="h-3 w-3 text-[#8BA894]" /> {o.email}
                      </div>
                    )}
                    {o.address && (
                      <div className="text-xs text-[#5b6b60] flex items-start gap-1 mt-1 line-clamp-2" title={o.address}>
                        <MapPin className="h-3 w-3 text-[#8BA894] shrink-0 mt-0.5" />
                        <span>{o.address}</span>
                      </div>
                    )}
                  </td>

                  {/* Order Items */}
                  <td className="px-5 py-3.5 text-xs text-gray-700 max-w-[240px]">
                    <div className="space-y-1">
                      {o.items.map((i, idx) => (
                        <div key={idx} className="line-clamp-1">
                          <span className="font-bold text-[#052E1D]">{i.qty}×</span> {i.name}
                          <span className="text-[#8BA894] ml-1 font-medium">({inr(i.price)})</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Order Total */}
                  <td className="px-5 py-3.5 font-bold text-[#052E1D] whitespace-nowrap">
                    {inr(o.total)}
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <OrderStatusSelect
                      id={o.id}
                      status={o.status}
                      onStatusUpdated={(next) => handleStatusUpdated(o.id, next)}
                    />
                  </td>

                  {/* View Details Action */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(o)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#cfdccf] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#07552F] hover:bg-[#07552F] hover:text-white transition cursor-pointer"
                      title="View order details"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── ORDER DETAILS MODAL ──────────────────────────────── */}
      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details #${selectedOrder?.id}`}
        subtitle={
          selectedOrder?.createdAt
            ? `Placed on ${new Date(selectedOrder.createdAt).toLocaleString("en-IN")}`
            : undefined
        }
        size="2xl"
        footer={
          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className="rounded-lg bg-[#07552F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#052E1D] transition cursor-pointer"
          >
            Close
          </button>
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[#E6EFE3] bg-[#F5F8F4] p-4 text-xs">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#052E1D]/70 flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Customer Details
                </span>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#052E1D]">{selectedOrder.customerName}</span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        selectedOrder.isGuest
                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {selectedOrder.isGuest ? "Guest Order" : "Registered User"}
                    </span>
                  </div>
                  <div className="text-[#5b6b60] flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {selectedOrder.phone || "No phone provided"}
                  </div>
                  <div className="text-[#5b6b60] flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {selectedOrder.email || "No email provided"}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#052E1D]/70 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Shipping Address
                </span>
                <p className="mt-2 text-[#052E1D] font-medium leading-relaxed whitespace-pre-wrap">
                  {selectedOrder.address || "No shipping address provided"}
                </p>
              </div>
            </div>

            {/* Status & Total Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#E6EFE3] py-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#5b6b60]">Order Status:</span>
                <OrderStatusSelect
                  id={selectedOrder.id}
                  status={selectedOrder.status}
                  onStatusUpdated={(next) => handleStatusUpdated(selectedOrder.id, next)}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#5b6b60]">Payment:</span>
                <span className="font-semibold uppercase text-[#052E1D]">
                  {selectedOrder.paymentStatus || "pending"}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#052E1D]/70 mb-2.5 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> Ordered Items ({selectedOrder.items.length})
              </h4>
              <div className="overflow-hidden rounded-xl border border-[#E6EFE3] bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#E6EFE3]/70 text-[#052E1D]">
                    <tr>
                      <th className="px-3.5 py-2.5 font-semibold">Item</th>
                      <th className="px-3.5 py-2.5 font-semibold">Price</th>
                      <th className="px-3.5 py-2.5 font-semibold">Quantity</th>
                      <th className="px-3.5 py-2.5 text-right font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EFE3]">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3.5 py-2.5 font-medium text-[#052E1D]">{item.name}</td>
                        <td className="px-3.5 py-2.5 text-[#5b6b60]">{inr(item.price)}</td>
                        <td className="px-3.5 py-2.5 font-semibold">{item.qty}</td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-[#052E1D]">
                          {inr(item.price * item.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-[#E6EFE3] bg-[#F5F8F4]">
                    <tr>
                      <td colSpan={3} className="px-3.5 py-2.5 font-bold text-right text-[#052E1D]">
                        Order Total:
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-sm text-[#07552F]">
                        {inr(selectedOrder.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
