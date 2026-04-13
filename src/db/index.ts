import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL não definido. Configure no arquivo .env");
}

const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

export const db = drizzle(pool, { schema });
