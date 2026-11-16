import { connection } from "next/server";
import UppilieesProductListing from "@/components/UppilieesProductListing";
import { fetchCollectionFromDb } from "@/lib/products-db";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  await connection();
  const collection = await fetchCollectionFromDb("products");
  return <UppilieesProductListing collection={collection} />;
}
