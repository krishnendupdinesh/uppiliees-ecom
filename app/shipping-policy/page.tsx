import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping Policy | UPPILIEES",
  description: "Learn about UPPILIEES shipping coverage, dispatch times, delivery estimates, and tracking.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="bg-[#F4F8F1] border-b border-[#E6EFE3] py-12 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#063D27]">Shipping Policy</h1>
        <p className="mt-2 text-base text-[#4D9A18] font-semibold">Pure Kerala produce safely delivered to your doorstep</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[#063D27] mb-3">1. Order Processing & Dispatch</h2>
          <p>
            All products are sourced directly from smallholder homesteads and traditional artisans across Kerala.
            Orders are typically verified, freshly packed in tamper-evident packaging, and dispatched within 24 to 48 business hours.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#063D27] mb-3">2. Delivery Timelines</h2>
          <p>
            We deliver across India via trusted express logistics partners:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Kerala & South India:</strong> 2 to 4 business days</li>
            <li><strong>Rest of India:</strong> 4 to 7 business days</li>
            <li><strong>Remote / North-East regions:</strong> 7 to 10 business days</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#063D27] mb-3">3. Shipping Charges</h2>
          <p>
            Standard shipping is calculated transparently at checkout based on weight and destination PIN code.
            Free shipping promotions apply on select order thresholds as announced on our website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#063D27] mb-3">4. Order Tracking</h2>
          <p>
            Once dispatched, you will receive tracking updates via SMS and Email. You can also monitor your package status on our{" "}
            <Link href="/track-order" className="text-[#07552F] font-bold underline hover:text-[#4D9A18]">
              Track Order
            </Link>{" "}
            page.
          </p>
        </section>
      </div>
    </div>
  );
}

