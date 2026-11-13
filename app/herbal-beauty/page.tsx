import UppilieesProductListing from "@/components/UppilieesProductListing";
import { herbalBeauty } from "@/data/products";

export default function HerbalBeautyPage() {
  return <UppilieesProductListing collection={herbalBeauty} />;
}