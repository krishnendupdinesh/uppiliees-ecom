import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | UPPILIEES",
  description: "Terms and conditions governing use of the UPPILIEES website and purchasing authentic Kerala products.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="bg-[#F4F8F1] border-b border-[#E6EFE3] py-12 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#063D27]">Terms &amp; Conditions</h1>
        <p className="mt-2 text-base text-[#4D9A18] font-semibold">Guidelines for using UPPILIEES platform and services</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[#063D27] mb-3">1. Agreement to Terms</h2>
          <p>
            By accessing or ordering from UPPILIEES, you agree to comply with and be bound by these Terms and Conditions. Please read them thoroughly prior to placing orders.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#063D27] mb-3">2. Product Authenticity & Handcrafting</h2>
          <p>
            Our products are traditional, artisanal, and homestead-produced. Minor natural variations in shade, texture, aroma, or weave are inherent hallmarks of handmade kasavu handlooms, stone-ground powders, and virgin oils.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#063D27] mb-3">3. Pricing & Payments</h2>
          <p>
            All prices listed on UPPILIEES are in Indian Rupees (INR) and include applicable taxes. We accept online payments via Razorpay (UPI, Credit/Debit cards, Net Banking) as well as Cash on Delivery (COD) for eligible pin codes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#063D27] mb-3">4. Cancellations & Returns</h2>
          <p>
            Orders can be cancelled before dispatch by contacting customer care. For perishable food items and unsealed personal care formulations, returns are eligible only in cases of damage in transit or defect upon arrival.
          </p>
        </section>
      </div>
    </div>
  );
}

