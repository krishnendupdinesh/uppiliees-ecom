import { NextResponse } from "next/server";
import { collections } from "@/data/products";

export async function GET() {
  const cats = collections.map((c, i) => ({
    id: i + 1,
    name: c.title,
    slug: c.slug,
  }));
  return NextResponse.json(cats);
}

