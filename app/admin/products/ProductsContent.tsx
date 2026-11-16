import { connection } from "next/server";
import { getProducts } from "@/lib/admin/db";
import ProductListClient from "./ProductListClient";

export default async function ProductsContent() {
  await connection();
  const products = await getProducts();
  return <ProductListClient initialProducts={products} />;
}
