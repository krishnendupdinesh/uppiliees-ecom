"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WishlistButton from "@/components/WishlistButton";
import { addToCart as addCartItem } from "@/lib/cart";
import { setBuyNowItem } from "@/lib/buyNow";
import { api } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════
   1. CONFIG – edit ONLY this part to change the section content
   - Change image         → edit `image` (path inside /public OR full https:// URL)
   - Change name / text   → edit `name`, `description`
   - Change price         → edit `price` (number). Add `originalPrice` ONLY
                            when there is a genuine discount, otherwise leave it out.
   - Change link          → `href` = product detail page
   - Add / remove a card  → copy / delete one object, give it a new id
   - See more button      → edit SECTION_TEXT.seeMoreLink

   ⚠ The products / prices below are TEMPORARY PLACEHOLDERS.
     Replace them with your real catalogue (or fetch them from your API
     and pass them in through the `products` prop).

   NOTE: for remote https:// URLs, add the host to `images.remotePatterns`
   in next.config.js, otherwise next/image will refuse to load it.
   ═══════════════════════════════════════════════════════════════ */

const SECTION_TEXT = {
  heading: "Our Best Sellers",
  subheading: "Discover the favourites from our collections.",
  seeMoreText: "See More",
  seeMoreLink: "/shop", // ← Shop All page
  addToCartText: "Add to Cart",
  currency: "₹",
};

export interface BestSellerProduct {
  id: number | string;
  name: string;
  description: string;
  price: number;
  /** Only set when a real discount exists. */
  originalPrice?: number;
  /** Path in /public or a remote image URL. */
  image: string;
  alt: string;
  /** Product detail page. */
  href: string;
}

const BEST_SELLERS: BestSellerProduct[] = [
  {
    id: 1,
    name: "Ashwagandha Powder",
    description: "Natural Ashwagandha Herbal Powder for holistic wellness and vitality.",
    price: 199,
    originalPrice: 260,
    image: "/images/ashwagandha.jpg",
    alt: "Ashwagandha Powder",
    href: "/products/ashwagandha-powder",
  },
  {
    id: 2,
    name: "Banana Dried Chips",
    description: "Traditional Kerala Dried Banana Chips crispy, salted and delicious.",
    price: 159,
    originalPrice: 199,
    image: "/images/driedchip.jpg",
    alt: "Banana Dried Chips",
    href: "/products/banana-dried-chips",
  },
  {
    id: 3,
    name: "Kerala Set Mundu",
    description: "Traditional Kerala Handloom Set Mundu woven with authentic kasavu.",
    price: 1899,
    originalPrice: 2399,
    image: "/images/setmundu2.jpg",
    alt: "Kerala Handloom Set Mundu",
    href: "/products/kerala-handloom-set-mundu",
  },
  {
    id: 4,
    name: "Face Wash",
    description: "Sankhu Puspam Herbal Face Wash for gentle, pure skin refreshment.",
    price: 159,
    originalPrice: 199,
    image: "/images/facewash.jpg",
    alt: "Sankhu Puspam Face Wash",
    href: "/products/sankhu-puspam-face-wash",
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

const formatPrice = (n: number) =>
  `${SECTION_TEXT.currency}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/* ═══════════════════════════════════════════════════════════════
   3. PRODUCT CARD
   ═══════════════════════════════════════════════════════════════ */

function ProductCard({
  product,
  delay,
  onAddToCart,
}: {
  product: BestSellerProduct;
  delay: number;
  onAddToCart?: (product: BestSellerProduct) => void;
}) {
  const router = useRouter();
  const { ref, visible } = useInView<HTMLElement>();
  const hasDiscount =
    product.originalPrice !== undefined && product.originalPrice > product.price;

  const isHandloom =
    product.name.toLowerCase().includes("mundu") ||
    product.name.toLowerCase().includes("saree") ||
    product.name.toLowerCase().includes("dhoti") ||
    product.href.includes("handloom");

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isHandloom) {
      router.push(product.href);
      return;
    }

    setBuyNowItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      alt: product.alt,
      href: product.href,
      qty: 1,
    });

    router.push("/checkout");
  };

  return (
    <article
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-xl border-2 border-[#07552F]/40 bg-white transition-all duration-700 ease-out hover:border-[#07552F] hover:shadow-[0_12px_30px_-12px_rgba(7,85,47,0.25)] motion-reduce:transition-none ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
      }`}
    >
      {/* Wishlist Button */}
      <div className="absolute top-3 right-3 z-10">
        <WishlistButton
          item={{
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.image,
            alt: product.alt,
            href: product.href,
          }}
        />
      </div>

      {/* Image (links to product page) */}
      <Link
        href={product.href}
        aria-label={`View ${product.name}`}
        className="relative block aspect-square w-full overflow-hidden bg-[#F4F8F1] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#07552F]"
      >
        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          quality={85}
          className="object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 md:p-4"
        />
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4 md:p-5">
        <h3 className="text-[16px] sm:text-[17px] font-bold leading-snug text-[#07552F] md:text-[19px]">
          <Link
            href={product.href}
            className="transition-colors duration-200 hover:text-[#4D9A18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F]"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 line-clamp-2 text-xs sm:text-[14px] font-normal leading-relaxed text-[#68786B] md:text-base">
          {product.description}
        </p>

        <div className="mt-2.5 sm:mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg sm:text-xl font-bold text-[#173D2A] md:text-[22px]">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs sm:text-[15px] font-normal text-[#68786B] line-through">
              {formatPrice(product.originalPrice as number)}
            </span>
          )}
        </div>

        {/* Buttons: Add to Cart (outline) & Buy Now (solid) */}
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 md:mt-auto">
          <button
            type="button"
            onClick={() => {
              if (isHandloom) {
                router.push(product.href);
                return;
              }
              if (onAddToCart) {
                onAddToCart(product);
              } else {
                addCartItem(
                  {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    image: product.image,
                    alt: product.alt,
                    href: product.href,
                  },
                  1
                );
              }
            }}
            className="flex-1 inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 rounded-md border-2 border-[#07552F] bg-white px-2.5 text-xs sm:text-sm font-semibold text-[#07552F] transition-colors duration-200 hover:bg-[#F4F8F1]"
          >
            Add to Cart
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className="flex-1 inline-flex h-10 sm:h-11 items-center justify-center rounded-md bg-[#07552F] px-2.5 text-xs sm:text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#063D27] shadow-sm"
          >
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. SECTION – use this below the category section

   Optional props:
   - products:    pass real products (e.g. from your API) instead of the config above
   - onAddToCart: hook into your existing cart (context / store / API)
                  e.g. <BestSellersSection onAddToCart={(p) => addToCart(p.id)} />

   Layout:
   - Mobile + tablet: swipeable row, 2 cards per view, each swipe moves to the next pair
   - Desktop (lg+):   normal 4-column grid
   ═══════════════════════════════════════════════════════════════ */

export default function BestSellersSection({
  products: initialProducts,
  onAddToCart,
}: {
  products?: BestSellerProduct[];
  onAddToCart?: (product: BestSellerProduct) => void;
}) {
  const [items, setItems] = useState<BestSellerProduct[]>(initialProducts || BEST_SELLERS);

  useEffect(() => {
    if (initialProducts) {
      setItems(initialProducts);
      return;
    }
    api<{ products: any[] }>("/products?featured=true")
      .then((data) => {
        if (data?.products && data.products.length > 0) {
          const mapped: BestSellerProduct[] = data.products.map((p) => {
            const catSlug = p.category_slug || (p.category_name ? p.category_name.toLowerCase().replace(/\s+/g, "-") : "products");
            return {
              id: p.id,
              name: p.name,
              description: p.description || "",
              price: Number(p.price),
              originalPrice: Number(p.mrp) > Number(p.price) ? Number(p.mrp) : undefined,
              image: p.image || `/products/${p.slug}.jpg`,
              alt: p.name,
              href: `/${catSlug}/${p.slug}`,
            };
          });
          setItems(mapped);
        }
      })
      .catch(() => {
        // Fall back to initial if API fails
      });
  }, [initialProducts]);

  const products = items;
  return (
    <section
      aria-labelledby="bestsellers-heading"
      className="overflow-x-hidden bg-white px-4 py-[52px] md:px-[3.3vw] md:py-[64px] lg:py-[90px]"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-[680px] text-center">
          <h2
            id="bestsellers-heading"
            className="text-[30px] font-bold leading-tight tracking-tight text-[#07552F] md:text-4xl lg:text-[44px]"
          >
            {SECTION_TEXT.heading}
          </h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[#68786B] md:text-[17px] lg:text-[18px]">
            {SECTION_TEXT.subheading}
          </p>
        </div>

        {/* Mobile/tablet: 2 cards per view, swipe for the next 2 · Desktop: 4 in a row */}
        <div
          className="
            -mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth
            px-4 pb-4 scroll-pl-4
            md:-mx-[3.3vw] md:mt-12 md:gap-6 md:px-[3.3vw] md:scroll-pl-[3.3vw]
            lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-7 lg:overflow-visible lg:px-0 lg:pb-0
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          "
        >
          {products.slice(0, 4).map((product, i) => (
            <div
              key={product.id}
              className={`flex shrink-0 basis-[calc((100%-0.75rem)/2)] snap-always md:basis-[calc((100%-1.5rem)/2)] lg:basis-auto ${
                i % 2 === 0 ? "snap-start" : "[scroll-snap-align:none]"
              }`}
            >
              <ProductCard
                product={product}
                delay={i * 100}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>

        {/* See more → Shop All (stays fixed below the swipe row) */}
        <div className="mt-6 flex justify-center md:mt-10">
          <Link
            href={SECTION_TEXT.seeMoreLink}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border-2 border-[#07552F] bg-white px-9 text-[15px] font-semibold text-[#07552F] transition-colors duration-200 hover:bg-[#07552F] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F]"
          >
            {SECTION_TEXT.seeMoreText}
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
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}