"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { api } from "@/lib/api";
import { isInWishlist, toggleWishlistItem, WISHLIST_EVENT, type WishlistItem } from "@/lib/wishlist";

interface WishlistButtonProps {
  item: WishlistItem;
  className?: string;
  size?: number;
}

export default function WishlistButton({
  item,
  className = "",
  size = 18,
}: WishlistButtonProps) {
  const router = useRouter();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isInWishlist(item.id));

    const handleUpdate = () => {
      setActive(isInWishlist(item.id));
    };

    window.addEventListener(WISHLIST_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [item.id]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const me = await api("/auth/me");
      if (!me || !me.id) {
        router.push("/login");
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    const wasActive = active;
    try {
      if (wasActive) {
        await api(`/wishlist/${item.id}`, { method: "DELETE" });
      } else {
        await api(`/wishlist/${item.id}`, { method: "POST" });
      }
      const isNowActive = toggleWishlistItem(item);
      setActive(isNowActive);
    } catch (err: any) {
      if (err?.status === 401) {
        router.push("/login");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
      className={`rounded-full p-2 transition-all duration-200 flex items-center justify-center ${
        active
          ? "bg-rose-50 text-rose-500 hover:bg-rose-100 shadow-sm"
          : "bg-white/90 backdrop-blur-sm text-gray-600 hover:text-rose-500 hover:bg-white shadow-sm"
      } ${className}`}
    >
      <Heart
        size={size}
        className={`transition-transform duration-200 hover:scale-110 ${
          active ? "fill-rose-500 text-rose-500" : ""
        }`}
      />
    </button>
  );
}

