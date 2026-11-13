import "server-only";
import { db, ensureDb } from "@/db";
import { settings } from "@/db/schema";
import { DEFAULT_SETTINGS } from "@/db/seed-defaults";

export type Settings = {
  priceMode: "dollar" | "ime";
  usdManual: number;
  copperUsdPerTon: number;
  premiumPct: number;
  imeCathode: number;
  retailGapBrass: number;
  retailGapCopper: number;
  oilLight: number;
  oilWet: number;
  minWorkshops: number;
  targetKg: number;
  commissionPct: number;
  penaltyToman: number;
};

export async function getSettings(): Promise<Settings> {
  await ensureDb();
  const rows = await db.select().from(settings);
  const m: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) m[r.key] = r.value;
  const n = (k: string) => Number(m[k]) || 0;
  return {
    priceMode: m.priceMode === "ime" ? "ime" : "dollar",
    usdManual: n("usdManual"),
    copperUsdPerTon: n("copperUsdPerTon"),
    premiumPct: n("premiumPct"),
    imeCathode: n("imeCathode"),
    retailGapBrass: n("retailGapBrass"),
    retailGapCopper: n("retailGapCopper"),
    oilLight: n("oilLight"),
    oilWet: n("oilWet"),
    minWorkshops: Math.max(1, Math.round(n("minWorkshops"))),
    targetKg: Math.max(1, Math.round(n("targetKg"))),
    commissionPct: n("commissionPct"),
    penaltyToman: n("penaltyToman"),
  };
}

export async function saveSettings(patch: Partial<Record<keyof Settings, string>>) {
  await ensureDb();
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || !(key in DEFAULT_SETTINGS)) continue;
    await db
      .insert(settings)
      .values({ key, value: String(value) })
      .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } });
  }
}
