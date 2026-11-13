"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { clearBuyNowItem } from "@/lib/buyNow";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F]";

export default function OrderSuccessClient({ orderId }: { orderId: string }) {
  useEffect(() => {
    // Clear any buyNow item on order success
    clearBuyNowItem();
  }, []);

  return (
    <main className="min-h-[70vh] bg-white py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-[580px] rounded-2xl border-2 border-[#07552F]/30 bg-[#FAFBF6] px-6 py-12 text-center shadow-sm">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full border-2 border-[#07552F]/40 bg-white text-[#07552F] shadow-sm">
          <CheckCircle2 size={44} className="text-[#4D9A18]" />
        </div>

        <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-[#063D27]">
          Order Confirmed!
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#68786B]">
          Thank you for choosing pure Kerala homestead goodness with UPPILIEES.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-white border border-[#E6EFE3] text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              Order Reference
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-[#07552F]">
              Confirmed
            </span>
          </div>
          <p className="text-xl font-bold text-[#07552F] mt-1">#{orderId}</p>
          <p className="text-xs text-gray-500 mt-2">
            A confirmation receipt and dispatch notifications have been sent to your contact details.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/account"
            className={`inline-flex h-12 items-center justify-center rounded-md bg-[#07552F] px-6 text-sm font-bold text-white transition-colors hover:bg-[#063D27] ${focusRing}`}
          >
            View Your Orders
          </Link>
          <Link
            href="/shop"
            className={`inline-flex h-12 items-center justify-center rounded-md border-2 border-[#07552F] bg-white px-6 text-sm font-bold text-[#07552F] transition-colors hover:bg-[#F4F8F1] ${focusRing}`}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

