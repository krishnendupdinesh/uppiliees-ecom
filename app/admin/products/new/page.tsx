import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#052E1D]">New product</h1>
      <ProductForm />
    </div>
  );
}

