"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════
   1. CONFIG – edit ONLY this part to change the section content
   - Change image         → edit `image` (path inside /public OR full https:// URL)
   - Change title / text  → edit `title`, `description`, `linkText`
   - Change link          → edit `href`
   - Image focus          → edit `position` (CSS object-position)
   - Add / remove a card  → copy / delete one object, give it a new id
                            (desktop shows up to 4 columns)

   Use product or ingredient photos only (no people), and only describe
   benefits that the real products support.

   NOTE: for remote https:// URLs, add the host to `images.remotePatterns`
   in next.config.js, otherwise next/image will refuse to load it.
   ═══════════════════════════════════════════════════════════════ */

const SECTION_TEXT = {
  heading: "Find Your Everyday Essentials",
  subheading: "Explore products that fit your daily beauty routine.",
};

interface NeedData {
  id: number;
  title: string;
  description: string;
  /** Path in /public or a remote image URL. */
  image: string;
  alt: string;
  href: string;
  linkText: string;
  /** object-position, e.g. "center", "top", "left center" */
  position?: string;
}

const NEEDS: NeedData[] = [
  {
    id: 1,
    title: "Everyday Skincare",
    description: "Simple essentials for your daily skin routine.",
    image: "/images/skincare1.jpg", // ← change image URL here
    alt: "Everyday skincare products",
    href: "/collections/everyday-skincare",
    linkText: "Explore",
    position: "center",
  },
  {
    id: 2,
    title: "Skin Nourishment",
    description: "Explore products for your skin care routine.",
    image: "/images/skincare.jpg", // ← change image URL here
    alt: "Skin nourishment products with botanical ingredients",
    href: "/collections/skin-nourishment",
    linkText: "Explore",
    position: "center",
  },
  {
    id: 3,
    title: "Everyday Haircare",
    description: "Simple essentials for your daily hair routine.",
    image: "/images/haircare1.jpg", // ← change image URL here
    alt: "Everyday haircare products",
    href: "/collections/everyday-haircare",
    linkText: "Explore",
    position: "center",
  },
  {
    id: 4,
    title: "Hair Nourishment",
    description: "Explore products for your hair care routine.",
    image: "/images/haircare.jpg", // ← change image URL here
    alt: "Hair nourishment products with botanical ingredients",
    href: "/collections/hair-nourishment",
    linkText: "Explore",
    position: "center",
  },
];

/* ═══════════════════════════════════════════════════════════════
   2. NEED CARD
   Mobile: the centered card is full size, the others are smaller
   and slightly faded. Tablet/desktop: all cards are normal size.
   ═══════════════════════════════════════════════════════════════ */

function NeedCard({ item, centered }: { item: NeedData; centered: boolean }) {
  return (
    <li
      className={`w-[78vw] shrink-0 snap-center transition-all duration-500 ease-out motion-reduce:transition-none md:w-auto md:shrink md:scale-100 md:opacity-100 ${
        centered ? "scale-100 opacity-100" : "scale-90 opacity-70"
      }`}
    >
      <Link
        href={item.href}
        aria-label={`${item.title} – ${item.linkText}`}
        className="group relative block aspect-[3/4] overflow-hidden rounded-xl border-2 border-[#07552F]/40 bg-[#EDF3E9] transition-[border-color,box-shadow] duration-300 hover:border-[#07552F] hover:shadow-[0_12px_30px_-12px_rgba(7,85,47,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F] motion-reduce:transition-none"
      >
        <Image
          src={item.image}
          alt={item.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 78vw"
          quality={85}
          className="object-cover transition-transform duration-700 ease-out md:group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          style={{ objectPosition: item.position ?? "center" }}
        />

        {/* Dark-green fade so the white text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#063D27]/90 via-[#063D27]/40 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
          <h3 className="text-[21px] font-bold leading-snug text-white md:text-[24px]">
            {item.title}
          </h3>
          <p className="mt-1.5 text-[15px] font-normal leading-relaxed text-white/90 md:text-base">
            {item.description}
          </p>

          <span className="mt-3.5 inline-flex h-10 items-center gap-1.5 rounded-md border border-white bg-white px-4 text-sm font-semibold text-[#063D27] transition-colors duration-200 group-hover:border-[#063D27] group-hover:bg-[#063D27] group-hover:text-white md:mt-4 md:h-11 md:px-5">
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
              className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </span>
        </div>
      </Link>
    </li>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. SECTION – use this in your homepage

   Mobile:  swipe row. One card in the center (zoomed in), the next
            one peeking in from the side. Swipe and the new card zooms
            in while the previous one zooms out.
   Tablet:  2 columns
   Desktop: 4 columns
   ═══════════════════════════════════════════════════════════════ */

export default function ShopByNeedsSection() {
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  // find which card is closest to the center of the scroll row
  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const center = list.scrollLeft + list.clientWidth / 2;
    let closest = 0;
    let min = Infinity;
    Array.from(list.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
      if (dist < min) {
        min = dist;
        closest = i;
      }
    });
    setActive(closest);
  }, []);

  const goTo = (i: number) => {
    const list = listRef.current;
    const el = list?.children[i] as HTMLElement | undefined;
    if (!list || !el) return;
    list.scrollTo({
      left: el.offsetLeft + el.offsetWidth / 2 - list.clientWidth / 2,
      behavior: "smooth",
    });
  };

  return (
    <section
      aria-labelledby="needs-heading"
      className="overflow-x-hidden bg-[#FAFBF6] px-4 py-[52px] md:px-[3.3vw] md:py-[64px] lg:py-[90px]"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-[680px] text-center">
          <h2
            id="needs-heading"
            className="text-[30px] font-bold leading-tight tracking-tight text-[#07552F] md:text-4xl lg:text-[44px]"
          >
            {SECTION_TEXT.heading}
          </h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[#68786B] md:text-[17px] lg:text-[18px]">
            {SECTION_TEXT.subheading}
          </p>
        </div>

        {/* Mobile: full-width swipe row (centered card zoomed, next one peeks) · md+: grid */}
        <ul
          ref={listRef}
          onScroll={handleScroll}
          className="-mx-4 mt-8 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto px-[11vw] py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:mt-12 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:py-0 lg:grid-cols-4 lg:gap-7"
        >
          {NEEDS.map((item, i) => (
            <NeedCard key={item.id} item={item} centered={active === i} />
          ))}
        </ul>

        {/* Dots: mobile only */}
        <div className="mt-4 flex justify-center gap-2 md:hidden">
          {NEEDS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show ${item.title}`}
              aria-current={active === i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full border-0 p-0 transition-all duration-300 ${
                active === i ? "w-[22px] bg-[#07552F]" : "w-2 bg-[#07552F]/25"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}