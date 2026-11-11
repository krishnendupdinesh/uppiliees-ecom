import type { Metadata } from "next";
import { ShieldCheck, Leaf, HeartHandshake, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Quality Standards | UPPILIEES",
  description: "Discover our stringent homestead purity pledge, ethical harvesting methods, and zero-compromise quality standards.",
};

export default function QualityStandardsPage() {
  const standards = [
    {
      icon: Leaf,
      title: "100% Homestead Harvested",
      desc: "Every coconut, herb, root, and plantain is collected from sustainable smallholder family homesteads across pristine Kerala farmlands.",
    },
    {
      icon: ShieldCheck,
      title: "Zero Toxins & Chemical Preservatives",
      desc: "No artificial dyes, parabens, sulphates, synthetic stabilizers, or mineral oils are ever permitted in our formulations.",
    },
    {
      icon: HeartHandshake,
      title: "Traditional Artisanal Processes",
      desc: "Crafted using ancestral knowledge: wood-pressed cold oils, slow simmering in bronze vessels (uruli), and sun-drying without industrial ovens.",
    },
    {
      icon: CheckCircle2,
      title: "Batch Testing & Verification",
      desc: "Every batch is inspected for purity, authentic aroma, and strict hygiene parameters before safe sealing and shipping.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="bg-[#F4F8F1] border-b border-[#E6EFE3] py-12 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#063D27]">Quality Standards &amp; Purity Pledge</h1>
        <p className="mt-2 text-base text-[#4D9A18] font-semibold">Pure Nature. Pure Goodness. No compromises, ever.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {standards.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl bg-[#FDFEFC] border-2 border-[#E6EFE3] hover:border-[#07552F]/40 transition shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-[#07552F] text-[#C7E900] flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#063D27] mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

