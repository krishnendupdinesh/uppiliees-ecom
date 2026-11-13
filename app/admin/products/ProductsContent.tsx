import { getProducts } from "@/lib/admin/db";
import ProductListClient from "./ProductListClient";

export default async function ProductsContent() {
  const products = await getProducts();
  return <ProductListClient initialProducts={products} />;
}
