"use client";

/*
  app/wishlist/page.tsx  – SINGLE-FILE WISHLIST PAGE
  (use src/app/wishlist/page.tsx if your project has a src folder)

  Navbar / AnnouncementBar / Footer come from your existing layout.
  Tip: client pages can't export `metadata`. To set the tab title, add
  `export const metadata = { title: "Your Wishlist | UPPILIEES" }` in
  app/wishlist/layout.tsx.

  HOW THE DATA WORKS
  - Saved products live in the browser's localStorage under WISHLIST_STORAGE_KEY.
  - Your heart buttons must save items in the SAME shape (see WishlistItem)
    and then call  window.dispatchEvent(new Event("uppiliees:wishlist-updated")).
  - "Add to Cart" here writes to the SAME cart storage as the cart page
    (key "uppiliees-cart", shape = CartItem in app/cart/page.tsx).
  - If your project already has a wishlist / cart (context / store / API),
    replace ONLY the functions in section 2 and keep the rest.
*/

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════
   1. CONFIG – edit ONLY this part to change the page content
   ═══════════════════════════════════════════════════════════════ */

const PAGE_TEXT = {
  heading: "Your Wishlist",
  emptyHeading: "Your wishlist is empty",
  emptyText: "Tap the heart on any product to save it here for later.",
  addToCartText: "Add to Cart",
  continueText: "Continue Shopping",
  currency: "₹",
};

const WISHLIST_STORAGE_KEY = "uppiliees-wishlist";
const WISHLIST_EVENT = "uppiliees:wishlist-updated";
const CART_STORAGE_KEY = "uppiliees-cart";
const CART_EVENT = "uppiliees:cart-updated";
const CART_HREF = "/cart";
const CONTINUE_HREF = "/shop"; // ← Shop All page
const MAX_QTY = 10;

export interface WishlistItem {
  id: number | string;
  name: string;
  description?: string;
  price: number;
  /** Only set when a real discount exists. */
  originalPrice?: number;
  /** Path in /public or a remote image URL. */
  image: string;
  alt?: string;
  /** Product detail page. */
  href: string;
}

interface CartItem extends Omit<WishlistItem, "description"> {
  qty: number;
}

/* ═══════════════════════════════════════════════════════════════
   2. DATA LAYER – swap these functions for your own store / API
   ═══════════════════════════════════════════════════════════════ */

function isValidItem(x: unknown): x is WishlistItem {
  if (!x || typeof x !== "object") return false;
  const i = x as Record<string, unknown>;
  return (
    (typeof i.id === "string" || typeof i.id === "number") &&
    typeof i.name === "string" &&
    typeof i.price === "number" &&
    Number.isFinite(i.price)
  );
}

function readList<T>(key: string, check: (x: unknown) => boolean): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed.filter(check) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, event: string, items: unknown[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event(event));
  } catch {
    /* storage blocked – nothing to do */
  }
}

const readWishlist = () => readList<WishlistItem>(WISHLIST_STORAGE_KEY, isValidItem);
const writeWishlist = (items: WishlistItem[]) =>
  writeList(WISHLIST_STORAGE_KEY, WISHLIST_EVENT, items);

/** Adds a product to the cart storage (or +1 if it is already there). */
function addToCartStorage(product: WishlistItem) {
  const cart = readList<CartItem>(
    CART_STORAGE_KEY,
    (x) => isValidItem(x) && typeof (x as CartItem).qty === "number"
  );
  const existing = cart.find((c) => c.id === product.id);
  let next: CartItem[];
  if (existing) {
    next = cart.map((c) =>
      c.id === product.id ? { ...c, qty: Math.min(c.qty + 1, MAX_QTY) } : c
    );
  } else {
    const { description: _description, ...rest } = product;
    next = [...cart, { ...rest, qty: 1 }];
  }
  writeList(CART_STORAGE_KEY, CART_EVENT, next);
}

