import mysql from "mysql2/promise";

// Resolve target database name (avoid MySQL/TiDB reserved system schema 'sys')
export function getDatabaseName(): string {
  const raw = (process.env.TIDB_DATABASE || "uppiliees").trim();
  if (!raw || raw.toLowerCase() === "sys") {
    return "uppiliees";
  }
  return raw;
}

// Reuse the connection pool across hot reloads in development.
// Pool creation is lazy so no database code runs at module import or build time.
const globalForDb = globalThis as unknown as {
  pool?: mysql.Pool;
};

export function getPool(): mysql.Pool {
  if (!globalForDb.pool) {
    globalForDb.pool = mysql.createPool({
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
  }
  return globalForDb.pool;
}

export const pool: mysql.Pool = new Proxy({} as mysql.Pool, {
  get(_target, prop) {
    const instance = getPool();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export default pool;
