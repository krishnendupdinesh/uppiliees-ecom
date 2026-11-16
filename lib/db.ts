import mysql from "mysql2/promise";

// Resolve target database name (avoid MySQL/TiDB reserved system schema 'sys')
export function getDatabaseName(): string {
  const raw = (process.env.TIDB_DATABASE || "uppiliees").trim();
  if (!raw || raw.toLowerCase() === "sys") {
    return "uppiliees";
  }
  return raw;
}

// Reuse the connection pool across hot reloads in development
const globalForDb = globalThis as unknown as {
  pool?: mysql.Pool;
};

export const pool: mysql.Pool =
  globalForDb.pool ??
  mysql.createPool({
    host: process.env.TIDB_HOST,
    port: Number(process.env.TIDB_PORT || 4000),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: getDatabaseName(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export default pool;
