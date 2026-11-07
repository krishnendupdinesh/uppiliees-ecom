"use client";

/*
  app/cart/page.tsx  – SINGLE-FILE CART PAGE
  (use src/app/cart/page.tsx if your project has a src folder)

  Navbar / AnnouncementBar / Footer come from your existing layout.
  Tip: client pages can't export `metadata`. To set the tab title, add
  `export const metadata = { title: "Your Bag | UPPILIEES" }` in
  app/cart/layout.tsx.

  HOW THE CART DATA WORKS
  - Items are kept in the browser's localStorage under CART_STORAGE_KEY.
  - Your "Add to Cart" buttons must save items in the SAME shape (see CartItem).
  - After changing the cart, dispatch  window.dispatchEvent(new Event("uppiliees:cart-updated"))
    so this page and your navbar bag badge update instantly.
  - If your project already has a cart (context / store / API), replace ONLY
    the two functions in section 2 (readCart / writeCart) and keep the rest.
*/

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════
   1. CONFIG – edit ONLY this part to change the page content
   ═══════════════════════════════════════════════════════════════ */

const PAGE_TEXT = {
  heading: "Your Bag",
  emptyHeading: "Your bag is empty",
  emptyText: "Looks like you haven't added anything yet. Explore our skincare and haircare essentials.",
  summaryHeading: "Order Summary",
  summaryNote: "Shipping and taxes are shown at checkout.",
  checkoutText: "Proceed to Checkout",
  continueText: "Continue Shopping",
  currency: "₹",
};

const CART_STORAGE_KEY = "uppiliees-cart";
const CART_EVENT = "uppiliees:cart-updated";
const CHECKOUT_HREF = "/checkout"; // ← your checkout route
const CONTINUE_HREF = "/shop"; // ← Shop All page
const MAX_QTY = 10;

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  /** Only set when a real discount exists. */
  originalPrice?: number;
  /** Path in /public or a remote image URL. */
  image: string;
  alt?: string;
  /** Product detail page. */
  href: string;
  qty: number;
}

/* ═══════════════════════════════════════════════════════════════
   2. DATA LAYER – swap these two functions for your own store / API
   ═══════════════════════════════════════════════════════════════ */

function isValidItem(x: unknown): x is CartItem {
  if (!x || typeof x !== "object") return false;
  const i = x as Record<string, unknown>;
  return (
    (typeof i.id === "string" || typeof i.id === "number") &&
    typeof i.name === "string" &&
    typeof i.price === "number" &&
    Number.isFinite(i.price) &&
    typeof i.qty === "number" &&
    Number.isInteger(i.qty) &&
    i.qty >= 1
  );
}

function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidItem) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CART_EVENT));
  } catch {
    /* storage blocked – nothing to do */
  }
}

const formatPrice = (n: number) =>
  `${PAGE_TEXT.currency}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/* ═══════════════════════════════════════════════════════════════
   3. ICONS
   ═══════════════════════════════════════════════════════════════ */

const ico = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const BagIcon = ({ size = 22 }: { size?: number }) => (
  <svg {...ico} width={size} height={size}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const TrashIcon = () => (
  <svg {...ico} width={18} height={18}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);
const MinusIcon = () => (
  <svg {...ico} width={16} height={16}>
    <path d="M5 12h14" />
  </svg>
);
const PlusIcon = () => (
  <svg {...ico} width={16} height={16}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);
const ArrowIcon = () => (
  <svg {...ico} width={16} height={16}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   4. SMALL PIECES
   ═══════════════════════════════════════════════════════════════ */

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07552F]";

function ProductImage({ src, alt }: { src: string; alt: string }) {
  if (!src) return <div className="absolute inset-0 bg-[#EDF3E9]" aria-hidden="true" />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(min-width: 768px) 120px, 88px"
      quality={85}
      className="object-contain p-2"
    />
  );
}

function QtyStepper({
  name,
  qty,
  onChange,
}: {
  name: string;
  qty: number;
  onChange: (next: number) => void;
}) {
  const btn = `flex size-9 items-center justify-center text-[#07552F] transition-colors duration-200 hover:bg-[#07552F] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#07552F] ${focusRing}`;
  return (
    <div
      role="group"
      aria-label={`Quantity for ${name}`}
      className="inline-flex items-center overflow-hidden rounded-md border-2 border-[#07552F]/40"
    >
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        disabled={qty <= 1}
        aria-label={`Decrease quantity of ${name}`}
        className={btn}
      >
        <MinusIcon />
      </button>
      <span className="min-w-9 px-1 text-center text-[15px] font-semibold text-[#173D2A]" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= MAX_QTY}
        aria-label={`Increase quantity of ${name}`}
        className={btn}
      >
        <PlusIcon />
      </button>
    </div>
  );
}

