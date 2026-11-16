import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables from .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function getTargetDatabase(): string {
  const raw = (process.env.TIDB_DATABASE || "uppiliees").trim();
  if (!raw || raw.toLowerCase() === "sys") {
    return "uppiliees";
  }
  return raw;
}

async function initDatabase() {
  const dbName = getTargetDatabase();
  let connection: mysql.Connection | null = null;

  try {
    console.log(`Connecting to TiDB Cloud (${process.env.TIDB_HOST})...`);

    connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT || 4000),
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
    });

    console.log(`Ensuring database "${dbName}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);

    const schemaPath = path.resolve(process.cwd(), "db/schema.sql");
    const rawSql = fs.readFileSync(schemaPath, "utf8");

    // Strip single-line comments and split statements by semicolon
    const cleanSql = rawSql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");

    const statements = cleanSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }

    // Safely ensure columns exist if tables were created by an earlier schema version
    const safeAlters = [
      "ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL",
      "ALTER TABLE categories ADD COLUMN subtitle VARCHAR(500) NULL",
      "ALTER TABLE products ADD COLUMN subcategory VARCHAR(255) NULL",
      "ALTER TABLE products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE",
      "ALTER TABLE products ADD COLUMN display_order INT NOT NULL DEFAULT 0",
      "ALTER TABLE products ADD COLUMN tags TEXT NULL",
      "ALTER TABLE products ADD COLUMN sizes_json TEXT NULL",
      "ALTER TABLE products ADD COLUMN benefits TEXT NULL",
      "ALTER TABLE products ADD COLUMN how_to_use TEXT NULL",
      "ALTER TABLE products ADD COLUMN ingredients TEXT NULL",
      "ALTER TABLE products ADD COLUMN return_policy TEXT NULL",
      "ALTER TABLE products ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE",
      "ALTER TABLE orders ADD COLUMN shipping_address TEXT NULL",
      "ALTER TABLE orders MODIFY COLUMN address TEXT NULL",
      "ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'pending'",
      "ALTER TABLE reviews ADD COLUMN user_name VARCHAR(255) NULL",
    ];

    for (const alterSql of safeAlters) {
      try {
        await connection.query(alterSql);
      } catch {
        // Column already exists or not applicable
      }
    }

    console.log("Database schema initialized successfully in TiDB Cloud!");
  } catch (error: any) {
    console.error("Failed to initialize database:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
