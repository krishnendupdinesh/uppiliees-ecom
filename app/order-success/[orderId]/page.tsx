import { Suspense } from "react";
import OrderSuccessClient from "./OrderSuccessClient";

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-white" />}>
      <OrderSuccessClient orderId={orderId} />
    </Suspense>
  );
}
