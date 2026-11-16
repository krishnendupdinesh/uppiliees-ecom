import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import ProductForm from "@/components/admin/ProductForm";
import { getProduct } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

async function EditProductContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#052E1D]">Edit product</h1>
      <ProductForm product={product} />
    </div>
  );
}

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-[#5b6b60]">Loading product...</p>}>
      <EditProductContent params={params} />
    </Suspense>
  );
}