"use client";

import { useState } from "react";
import { Search, Package, Truck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [searched, setSearched] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      setSearched(true);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="bg-[#F4F8F1] border-b border-[#E6EFE3] py-12 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#063D27]">Track Your Order</h1>
        <p className="mt-2 text-base text-[#4D9A18] font-semibold">Real-time shipping and dispatch status</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <form onSubmit={handleTrack} className="bg-white p-6 rounded-2xl border-2 border-[#07552F]/30 shadow-sm space-y-4">
          <div>
            <label htmlFor="track-id" className="block text-sm font-bold text-[#063D27] mb-1.5">
              Order ID or Tracking AWB Number:
            </label>
            <div className="relative">
              <input
                id="track-id"
                type="text"
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(e.target.value);
                  setSearched(false);
                }}
                placeholder="e.g. UPP-1042 or 1489201"
                required
                className="w-full h-12 rounded-lg border border-[#07552F]/40 px-4 pr-12 text-sm text-[#183629] focus:outline-none focus:ring-2 focus:ring-[#07552F]/20"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-4 bg-[#07552F] hover:bg-[#063D27] text-white rounded-md text-xs font-bold transition flex items-center gap-1.5"
              >
                <Search size={14} />
                <span>Track</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Order IDs can be found in your order confirmation email or under your{" "}
            <Link href="/account" className="text-[#07552F] font-bold underline">
              Account orders
            </Link>.
          </p>
        </form>

        {searched && (
          <div className="mt-8 p-6 rounded-2xl bg-[#FDFEFC] border border-[#E6EFE3] shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E6EFE3] pb-4 mb-6">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Order Reference</span>
                <span className="text-lg font-bold text-[#063D27]">#{orderNumber.trim()}</span>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-[#07552F]">
                In Transit
              </span>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#07552F] text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#063D27]">Order Confirmed &amp; Packed</h4>
                  <p className="text-xs text-gray-500">Homestead fulfillment center, Kerala</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#07552F] text-white flex items-center justify-center shrink-0">
                  <Truck size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#063D27]">Handed over to Express Logistics</h4>
                  <p className="text-xs text-gray-500">In transit to regional distribution hub</p>
                </div>
              </div>

              <div className="flex gap-4 items-start opacity-50">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                  <Package size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700">Out for Delivery</h4>
                  <p className="text-xs text-gray-500">Scheduled upon arrival at destination hub</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

