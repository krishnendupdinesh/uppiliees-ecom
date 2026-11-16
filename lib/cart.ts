export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  alt?: string;
  href: string;
  qty: number;
}

export const CART_STORAGE_KEY = "uppiliees-cart";
export const CART_EVENT = "uppiliees:cart-updated";
export const MAX_QTY = 10;

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

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidItem) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CART_EVENT));
  } catch {
    /* storage blocked */
  }
}

export function getCartTotalCount(): number {
  const items = getCart();
  return items.reduce((total, item) => total + (item.qty || 1), 0);
}

export function addToCart(item: Omit<CartItem, "qty">, qty: number = 1): void {
  const safePrice = Number.isFinite(Number(item.price)) ? Number(item.price) : 0;
  const normalizedItem = { ...item, price: safePrice };

  const items = getCart();
  const existingIndex = items.findIndex((i) => String(i.id) === String(normalizedItem.id));

  let updated: CartItem[];
  if (existingIndex > -1) {
    updated = items.map((i, idx) => {
      if (idx !== existingIndex) return i;
      const newQty = Math.min(MAX_QTY, i.qty + qty);
      return { ...i, qty: newQty };
    });
  } else {
    updated = [...items, { ...normalizedItem, qty: Math.min(MAX_QTY, Math.max(1, qty)) }];
  }
  saveCart(updated);

  // Sync with database cart for logged-in users
  if (typeof window !== "undefined") {
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: normalizedItem.id, quantity: qty, mode: "add" }),
    }).catch(() => {});
  }
}

export function updateCartItemQty(id: number | string, qty: number): void {
  const items = getCart();
  let updated: CartItem[];
  if (qty <= 0) {
    updated = items.filter((i) => String(i.id) !== String(id));
  } else {
    updated = items.map((i) =>
      String(i.id) === String(id) ? { ...i, qty: Math.min(MAX_QTY, qty) } : i
    );
  }
  saveCart(updated);

  if (typeof window !== "undefined") {
    if (qty <= 0) {
      fetch(`/api/cart?productId=${encodeURIComponent(String(id))}`, {
        method: "DELETE",
      }).catch(() => {});
    } else {
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, quantity: qty, mode: "set" }),
      }).catch(() => {});
    }
  }
}

export function removeFromCart(id: number | string): void {
  const items = getCart();
  saveCart(items.filter((i) => String(i.id) !== String(id)));

  if (typeof window !== "undefined") {
    fetch(`/api/cart?productId=${encodeURIComponent(String(id))}`, {
      method: "DELETE",
    }).catch(() => {});
  }
}
