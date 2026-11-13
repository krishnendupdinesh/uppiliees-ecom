"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
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

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Toggle wishlist directly in local storage for both guests and logged-in users
    const isNowActive = toggleWishlistItem(item);
    setActive(isNowActive);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
      className={`rounded-full p-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${
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
