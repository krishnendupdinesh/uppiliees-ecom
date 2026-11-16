"use client";

import { useState } from "react";
import {
  Search,
  Users as UsersIcon,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Download,
  Calendar,
  Phone,
  Mail,
  ShoppingBag,
  IndianRupee,
} from "lucide-react";
import Modal, { ConfirmModal, AlertModal } from "@/components/admin/Modal";
import type { RegisteredUser } from "@/lib/admin/types";
import { api } from "@/lib/api";

const inr = (n: number | undefined | null) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

interface UserOrderDetail {
  id: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  address: string;
}

interface UserDetailsApiResponse {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_blocked: boolean;
  created_at: string;
  orders: UserOrderDetail[];
}

interface UserFullDetail extends RegisteredUser {
  ordersList?: UserOrderDetail[];
}

export default function UsersClient({ initialUsers }: { initialUsers: RegisteredUser[] }) {
  const [users, setUsers] = useState<RegisteredUser[]>(initialUsers);
  const [search, setSearch] = useState("");

  // Modals state
  const [selectedUser, setSelectedUser] = useState<UserFullDetail | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [blockingUser, setBlockingUser] = useState<RegisteredUser | null>(null);
  const [isUpdatingBlock, setIsUpdatingBlock] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    message: string;
    variant?: "success" | "error";
  } | null>(null);

  // Filter users by name, email, or phone
  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q))
    );
  });

  // View user details and load their order history
  async function handleViewUser(user: RegisteredUser) {
    setSelectedUser(user);
    setIsLoadingDetails(true);
    try {
      const data = await api<UserDetailsApiResponse>(`/api/admin/users/${user.id}`);
      setSelectedUser({
        ...user,
        phone: data.phone || user.phone,
        is_blocked: data.is_blocked !== undefined ? data.is_blocked : user.is_blocked,
        ordersList: Array.isArray(data.orders) ? data.orders : [],
      });
    } catch {
      // Keep basic user info if extra fetch fails
    } finally {
      setIsLoadingDetails(false);
    }
  }

  // Confirm and toggle block status
  async function handleConfirmBlockToggle() {
    if (!blockingUser) return;
    const nextBlocked = !blockingUser.is_blocked;
    setIsUpdatingBlock(true);
    try {
      await api(`/api/admin/users/${blockingUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_blocked: nextBlocked }),
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === blockingUser.id ? { ...u, is_blocked: nextBlocked } : u))
      );

      if (selectedUser && selectedUser.id === blockingUser.id) {
        setSelectedUser((prev) => (prev ? { ...prev, is_blocked: nextBlocked } : null));
      }

      const action = nextBlocked ? "blocked" : "unblocked";
      setAlertInfo({
        title: `User ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        message: `Account for ${blockingUser.name} has been ${action}. ${
          nextBlocked ? "The user cannot log in while blocked." : "The user can now log in normally."
        }`,
        variant: "success",
      });
      setBlockingUser(null);
    } catch (err: any) {
      setAlertInfo({
        title: "Update Failed",
        message: err.message || "Failed to update user block status.",
        variant: "error",
      });
    } finally {
      setIsUpdatingBlock(false);
    }
  }

  // Export Users to CSV (Requirement 7)
  function exportUsersToCsv() {
    if (filtered.length === 0) return;

    const headers = [
      "User ID",
      "Full Name",
      "Email Address",
      "Phone",
      "Joined Date",
      "Total Orders",
      "Total Spent (INR)",
      "Status",
    ];

    const rows = filtered.map((u) => [
      `"${u.id}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.phone || ""}"`,
      `"${u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN") : ""}"`,
      u.orders,
      u.spent,
      `"${u.is_blocked ? "Blocked" : "Active"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `registered_users_${new Date().toISOString().split("T")[0]}.csv`);
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
            Registered Users ({users.length})
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#5b6b60]">
            Manage registered customer accounts, view complete order histories, and manage block status.
          </p>
        </div>

        <button
          type="button"
          onClick={exportUsersToCsv}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#07552F] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#07552F] shadow-xs transition hover:bg-[#F5F8F4] active:scale-[0.98] cursor-pointer"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Total Users Banner / Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E6EFE3] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#5b6b60] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Registered</span>
            <UsersIcon className="h-4 w-4 text-[#07552F]" />
          </div>
          <div className="text-2xl font-bold text-[#052E1D]">{users.length}</div>
          <div className="text-[11px] text-[#5b6b60] mt-0.5">Verified customer profiles</div>
        </div>

        <div className="rounded-xl border border-[#E6EFE3] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#5b6b60] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Accounts</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            {users.filter((u) => !u.is_blocked).length}
          </div>
          <div className="text-[11px] text-[#5b6b60] mt-0.5">Can login and place orders</div>
        </div>

        <div className="rounded-xl border border-[#E6EFE3] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#5b6b60] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Blocked Accounts</span>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700">
            {users.filter((u) => u.is_blocked).length}
          </div>
          <div className="text-[11px] text-[#5b6b60] mt-0.5">Access disabled by admin</div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="rounded-xl border border-[#E6EFE3] bg-white p-3 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8BA894]" />
          <input
            type="text"
            placeholder="Search registered users by name, email, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#cfdccf]/70 bg-white py-2 pl-9 pr-3 text-sm text-[#052E1D] placeholder-[#8BA894] outline-none transition focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E6EFE3] bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E6EFE3] bg-[#F5F8F4] text-[#052E1D]">
            <tr>
              <th className="px-5 py-3.5 font-semibold">User</th>
              <th className="px-5 py-3.5 font-semibold">Contact</th>
              <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Joined Date</th>
              <th className="px-5 py-3.5 font-semibold">Orders</th>
              <th className="px-5 py-3.5 font-semibold">Total Spent</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EFE3]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-[#5b6b60]">
                  <UsersIcon className="mx-auto h-8 w-8 text-[#8BA894] mb-2" />
                  <p className="font-medium text-[#052E1D]">No registered users found</p>
                  <p className="text-xs text-[#8BA894] mt-0.5">
                    Customers who create an account or sign up will appear here.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="transition hover:bg-[#F9FCF7]/70">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-[#052E1D]">{u.name}</div>
                    <div className="text-xs text-[#8BA894]">ID: #{u.id}</div>
                  </td>
                  <td className="px-5 py-3.5 text-[#5b6b60]">
                    <div>{u.email}</div>
                    {u.phone ? <div className="text-xs text-[#8BA894]">{u.phone}</div> : null}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-[#5b6b60]">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 font-medium">{u.orders}</td>
                  <td className="px-5 py-3.5 font-semibold text-[#052E1D]">{inr(u.spent)}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.is_blocked
                          ? "bg-red-100 text-red-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {u.is_blocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleViewUser(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#cfdccf] bg-white px-2.5 py-1 text-xs font-semibold text-[#07552F] hover:bg-[#07552F] hover:text-white transition cursor-pointer"
                        title="View user details and order history"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>

                      <button
                        type="button"
                        onClick={() => setBlockingUser(u)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                          u.is_blocked
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                        title={u.is_blocked ? "Unblock user account" : "Block user account"}
                      >
                        {u.is_blocked ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" /> Unblock
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-3.5 w-3.5" /> Block
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── USER DETAILS & ORDER HISTORY MODAL ────────────────── */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name || "User Details"}
        subtitle={`Registered Customer #${selectedUser?.id}`}
        size="2xl"
        footer={
          <>
            {selectedUser && (
              <button
                type="button"
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  setBlockingUser(target);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  selectedUser.is_blocked
                    ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                {selectedUser.is_blocked ? "Unblock Account" : "Block Account"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="rounded-lg bg-[#07552F] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#052E1D] transition cursor-pointer"
            >
              Close
            </button>
          </>
        }
      >
        {selectedUser && (
          <div className="space-y-5">
            {/* Customer Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl border border-[#E6EFE3] bg-[#F5F8F4] p-3.5 text-xs">
              <div>
                <span className="text-[#5b6b60] flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </span>
                <p className="font-semibold text-[#052E1D] mt-0.5 truncate" title={selectedUser.email}>
                  {selectedUser.email}
                </p>
              </div>

              <div>
                <span className="text-[#5b6b60] flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </span>
                <p className="font-semibold text-[#052E1D] mt-0.5">
                  {selectedUser.phone || "Not provided"}
                </p>
              </div>

              <div>
                <span className="text-[#5b6b60] flex items-center gap-1">
                  <ShoppingBag className="h-3 w-3" /> Orders Placed
                </span>
                <p className="font-semibold text-[#052E1D] mt-0.5">
                  {selectedUser.orders} {selectedUser.orders === 1 ? "order" : "orders"}
                </p>
              </div>

              <div>
                <span className="text-[#5b6b60] flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" /> Total Spent
                </span>
                <p className="font-bold text-[#07552F] mt-0.5">{inr(selectedUser.spent)}</p>
              </div>
            </div>

            {/* Account Status and Joined Date */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#5b6b60]">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Member since:{" "}
                  <strong>
                    {selectedUser.created_at
                      ? new Date(selectedUser.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </strong>
                </span>
              </div>

              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    selectedUser.is_blocked
                      ? "bg-red-100 text-red-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {selectedUser.is_blocked ? "Account Blocked" : "Active Customer"}
                </span>
              </div>
            </div>

            {/* Order History */}
            <div>
              <h4 className="text-sm font-bold text-[#052E1D] mb-2 flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-[#07552F]" /> Order History
              </h4>

              {isLoadingDetails ? (
                <div className="p-6 text-center text-xs text-[#5b6b60]">
                  Loading order history...
                </div>
              ) : !selectedUser.ordersList || selectedUser.ordersList.length === 0 ? (
                <div className="rounded-lg border border-[#E6EFE3] bg-white p-6 text-center text-xs text-[#5b6b60]">
                  No orders placed yet by this customer.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[#E6EFE3] bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#E6EFE3]/70 text-[#052E1D]">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Order</th>
                        <th className="px-3 py-2 font-semibold">Date</th>
                        <th className="px-3 py-2 font-semibold">Shipping Address</th>
                        <th className="px-3 py-2 font-semibold">Total</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EFE3]">
                      {selectedUser.ordersList.map((ord) => (
                        <tr key={ord.id}>
                          <td className="px-3 py-2 font-semibold text-[#052E1D]">#{ord.id}</td>
                          <td className="px-3 py-2 text-[#5b6b60] whitespace-nowrap">
                            {ord.createdAt
                              ? new Date(ord.createdAt).toLocaleDateString("en-IN")
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate" title={ord.address}>
                            {ord.address || "—"}
                          </td>
                          <td className="px-3 py-2 font-bold text-[#052E1D]">{inr(ord.total)}</td>
                          <td className="px-3 py-2 capitalize font-medium text-[#07552F]">
                            {ord.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── CONFIRM BLOCK / UNBLOCK MODAL ───────────────────────── */}
      <ConfirmModal
        isOpen={Boolean(blockingUser)}
        onClose={() => setBlockingUser(null)}
        onConfirm={handleConfirmBlockToggle}
        title={blockingUser?.is_blocked ? "Unblock User" : "Block User"}
        message={
          <div>
            <p>
              Are you sure you want to {blockingUser?.is_blocked ? "unblock" : "block"}{" "}
              <strong>{blockingUser?.name}</strong> ({blockingUser?.email})?
            </p>
            <p className="mt-2 text-xs text-red-600">
              {blockingUser?.is_blocked
                ? "This will restore the user's ability to log in and make purchases."
                : "Blocked users cannot log in to their account or place new orders."}
            </p>
          </div>
        }
        confirmText={blockingUser?.is_blocked ? "Unblock Account" : "Block Account"}
        danger={!blockingUser?.is_blocked}
        loading={isUpdatingBlock}
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
