import { Suspense } from "react";
import ProductsContent from "./ProductsContent";

export const instant = false;

export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#5b6b60]">Loading products...</p>}>
      <ProductsContent />
    </Suspense>
  );
}
