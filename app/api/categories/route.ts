import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

const DEFAULT_CATEGORIES = [
  { id: 1, name: "Herbal & Beauty", slug: "herbal-beauty", subtitle: "Pure Nature. Pure Goodness." },
  { id: 2, name: "Traditional Food", slug: "traditional-foods", subtitle: "Homemade and traditional, straight from Kerala kitchens" },
  { id: 3, name: "Handloom", slug: "handloom", subtitle: "Authentic Kerala handloom, woven with care" },
];

export async function GET() {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, name, slug, subtitle FROM categories ORDER BY id ASC"
    );
    if (rows.length > 0) {
      return NextResponse.json(rows);
    }
    return NextResponse.json(DEFAULT_CATEGORIES);
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(DEFAULT_CATEGORIES);
  }
}
