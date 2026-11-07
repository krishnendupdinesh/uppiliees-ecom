"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Leaf,
  ChevronLeft,
} from "lucide-react";
import { NAV_CATEGORIES, ANNOUNCEMENTS } from "@/data/navigation";
import { PRODUCTS, getProductsByCategory } from "@/data/products";
import MegaMenu from "./MegaMenu";
import SearchDropdown from "./SearchDropdown";

export default function Navbar() {
  // Navigation & Interactive States
  const [activeCategory, setActiveCategory] = useState("HOME");
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Announcement bar state
  const [announcementIdx, setAnnouncementIdx] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const navRef = useRef(null);

  // Cart & Wishlist states
  const [cart] = useState([]);
  const [wishlist] = useState([]);

  // Auto-rotate announcement bar
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Sticky navbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard accessibility: ESC key closes all dropdowns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setHoveredCategory(null);
        setSearchOpen(false);
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener: closes search and mega menu dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target)) {
        setHoveredCategory(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentHoveredItem = NAV_CATEGORIES.find(
    (c) => c.name === hoveredCategory
  );

  return (
    <header className="relative w-full z-50 select-none font-sans">
      {/* 1. TOP ANNOUNCEMENT BAR (Fully Responsive) */}
      <div className="w-full bg-[#063D27] text-white text-xs border-b border-[#07552F]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-8 sm:h-9 flex items-center justify-between gap-1 sm:gap-2">
          {/* Left: Brand Promise (Hidden on mobile/tablet for space) */}
          <div className="w-auto lg:w-60 hidden lg:flex items-center gap-2 text-xs text-[#E6EFE3] shrink-0">
            <Leaf className="w-3.5 h-3.5 text-[#C7E900]" />
            <span className="font-semibold tracking-wide">Pure Nature. Pure Goodness.</span>
          </div>

          {/* Center: Rotating Message */}
          <div className="flex-1 flex items-center justify-center text-center overflow-hidden h-6 sm:h-7 px-1 sm:px-2">
            <AnimatePresence mode="wait">
              <motion.span
                key={announcementIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-[11px] sm:text-xs md:text-[13px] text-[#F4F8F1] tracking-wide font-medium truncate sm:whitespace-normal"
              >
                {ANNOUNCEMENTS[announcementIdx]}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Right: Quick Controls */}
          <div className="w-auto lg:w-60 flex items-center justify-end gap-1.5 sm:gap-3 text-xs text-[#E6EFE3] shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() =>
                  setAnnouncementIdx((prev) =>
                    prev === 0 ? ANNOUNCEMENTS.length - 1 : prev - 1
                  )
                }
                className="p-1 hover:text-white border-0 bg-transparent cursor-pointer transition-colors"
                aria-label="Previous announcement"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setAnnouncementIdx((prev) => (prev + 1) % ANNOUNCEMENTS.length)
                }
                className="p-1 hover:text-white border-0 bg-transparent cursor-pointer transition-colors"
                aria-label="Next announcement"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION (Responsive Mobile + Desktop) */}
      <div
        className={`w-full bg-white border-b border-[#E6EFE3] transition-all duration-300 ${
          isScrolled ? "py-2 shadow-sm" : "py-2.5 sm:py-3.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-6">
          {/* Left Column: Mobile Menu Toggle + Logo */}
          <div className="w-auto lg:w-60 shrink-0 flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 text-[#07552F] hover:bg-[#F4F8F1] rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
              aria-label="Open mobile navigation"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <img
                src="/images/uppiliees-logo.png?v=4"
                alt="UPPILIEES — Pure Nature. Pure Goodness."
                className="h-10 sm:h-14 md:h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                style={{ maxHeight: "68px", maxWidth: "210px" }}
              />
            </Link>
          </div>

          {/* Center Column: Desktop Search Bar (Centered) */}
          <div
            className="flex-1 max-w-xl hidden md:block"
            onClick={() => setSearchOpen(true)}
          >
            <SearchDropdown
              isOpen={searchOpen}
              onClose={() => setSearchOpen(false)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              containerRef={searchRef}
            />
          </div>

          {/* Right Column: User Action Icons */}
          <div className="w-auto lg:w-60 shrink-0 flex items-center justify-end gap-1.5 sm:gap-3">
            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 text-[#07552F] hover:bg-[#F4F8F1] rounded-full transition-colors border-0 bg-transparent cursor-pointer"
              aria-label="Toggle mobile search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Account Link */}
            <Link
              href="/account"
              className="p-1.5 sm:p-2 text-[#07552F] hover:bg-[#F4F8F1] rounded-full transition-colors flex items-center gap-1.5 no-underline"
              title="Account"
            >
              <User className="w-5 h-5" />
              <span className="hidden xl:inline text-xs font-bold text-[#183629]">
                Account
              </span>
            </Link>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="relative p-1.5 sm:p-2 text-[#07552F] hover:bg-[#F4F8F1] rounded-full transition-colors no-underline"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#4D9A18] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Shopping Bag Link */}
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 sm:gap-2 bg-[#063D27] hover:bg-[#07552F] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all no-underline shadow-sm"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#C7E900]" />
              <span className="text-xs font-bold tracking-wide">
                <span className="hidden sm:inline">Bag </span>({cart.length})
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden px-3 pt-2 pb-1 border-t border-[#E6EFE3] mt-2"
            >
              <div className="flex items-center rounded-full border border-[#4D9A18]/40 bg-[#F4F8F1] px-3.5 py-2 shadow-inner">
                <Search className="w-4 h-4 text-[#07552F] mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Kerala products..."
                  className="w-full bg-transparent text-xs sm:text-sm text-[#183629] placeholder-[#8BA894] focus:outline-none border-0 font-medium"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-[#8BA894] hover:text-[#063D27] border-0 bg-transparent cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Live search results dropdown on mobile */}
              {searchQuery.trim() && (
                <div className="mt-2 max-h-60 overflow-y-auto rounded-xl bg-white border border-[#E6EFE3] shadow-lg p-2 space-y-1">
                  {PRODUCTS.filter((p) =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.category.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                    .slice(0, 6)
                    .map((p) => (
                      <Link
                        key={p.id}
                        href={p.href || `/products/${p.slug}`}
                        onClick={() => {
                          setMobileSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F4F8F1] text-xs font-semibold text-[#183629] no-underline"
                      >
                        <div>
                          <div className="text-[#063D27] font-bold">{p.name}</div>
                          <div className="text-[10px] text-[#8BA894]">{p.category}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#8BA894]" />
                      </Link>
                    ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. CATEGORY NAVIGATION (Desktop Centered Bar) */}
      <nav
        ref={navRef}
        className={`hidden lg:block w-full bg-[#F4F8F1] border-b border-[#E6EFE3] transition-all duration-300 ${
          isScrolled ? "sticky top-0 z-40 backdrop-blur-md bg-[#F4F8F1]/95 shadow-sm" : ""
        }`}
      >
        {/* Desktop / Laptop Centered Category Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <ul className="flex items-center justify-center gap-3 lg:gap-5 xl:gap-8 m-0 p-0 list-none">
              {NAV_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.name;
                const isHovered = hoveredCategory === cat.name;

                return (
                  <li
                    key={cat.name}
                    className="relative py-3.5 shrink-0 flex items-center"
                    onMouseEnter={() => setHoveredCategory(cat.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <Link
                      href={cat.href}
                      onClick={(e) => {
                        setActiveCategory(cat.name);
                        // On click/touch, toggle mega menu dropdown
                        if (cat.hasMegaMenu) {
                          if (hoveredCategory === cat.name) {
                            setHoveredCategory(null);
                          } else {
                            setHoveredCategory(cat.name);
                          }
                        }
                      }}
                      className={`inline-flex items-center justify-center gap-1.5 px-2.5 xl:px-3 py-1 text-[13px] xl:text-[15px] font-bold uppercase tracking-wider whitespace-nowrap leading-none transition-colors no-underline ${
                        isActive || isHovered
                          ? "text-[#07552F]"
                          : "text-[#183629] hover:text-[#07552F]"
                      }`}
                    >
                      <span className="whitespace-nowrap">{cat.name}</span>
                      {cat.hasMegaMenu && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 shrink-0 text-[#8BA894] transition-transform duration-200 ${
                            isHovered ? "rotate-180 text-[#4D9A18]" : ""
                          }`}
                        />
                      )}
                    </Link>

                    {/* Animated Lime Active Indicator */}
                    {(isActive || isHovered) && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute bottom-0 left-2 right-2 h-[3px] bg-gradient-to-r from-[#4D9A18] via-[#C7E900] to-[#4D9A18] rounded-full"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Desktop MegaMenu Dropdown Component */}
        <div
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <MegaMenu
            category={currentHoveredItem}
            isOpen={Boolean(currentHoveredItem && currentHoveredItem.hasMegaMenu)}
            onClose={() => setHoveredCategory(null)}
          />
        </div>
      </nav>

      {/* 4. RESPONSIVE MOBILE SLIDE-OUT DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#063D27]/60 backdrop-blur-sm z-50 lg:hidden"
            />

            {/* Slide-out Menu Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto lg:hidden"
            >
              <div>
                {/* Header */}
                <div className="p-4 border-b border-[#E6EFE3] flex items-center justify-between bg-white">
                  <img
                    src="/images/uppiliees-logo.png?v=4"
                    alt="UPPILIEES"
                    className="h-11 w-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-[#07552F] hover:bg-[#F4F8F1] rounded-full border-0 bg-transparent cursor-pointer transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Drawer Search */}
                <div className="p-4 border-b border-[#E6EFE3] bg-[#F4F8F1]/50">
                  <div className="flex items-center rounded-full border border-[#E6EFE3] bg-white px-3.5 py-2">
                    <Search className="w-4 h-4 text-[#07552F] mr-2 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Kerala products..."
                      className="w-full bg-transparent text-xs text-[#183629] placeholder-[#8BA894] focus:outline-none border-0 font-medium"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="p-1 text-[#8BA894] border-0 bg-transparent cursor-pointer"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {searchQuery.trim() && (
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                      {PRODUCTS.filter((p) =>
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.category.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                        .slice(0, 6)
                        .map((p) => (
                          <Link
                            key={p.id}
                            href={p.href || `/products/${p.slug}`}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setSearchQuery("");
                            }}
                            className="block py-2 px-3 text-xs sm:text-sm font-bold text-[#183629] hover:text-[#07552F] hover:bg-white rounded-lg no-underline transition-colors border border-transparent hover:border-[#E6EFE3]"
                          >
                            {p.name}
                          </Link>
                        ))}
                    </div>
                  )}
                </div>

                {/* Categories Accordion */}
                <div className="p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8BA894] block mb-2">
                    Kerala Categories
                  </span>

                  {NAV_CATEGORIES.map((cat) => {
                    const isExpanded = mobileExpandedCat === cat.name;

                    if (!cat.hasMegaMenu) {
                      return (
                        <Link
                          key={cat.name}
                          href={cat.href}
                          onClick={() => {
                            setActiveCategory(cat.name);
                            setMobileMenuOpen(false);
                          }}
                          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold no-underline transition-colors ${
                            activeCategory === cat.name
                              ? "bg-[#07552F] text-white"
                              : "text-[#183629] hover:bg-[#F4F8F1]"
                          }`}
                        >
                          <span>{cat.name}</span>
                          <ChevronRight className="w-4 h-4 opacity-70" />
                        </Link>
                      );
                    }

                    const categoryProducts = getProductsByCategory(cat.categoryKey);

                    return (
                      <div
                        key={cat.name}
                        className="rounded-xl border border-[#E6EFE3] overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setMobileExpandedCat(isExpanded ? null : cat.name)
                          }
                          className="w-full flex items-center justify-between px-3.5 py-3 text-sm font-bold text-[#063D27] bg-[#F4F8F1] border-0 cursor-pointer"
                        >
                          <span>{cat.name}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-[#07552F] transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="px-3 py-2 bg-white space-y-1">
                            <Link
                              href={cat.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block py-2 px-2 text-xs font-bold text-[#4D9A18] hover:underline"
                            >
                              View All in {cat.categoryKey} &rarr;
                            </Link>
                            {categoryProducts.map((p) => (
                              <Link
                                key={p.id}
                                href={p.href || `/products/${p.slug}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-1.5 px-2 text-xs sm:text-sm font-semibold text-[#183629] hover:text-[#07552F] hover:bg-[#F4F8F1] rounded-lg no-underline transition-colors"
                              >
                                {p.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Drawer Footer */}
              <div className="p-4 border-t border-[#E6EFE3] bg-[#F4F8F1] text-xs">
                <div className="text-center text-[#8BA894] text-[11px]">
                  UPPILIEES — Pure Nature. Pure Goodness.
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
