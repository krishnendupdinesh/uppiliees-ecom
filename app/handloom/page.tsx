import { connection } from "next/server";
import UppilieesProductListing from "@/components/UppilieesProductListing";
import { fetchCollectionFromDb } from "@/lib/products-db";

export const dynamic = "force-dynamic";

export default async function TraditionalHandloomPage() {
  await connection();
  const collection = await fetchCollectionFromDb("handloom");
  return <UppilieesProductListing collection={collection} />;
}