function CartRow({
  item,
  onQty,
  onRemove,
}: {
  item: CartItem;
  onQty: (id: CartItem["id"], qty: number) => void;
  onRemove: (id: CartItem["id"]) => void;
}) {
  const hasDiscount = item.originalPrice !== undefined && item.originalPrice > item.price;

  return (
    <li className="flex gap-3 rounded-xl border-2 border-[#07552F]/30 bg-white p-3 md:gap-5 md:p-4">
      <Link
        href={item.href}
        aria-label={`View ${item.name}`}
        className={`relative block size-[88px] shrink-0 overflow-hidden rounded-lg bg-[#F4F8F1] md:size-[120px] ${focusRing}`}
      >
        <ProductImage src={item.image} alt={item.alt ?? item.name} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-bold leading-snug text-[#07552F] md:text-lg">
            <Link href={item.href} className={`transition-colors hover:text-[#4D9A18] ${focusRing}`}>
              {item.name}
            </Link>
          </h3>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.name} from bag`}
            className={`-mr-1 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-[#68786B] transition-colors hover:bg-[#EDF3E9] hover:text-[#07552F] ${focusRing}`}
          >
            <TrashIcon />
          </button>
        </div>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-bold text-[#173D2A] md:text-base">
            {formatPrice(item.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-[#68786B] line-through">
              {formatPrice(item.originalPrice as number)}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <QtyStepper name={item.name} qty={item.qty} onChange={(q) => onQty(item.id, q)} />
          <p className="text-[15px] font-bold text-[#173D2A] md:text-lg">
            {formatPrice(item.price * item.qty)}
          </p>
        </div>
      </div>
    </li>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]" aria-hidden="true">
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-[112px] animate-pulse rounded-xl bg-[#EDF3E9] motion-reduce:animate-none md:h-[152px]" />
        ))}
      </div>
      <div className="h-[260px] animate-pulse rounded-xl bg-[#EDF3E9] motion-reduce:animate-none" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. PAGE
   Mobile: items stacked, summary below.
   Laptop: items left, sticky summary right.
   ═══════════════════════════════════════════════════════════════ */

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => setItems(readCart()), []);

  useEffect(() => {
    reload();
    setLoaded(true);
    window.addEventListener(CART_EVENT, reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener(CART_EVENT, reload);
      window.removeEventListener("storage", reload);
    };
  }, [reload]);

  const setQty = (id: CartItem["id"], qty: number) => {
    const clamped = Math.min(Math.max(qty, 1), MAX_QTY);
    const next = items.map((i) => (i.id === id ? { ...i, qty: clamped } : i));
    setItems(next);
    writeCart(next);
  };

  const remove = (id: CartItem["id"]) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    writeCart(next);
  };

  const clearAll = () => {
    setItems([]);
    writeCart([]);
  };

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const savings = items.reduce(
    (n, i) =>
      i.originalPrice !== undefined && i.originalPrice > i.price
        ? n + (i.originalPrice - i.price) * i.qty
        : n,
    0
  );

  return (
    <main>
      {/* Title band */}
      <section
        aria-labelledby="cart-heading"
        className="bg-[#F4F8F1] px-4 py-[32px] text-center md:px-[3.3vw] md:py-[48px] lg:py-[60px]"
      >
        <h1
          id="cart-heading"
          className="text-[30px] font-bold leading-tight tracking-tight text-[#07552F] md:text-[40px] lg:text-[46px]"
        >
          {PAGE_TEXT.heading}
        </h1>
        {loaded && count > 0 && (
          <p className="mt-2 text-[15px] text-[#68786B] md:text-base">
            {count} {count === 1 ? "item" : "items"}
          </p>
        )}
      </section>

      <section className="bg-[#FAFBF6] px-4 py-[32px] md:px-[3.3vw] md:py-[56px] lg:py-[72px]">
        <div className="mx-auto max-w-[1280px]">
          {!loaded ? (
            <CartSkeleton />
          ) : items.length === 0 ? (
            /* Empty state */
            <div className="mx-auto max-w-[520px] rounded-xl border-2 border-[#07552F]/30 bg-white px-6 py-12 text-center md:py-16">
              <div className="mx-auto flex size-[76px] items-center justify-center rounded-full border-2 border-[#07552F]/40 bg-[#F4F8F1] text-[#07552F]">
                <BagIcon size={32} />
              </div>
              <h2 className="mt-5 text-[22px] font-bold text-[#07552F] md:text-[26px]">
                {PAGE_TEXT.emptyHeading}
              </h2>
              <p className="mx-auto mt-2 max-w-[380px] text-[15px] leading-relaxed text-[#68786B]">
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
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
              {/* Items */}
              <div>
                <ul className="space-y-3 md:space-y-4">
                  {items.map((item) => (
                    <CartRow key={item.id} item={item} onQty={setQty} onRemove={remove} />
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={CONTINUE_HREF}
                    className={`inline-flex items-center gap-2 text-[15px] font-semibold text-[#07552F] underline-offset-4 transition-colors hover:text-[#4D9A18] hover:underline ${focusRing}`}
                  >
                    {PAGE_TEXT.continueText}
                  </Link>
                  <button
                    type="button"
                    onClick={clearAll}
                    className={`text-[15px] font-semibold text-[#68786B] underline-offset-4 transition-colors hover:text-[#07552F] hover:underline ${focusRing}`}
                  >
                    Clear bag
                  </button>
                </div>
              </div>

              {/* Summary */}
              <aside
                aria-label={PAGE_TEXT.summaryHeading}
                className="rounded-xl border-2 border-[#07552F]/40 bg-white p-5 md:p-7 lg:sticky lg:top-28"
              >
                <h2 className="text-[20px] font-bold text-[#07552F] md:text-[22px]">
                  {PAGE_TEXT.summaryHeading}
                </h2>

                <dl className="mt-5 space-y-3 text-[15px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#68786B]">
                      Items ({count})
                    </dt>
                    <dd className="font-semibold text-[#173D2A]">{formatPrice(subtotal)}</dd>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#68786B]">You save</dt>
                      <dd className="font-semibold text-[#4D9A18]">{formatPrice(savings)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 border-t border-[#E2EBDD] pt-4 text-lg">
                    <dt className="font-bold text-[#07552F]">Subtotal</dt>
                    <dd className="font-bold text-[#173D2A]">{formatPrice(subtotal)}</dd>
                  </div>
                </dl>

                <p className="mt-3 text-[13px] leading-relaxed text-[#68786B]">
                  {PAGE_TEXT.summaryNote}
                </p>

                <Link
                  href={CHECKOUT_HREF}
                  className={`mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#07552F] px-6 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#063D27] ${focusRing}`}
                >
                  {PAGE_TEXT.checkoutText}
                  <ArrowIcon />
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}