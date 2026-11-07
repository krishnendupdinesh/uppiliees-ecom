"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Sparkles } from "lucide-react";
import { PRODUCTS } from "@/data/products";

export default function SearchDropdown({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  containerRef,
}) {
  // Live filtering by product name or category
  const filteredProducts = searchQuery.trim()
    ? PRODUCTS.filter((item) => {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      })
    : [];

  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Box */}
      <div
        className={`flex items-center rounded-full border transition-all duration-300 bg-[#F4F8F1] px-3.5 sm:px-4 py-2 sm:py-2.5 ${
          isOpen
            ? "border-[#4D9A18] ring-2 ring-[#4D9A18]/25 bg-white shadow-lg"
            : "border-[#E6EFE3] hover:border-[#8BA894]"
        }`}
      >
        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#07552F] mr-2.5 sm:mr-3 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Kerala products: Urukku Velichenna, Kannan Kaya, Kasavu..."
          className="w-full bg-transparent text-xs sm:text-sm text-[#183629] placeholder-[#8BA894] focus:outline-none border-0 font-medium"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full text-[#8BA894] hover:text-[#063D27] mr-1.5 sm:mr-2 cursor-pointer border-0 bg-transparent transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#07552F] bg-[#E6EFE3] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0 border border-[#4D9A18]/20 hidden sm:inline">
          Kerala Pure
        </span>
      </div>

      {/* Dropdown Results - Fully Responsive */}
      <AnimatePresence>
        {isOpen && searchQuery.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#E6EFE3] p-3 sm:p-4 z-50 max-h-[65vh] sm:max-h-96 overflow-y-auto overscroll-contain"
          >
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E6EFE3]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-[#063D27]">
                  Matching Products ({filteredProducts.length})
                </span>
                <Sparkles className="w-3 h-3 text-[#C7E900]" />
              </div>
              <span className="text-[11px] text-[#8BA894] font-normal hidden sm:inline">
                Pure Nature. Pure Goodness.
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-6 text-center text-xs sm:text-sm font-normal text-[#8BA894]">
                No Kerala products found matching &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <ul className="space-y-1.5 m-0 p-0 list-none">
                {filteredProducts.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={product.href || `/products/${product.slug}`}
                      onClick={() => {
                        onClose();
                        handleClear();
                      }}
                      className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#FDFEFC] hover:bg-[#F4F8F1] border border-transparent hover:border-[#E6EFE3] transition-all group no-underline text-[#183629]"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <p className="text-xs sm:text-sm md:text-[15px] font-bold text-[#063D27] group-hover:text-[#4D9A18] transition-colors m-0 leading-snug truncate">
                          {product.name}
                        </p>
                        <span className="text-[10px] sm:text-xs font-medium text-[#8BA894] uppercase tracking-wide">
                          {product.category}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#8BA894] group-hover:text-[#4D9A18] group-hover:translate-x-1 transition-transform shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
