"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/data/products";
import { addToCart, getCart, updateCartItemQty, CART_EVENT } from "@/lib/cart";
import CartControl from "./CartControl";

/* Cart button for the product page */
export default function ProductActions({
  product,
  href,
}: {
  product?: Product;
  href?: string;
}) {
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    if (!product) return;
    const sync = () => {
      const items = getCart();
      const match = items.find((i) => String(i.id) === String(product.id));
      setQuantity(match ? match.qty : 0);
    };

    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [product]);

  const handleAdd = () => {
    if (!product) {
      setQuantity((q) => q + 1);
      return;
    }
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.mrp > product.price ? product.mrp : undefined,
        image: (product as any).image || `/products/${product.slug}.jpg`,
        alt: product.name,
        href: href || "",
      },
      1
    );
  };

  const handleRemove = () => {
    if (!product) {
      setQuantity((q) => Math.max(0, q - 1));
      return;
    }
    updateCartItemQty(product.id, quantity - 1);
  };

  return (
    <div className="max-w-xs">
      <CartControl
        quantity={quantity}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />
    </div>
  );
}
