import { redirect } from "next/navigation";

export const instant = false;

type Params = Promise<{ slug: string }>;

export default async function CollectionSlugRedirect({ params }: { params: Params }) {
  const { slug } = await params;
  if (slug === "handloom") {
    redirect("/handloom");
  } else if (slug === "kerala-food" || slug === "food") {
    redirect("/traditional-foods");
  } else if (slug === "herbal-beauty-wellness" || slug === "herbal-beauty") {
    redirect("/herbal-beauty");
  }
  redirect("/shop");
}