const formatPrice = (n: number) =>
  `${PAGE_TEXT.currency}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/* ═══════════════════════════════════════════════════════════════
   3. ICONS
   ═══════════════════════════════════════════════════════════════ */

const ico = {
  viewBox: "0 0 24 24",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const HeartIcon = ({ size = 20, filled = false }: { size?: number; filled?: boolean }) => (
  <svg
    {...ico}
    width={size}
    height={size}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
const BagIcon = () => (
  <svg {...ico} width={18} height={18} fill="none" stroke="currentColor">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const ArrowIcon = () => (
  <svg {...ico} width={16} height={16} fill="none" stroke="currentColor">
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   4. FADE-IN ON SCROLL (respects reduced motion)
   ═══════════════════════════════════════════════════════════════ */

function useInView<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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
  }, [el]);

  return { ref: setEl, visible };
}

/* ═══════════════════════════════════════════════════════════════
   5. WISHLIST CARD
   ═══════════════════════════════════════════════════════════════ */

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F]";

function WishlistCard({
  item,
  delay,
  onRemove,
  onAdd,
}: {
  item: WishlistItem;
  delay: number;
  onRemove: (item: WishlistItem) => void;
  onAdd: (item: WishlistItem) => void;
}) {
  const { ref, visible } = useInView<HTMLElement>();
  const hasDiscount = item.originalPrice !== undefined && item.originalPrice > item.price;

  return (
    <article
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={`group flex h-full flex-col overflow-hidden rounded-xl border-2 border-[#07552F]/40 bg-white transition-all duration-700 ease-out hover:border-[#07552F] hover:shadow-[0_12px_30px_-12px_rgba(7,85,47,0.25)] motion-reduce:transition-none ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
      }`}
    >
      <div className="relative">
        <Link
          href={item.href}
          aria-label={`View ${item.name}`}
          className={`relative block aspect-square w-full overflow-hidden bg-[#F4F8F1] ${focusRing}`}
        >
          {item.image ? (
            <Image
              src={item.image}
              alt={item.alt ?? item.name}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              quality={85}
              className="object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 md:p-4"
            />
          ) : null}
        </Link>

        {/* Remove (filled heart) */}
        <button
          type="button"
          onClick={() => onRemove(item)}
          aria-label={`Remove ${item.name} from wishlist`}
          className={`absolute right-2 top-2 flex size-10 items-center justify-center rounded-full bg-white/95 text-[#07552F] shadow-sm transition-colors duration-200 hover:bg-[#07552F] hover:text-white md:right-3 md:top-3 ${focusRing}`}
        >
          <HeartIcon filled />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3.5 md:p-5">
        <h3 className="text-[16px] font-bold leading-snug text-[#07552F] md:text-lg">
          <Link href={item.href} className={`transition-colors duration-200 hover:text-[#4D9A18] ${focusRing}`}>
            {item.name}
          </Link>
        </h3>

        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#68786B] md:text-[15px]">
            {item.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg font-bold text-[#173D2A] md:text-xl">{formatPrice(item.price)}</span>
          {hasDiscount && (
            <span className="text-sm text-[#68786B] line-through">
              {formatPrice(item.originalPrice as number)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAdd(item)}
          className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#07552F] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#063D27] md:mt-auto md:h-12 md:text-[15px] ${focusRing}`}
        >
          <BagIcon />
          {PAGE_TEXT.addToCartText}
        </button>
      </div>
    </article>
  );
}

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4 lg:gap-7" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-[#EDF3E9] motion-reduce:animate-none" />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. PAGE
   2 columns on mobile + tablet, 4 on laptop.
   ═══════════════════════════════════════════════════════════════ */

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string>("");

  const loadFromApi = useCallback(async () => {
    try {
      const data = await api<any[]>("/wishlist");
      const mapped: WishlistItem[] = (data || []).map((p) => {
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
      writeWishlist(mapped);
      setLoaded(true);
    } catch (err: any) {
      if (err?.status === 401) {
        router.push("/login");
        return;
      }
      setItems(readWishlist());
      setLoaded(true);
    }
  }, [router]);

  useEffect(() => {
    loadFromApi();
    window.addEventListener(WISHLIST_EVENT, loadFromApi);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, loadFromApi);
    };
  }, [loadFromApi]);

  const remove = async (item: WishlistItem) => {
    try {
      await api(`/wishlist/${item.id}`, { method: "DELETE" });
    } catch (err: any) {
      if (err?.status === 401) {
        router.push("/login");
        return;
      }
    }
    const next = items.filter((i) => String(i.id) !== String(item.id));
    setItems(next);
    writeWishlist(next);
    setNotice(`${item.name} was removed from your wishlist.`);
  };

  const addOne = (item: WishlistItem) => {
    addToCartStorage(item);
    setNotice(`${item.name} was added to your bag.`);
  };

  const addAll = () => {
    items.forEach(addToCartStorage);
    setNotice(`${items.length} ${items.length === 1 ? "item was" : "items were"} added to your bag.`);
  };

  const clearAll = async () => {
    for (const item of items) {
      try {
        await api(`/wishlist/${item.id}`, { method: "DELETE" });
      } catch {}
    }
    setItems([]);
    writeWishlist([]);
    setNotice("Your wishlist was cleared.");
  };

  return (
    <main>
      {/* Title band */}
      <section
        aria-labelledby="wishlist-heading"
        className="bg-[#F4F8F1] px-4 py-[32px] text-center md:px-[3.3vw] md:py-[48px] lg:py-[60px]"
      >
        <h1
          id="wishlist-heading"
          className="text-[30px] font-bold leading-tight tracking-tight text-[#07552F] md:text-[40px] lg:text-[46px]"
        >
          {PAGE_TEXT.heading}
        </h1>
        {loaded && items.length > 0 && (
          <p className="mt-2 text-[15px] text-[#68786B] md:text-base">
            {items.length} saved {items.length === 1 ? "product" : "products"}
          </p>
        )}
      </section>

      <section className="bg-white px-4 py-[32px] md:px-[3.3vw] md:py-[56px] lg:py-[72px]">
        <div className="mx-auto max-w-[1280px]">
          {/* Live feedback */}
          <div aria-live="polite" className="min-h-0">
            {notice && (
              <p className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md border border-[#4D9A18]/40 bg-[#EDF3E9] px-4 py-3 text-sm leading-relaxed text-[#063D27]">
                <span>{notice}</span>
                {notice.includes("added to your bag") && (
                  <Link
                    href={CART_HREF}
                    className={`font-semibold underline underline-offset-4 hover:text-[#07552F] ${focusRing}`}
                  >
                    View bag
                  </Link>
                )}
              </p>
            )}
          </div>

          {!loaded ? (
            <WishlistSkeleton />
          ) : items.length === 0 ? (
            /* Empty state */
            <div className="mx-auto max-w-[520px] rounded-xl border-2 border-[#07552F]/30 bg-[#FAFBF6] px-6 py-12 text-center md:py-16">
              <div className="mx-auto flex size-[76px] items-center justify-center rounded-full border-2 border-[#07552F]/40 bg-white text-[#07552F]">
                <HeartIcon size={32} />
              </div>
              <h2 className="mt-5 text-[22px] font-bold text-[#07552F] md:text-[26px]">
                {PAGE_TEXT.emptyHeading}
              </h2>
              <p className="mx-auto mt-2 max-w-[360px] text-[15px] leading-relaxed text-[#68786B]">
                {PAGE_TEXT.emptyText}
              </p>
              <Link
                href={CONTINUE_HREF}
                className={`mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#07552F] px-8 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#063D27] ${focusRing}`}
              >
                {PAGE_TEXT.continueText}
                <ArrowIcon />
              </Link>
            </div>
          ) : (
            <>
              {/* Bulk actions */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 md:mb-7">
                <button
                  type="button"
                  onClick={clearAll}
                  className={`text-[15px] font-semibold text-[#68786B] underline-offset-4 transition-colors hover:text-[#07552F] hover:underline ${focusRing}`}
                >
                  Clear wishlist
                </button>
                <button
                  type="button"
                  onClick={addAll}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border-2 border-[#07552F] bg-white px-6 text-[15px] font-semibold text-[#07552F] transition-colors duration-200 hover:bg-[#07552F] hover:text-white ${focusRing}`}
                >
                  <BagIcon />
                  Add all to cart
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4 lg:gap-7">
                {items.map((item, i) => (
                  <WishlistCard
                    key={item.id}
                    item={item}
                    delay={(i % 4) * 100}
                    onRemove={remove}
                    onAdd={addOne}
                  />
                ))}
              </div>

              <div className="mt-9 flex justify-center md:mt-12">
                <Link
                  href={CONTINUE_HREF}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-md border-2 border-[#07552F] bg-white px-9 text-[15px] font-semibold text-[#07552F] transition-colors duration-200 hover:bg-[#07552F] hover:text-white ${focusRing}`}
                >
                  {PAGE_TEXT.continueText}
                  <ArrowIcon />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}