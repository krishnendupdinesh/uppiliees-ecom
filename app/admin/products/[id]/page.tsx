import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { getProduct } from "@/lib/admin/db";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
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