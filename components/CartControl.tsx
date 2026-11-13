"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";

type Props = {
  quantity: number; // how many of this product are in the cart
  onAdd: () => void;
  onRemove: () => void;
};

/* "Add to Cart" button that turns into a - [count] + stepper */
export default function CartControl({ quantity, onAdd, onRemove }: Props) {
  if (quantity === 0) {
    return (
      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 bg-[#07552F] hover:bg-[#063D27] text-white text-sm font-medium py-2 rounded transition"
      >
        <ShoppingCart size={16} />
        Add to Cart
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between border border-[#07552F] rounded py-1 px-2">
      <button onClick={onRemove} aria-label="Remove one" className="p-1 text-[#07552F]">
        <Minus size={16} />
      </button>
      <span className="text-sm font-semibold text-[#07552F]">{quantity}</span>
      <button onClick={onAdd} aria-label="Add one more" className="p-1 text-[#07552F]">
        <Plus size={16} />
      </button>
    </div>
  );
}