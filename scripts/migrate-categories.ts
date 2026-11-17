import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env from current directory, parent directory, or shopclues/.env
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
  console.error("❌ Missing TiDB environment variables (TIDB_HOST, TIDB_USER, TIDB_PASSWORD).");
  console.error("Please ensure your .env file is present with valid database credentials.");
  process.exit(1);
}

// Reuse the same DB connection settings as lib/db.ts
const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  ssl: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 5,
});

// Summary tracking
const summary = {
  tablesCreated: [] as string[],
  columnsAdded: [] as string[],
  sectionsSeeded: 0,
  categoriesSeeded: 0,
  categoriesAssigned: 0,
  productsUpdated: 0,
  unmatchedCategories: [] as { id: number; name: string; slug: string }[],
  unmatchedProducts: [] as { id: number | string; name: string; category?: string; subcategory?: string }[],
};

// Check if a table exists in the database
async function tableExists(tableName: string): Promise<boolean> {
  const [rows]: any = await pool.execute(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
    [database, tableName]
  );
  return Array.isArray(rows) && rows.length > 0;
}

// Check if a column exists in a table
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const [rows]: any = await pool.execute(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?",
    [database, tableName, columnName]
  );
  return Array.isArray(rows) && rows.length > 0;
}

// Slugify helper
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function run() {
  console.log("====================================================================");
  console.log(`🚀 Starting TiDB Migration for Sections, Categories & Pricing`);
  console.log(`📡 Connected to database: "${database}" on host: "${host}"`);
  console.log("====================================================================\n");

  // ---------------------------------------------------------------------------
  // STEP 1: Inspect Current Schema
  // ---------------------------------------------------------------------------
  console.log("--- STEP 1: Inspecting Current Schema ---");
  const hasCategories = await tableExists("categories");
  const hasProducts = await tableExists("products");
  const hasSections = await tableExists("sections");

  console.log(`• Table "sections": ${hasSections ? "EXISTS" : "DOES NOT EXIST"}`);
  console.log(`• Table "categories": ${hasCategories ? "EXISTS" : "DOES NOT EXIST"}`);
  console.log(`• Table "products": ${hasProducts ? "EXISTS" : "DOES NOT EXIST"}\n`);

  // ---------------------------------------------------------------------------
  // STEP 2: Create and Seed Table `sections`
  // ---------------------------------------------------------------------------
  console.log("--- STEP 2: Ensuring Table `sections` Exists & Seeded ---");
  if (!hasSections) {
    await pool.execute(`
      CREATE TABLE sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✓ Created table sections");
    summary.tablesCreated.push("sections");
  } else {
    console.log("• Table sections already exists, skipped creation");
  }

  // Seed the 3 required sections
  const defaultSections = [
    { id: 1, name: "Herbal & Wellness", slug: "herbal-wellness", sort_order: 1 },
    { id: 2, name: "Kerala Food Products", slug: "kerala-food-products", sort_order: 2 },
    { id: 3, name: "Handloom", slug: "handloom", sort_order: 3 },
  ];

  for (const s of defaultSections) {
    const [existing]: any = await pool.execute("SELECT id FROM sections WHERE slug = ? LIMIT 1", [s.slug]);
    if (!existing || existing.length === 0) {
      await pool.execute("INSERT INTO sections (id, name, slug, sort_order) VALUES (?, ?, ?, ?)", [
        s.id,
        s.name,
        s.slug,
        s.sort_order,
      ]);
      console.log(`✓ Seeded section: "${s.name}" (slug: ${s.slug})`);
      summary.sectionsSeeded += 1;
    } else {
      console.log(`• Section "${s.name}" already exists, skipped`);
    }
  }
  console.log("");

  // ---------------------------------------------------------------------------
  // STEP 3: Create or Update Table `categories`
  // ---------------------------------------------------------------------------
  console.log("--- STEP 3: Ensuring Table `categories` & Columns Exist ---");
  if (!hasCategories) {
    await pool.execute(`
      CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        section_id INT NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        image TEXT NULL,
        subtitle VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_categories_section (section_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✓ Created table categories");
    summary.tablesCreated.push("categories");
  } else {
    // Add missing columns if table already existed
    const categoryCols = [
      { name: "section_id", def: "INT NOT NULL DEFAULT 1" },
      { name: "is_active", def: "BOOLEAN NOT NULL DEFAULT TRUE" },
      { name: "image", def: "TEXT NULL" },
      { name: "subtitle", def: "VARCHAR(500) NULL" },
    ];

    for (const col of categoryCols) {
      const exists = await columnExists("categories", col.name);
      if (!exists) {
        await pool.execute(`ALTER TABLE categories ADD COLUMN \`${col.name}\` ${col.def}`);
        console.log(`✓ Added column "${col.name}" to categories`);
        summary.columnsAdded.push(`categories.${col.name}`);
      } else {
        console.log(`• Column "${col.name}" already exists on categories, skipped`);
      }
    }
  }

  // Seed default categories
  const categoriesToSeed = [
    // Section 1: Herbal & Wellness
    { name: "Pain Relief", slug: "pain-relief", section_id: 1 },
    { name: "Baby Care", slug: "baby-care", section_id: 1 },
    { name: "Hair Care", slug: "hair-care", section_id: 1 },
    { name: "Skin Care", slug: "skin-care", section_id: 1 },
    { name: "Wellness Powders", slug: "wellness-powders", section_id: 1 },
    { name: "Home Care", slug: "home-care", section_id: 1 },
    { name: "Powders", slug: "powders", section_id: 1 },

    // Section 2: Kerala Food Products
    { name: "Chips & Sweets", slug: "chips-sweets", section_id: 2 },
    { name: "Pickle, Ghee & Lard", slug: "pickle-ghee-lard", section_id: 2 },
    { name: "Dried Foods", slug: "dried-foods", section_id: 2 },

    // Section 3: Handloom
    { name: "Sarees", slug: "sarees", section_id: 3 },
    { name: "Set Mundu", slug: "set-mundu", section_id: 3 },
    { name: "Dhotis", slug: "dhotis", section_id: 3 },
  ];

  for (const cat of categoriesToSeed) {
    const [existing]: any = await pool.execute(
      "SELECT id FROM categories WHERE slug = ? OR LOWER(name) = LOWER(?) LIMIT 1",
      [cat.slug, cat.name]
    );

    if (!existing || existing.length === 0) {
      await pool.execute(
        "INSERT INTO categories (name, slug, section_id, is_active) VALUES (?, ?, ?, TRUE)",
        [cat.name, cat.slug, cat.section_id]
      );
      console.log(`✓ Seeded category: "${cat.name}" under section ${cat.section_id}`);
      summary.categoriesSeeded += 1;
    }
  }

  // Assign every existing category to the correct section
  console.log("\n• Checking and assigning categories to their proper sections...");
  const [existingCats]: any = await pool.execute("SELECT id, name, slug, section_id FROM categories");

  for (const c of existingCats) {
    const text = `${c.name} ${c.slug}`.toLowerCase();
    let targetSectionId: number | null = null;

    if (
      text.includes("pain") ||
      text.includes("baby") ||
      text.includes("hair") ||
      text.includes("skin") ||
      text.includes("wellness") ||
      text.includes("home care") ||
      text.includes("herbal") ||
      text.includes("beauty") ||
      text.includes("powder")
    ) {
      targetSectionId = 1;
    } else if (
      text.includes("chip") ||
      text.includes("sweet") ||
      text.includes("pickle") ||
      text.includes("ghee") ||
      text.includes("lard") ||
      text.includes("dried") ||
      text.includes("food") ||
      text.includes("culinary")
    ) {
      targetSectionId = 2;
    } else if (
      text.includes("saree") ||
      text.includes("mundu") ||
      text.includes("dhoti") ||
      text.includes("handloom") ||
      text.includes("kasavu") ||
      text.includes("cloth")
    ) {
      targetSectionId = 3;
    }

    if (targetSectionId !== null) {
      if (Number(c.section_id) !== targetSectionId) {
        await pool.execute("UPDATE categories SET section_id = ? WHERE id = ?", [targetSectionId, c.id]);
        console.log(`✓ Assigned category "${c.name}" to section ${targetSectionId}`);
        summary.categoriesAssigned += 1;
      }
    } else {
      summary.unmatchedCategories.push({ id: c.id, name: c.name, slug: c.slug });
      console.log(`⚠️  Could not automatically match category "${c.name}" (slug: ${c.slug}), kept section ${c.section_id || 1}`);
    }
  }
  console.log("");

  // ---------------------------------------------------------------------------
  // STEP 4: Add Missing Columns to Table `products`
  // ---------------------------------------------------------------------------
  console.log("--- STEP 4: Ensuring Product Columns Exist ---");
  if (!hasProducts) {
    console.log("⚠️  Table 'products' does not exist yet. Please run initial DB setup first.");
  } else {
    const productCols = [
      { name: "category_id", def: "INT NULL" },
      { name: "mrp", def: "DECIMAL(10, 2) NOT NULL DEFAULT 0.00" },
      { name: "discount_percent", def: "DECIMAL(5, 2) NOT NULL DEFAULT 0.00" },
      { name: "selling_price", def: "DECIMAL(10, 2) NOT NULL DEFAULT 0.00" },
    ];

    for (const col of productCols) {
      const exists = await columnExists("products", col.name);
      if (!exists) {
        await pool.execute(`ALTER TABLE products ADD COLUMN \`${col.name}\` ${col.def}`);
        console.log(`✓ Added column "${col.name}" to products`);
        summary.columnsAdded.push(`products.${col.name}`);
      } else {
        console.log(`• Column "${col.name}" already exists on products, skipped`);
      }
    }
  }
  console.log("");

  // ---------------------------------------------------------------------------
  // STEP 5: Fill Product Columns from Existing Data
  // ---------------------------------------------------------------------------
  console.log("--- STEP 5: Migrating Product Pricing & Categories ---");
  if (hasProducts) {
    const [allProducts]: any = await pool.execute("SELECT * FROM products");
    const [freshCategories]: any = await pool.execute("SELECT id, name, slug FROM categories");

    for (const p of allProducts) {
      const oldPrice = Number(p.price || 0);
      const existingMrp = Number(p.mrp || 0);
      const existingSelling = Number(p.selling_price || 0);

      // mrp = existing mrp if > 0, else old price
      const finalMrp = existingMrp > 0 ? existingMrp : oldPrice;
      // selling_price = existing selling_price if > 0, else old price
      const finalSelling = existingSelling > 0 ? existingSelling : oldPrice;

      // discount_percent = round((mrp - selling_price) / mrp * 100) when both exist
      let finalDiscount = Number(p.discount_percent || 0);
      if (finalMrp > finalSelling && finalMrp > 0) {
        finalDiscount = Math.round(((finalMrp - finalSelling) / finalMrp) * 100);
      } else if (finalMrp === finalSelling) {
        finalDiscount = 0;
      }

      // Match category_id from category name / subcategory / slug
      let matchedCategoryId: number | null = p.category_id ? Number(p.category_id) : null;

      if (!matchedCategoryId) {
        const catSearchTerm = (p.subcategory || p.category || p.category_name || "").toLowerCase().trim();
        const pSlug = (p.slug || "").toLowerCase();

        const match = freshCategories.find((c: any) => {
          const cName = c.name.toLowerCase();
          const cSlug = c.slug.toLowerCase();
          return (
            (catSearchTerm && (cName === catSearchTerm || cSlug === catSearchTerm)) ||
            (catSearchTerm && (catSearchTerm.includes(cName) || cName.includes(catSearchTerm))) ||
            pSlug.includes(cSlug)
          );
        });

        if (match) {
          matchedCategoryId = match.id;
        } else {
          summary.unmatchedProducts.push({
            id: p.id,
            name: p.name,
            category: p.category,
            subcategory: p.subcategory,
          });
        }
      }

      await pool.execute(
        `UPDATE products 
         SET 
           mrp = ?,
           selling_price = ?,
           price = ?,
           discount_percent = ?,
           category_id = COALESCE(?, category_id)
         WHERE id = ?`,
        [finalMrp, finalSelling, finalSelling, finalDiscount, matchedCategoryId, p.id]
      );

      summary.productsUpdated += 1;
    }

    console.log(`✓ Updated ${summary.productsUpdated} products with mrp, selling_price, discount %, and category_id.`);
  }

  // ---------------------------------------------------------------------------
  // STEP 6: Print Summary
  // ---------------------------------------------------------------------------
  console.log("\n====================================================================");
  console.log("📋 MIGRATION SUMMARY");
  console.log("====================================================================");
  console.log(`• Tables Created:       ${summary.tablesCreated.length > 0 ? summary.tablesCreated.join(", ") : "None (already existed)"}`);
  console.log(`• Columns Added:        ${summary.columnsAdded.length > 0 ? summary.columnsAdded.join(", ") : "None (already existed)"}`);
  console.log(`• Sections Seeded:      ${summary.sectionsSeeded}`);
  console.log(`• Categories Seeded:    ${summary.categoriesSeeded}`);
  console.log(`• Categories Assigned:  ${summary.categoriesAssigned}`);
  console.log(`• Products Migrated:    ${summary.productsUpdated}`);

  if (summary.unmatchedCategories.length > 0) {
    console.log(`\n⚠️  Unmatched Categories (${summary.unmatchedCategories.length}):`);
    for (const uc of summary.unmatchedCategories) {
      console.log(`   - ID ${uc.id}: "${uc.name}" (slug: ${uc.slug})`);
    }
    console.log("   (These were left with their current section or default section 1)");
  }

  if (summary.unmatchedProducts.length > 0) {
    console.log(`\n⚠️  Products Without Direct Category Match (${summary.unmatchedProducts.length}):`);
    for (const up of summary.unmatchedProducts.slice(0, 5)) {
      console.log(`   - ID ${up.id}: "${up.name}" (category: ${up.category || "none"}, subcategory: ${up.subcategory || "none"})`);
    }
    if (summary.unmatchedProducts.length > 5) {
      console.log(`   ...and ${summary.unmatchedProducts.length - 5} more.`);
    }
    console.log("   (You can assign these anytime in the Admin Dashboard under Products)");
  }

  console.log("\n🎉 Migration completed successfully! No data was dropped or lost.");
  console.log("====================================================================\n");

  await pool.end();
}

run().catch(async (err) => {
  console.error("\n❌ Migration failed with error:", err);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
