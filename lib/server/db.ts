import { Pool } from "pg";

let pool: Pool | undefined;

// Only the server imports this module. DATABASE_URL must never be a public env variable.
export function getDatabasePool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
  });
  return pool;
}
