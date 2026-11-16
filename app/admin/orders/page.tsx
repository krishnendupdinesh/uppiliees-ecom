import { Suspense } from "react";
import OrdersContent from "./OrdersContent";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#5b6b60]">Loading orders...</p>}>
      <OrdersContent />
    </Suspense>
  );
}
