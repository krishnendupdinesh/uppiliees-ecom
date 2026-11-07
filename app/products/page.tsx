import UppilieesProductListing from "@/components/UppilieesProductListing";
import { allProducts } from "@/data/products";

export default function AllProductsPage() {
  return <UppilieesProductListing collection={allProducts} />;
}

