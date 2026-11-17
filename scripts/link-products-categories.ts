import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env from current directory or parent directory
const possibleEnvPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "shopclues", ".env"),
  path.resolve(__dirname, "..", ".env"),
  path.resolve(__dirname, "..", "..", "shopclues", ".env"),
  path.resolve(__dirname, "..", "..", "backend", ".env"),
];

for (const p of possibleEnvPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

const host = (process.env.TIDB_HOST || "").trim();
const port = Number(process.env.TIDB_PORT || 4000);
const user = (process.env.TIDB_USER || "").trim();
const password = process.env.TIDB_PASSWORD || "";
const database = (process.env.TIDB_DATABASE || "uppiliees").trim();

if (!host || !user || !password) {
  console.error("❌ Missing TiDB environment variables.");
  process.exit(1);
}

async function run() {
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  });

  console.log("====================================================================");
  console.log("🔗 LINK PRODUCTS TO REAL CATEGORIES (category_id)");
  console.log(`📡 Connected to database: "${database}"`);
  console.log("====================================================================\n");

  // 1. Fetch all categories
  const [categories]: any = await conn.execute(
    "SELECT id, name, slug, section_id FROM categories ORDER BY id ASC"
  );
  const catMapByName = new Map<string, any>();
  const catMapById = new Map<number, any>();
  for (const c of categories) {
    catMapByName.set(c.name.trim().toLowerCase(), c);
    catMapByName.set(c.slug.trim().toLowerCase(), c);
    catMapById.set(Number(c.id), c);
  }

  // 2. Fetch all products
  const [products]: any = await conn.execute(
    "SELECT id, name, category_id, subcategory FROM products ORDER BY id ASC"
  );

  type PreviewItem = {
    id: number;
    name: string;
    oldCategoryId: number;
    oldCategoryName: string;
    newCategoryId: number;
    newCategoryName: string;
    matchedBy: string;
  };

  const toUpdate: PreviewItem[] = [];
  const unmatched: any[] = [];

  for (const p of products) {
    const oldCat = catMapById.get(Number(p.category_id));
    const oldCatName = oldCat ? oldCat.name : `ID: ${p.category_id}`;

    const sub = String(p.subcategory || "").trim().toLowerCase();
    const matched = catMapByName.get(sub);

    if (matched) {
      toUpdate.push({
        id: p.id,
        name: p.name,
        oldCategoryId: p.category_id,
        oldCategoryName: oldCatName,
        newCategoryId: matched.id,
        newCategoryName: matched.name,
        matchedBy: p.subcategory,
      });
    } else {
      unmatched.push(p);
    }
  }

  // 3. Print Preview
  console.log(`📋 PREVIEW: Found ${toUpdate.length} products to link:`);
  console.table(
    toUpdate.map((u) => ({
      ID: u.id,
      Product: u.name.length > 35 ? u.name.slice(0, 32) + "..." : u.name,
      "Old Cat": `${u.oldCategoryName} (#${u.oldCategoryId})`,
      "New Cat": `${u.newCategoryName} (#${u.newCategoryId})`,
      "Matched Subcategory": u.matchedBy,
    }))
  );

  if (unmatched.length > 0) {
    console.warn(`⚠️ UNMATCHED PRODUCTS (${unmatched.length}):`);
    console.table(unmatched);
  } else {
    console.log("✨ All products matched 100% to real categories!\n");
  }

  // 4. Apply updates
  console.log("🚀 Applying updates to products table...");
  let updatedCount = 0;
  for (const u of toUpdate) {
    await conn.execute(
      "UPDATE products SET category_id = ?, subcategory = ? WHERE id = ?",
      [u.newCategoryId, u.newCategoryName, u.id]
    );
    updatedCount++;
  }

  console.log(`✓ Successfully updated category_id for ${updatedCount} products!\n`);

  // 5. Query category product counts after update
  console.log("📊 NEW CATEGORY PRODUCT COUNTS (with count of products):");
  const [counts]: any = await conn.execute(`
    SELECT 
      c.id, 
      c.name, 
      s.name AS section,
      COUNT(p.id) AS product_count
    FROM categories c
    LEFT JOIN sections s ON s.id = c.section_id
    LEFT JOIN products p ON c.id = p.category_id
    GROUP BY c.id, c.name, s.name, s.sort_order
    ORDER BY COALESCE(s.sort_order, 99) ASC, c.name ASC
  `);

  console.table(counts);

  await conn.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
