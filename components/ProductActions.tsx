"use client";

import { useState } from "react";
import CartControl from "./CartControl";

/* Cart button for the product page */
export default function ProductActions() {
  const [quantity, setQuantity] = useState(0);

  return (
    <div className="max-w-xs">
      <CartControl
        quantity={quantity}
        onAdd={() => setQuantity((q) => q + 1)}
        onRemove={() => setQuantity((q) => Math.max(0, q - 1))}
      />
    </div>
  );
}