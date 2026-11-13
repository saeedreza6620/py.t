import "server-only";
import { and, eq, gte, ne, sql } from "drizzle-orm";
import { db, ensureDb } from "@/db";
import { batches, loads, workshops } from "@/db/schema";

export async function publicStats() {
  await ensureDb();
  const since = Date.now() - 30 * 24 * 3600_000;
  const [w] = await db.select({ n: sql<number>`count(*)` }).from(workshops);
  const [k] = await db
    .select({ n: sql<number>`coalesce(sum(${loads.estKg}),0)` })
    .from(loads)
    .where(and(gte(loads.createdAt, since), ne(loads.status, "cancelled")));
  const [paid] = await db
    .select({ n: sql<number>`coalesce(sum(${loads.payableToman}),0)` })
    .from(loads)
    .where(eq(loads.status, "picked"));
  const [open] = await db
    .select({ n: sql<number>`count(*)` })
    .from(batches)
    .where(sql`${batches.status} in ('filling','ready')`);
  return { workshops: Number(w.n), kg30: Number(k.n), paid: Number(paid.n), openBatches: Number(open.n) };
}
