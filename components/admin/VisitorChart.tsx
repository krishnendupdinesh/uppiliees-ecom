"use client";

import { useState } from "react";

interface HistoryPoint {
  date: string;
  count: number;
  guestCount: number;
  registeredCount: number;
}

export default function VisitorChart({
  initialHistory = [],
}: {
  initialHistory: HistoryPoint[];
}) {
  const [range, setRange] = useState<"7" | "30">("7");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generate data for the chosen range
  const days = range === "7" ? 7 : 30;
  const historyMap = new Map<string, HistoryPoint>();
  initialHistory.forEach((h) => historyMap.set(h.date, h));

  const chartData: HistoryPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const existing = historyMap.get(dateStr);
    chartData.push(
      existing || {
        date: dateStr,
        count: 0,
        guestCount: 0,
        registeredCount: 0,
      }
    );
  }

  const maxCount = Math.max(1, ...chartData.map((d) => d.count));

  return (
    <div className="rounded-xl border border-[#E6EFE3] bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="font-semibold text-base text-[#052E1D]">Visitor Activity</h2>
          <p className="text-xs text-[#5b6b60]">
            Track guest vs registered visitors over time
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-[#F5F8F4] p-1 border border-[#E6EFE3]">
          <button
            type="button"
            onClick={() => setRange("7")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition cursor-pointer ${
              range === "7"
                ? "bg-[#07552F] text-white shadow-xs"
                : "text-[#5b6b60] hover:text-[#052E1D]"
            }`}
          >
            Last 7 days
          </button>
          <button
            type="button"
            onClick={() => setRange("30")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition cursor-pointer ${
              range === "30"
                ? "bg-[#07552F] text-white shadow-xs"
                : "text-[#5b6b60] hover:text-[#052E1D]"
            }`}
          >
            Last 30 days
          </button>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="mt-2 relative">
        <div className="h-44 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2">
          {chartData.map((point, index) => {
            const heightPercent = Math.max(8, Math.round((point.count / maxCount) * 100));
            const isHovered = hoveredIndex === index;
            const displayDate = new Date(point.date).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={point.date}
                className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 z-20 whitespace-nowrap rounded-lg bg-[#052E1D] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg pointer-events-none">
                    <p className="font-bold text-[#E6EFE3]">{displayDate}</p>
                    <p className="text-emerald-300">Total: {point.count} visitors</p>
                    <p className="text-xs text-amber-200">Guests: {point.guestCount}</p>
                    <p className="text-xs text-emerald-200">Registered: {point.registeredCount}</p>
                  </div>
                )}

                {/* Stacked bar visual */}
                <div
                  className={`w-full rounded-t-sm transition-all duration-200 ${
                    point.count > 0 ? "bg-[#07552F] hover:bg-[#052E1D]" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between border-t border-[#E6EFE3] pt-2 text-[10px] text-[#5b6b60]">
          <span>
            {new Date(chartData[0].date).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            })}
          </span>
          {days === 30 && (
            <span>
              {new Date(chartData[14].date).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          <span>
            {new Date(chartData[chartData.length - 1].date).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
