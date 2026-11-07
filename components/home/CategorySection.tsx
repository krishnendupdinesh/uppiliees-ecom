"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════
   1. CONFIG – edit ONLY this part to change the section content
   - Change image         → edit `image` (path inside /public OR full https:// URL)
   - Change title / text  → edit `title`, `shortTitle`, `description`, `linkText`
                            (`shortTitle` is the compact name shown on small phones)
   - Change link          → edit `href`
   - Image focus          → edit `position` (CSS object-position)
   - Add / remove a card  → copy / delete one object, give it a new id
                            (layout: 3 cards in ONE row on every screen size)

   NOTE: for remote https:// URLs, add the host to `images.remotePatterns`
   in next.config.js, otherwise next/image will refuse to load it.
   ═══════════════════════════════════════════════════════════════ */

const SECTION_TEXT = {
  heading: "Explore Our Collections",
  subheading: "Discover everyday essentials from our herbal, food and handloom collections.",
};

interface CategoryData {
  id: number;
  title: string;
  /** Compact title for small phones (below 640px), where 3 cards share one row. */
  shortTitle: string;
  description: string;
  /** Path in /public or a remote image URL. */
  image: string;
  alt: string;
  href: string;
  linkText: string;
  /** object-position, e.g. "center", "top", "left center" */
  position?: string;
}

const CATEGORIES: CategoryData[] = [
  {
    id: 1,
    title: "Herbal, Beauty & Wellness Products",
    shortTitle: "Herbal & Wellness",
    description: "Nature-inspired essentials for your everyday self-care.",
    image: "/images/category-herbal.jpg", // ← change image URL here
    alt: "Herbal, beauty and wellness products",
    href: "/collections/herbal-beauty-wellness",
    linkText: "Shop Now",
    position: "center",
  },
  {
    id: 2,
    title: "Traditional Kerala Food Products",
    shortTitle: "Kerala Food",
    description: "Authentic flavours made the traditional Kerala way.",
    image: "/images/category-food.jpg", // ← change image URL here
    alt: "Traditional Kerala food products",
    href: "/collections/kerala-food",
    linkText: "Shop Now",
    position: "center",
  },
  {
    id: 3,
    title: "Traditional Handloom Products",
    shortTitle: "Handlooms",
    description: "Handwoven pieces that celebrate Kerala craftsmanship.",
    image: "/images/category-handlooms.jpg", // ← change image URL here
    alt: "Traditional handloom products",
    href: "/collections/handloom",
    linkText: "Shop Now",
    position: "center",
  },
];

/* ═══════════════════════════════════════════════════════════════
   2. FADE-IN ON SCROLL (respects reduced motion)
   ═══════════════════════════════════════════════════════════════ */

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

/* ═══════════════════════════════════════════════════════════════
   3. CATEGORY CARD
   Phone / tablet : compact card (image, short title, link stacked)
   Desktop (lg+)  : full card (title + description, link on the right)
   ═══════════════════════════════════════════════════════════════ */

function CategoryCard({ item, delay }: { item: CategoryData; delay: number }) {
  const { ref, visible } = useInView<HTMLAnchorElement>();

  return (
    <Link
      ref={ref}
      href={item.href}
      aria-label={item.title}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={`group block overflow-hidden rounded-lg border-2 border-[#07552F]/40 bg-white transition-all hover:border-[#07552F] duration-700 ease-out hover:shadow-[0_12px_30px_-12px_rgba(7,85,47,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F] motion-reduce:transition-none sm:rounded-xl ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#EDF3E9] sm:aspect-[5/4]">
        <Image
          src={item.image}
          alt={item.alt}
          fill
          sizes="(min-width: 1024px) 33vw, 33vw"
          quality={85}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          style={{ objectPosition: item.position ?? "center" }}
        />
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1.5 p-3 sm:gap-2 sm:p-4 lg:flex-row lg:items-start lg:justify-between lg:gap-4 lg:p-6">
        <div>
          <h3 className="text-sm font-bold leading-tight text-[#07552F] sm:text-lg sm:leading-snug lg:text-[22px]">
            {/* Short name on small phones, full name from 640px up */}
            <span className="sm:hidden" aria-hidden="true">
              {item.shortTitle}
            </span>
            <span className="hidden sm:inline">{item.title}</span>
          </h3>
          <p className="mt-1.5 hidden text-base font-normal leading-relaxed text-[#68786B] md:block">
            {item.description}
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#07552F] transition-colors duration-200 group-hover:text-[#4D9A18] sm:gap-1.5 sm:text-[15px] lg:mt-0.5">
          {item.linkText}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-3.5 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none sm:size-4"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. SECTION – use this below your hero
   ═══════════════════════════════════════════════════════════════ */

export default function CategorySection() {
  return (
    <section
      aria-labelledby="category-heading"
      className="bg-[#F4F8F1] px-3 py-[44px] sm:px-4 md:px-[3.3vw] md:py-[64px] lg:py-[90px]"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-[680px] text-center">
          <h2
            id="category-heading"
            className="text-[28px] font-bold leading-tight tracking-tight text-[#07552F] md:text-4xl lg:text-[44px]"
          >
            {SECTION_TEXT.heading}
          </h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[#68786B] md:text-[17px] lg:text-[18px]">
            {SECTION_TEXT.subheading}
          </p>
        </div>

        {/* 3 cards in ONE row on every screen size */}
        <div className="mt-7 grid grid-cols-3 gap-2.5 sm:gap-4 md:mt-12 md:gap-6 lg:gap-8">
          {CATEGORIES.map((item, i) => (
            <CategoryCard key={item.id} item={item} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}