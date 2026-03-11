/**
 * Database Initialization Script
 * Run this to set up the Neon DB schema
 * 
 * Usage:
 *   npm run init-db
 *   or
 *   DATABASE_URL=postgresql://... npx tsx server/init-db.ts
 */

import "dotenv/config";
import { initializeDatabase, closePool } from "./db";

async function main() {
  try {
    console.log("🗄️  Starting database initialization...\n");
    await initializeDatabase();
    console.log("\n✅ Database initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Database initialization failed:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
