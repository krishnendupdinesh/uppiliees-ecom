export interface BuyNowItem {
  id: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  alt?: string;
  href: string;
  qty: number;
  slug?: string;
  selectedColor?: string;
  selectedSize?: string;
}

const BUY_NOW_STORAGE_KEY = "uppiliees_buy_now";

export function setBuyNowItem(item: BuyNowItem): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(item));
  } catch (e) {
    console.error("Failed to save buy now item to sessionStorage", e);
  }
}

export function getBuyNowItem(): BuyNowItem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read buy now item from sessionStorage", e);
    return null;
  }
}

export function clearBuyNowItem(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear buy now item from sessionStorage", e);
  }
}

