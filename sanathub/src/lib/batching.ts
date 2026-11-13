import "server-only";
import { and, eq, inArray, ne, sql, desc } from "drizzle-orm";
import { db, ensureDb } from "@/db";
import { batches, buyers, grades, loads, workshops, zones, type Buyer, type Workshop } from "@/db/schema";
import { getSettings } from "./settings";
import { getPriceBoard, oilPct } from "./prices";
import { DISCREPANCY } from "./format";

export class UserError extends Error {}

/** وضعیت زنده یک بار تجمیعی */
export async function batchProgress(batchId: number) {
  const rows = await db
    .select({ workshopId: loads.workshopId, estKg: loads.estKg })
    .from(loads)
    .where(and(eq(loads.batchId, batchId), ne(loads.status, "cancelled")));
  const ws = new Set(rows.map((r) => r.workshopId));
  return { workshops: ws.size, kg: rows.reduce((a, r) => a + r.estKg, 0), loads: rows.length };
}

async function fillingBatch(zoneId: number, gradeId: string) {
  const [open] = await db
    .select()
    .from(batches)
    .where(and(eq(batches.zoneId, zoneId), eq(batches.gradeId, gradeId), eq(batches.status, "filling")))
    .limit(1);
  if (open) return open;
  const s = await getSettings();
  const [created] = await db
    .insert(batches)
    .values({ zoneId, gradeId, status: "filling", minWorkshops: s.minWorkshops, targetKg: s.targetKg, createdAt: Date.now() })
    .returning();
  return created;
}

/** بعد از هر تغییر: اگر به حد نصاب رسید «آماده فروش»، اگر افت کرد برمی‌گردد به «در حال تجمیع» */
export async function evaluateBatch(batchId: number) {
  const [b] = await db.select().from(batches).where(eq(batches.id, batchId));
  if (!b) return;
  const p = await batchProgress(batchId);
  const full = p.workshops >= b.minWorkshops || p.kg >= b.targetKg;
  if (b.status === "filling" && full) {
    await db.update(batches).set({ status: "ready", readyAt: Date.now() }).where(and(eq(batches.id, batchId), eq(batches.status, "filling")));
  } else if (b.status === "ready" && !full) {
    await db.update(batches).set({ status: "filling", readyAt: null }).where(and(eq(batches.id, batchId), eq(batches.status, "ready")));
  } else if (p.loads === 0 && (b.status === "filling" || b.status === "ready")) {
    await db.update(batches).set({ status: "cancelled" }).where(eq(batches.id, batchId));
  }
}

export async function announceLoad(w: Workshop, input: { gradeId: string; estKg: number; oilLevel: "dry" | "light" | "wet"; note: string }) {
  await ensureDb();
  if (!Number.isFinite(input.estKg) || input.estKg < 20 || input.estKg > 20000) {
    throw new UserError("وزن تخمینی باید بین ۲۰ تا ۲۰٬۰۰۰ کیلو باشد.");
  }
  const [g] = await db.select().from(grades).where(and(eq(grades.id, input.gradeId), eq(grades.active, true)));
  if (!g) throw new UserError("گرید انتخاب‌شده معتبر نیست.");
  if (w.strikes >= 3) throw new UserError("حساب شما به‌دلیل تکرار مغایرت محدود شده است. با پشتیبانی تماس بگیرید.");

  const b = await fillingBatch(w.zoneId, g.id);
  const [dupe] = await db
    .select({ id: loads.id })
    .from(loads)
    .innerJoin(batches, eq(loads.batchId, batches.id))
    .where(and(eq(loads.workshopId, w.id), eq(loads.gradeId, g.id), eq(loads.status, "waiting"), inArray(batches.status, ["filling", "ready"])));
  if (dupe) throw new UserError("برای این گرید یک بار در صف دارید؛ اول آن را لغو یا تحویل کنید.");

  const [l] = await db
    .insert(loads)
    .values({ workshopId: w.id, batchId: b.id, gradeId: g.id, estKg: Math.round(input.estKg), oilLevel: input.oilLevel, note: input.note.slice(0, 300), createdAt: Date.now() })
    .returning();
  await evaluateBatch(b.id);
  return l;
}

export async function cancelLoad(w: Workshop, loadId: number) {
  await ensureDb();
  const [row] = await db
    .select({ l: loads, b: batches })
    .from(loads)
    .innerJoin(batches, eq(loads.batchId, batches.id))
    .where(and(eq(loads.id, loadId), eq(loads.workshopId, w.id)));
  if (!row) throw new UserError("بار پیدا نشد.");
  if (row.l.status !== "waiting" || !["filling", "ready"].includes(row.b.status)) {
    throw new UserError("این بار فروخته شده و دیگر قابل لغو نیست.");
  }
  await db.update(loads).set({ status: "cancelled" }).where(eq(loads.id, loadId));
  await evaluateBatch(row.b.id);
}

