"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Leaf,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ArrowUp,
  Send,
  CheckCircle2,
} from "lucide-react";
import { NAV_CATEGORIES } from "@/data/navigation";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shopCategories = NAV_CATEGORIES.filter((c) => c.hasMegaMenu);

  return (
    <footer className="w-full bg-[#063D27] text-white font-sans border-t border-[#07552F] select-none">
      {/* 1. TOP VALUE & TRUST BAR (2x2 on Mobile, 4-col on Desktop) */}
      <div className="border-b border-[#07552F] bg-[#052E1D]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {/* Pillar 1 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 p-3.5 rounded-2xl bg-[#063D27]/70 border border-[#07552F]">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#07552F] text-[#C7E900] flex items-center justify-center shrink-0 border border-[#4D9A18]/30">
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  100% Homestead
                </h4>
                <p className="text-xs sm:text-sm font-normal text-[#8BA894] mt-0.5 leading-snug">
                  Direct Kerala smallholders
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 p-3.5 rounded-2xl bg-[#063D27]/70 border border-[#07552F]">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#07552F] text-[#C7E900] flex items-center justify-center shrink-0 border border-[#4D9A18]/30">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Zero Toxins
                </h4>
                <p className="text-xs sm:text-sm font-normal text-[#8BA894] mt-0.5 leading-snug">
                  Chemical-free recipes
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 p-3.5 rounded-2xl bg-[#063D27]/70 border border-[#07552F]">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#07552F] text-[#C7E900] flex items-center justify-center shrink-0 border border-[#4D9A18]/30">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Express Delivery
                </h4>
                <p className="text-xs sm:text-sm font-normal text-[#8BA894] mt-0.5 leading-snug">
                  Fast all-India dispatch
                </p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 p-3.5 rounded-2xl bg-[#063D27]/70 border border-[#07552F]">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#07552F] text-[#C7E900] flex items-center justify-center shrink-0 border border-[#4D9A18]/30">
                <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Kasavu Handloom
                </h4>
                <p className="text-xs sm:text-sm font-normal text-[#8BA894] mt-0.5 leading-snug">
                  Artisan weavers support
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER CONTENT (Responsive Grid Layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
          {/* Column 1: Brand & Heritage (Full width on mobile, 4-col on Desktop) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-block bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm hover:opacity-95 transition-opacity">
              <img
                src="/images/uppiliees-logo.png?v=4"
                alt="UPPILIEES — Pure Nature. Pure Goodness."
                className="h-10 sm:h-12 md:h-14 w-auto object-contain"
                style={{ maxHeight: "54px", maxWidth: "190px" }}
              />
            </Link>

            <p className="text-sm sm:text-[15px] text-[#E6EFE3]/85 leading-relaxed max-w-sm">
              UPPILIEES brings the pure botanical wisdom and culinary traditions of Kerala homesteads straight to your family. Pure Nature. Pure Goodness.
            </p>

            <div className="pt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07552F] text-xs font-semibold text-[#E6EFE3] border border-[#4D9A18]/30">
                <MapPin className="w-3.5 h-3.5 text-[#C7E900]" />
                Direct Harvest • Kerala, India
              </span>
            </div>

            {/* Social Media Links */}
            <div className="pt-1 flex items-center gap-3 text-[#E6EFE3]">
              <span className="text-xs text-[#8BA894] font-medium mr-1">Follow:</span>
              
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#07552F] hover:bg-[#C7E900] hover:text-[#063D27] flex items-center justify-center transition-all text-[#E6EFE3]"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#07552F] hover:bg-[#C7E900] hover:text-[#063D27] flex items-center justify-center transition-all text-[#E6EFE3]"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z" />
                </svg>
              </a>

              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#07552F] hover:bg-[#C7E900] hover:text-[#063D27] flex items-center justify-center transition-all text-[#E6EFE3]"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              <a
                href="https://wa.me/919846000000"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#07552F] hover:bg-[#C7E900] hover:text-[#063D27] flex items-center justify-center transition-all text-[#E6EFE3]"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Columns 2 & 3: Categories & Customer Care (Side-by-side 2-col on Mobile, clean on Desktop) */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:contents">
            {/* Column 2: Kerala Categories */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white border-b border-[#07552F] pb-2 flex items-center justify-between">
                <span>Categories</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C7E900]" />
              </h4>

              <ul className="space-y-2 text-sm sm:text-[15px] text-[#E6EFE3]/90 list-none m-0 p-0">
                {shopCategories.map((cat) => (
                  <li key={cat.name}>
                    <Link
                      href={cat.href}
                      className="hover:text-[#C7E900] transition-colors flex items-center gap-1.5 no-underline py-0.5 leading-snug"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4D9A18] shrink-0" />
                      <span>{cat.name}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/about"
                    className="hover:text-[#C7E900] transition-colors flex items-center gap-1.5 no-underline py-0.5 leading-snug"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4D9A18] shrink-0" />
                    <span>Purity Pledge</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Care & Policies */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white border-b border-[#07552F] pb-2 flex items-center justify-between">
                <span>Customer Care</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C7E900]" />
              </h4>

              <ul className="space-y-2 text-sm sm:text-[15px] text-[#E6EFE3]/90 list-none m-0 p-0">
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-[#C7E900] transition-colors no-underline block py-0.5 leading-snug"
                  >
                    Track Dispatch
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-[#C7E900] transition-colors no-underline block py-0.5 leading-snug"
                  >
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-[#C7E900] transition-colors no-underline block py-0.5 leading-snug"
                  >
                    Quality Standards
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-[#C7E900] transition-colors no-underline block py-0.5 leading-snug"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-[#C7E900] transition-colors no-underline block py-0.5 leading-snug"
                  >
                    Terms &amp; Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 4: Homestead Concierge & Newsletter (Full width on Mobile, 3-col on Desktop) */}
          <div className="lg:col-span-3 space-y-4 pt-2 lg:pt-0">
            <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white border-b border-[#07552F] pb-2 flex items-center justify-between">
              <span>Homestead Concierge</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C7E900]" />
            </h4>

            {/* Interactive Touch Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
              <a
                href="tel:+919846000000"
                className="flex items-center gap-2.5 p-2 rounded-xl bg-[#07552F]/60 hover:bg-[#07552F] border border-[#4D9A18]/25 text-[#E6EFE3] hover:text-[#C7E900] transition-colors no-underline"
              >
                <div className="w-7 h-7 rounded-lg bg-[#063D27] flex items-center justify-center text-[#C7E900] shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 text-xs">
                  <span className="text-[10px] text-[#8BA894] block font-bold leading-none">Tap to Call</span>
                  <span className="font-semibold truncate block mt-0.5">+91 98460 00000</span>
                </div>
              </a>

              <a
                href="https://wa.me/919846000000"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 p-2 rounded-xl bg-[#07552F]/60 hover:bg-[#07552F] border border-[#4D9A18]/25 text-[#E6EFE3] hover:text-[#C7E900] transition-colors no-underline"
              >
                <div className="w-7 h-7 rounded-lg bg-[#063D27] flex items-center justify-center text-[#C7E900] shrink-0">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 text-xs">
                  <span className="text-[10px] text-[#8BA894] block font-bold leading-none">WhatsApp</span>
                  <span className="font-semibold truncate block mt-0.5">Mon – Sat (9 AM – 7 PM)</span>
                </div>
              </a>

              <a
                href="mailto:care@uppiliees.com"
                className="flex items-center gap-2.5 p-2 rounded-xl bg-[#07552F]/60 hover:bg-[#07552F] border border-[#4D9A18]/25 text-[#E6EFE3] hover:text-[#C7E900] transition-colors no-underline"
              >
                <div className="w-7 h-7 rounded-lg bg-[#063D27] flex items-center justify-center text-[#C7E900] shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 text-xs">
                  <span className="text-[10px] text-[#8BA894] block font-bold leading-none">Email</span>
                  <span className="font-semibold truncate block mt-0.5">care@uppiliees.com</span>
                </div>
              </a>
            </div>

            {/* Newsletter Subscription (Sleek Integrated Pill) */}
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8BA894] block mb-2">
                Join the Botanical Family
              </span>
              <form onSubmit={handleSubscribe} className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address..."
                  required
                  className="w-full bg-[#07552F] text-xs text-white placeholder-[#8BA894] pl-3.5 pr-28 py-2.5 rounded-full border border-[#4D9A18]/40 focus:outline-none focus:border-[#C7E900]"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 bg-[#C7E900] hover:bg-white text-[#063D27] font-bold text-xs px-3.5 rounded-full transition-all border-0 cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
                  aria-label="Subscribe"
                >
                  <span>Subscribe</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>

              {subscribed && (
                <p className="text-xs text-[#C7E900] mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Welcome to UPPILIEES Botanical Family!</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM BAR & SECURE PAYMENTS */}
      <div className="border-t border-[#07552F] bg-[#052E1D] py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8BA894] text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>&copy; 2026 UPPILIEES.</span>
            <span>•</span>
            <span className="text-[#E6EFE3]">Pure Nature. Pure Goodness.</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Traditional Kerala Homestead Produce</span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <span className="text-[11px] text-[#8BA894] hidden lg:inline">
              100% Secure Checkout: UPI • Cards • NetBanking • COD
            </span>
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-xs text-[#C7E900] hover:text-white transition-colors border-0 bg-transparent cursor-pointer font-bold py-1"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
