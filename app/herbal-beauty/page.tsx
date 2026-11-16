import UppilieesProductListing from "@/components/UppilieesProductListing";
import { herbalBeauty } from "@/data/products";

export const dynamic = "force-dynamic";

export default function HerbalBeautyPage() {
  return <UppilieesProductListing collection={herbalBeauty} />;
}