/** خرید یک مگا-بار آماده توسط خریدار: قیمت همان لحظه قفل می‌شود */
export async function buyBatch(buyer: Buyer, batchId: number) {
  await ensureDb();
  const [b] = await db.select().from(batches).where(eq(batches.id, batchId));
  if (!b || b.status !== "ready") throw new UserError("این بار دیگر برای فروش در دسترس نیست.");
  const board = await getPriceBoard();
  const gp = board.grades.find((g) => g.id === b.gradeId);
  if (!gp) throw new UserError("قیمت این گرید در دسترس نیست.");
  const res = await db
    .update(batches)
    .set({
      status: "sold",
      buyerId: buyer.id,
      lockedPricePerKg: gp.bulk,
      lockedUsd: board.usd,
      lockedCathode: board.cathode,
      commissionPct: board.commissionPct,
      soldAt: Date.now(),
    })
    .where(and(eq(batches.id, batchId), eq(batches.status, "ready")))
    .returning({ id: batches.id });
  if (res.length === 0) throw new UserError("خریدار دیگری زودتر این بار را برداشت.");
}

/** ثبت توزین در محل */
export async function recordPickup(
  buyer: Buyer,
  loadId: number,
  input: { actualKg: number; actualOil: "dry" | "light" | "wet"; discrepancy: string | null; reject: boolean },
) {
  await ensureDb();
  const [row] = await db
    .select({ l: loads, b: batches, w: workshops })
    .from(loads)
    .innerJoin(batches, eq(loads.batchId, batches.id))
    .innerJoin(workshops, eq(loads.workshopId, workshops.id))
    .where(eq(loads.id, loadId));
  if (!row || row.b.buyerId !== buyer.id) throw new UserError("این توقف متعلق به شما نیست.");
  if (row.b.status !== "sold") throw new UserError("این بار در وضعیت جمع‌آوری نیست.");
  if (row.l.status !== "waiting") throw new UserError("این توقف قبلاً ثبت شده است.");
  const s = await getSettings();
  const d = input.discrepancy && DISCREPANCY[input.discrepancy] ? input.discrepancy : null;

  if (input.reject) {
    await db.update(loads).set({ status: "rejected", discrepancy: d ?? "absent", actualKg: 0, payableToman: 0, pickedAt: Date.now() }).where(eq(loads.id, loadId));
    if (d && DISCREPANCY[d].strike) {
      await db
        .update(workshops)
        .set({ strikes: sql`${workshops.strikes} + 1`, penaltyToman: sql`${workshops.penaltyToman} + ${s.penaltyToman}` })
        .where(eq(workshops.id, row.w.id));
    }
  } else {
    if (!Number.isFinite(input.actualKg) || input.actualKg <= 0 || input.actualKg > 30000) throw new UserError("وزن باسکول معتبر نیست.");
    const net = input.actualKg * (1 - oilPct(s, input.actualOil) / 100);
    const payable = Math.round(net * (row.b.lockedPricePerKg ?? 0));
    await db
      .update(loads)
      .set({ status: "picked", actualKg: input.actualKg, actualOil: input.actualOil, discrepancy: d, payableToman: payable, pickedAt: Date.now() })
      .where(eq(loads.id, loadId));
  }
  const left = await db
    .select({ n: sql<number>`count(*)` })
    .from(loads)
    .where(and(eq(loads.batchId, row.b.id), eq(loads.status, "waiting")));
  if (!left[0]?.n) await db.update(batches).set({ status: "settled", settledAt: Date.now() }).where(eq(batches.id, row.b.id));
}

/** فهرست بارهای تجمیعی با جزئیات برای بازار خریدار و پنل مدیر */
export async function listBatches(statuses: ("filling" | "ready" | "sold" | "settled" | "cancelled")[], buyerId?: number) {
  await ensureDb();
  const where = buyerId
    ? and(inArray(batches.status, statuses), eq(batches.buyerId, buyerId))
    : inArray(batches.status, statuses);
  const rows = await db
    .select({ b: batches, z: zones, g: grades, buyer: buyers })
    .from(batches)
    .innerJoin(zones, eq(batches.zoneId, zones.id))
    .innerJoin(grades, eq(batches.gradeId, grades.id))
    .leftJoin(buyers, eq(batches.buyerId, buyers.id))
    .where(where)
    .orderBy(desc(batches.createdAt));
  const out = [];
  for (const r of rows) out.push({ ...r, progress: await batchProgress(r.b.id) });
  return out;
}
