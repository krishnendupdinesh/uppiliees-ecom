import UppilieesProductListing from "@/components/UppilieesProductListing";
import { allProducts } from "@/data/products";

export const dynamic = "force-dynamic";

export default function ShopPage() {
  return <UppilieesProductListing collection={allProducts} />;
}

