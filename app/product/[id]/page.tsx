import { redirect } from "next/navigation";
import { OLD_PRODUCT_ID_TO_SLUG } from "@/lib/routes";

export const instant = false;

type Params = Promise<{ id: string }>;

export default async function ProductOldRedirectPage({ params }: { params: Params }) {
  const { id } = await params;
  const targetSlug = OLD_PRODUCT_ID_TO_SLUG[id] || id;
  redirect(`/products/${targetSlug}`);
}
