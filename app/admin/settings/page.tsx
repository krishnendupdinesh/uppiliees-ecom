"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle =
    "w-full rounded-md border border-[#cfdccf] bg-white px-3 py-2 text-sm text-[#052E1D] outline-none focus:border-[#07552F] focus:ring-2 focus:ring-[#07552F]/20";
  const labelStyle = "mb-1 block text-sm font-medium text-[#052E1D]";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#052E1D]">Settings</h1>

      <div className="max-w-xl rounded-lg border border-[#E6EFE3] bg-white p-6">
        <h2 className="text-lg font-semibold text-[#052E1D] mb-4">Change Password</h2>

        {success && (
          <div className="mb-4 rounded-md bg-[#E6EFE3] p-3 text-sm font-medium text-[#07552F]">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelStyle}>Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputStyle}
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="pt-2">
            <button
              disabled={loading}
              type="submit"
              className="rounded-md bg-[#07552F] px-5 py-2 text-sm font-medium text-white hover:bg-[#052E1D] disabled:opacity-60 transition"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

