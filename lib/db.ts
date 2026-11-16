import mysql from "mysql2/promise";

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export function getDatabaseName(): string {
  const raw = (process.env.TIDB_DATABASE || "").trim();
  if (!raw || raw.toLowerCase() === "sys") {
    throw new Error(
      "Missing or invalid TIDB_DATABASE environment variable (cannot be empty or 'sys')."
    );
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
    const host = (process.env.TIDB_HOST || "").trim();
    const portRaw = (process.env.TIDB_PORT || "").trim();
    const user = (process.env.TIDB_USER || "").trim();
    const password = process.env.TIDB_PASSWORD || "";
    const database = getDatabaseName();

    const missing: string[] = [];
    if (!host) missing.push("TIDB_HOST");
    if (!portRaw) missing.push("TIDB_PORT");
    if (!user) missing.push("TIDB_USER");
    if (!password) missing.push("TIDB_PASSWORD");
    if (!database) missing.push("TIDB_DATABASE");

    if (missing.length > 0) {
      throw new Error(
        `Missing required TiDB environment variable(s): ${missing.join(", ")}`
      );
    }

    if (LOCALHOST_HOSTS.has(host.toLowerCase())) {
      throw new Error(
        `Invalid TIDB_HOST "${host}": TiDB Cloud host is required (localhost fallback is disabled).`
      );
    }

    const port = Number(portRaw);
    if (!Number.isInteger(port) || port <= 0) {
      throw new Error(`Invalid TIDB_PORT "${portRaw}": must be a valid port number.`);
    }

    globalForDb.pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
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
