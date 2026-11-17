import { Suspense } from "react";
import { connection } from "next/server";
import { getAdminCategories } from "@/lib/admin/db";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

async function CategoriesContent() {
  await connection();
  const categories = await getAdminCategories();
  return <CategoriesClient initialCategories={categories} />;
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#5b6b60]">Loading categories...</p>}>
      <CategoriesContent />
    </Suspense>
  );
}
