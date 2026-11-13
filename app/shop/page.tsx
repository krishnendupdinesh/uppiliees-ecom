import UppilieesProductListing from "@/components/UppilieesProductListing";
import { allProducts } from "@/data/products";

export default function ShopPage() {
  return <UppilieesProductListing collection={allProducts} />;
}

