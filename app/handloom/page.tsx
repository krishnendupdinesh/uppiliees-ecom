import UppilieesProductListing from "@/components/UppilieesProductListing";
import { handloom } from "@/data/products";

export const dynamic = "force-dynamic";

export default function TraditionalHandloomPage() {
  return <UppilieesProductListing collection={handloom} />;
}