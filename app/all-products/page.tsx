import UppilieesProductListing from "@/components/UppilieesProductListing";
import { allProducts } from "@/data/products";

export default function AllProductsAliasPage() {
  return <UppilieesProductListing collection={allProducts} />;
}

