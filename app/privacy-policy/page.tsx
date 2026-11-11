import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | UPPILIEES",
  description: "Read the Privacy Policy of UPPILIEES to understand how we collect, protect, and respect your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="bg-[#F4F8F1] border-b border-[#E6EFE3] py-12 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#063D27]">Privacy Policy</h1>
        <p className="mt-2 text-base text-[#4D9A18] font-semibold">Your privacy and data security are our highest priorities</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[#063D27] mb-3">1. Information We Collect</h2>
          <p>
            When you purchase from UPPILIEES, we collect details necessary to fulfill your order, including your name, email address, phone number, and delivery address. Payment details are processed directly through secure, RBI-authorized payment gateways like Razorpay; we do not store full card numbers or banking passwords.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#063D27] mb-3">2. How We Use Your Information</h2>
          <p>
            Your information is used strictly to process orders, communicate shipment milestones, handle returns/customer service, and optionally send you newsletters if you have chosen to subscribe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#063D27] mb-3">3. Data Protection & Sharing</h2>
          <p>
            We never sell, rent, or lease your personal information to third parties. We share contact and delivery information solely with our verified courier and logistics partners for shipping purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#063D27] mb-3">4. Contact Us About Your Privacy</h2>
          <p>
            For any queries or requests regarding your personal data, reach out to our concierge team at{" "}
            <a href="mailto:care@uppiliees.com" className="text-[#07552F] font-bold underline hover:text-[#4D9A18]">
              care@uppiliees.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}

