import "server-only";
import { desc, asc, eq } from "drizzle-orm";
import { db, ensureDb } from "@/db";
import { grades, priceSnapshots } from "@/db/schema";
import { getSettings, type Settings } from "./settings";

/* ------------------------------------------------------------------ *
 *  موتور قیمت صنعت‌هاب
 *  کاتد (تومان/کیلو):
 *    حالت «دلاری»: مس جهانی (دلار/تن) ÷ ۱۰۰۰ × دلار آزاد (تومان) × (۱ + پریمیوم)
 *    حالت «بورس»: آخرین قیمت کاتد مس بورس کالا (ورود دستی مدیر)
 *  قیمت عمده هر گرید = کاتد × ضریب گرید
 *  قیمت خرده‌بار مرجع (آنچه دلال وانتی معمولاً می‌دهد) = عمده × (۱ − فاصله خرده‌بار)
 *  پرداختی به کارگاه = وزن واقعی × (۱ − کسر روغن) × قیمت قفل‌شده
 * ------------------------------------------------------------------ */

export type Feed = { value: number; source: string; at: number };

function pick(obj: unknown, dotPath: string): unknown {
  return dotPath.split(".").filter(Boolean).reduce<unknown>((o, k) => {
    if (o && typeof o === "object") return (o as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

async function fetchJson(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

const toNumber = (v: unknown) => Number(String(v ?? "").replace(/[,٬\s]/g, ""));

/** دلار آزاد به تومان، از نوسان یا هر API دلخواه */
async function liveUsd(): Promise<Feed | null> {
  const unitDiv = (process.env.USD_UNIT || "toman") === "rial" ? 10 : 1;
  try {
    if (process.env.NAVASAN_API_KEY) {
      const item = process.env.NAVASAN_ITEM || "usd_sell";
      const j = await fetchJson(
        `https://api.navasan.tech/latest/?api_key=${encodeURIComponent(process.env.NAVASAN_API_KEY)}&item=${item}`,
      );
      const v = toNumber(pick(j, `${item}.value`)) / unitDiv;
      if (v > 1000) return { value: Math.round(v), source: "نوسان", at: Date.now() };
    }
    if (process.env.USD_URL && process.env.USD_JSON_PATH) {
      const j = await fetchJson(process.env.USD_URL);
      const v = toNumber(pick(j, process.env.USD_JSON_PATH)) / unitDiv;
      if (v > 1000) return { value: Math.round(v), source: process.env.USD_SOURCE_NAME || "API", at: Date.now() };
    }
  } catch (e) {
    console.warn("[prices] usd feed failed:", (e as Error).message);
  }
  return null;
}

/** قیمت جهانی مس به دلار/تن، اختیاری */
async function liveCopper(): Promise<Feed | null> {
  if (!process.env.COPPER_URL || !process.env.COPPER_JSON_PATH) return null;
  try {
    const j = await fetchJson(process.env.COPPER_URL);
    let v = toNumber(pick(j, process.env.COPPER_JSON_PATH));
    const unit = process.env.COPPER_UNIT || "ton";
    if (unit === "lb") v *= 2204.62;
    if (unit === "kg") v *= 1000;
    if (v > 1000) return { value: Math.round(v), source: process.env.COPPER_SOURCE_NAME || "API", at: Date.now() };
  } catch (e) {
    console.warn("[prices] copper feed failed:", (e as Error).message);
  }
  return null;
}

const TTL = 60_000;
let cache: { usd: Feed | null; copper: Feed | null; at: number } | null = null;

async function feeds() {
  if (cache && Date.now() - cache.at < TTL) return cache;
  const [usd, copper] = await Promise.all([liveUsd(), liveCopper()]);
  cache = { usd, copper, at: Date.now() };
  return cache;
}

export function cathodeFrom(s: Settings, usd: number, copperUsdPerTon: number) {
  if (s.priceMode === "ime") return Math.round(s.imeCathode);
  return Math.round((copperUsdPerTon / 1000) * usd * (1 + s.premiumPct / 100));
}

export function oilPct(s: Pick<Settings, "oilLight" | "oilWet">, level: "dry" | "light" | "wet") {
  return level === "wet" ? s.oilWet : level === "light" ? s.oilLight : 0;
}

export type GradePrice = {
  id: string;
  name: string;
  family: "brass" | "copper";
  coef: number;
  description: string;
  bulk: number;
  retail: number;
  gain: number;
};

export type PriceBoard = {
  ts: number;
  mode: "dollar" | "ime";
  usd: number;
  usdSource: string;
  usdLive: boolean;
  copperUsdPerTon: number;
  copperSource: string;
  cathode: number;
  oilLight: number;
  oilWet: number;
  commissionPct: number;
  grades: GradePrice[];
  history: { ts: number; usd: number; cathode: number }[];
};

let lastSnapshotAt = 0;

export async function getPriceBoard(): Promise<PriceBoard> {
  await ensureDb();
  const s = await getSettings();
  const f = await feeds();
  const usd = f.usd?.value ?? s.usdManual;
  const copper = f.copper?.value ?? s.copperUsdPerTon;
  const cathode = cathodeFrom(s, usd, copper);

  const gs = await db.select().from(grades).where(eq(grades.active, true)).orderBy(asc(grades.sort));
  const board: GradePrice[] = gs.map((g) => {
    const bulk = Math.round(cathode * g.coef);
    const gap = g.family === "brass" ? s.retailGapBrass : s.retailGapCopper;
    const retail = Math.round(bulk * (1 - gap / 100));
    return { id: g.id, name: g.name, family: g.family, coef: g.coef, description: g.description, bulk, retail, gain: bulk - retail };
  });

  const now = Date.now();
  if (now - lastSnapshotAt > 5 * 60_000) {
    lastSnapshotAt = now;
    const [last] = await db.select().from(priceSnapshots).orderBy(desc(priceSnapshots.ts)).limit(1);
    if (!last || last.usd !== usd || last.cathode !== cathode || now - last.ts > 3 * 3600_000) {
      await db.insert(priceSnapshots).values({ ts: now, usd, cathode, usdSource: f.usd ? f.usd.source : "دستی" });
    }
  }
  const hist = await db.select().from(priceSnapshots).orderBy(desc(priceSnapshots.ts)).limit(60);

  return {
    ts: now,
    mode: s.priceMode,
    usd,
    usdSource: f.usd ? f.usd.source : "ثبت مدیر",
    usdLive: !!f.usd,
    copperUsdPerTon: copper,
    copperSource: f.copper ? f.copper.source : "ثبت مدیر",
    cathode,
    oilLight: s.oilLight,
    oilWet: s.oilWet,
    commissionPct: s.commissionPct,
    grades: board,
    history: hist.reverse().map((h) => ({ ts: h.ts, usd: h.usd, cathode: h.cathode })),
  };
}

export function invalidatePriceCache() {
  cache = null;
  lastSnapshotAt = 0;
}
