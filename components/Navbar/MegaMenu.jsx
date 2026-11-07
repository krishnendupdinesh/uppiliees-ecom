"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Leaf, Sparkles, X } from "lucide-react";
import { getProductsByCategory } from "@/data/products";

export default function MegaMenu({ category, isOpen, onClose }) {
  if (!category || !category.hasMegaMenu) return null;

  // Retrieve actual products for this category from products.js
  const products = getProductsByCategory(category.categoryKey);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* =========================================================================
              1. DESKTOP MEGA MENU (lg: 1024px and above)
              Full-width luxury botanical layout
              ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="hidden lg:block absolute left-0 right-0 w-full bg-white border-t border-[#E6EFE3] shadow-2xl z-50 max-h-[82vh] overflow-y-auto overscroll-contain"
          >
            {/* Top Accent Stripe */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#063D27] via-[#C7E900] to-[#07552F]" />

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-10">
              <div className="flex flex-row items-start justify-between gap-10">
                {/* Category Info Header */}
                <div className="w-1/4 space-y-3 pr-6 border-r border-[#E6EFE3] shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#07552F] bg-[#E6EFE3] px-3 py-1 rounded-full border border-[#4D9A18]/25">
                    <Leaf className="w-3.5 h-3.5 text-[#4D9A18]" />
                    Kerala Heritage
                  </span>
                  
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-[#063D27] font-serif m-0 tracking-tight">
                    {category.categoryKey}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-[#183629]/75 leading-relaxed">
                    Authentic produce & handloom crafted according to age-old Kerala homestead traditions. Pure Nature. Pure Goodness.
                  </p>

                  <div className="pt-2">
                    <Link
                      href={category.href}
                      onClick={onClose}
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#07552F] hover:text-[#4D9A18] transition-colors py-1 group no-underline"
                    >
                      <span>Explore All in {category.categoryKey}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#8BA894]">
                    <Sparkles className="w-3.5 h-3.5 text-[#C7E900]" />
                    <span>100% Homestead Cultivated</span>
                  </div>
                </div>

                {/* Desktop 3-Column Product Grid */}
                <div className="w-3/4">
                  <div className="flex items-center justify-between border-b border-[#E6EFE3] pb-2.5 mb-4">
                    <h4 className="text-sm font-black uppercase tracking-wider text-[#063D27] m-0 flex items-center gap-2">
                      <span>Available Formulations & Products</span>
                      <span className="text-xs font-bold text-white bg-[#07552F] px-2 py-0.5 rounded-full">
                        {products.length}
                      </span>
                    </h4>
                    <span className="text-xs text-[#8BA894] font-medium">
                      Select a product for details
                    </span>
                  </div>

                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                    {products.map((product) => (
                      <Link
                        key={product.id}
                        href={product.href || `/products/${product.slug}`}
                        onClick={onClose}
                        className="group flex items-center justify-between px-4 py-3 rounded-xl bg-[#FDFEFC] hover:bg-[#F4F8F1] border border-[#E6EFE3]/70 hover:border-[#4D9A18]/40 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md transition-all text-[#183629] no-underline"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-[#4D9A18] group-hover:bg-[#C7E900] group-hover:scale-125 transition-all shrink-0" />
                          <span className="text-[15px] font-bold text-[#063D27] group-hover:text-[#4D9A18] transition-colors truncate">
                            {product.name}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8BA894] group-hover:text-[#4D9A18] group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* =========================================================================
              2. MOBILE & TABLET DROPDOWN MENU (Below lg: < 1024px)
              Compact, Floating Dropdown Card (NOT Full Screen Takeover!)
              ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden absolute top-full left-3 right-3 sm:left-6 sm:right-6 md:left-auto md:right-8 md:w-[460px] mt-1.5 bg-white rounded-2xl shadow-2xl border border-[#E6EFE3] overflow-hidden z-50 max-h-[55vh] flex flex-col"
          >
            {/* Top Accent Stripe */}
            <div className="h-1 w-full bg-gradient-to-r from-[#063D27] via-[#C7E900] to-[#07552F]" />

            {/* Compact Mobile Header */}
            <div className="px-4 py-3 bg-[#F4F8F1] border-b border-[#E6EFE3] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#4D9A18]" />
                <h4 className="text-sm font-extrabold text-[#063D27] m-0">
                  {category.categoryKey}
                </h4>
                <span className="text-[10px] font-bold text-white bg-[#07552F] px-2 py-0.5 rounded-full">
                  {products.length}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1 text-[#8BA894] hover:text-[#063D27] rounded-full hover:bg-white border-0 bg-transparent cursor-pointer transition-colors"
                aria-label="Close dropdown"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Compact Product Items (1 col on mobile, 2 col on tablet) */}
            <div className="p-2 sm:p-3 overflow-y-auto overscroll-contain flex-1 max-h-[42vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={product.href || `/products/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FDFEFC] hover:bg-[#F4F8F1] border border-transparent hover:border-[#E6EFE3] text-xs font-bold text-[#183629] hover:text-[#07552F] no-underline transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4D9A18] group-hover:bg-[#C7E900] shrink-0" />
                      <span className="truncate">{product.name}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8BA894] group-hover:text-[#4D9A18] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer Quick Action */}
            <div className="p-2.5 px-4 bg-[#F4F8F1] border-t border-[#E6EFE3] flex items-center justify-between text-xs">
              <span className="text-[#8BA894] font-medium text-[11px]">
                Kerala Homestead Produce
              </span>
              <Link
                href={category.href}
                onClick={onClose}
                className="font-bold text-[#07552F] hover:text-[#4D9A18] flex items-center gap-1 no-underline"
              >
                <span>View All ({products.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
