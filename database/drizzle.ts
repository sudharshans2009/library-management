import config from "@/lib/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// Configure Neon with better connection settings
const sql = neon(config.env.databaseUrl, {
  connectionTimeoutMillis: 20000, // 20 seconds timeout
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  maxConnectionPoolSize: 10, // Maximum connections
});

export const db = drizzle({ client: sql, casing: "snake_case" });
