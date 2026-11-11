"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getImageProps } from "next/image";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════
   1. CONFIG – edit ONLY this part to change the hero content
   - Change image         → edit `image` (desktop) / `mobileImage` (phone)
                            (a path inside /public OR a full https:// URL)
   - Change text / button → edit eyebrow, title, description, buttons
   - Text side            → `align: "left" | "right"` (desktop only)
   - Text colour          → `tone: "dark"` (green text, for light images)
                            `tone: "light"` (white text, for dark images)
                            (on phones the text is always white on a green fade)
   - Image focus          → `position` (desktop) / `mobilePosition` (phone)
                            CSS object-position, e.g. "center", "75% center", "20% center"
                            Phones show a tall crop of the banner, so use
                            `mobilePosition` to keep the products in view.
                            Best result: give a portrait `mobileImage` (about 4:5,
                            e.g. 1080 × 1350) made for phones.
   - Add / remove a slide → copy / delete one object, give it a new id

   NOTE: for remote https:// URLs, add the host to `images.remotePatterns`
   in next.config.js, otherwise next/image will refuse to load it.
   ═══════════════════════════════════════════════════════════════ */

interface HeroButton {
  text: string;
  link: string;
}

interface HeroSlideData {
  id: number;
  /** Wide banner (tablet + desktop). Path in /public or a remote URL. */
  image: string;
  /** Optional portrait image for phones (about 4:5). Falls back to `image`. */
  mobileImage?: string;
  alt: string;
  eyebrow?: string;
  title: string;
  description?: string;
  primaryButton: HeroButton;
  secondaryButton?: HeroButton;
  align: "left" | "right";
  tone: "dark" | "light";
  /** object-position on desktop, e.g. "center", "right center" */
  position?: string;
  /** object-position on mobile */
  mobilePosition?: string;
}

/** Time each slide stays on screen (ms). */
const AUTOPLAY_MS = 5000;

const HERO_SLIDES: HeroSlideData[] = [
  {
    id: 1,
    image: "/images/herosection1.png", // ← desktop image URL
    // mobileImage: "/images/herosection1-mobile.png", // ← optional portrait image for phones (sharpest result)
    alt: "UPPILIEES skincare collection",
    eyebrow: "NATURE-INSPIRED BEAUTY",
    title: "Discover the Goodness of Nature",
    description:
      "Explore nature-inspired skincare essentials designed to make your everyday beauty routine special.",
    primaryButton: { text: "Shop Skincare", link: "/herbal-beauty" },
    secondaryButton: { text: "Explore Collection", link: "/shop" },
    align: "left",
    tone: "dark",
    position: "center",
    mobilePosition: "80% center", // products are on the right side of this banner
  },
  {
    id: 2,
    image: "/images/herosection3.png", // ← Kerala traditional handloom image
    // mobileImage: "/images/herosection3-mobile.png", // ← optional phone-specific image
    alt: "Traditional Kerala handloom weaving loom with woven cloth",
    eyebrow: "TRADITIONAL KERALA HANDLOOMS",
    title: "Woven with Kerala Tradition",
    description:
      "Explore traditional Kerala handloom products, rooted in the craft of the loom.",
    primaryButton: { text: "Shop Handlooms", link: "/handloom" },
    secondaryButton: { text: "Discover More", link: "/shop" },
    align: "right",
    tone: "light", // ← white text for this darker image
    mobilePosition: "25% center", // loom is on the left side of this banner
  },
  {
    id: 3,
    image: "/images/herosection4.png", // ← Kerala traditional food / curry powders image
    // mobileImage: "/images/herosection4-mobile.png", // ← optional phone-specific image
    alt: "Traditional Kerala curry powders and spices in clay and wooden bowls",
    eyebrow: "TRADITIONAL KERALA FOOD",
    title: "The Authentic Taste of Kerala",
    description:
      "Discover traditional Kerala curry powders and spices for everyday home cooking.",
    primaryButton: { text: "Shop Food Products", link: "/traditional-foods" },
    secondaryButton: { text: "Explore Products", link: "/shop" },
    align: "left",
    tone: "light", // ← white text for this darker image
    mobilePosition: "80% center", // spices are on the right side of this banner
  },
  // {
  //   id: 4,
  //   image: "/images/uppiliees-hero-collection.png",
  //   alt: "UPPILIEES complete collection",
  //   eyebrow: "NATURE-INSPIRED BEAUTY",
  //   title: "Your Everyday Beauty Essentials",
  //   description:
  //     "Explore our skincare and haircare collections and find the essentials for your daily routine.",
  //   primaryButton: { text: "Shop All", link: "/shop" },
  //   secondaryButton: { text: "Explore Collection", link: "/collections" },
  //   align: "left",
  //   tone: "dark",
  // },
];

/* ═══════════════════════════════════════════════════════════════
   2. SLIDE
   Phone          : text sits over the bottom of the image on a soft green fade
   Tablet/desktop : text sits over the side of the banner (colour follows `tone`)
   ═══════════════════════════════════════════════════════════════ */

function Slide({
  slide,
  isActive,
  priority,
}: {
  slide: HeroSlideData;
  isActive: boolean;
  priority: boolean;
}) {
  const isRight = slide.align === "right";
  const isLight = slide.tone === "light";

  const base = { alt: slide.alt, fill: true, priority, quality: 90 };

  // Phones download the mobile image, md+ downloads the desktop image.
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...base, src: slide.image, sizes: "(min-width: 768px) 100vw, 100vw" });

  // CLARITY: on phones the wide banner is scaled up to fill a tall box (it renders ~3x wider
  // than the screen), so it must download a large version ("300vw"). A portrait
  // `mobileImage` renders at screen width, so "100vw" is enough for it.
  const {
    props: { srcSet: mobileSrcSet, ...imgProps },
  } = getImageProps({
    ...base,
    src: slide.mobileImage ?? slide.image,
    sizes: slide.mobileImage ? "100vw" : "300vw",
  });

  // Overlay. Phone: green fade rising from the bottom. md+: soft fade on the text side only.
  const overlayMd = isLight
    ? `${isRight ? "md:bg-gradient-to-l" : "md:bg-gradient-to-r"} md:from-black/55 md:via-black/15 md:to-transparent`
    : `${isRight ? "md:bg-gradient-to-l" : "md:bg-gradient-to-r"} md:from-[#FAFBF6]/25 md:via-[#FAFBF6]/8 md:to-transparent`;

  // Button styles. Text AND background both change on hover, so they never end up the same colour.
  // Phone: always white buttons (sit on the green fade). md+: follow `tone`.
  const btnBase =
    "inline-flex h-10 items-center justify-center rounded-md border px-5 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:h-12 md:px-8 md:text-[15px]";

  const primaryClass = isLight
    ? `${btnBase} border-white bg-white text-[#063D27] hover:border-[#063D27] hover:bg-[#063D27] hover:text-white focus-visible:outline-white`
    : `${btnBase} border-white bg-white text-[#063D27] hover:border-[#063D27] hover:bg-[#063D27] hover:text-white focus-visible:outline-white md:border-[#07552F] md:bg-[#07552F] md:text-white md:hover:border-[#063D27] md:hover:bg-[#063D27] md:hover:text-white md:focus-visible:outline-[#07552F]`;

  const secondaryClass = isLight
    ? `${btnBase} border-white bg-transparent text-white hover:bg-white hover:text-[#063D27] focus-visible:outline-white`
    : `${btnBase} border-white bg-transparent text-white hover:bg-white hover:text-[#063D27] focus-visible:outline-white md:border-[#07552F] md:bg-white/70 md:text-[#07552F] md:hover:bg-[#07552F] md:hover:text-white md:focus-visible:outline-[#07552F]`;

  const titleColor = isLight ? "text-white" : "text-white md:text-[#07552F]";
  const eyebrowColor = isLight ? "text-white/90" : "text-white/90 md:text-[#4D9A18]";
  const descColor = isLight ? "text-white/90" : "text-white/90 md:text-[#173D2A]";

  return (
    <article
      aria-hidden={!isActive}
      aria-roledescription="slide"
      // Phone: slides stack in one grid cell (height = tallest slide, min 380px).
      // md+: slides are absolutely positioned inside the fixed-ratio banner.
      className={`relative flex min-h-[380px] items-end [grid-area:1/1] transition-opacity duration-700 ease-in-out motion-reduce:transition-none md:absolute md:inset-0 md:block md:min-h-0 ${
        isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
      }`}
    >
      <picture>
        <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...imgProps}
          srcSet={mobileSrcSet}
          alt={slide.alt}
          className="absolute inset-0 h-full w-full object-cover [object-position:var(--m-pos)] md:[object-position:var(--d-pos)]"
          style={
            {
              "--m-pos": slide.mobilePosition ?? "center",
              "--d-pos": slide.position ?? "center",
            } as React.CSSProperties
          }
        />
      </picture>

      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-[#063D27]/80 via-[#063D27]/30 to-transparent to-[70%] ${overlayMd}`}
      />

      {/* Text */}
      <div
        className={`relative z-10 w-full px-5 pb-11 pt-28 md:absolute md:inset-0 md:flex md:items-center md:px-[6%] md:pb-0 md:pt-0 ${
          isRight ? "md:justify-end md:text-right" : "md:justify-start md:text-left"
        }`}
      >
        <div className="max-w-[520px] [text-shadow:0_1px_8px_rgba(0,0,0,0.5)] md:[text-shadow:none]">
          {slide.eyebrow && (
            <p
              className={`mb-2 text-xs font-bold tracking-[0.14em] md:mb-3 md:text-sm ${eyebrowColor}`}
            >
              {slide.eyebrow}
            </p>
          )}

          <h2
            className={`text-[28px] font-bold leading-[1.1] tracking-tight md:text-5xl md:leading-[1.08] lg:text-[58px] xl:text-[66px] ${titleColor}`}
          >
            {slide.title}
          </h2>

          {slide.description && (
            <p
              className={`mt-2.5 line-clamp-2 text-[15px] font-normal leading-relaxed md:mt-4 md:line-clamp-none md:text-[17px] lg:text-[19px] ${descColor}`}
            >
              {slide.description}
            </p>
          )}

          <div className={`mt-4 flex flex-wrap gap-2.5 md:mt-8 md:gap-3 ${isRight ? "md:justify-end" : ""}`}>
            <Link
              href={slide.primaryButton.link}
              tabIndex={isActive ? 0 : -1}
              className={primaryClass}
            >
              {slide.primaryButton.text}
            </Link>

            {slide.secondaryButton && (
              <Link
                href={slide.secondaryButton.link}
                tabIndex={isActive ? 0 : -1}
                className={secondaryClass}
              >
                {slide.secondaryButton.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. CONTROLS (arrows + dots)
   Arrows are hidden on phones – swipe left/right instead.
   ═══════════════════════════════════════════════════════════════ */

const arrowBtn =
  "absolute top-1/2 z-20 hidden size-[46px] -translate-y-1/2 items-center justify-center rounded-full border border-[#E2EBDD] bg-white text-[#07552F] shadow-md transition-all duration-200 hover:scale-105 hover:bg-[#07552F] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F] md:flex";

function Controls({
  count,
  index,
  onPrev,
  onNext,
  onSelect,
}: {
  count: number;
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (i: number) => void;
}) {
  return (
    <>
      <button type="button" onClick={onPrev} aria-label="Previous slide" className={`${arrowBtn} left-3`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button type="button" onClick={onNext} aria-label="Next slide" className={`${arrowBtn} right-3`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center rounded-full bg-white/85 px-2 backdrop-blur-sm md:bottom-4">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className="group flex h-6 items-center px-[3px] focus-visible:outline-none md:h-7"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-[#07552F] group-focus-visible:ring-offset-1 motion-reduce:transition-none ${
                i === index ? "w-5 bg-[#07552F]" : "w-1.5 bg-[#07552F]/30 group-hover:bg-[#4D9A18]"
              }`}
            />
          </button>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. HERO SECTION (carousel logic) – use this in your page
   ═══════════════════════════════════════════════════════════════ */

const SWIPE_THRESHOLD = 50;

export default function HeroCarousel() {
  const count = HERO_SLIDES.length;
  const hasMultiple = count > 1;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  // Respect reduced-motion preference (autoplay is switched off).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Pause when the browser tab is not visible.
  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Autoplay. Depends on `index`, so any manual change restarts the timer.
  useEffect(() => {
    if (!hasMultiple || paused || tabHidden || reducedMotion) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, paused, tabHidden, reducedMotion, hasMultiple, count]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || !hasMultiple) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      goTo(dx < 0 ? index + 1 : index - 1);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!hasMultiple) return;
    if (e.key === "ArrowLeft") goTo(index - 1);
    if (e.key === "ArrowRight") goTo(index + 1);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="bg-[#FAFBF6] px-3 pb-3 pt-3 md:px-[3.3vw] md:pb-10 md:pt-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      {/*
        PHONE  : grid (height = tallest slide, min 380px)
        md+    : fixed-ratio banner. Tweak the ratios below:
                 smaller second number ratio = taller banner (e.g. 2.4/1 → 2.1/1)
      */}
      <div
        className="relative mx-auto grid w-full max-w-[1920px] touch-pan-y overflow-hidden rounded-xl border border-[#E2EBDD] bg-[#063D27] md:block md:aspect-[1.9/1] md:bg-[#EDF3E9] lg:aspect-[2.4/1] lg:min-h-[520px] lg:max-h-[640px]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-live={paused || reducedMotion ? "polite" : "off"}
      >
        {HERO_SLIDES.map((slide, i) => (
          <Slide key={slide.id} slide={slide} isActive={i === index} priority={i === 0} />
        ))}

        {hasMultiple && (
          <Controls
            count={count}
            index={index}
            onPrev={() => goTo(index - 1)}
            onNext={() => goTo(index + 1)}
            onSelect={goTo}
          />
        )}
      </div>
    </section>
  );
}