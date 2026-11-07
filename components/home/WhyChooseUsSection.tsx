"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   1. CONFIG – edit ONLY this part to change the section content
   - Change heading              → edit SECTION_TEXT
   - Change a benefit            → edit `title`, `description`
   - Change an icon              → `icon`: "leaf" | "heart" | "sparkles" | "flower"
   - Add / remove a benefit      → copy / delete one object, give it a new id
                                   (desktop shows 4 in one row; mobile shows
                                   2 at a time and swipes to the next 2)
   ═══════════════════════════════════════════════════════════════ */

const SECTION_TEXT = {
  heading: "Why Choose UPPILIEES?",
};

type IconName = "leaf" | "heart" | "sparkles" | "flower";

interface BenefitData {
  id: number;
  icon: IconName;
  title: string;
  description: string;
}

const BENEFITS: BenefitData[] = [
  {
    id: 1,
    icon: "leaf",
    title: "Nature Inspired",
    description: "Inspired by the simplicity and goodness of nature.",
  },
  {
    id: 2,
    icon: "heart",
    title: "Made with Care",
    description: "Thoughtfully presented essentials for everyday care.",
  },
  {
    id: 3,
    icon: "sparkles",
    title: "Everyday Self-Care",
    description: "Make your daily beauty routine feel special.",
  },
  {
    id: 4,
    icon: "flower",
    title: "Skincare & Haircare",
    description: "Explore essentials for both skin and hair.",
  },
];

/* ═══════════════════════════════════════════════════════════════
   2. LINE ICONS (minimal, Forest Green)
   Size is controlled by the className so it can scale per screen.
   ═══════════════════════════════════════════════════════════════ */

function Icon({ name }: { name: IconName }) {
  const common = {
    className: "size-[30px] md:size-8 lg:size-[34px]",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "leaf":
      return (
        <svg {...common}>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...common}>
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          <path d="M20 3v4" />
          <path d="M22 5h-4" />
          <path d="M4 17v2" />
          <path d="M5 18H3" />
        </svg>
      );
    case "flower":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" />
          <path d="M12 7.5V9" />
          <path d="M7.5 12H9" />
          <path d="M16.5 12H15" />
          <path d="M12 16.5V15" />
          <path d="m8 8 1.88 1.88" />
          <path d="M14.12 9.88 16 8" />
          <path d="m8 16 1.88-1.88" />
          <path d="M14.12 14.12 16 16" />
        </svg>
      );
  }
}

/* ═══════════════════════════════════════════════════════════════
   3. FADE-IN ON SCROLL (respects reduced motion)
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
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

/* ═══════════════════════════════════════════════════════════════
   4. BENEFIT ITEM
   ═══════════════════════════════════════════════════════════════ */

function BenefitItem({ item, delay }: { item: BenefitData; delay: number }) {
  const { ref, visible } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={`group flex w-full min-w-0 flex-col items-center px-3 text-center transition-all duration-700 ease-out motion-reduce:transition-none lg:px-3 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
      }`}
    >
      {/* Icon in a soft ring */}
      <div className="flex size-[72px] shrink-0 items-center justify-center rounded-full border-2 border-[#07552F]/40 bg-white text-[#07552F] transition-colors duration-300 group-hover:border-[#07552F] group-hover:bg-[#07552F] group-hover:text-white motion-reduce:transition-none md:size-[76px] lg:size-[88px]">
        <Icon name={item.icon} />
      </div>

      <h3 className="mt-3.5 text-[17px] font-bold leading-snug text-[#07552F] md:mt-4 md:text-[19px] lg:mt-5 lg:text-[21px]">
        {item.title}
      </h3>
      <p className="mt-1.5 max-w-[270px] text-sm font-normal leading-relaxed text-[#68786B] md:mt-2 md:text-base lg:text-[17px]">
        {item.description}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. SECTION – use this below your other homepage sections

   Mobile:       swipe row, 2 items per view, swipe for the next 2
   Tablet/Desk:  all 4 in one row (thin dividers on desktop)
   ═══════════════════════════════════════════════════════════════ */

export default function WhyChooseUsSection() {
  const listRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const items = BENEFITS.slice(0, 4);
  const pageCount = Math.ceil(items.length / 2);

  // which "page" (pair of items) is currently in view
  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const idx = Math.round(list.scrollLeft / list.clientWidth);
    setPage(Math.min(Math.max(idx, 0), pageCount - 1));
  }, [pageCount]);

  const goTo = (p: number) => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ left: p * list.clientWidth, behavior: "smooth" });
  };

  return (
    <section
      aria-labelledby="why-choose-heading"
      className="bg-[#F4F8F1] px-4 py-10 md:px-[3.3vw] md:py-[56px] lg:py-[80px]"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-[680px] text-center">
          <h2
            id="why-choose-heading"
            className="text-[28px] font-bold leading-tight tracking-tight text-[#07552F] md:text-4xl lg:text-[44px]"
          >
            {SECTION_TEXT.heading}
          </h2>
        </div>

        {/*
          Mobile: swipe row, 2 items per view (each swipe moves to the next pair).
          md+: 4 columns in one row, thin dividers on desktop only.
        */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="mt-7 flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mt-10 md:grid md:grid-cols-4 md:overflow-visible lg:mt-12 lg:[&>*:not(:first-child)]:border-l lg:[&>*:not(:first-child)]:border-[#07552F]/20"
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`flex shrink-0 basis-1/2 snap-always md:basis-auto md:shrink ${
                i % 2 === 0 ? "snap-start" : "[scroll-snap-align:none]"
              }`}
            >
              <BenefitItem item={item} delay={i * 100} />
            </div>
          ))}
        </div>

        {/* Dots: mobile only, one per pair */}
        <div className="mt-5 flex justify-center gap-2 md:hidden">
          {Array.from({ length: pageCount }).map((_, p) => (
            <button
              key={p}
              type="button"
              aria-label={`Show items ${p * 2 + 1} and ${p * 2 + 2}`}
              aria-current={page === p}
              onClick={() => goTo(p)}
              className={`h-2 rounded-full border-0 p-0 transition-all duration-300 ${
                page === p ? "w-[22px] bg-[#07552F]" : "w-2 bg-[#07552F]/25"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}