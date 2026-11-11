"use client";

import { useState } from "react";

export type ProductTab = {
  id: string;
  label: string;
  paragraphs: string[];
};

export default function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="mt-8">
      {/* Tab bar */}
      <div
        role="tablist"
        className="flex border-b border-gray-200 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === current.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={`flex-1 whitespace-nowrap px-4 py-3 text-sm transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-[#063D27] text-[#063D27] font-semibold"
                  : "border-transparent text-gray-400 hover:text-[#063D27]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div role="tabpanel" className="pt-5 space-y-4">
        {current.paragraphs.map((text, i) => (
          <p key={i} className="text-sm text-gray-600 leading-relaxed">
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}