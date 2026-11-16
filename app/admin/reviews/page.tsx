import { connection } from "next/server";
import ReviewsClient from "./ReviewsClient";
import { getAdminReviews, getProducts } from "@/lib/admin/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Product Reviews | Uppilies Admin" };

export default async function AdminReviewsPage() {
  await connection();
  const [reviews, products] = await Promise.all([
    getAdminReviews(),
    getProducts(),
  ]);

  const productsList = products.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  return <ReviewsClient initialReviews={reviews} productsList={productsList} />;
}
