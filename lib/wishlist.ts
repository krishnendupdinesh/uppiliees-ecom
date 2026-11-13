export interface WishlistItem {
  id: number | string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  alt?: string;
  href: string;
}

export const WISHLIST_STORAGE_KEY = "uppiliees-wishlist";
export const WISHLIST_EVENT = "uppiliees:wishlist-updated";

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

export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidItem) : [];
  } catch {
    return [];
  }
}

export function saveWishlist(items: WishlistItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  } catch {
    /* storage blocked */
  }
}

export function isInWishlist(id: number | string): boolean {
  const items = getWishlist();
  return items.some((item) => String(item.id) === String(id));
}

export function toggleWishlistItem(item: WishlistItem): boolean {
  const current = getWishlist();
  const exists = current.some((i) => String(i.id) === String(item.id));
  let updated: WishlistItem[];
  if (exists) {
    updated = current.filter((i) => String(i.id) !== String(item.id));
  } else {
    updated = [...current, item];
  }
  saveWishlist(updated);
  return !exists;
}

