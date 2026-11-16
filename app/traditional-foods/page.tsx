import UppilieesProductListing from "@/components/UppilieesProductListing";
import { traditionalFoods } from "@/data/products";

export const dynamic = "force-dynamic";

export default function TraditionalFoodPage() {
  return <UppilieesProductListing collection={traditionalFoods} />;
}