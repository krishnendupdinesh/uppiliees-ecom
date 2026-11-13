import UppilieesProductListing from "@/components/UppilieesProductListing";
import { traditionalFoods } from "@/data/products";

export default function TraditionalFoodPage() {
  return <UppilieesProductListing collection={traditionalFoods} />;
}