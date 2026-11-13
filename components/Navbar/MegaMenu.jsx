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
                  
                  <h3 className="text-2xl lg:text-3xl font-bold text-[#063D27] font-sans m-0 tracking-tight">
                    {category.categoryKey}
                  </h3>
                  
                  <p className="text-sm sm:text-[15px] font-normal text-[#183629]/80 leading-relaxed">
                    Authentic produce & handloom crafted according to age-old Kerala homestead traditions. Pure Nature. Pure Goodness.
                  </p>

                  <div className="pt-2">
                    <Link
                      href={category.href}
                      onClick={onClose}
                      className="inline-flex items-center gap-2 text-[15px] font-bold text-[#07552F] hover:text-[#4D9A18] transition-colors py-1 group no-underline"
                    >
                      <span>Explore All in {category.categoryKey}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="pt-2 flex items-center gap-2 text-xs sm:text-sm font-medium text-[#8BA894]">
                    <Sparkles className="w-3.5 h-3.5 text-[#C7E900]" />
                    <span>100% Homestead Cultivated</span>
                  </div>
                </div>

                {/* Desktop 3-Column Product Grid */}
                <div className="w-3/4">
                  <div className="flex items-center justify-between border-b border-[#E6EFE3] pb-2.5 mb-4">
                    <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#063D27] m-0 flex items-center gap-2">
                      <span>Available Formulations & Products</span>
                      <span className="text-xs font-bold text-white bg-[#07552F] px-2.5 py-0.5 rounded-full">
                        {products.length}
                      </span>
                    </h4>
                    <span className="text-xs sm:text-sm text-[#8BA894] font-normal">
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
        </>
      )}
    </AnimatePresence>
  );
}
