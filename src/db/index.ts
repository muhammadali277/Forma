import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

/**
 * Hosted Postgres (Supabase, Neon, ...) needs SSL; a database on this machine usually doesn't.
 * SSL settings written into the URL (e.g. ?sslmode=require) would override the `ssl` option below and
 * make node-postgres reject Supabase's certificate, so they are removed and SSL is configured here.
 */
function poolConfig(raw: string): PoolConfig {
  const base: PoolConfig = { max: 5, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 10_000 };
  try {
    const url = new URL(raw);
    const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
    for (const key of ["sslmode", "ssl", "uselibpqcompat"]) url.searchParams.delete(key);
    return { ...base, connectionString: url.toString(), ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }) };
  } catch {
    return { ...base, connectionString: raw };
  }
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool = globalForDb.__arenaNextJsPostgresqlPool ?? new Pool(poolConfig(databaseUrl));

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
