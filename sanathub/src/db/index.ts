import "server-only";
import path from "node:path";
import fs from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";
import { seedDefaults } from "./seed-defaults";

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const dir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return "file:" + path.join(dir, "sanathub.db");
}

const client = createClient({
  url: databaseUrl(),
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;

let ready: Promise<void> | null = null;

/** هر درخواست سمت سرور قبل از کار با دیتابیس این را صدا می‌زند: مهاجرت + داده‌های پایه، فقط یک بار */
export function ensureDb() {
  if (!ready) {
    ready = (async () => {
      await client.execute("PRAGMA foreign_keys = ON");
      await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
      await seedDefaults(db);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}
