import { sql } from "drizzle-orm";
import { grades, settings, zones } from "./schema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "./schema";

/**
 * مقادیر پیش‌فرض قابل‌ویرایش از پنل مدیر.
 * کالیبراسیون اولیه (۲۱ و ۱۷ آبان ۱۴۰۵):
 *  - کاتد مس بورس کالا ≈ ۳٬۰۱۳٬۰۰۰ تومان/کیلو ≈ ۱۱٬۳۷۸ دلار/تن با دلار آزاد → دلار ≈ ۲۶۵٬۰۰۰ تومان
 *  - ضرایب گرید = میانگین قیمت «عمده‌بار» ایران‌ضایعات ÷ قیمت کاتد
 *  - فاصله خرده‌بار تا عمده‌بار: برنج ≈ ۱۹٪، مس ≈ ۶٪
 */
export const DEFAULT_SETTINGS: Record<string, string> = {
  priceMode: "dollar", // dollar: مس جهانی × دلار آزاد | ime: قیمت کاتد بورس کالا
  usdManual: "265000",
  copperUsdPerTon: "11300",
  premiumPct: "0",
  imeCathode: "3013000",
  retailGapBrass: "19",
  retailGapCopper: "6",
  oilLight: "3",
  oilWet: "8",
  minWorkshops: "10",
  targetKg: "3000",
  commissionPct: "2",
  penaltyToman: "500000",
};

export const DEFAULT_GRADES = [
  { id: "brass-chip", name: "براده / سفاله برنج زرد", family: "brass", coef: 0.58, sort: 1,
    description: "براده تراشکاری برنج زردبار؛ رایج‌ترین بار کارگاه‌های تراش و CNC" },
  { id: "brass-solid", name: "دم‌قیچی و قطعه برنج زرد", family: "brass", coef: 0.65, sort: 2,
    description: "سرشاخه، دم‌قیچی و قطعات معیوب برنج زردبار" },
  { id: "brass-white", name: "برنج سفیدبار", family: "brass", coef: 0.5, sort: 3,
    description: "آلیاژ با مس کمتر؛ ضریب را با خریدار کالیبره کنید" },
  { id: "copper-chip", name: "براده مس", family: "copper", coef: 0.84, sort: 4,
    description: "براده تراشکاری مس خالص" },
  { id: "copper-melt", name: "مس ذوبی", family: "copper", coef: 0.89, sort: 5,
    description: "قطعات و لوله مسی برای ذوب" },
  { id: "copper-cable", name: "مس کابلی قرمز", family: "copper", coef: 0.95, sort: 6,
    description: "مفتول لخت و براق" },
] as const;

export const DEFAULT_ZONES = [
  { name: "شهرک صنعتی شمس‌آباد", lat: 35.372, lng: 51.236 },
  { name: "شهرک صنعتی خاوران", lat: 35.468, lng: 51.701 },
  { name: "شادآباد", lat: 35.659, lng: 51.299 },
];

export async function seedDefaults(db: LibSQLDatabase<typeof schema>) {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.insert(settings).values({ key, value }).onConflictDoNothing();
  }
  const g = await db.select({ n: sql<number>`count(*)` }).from(grades);
  if (!g[0]?.n) await db.insert(grades).values(DEFAULT_GRADES.map((x) => ({ ...x })));
  const z = await db.select({ n: sql<number>`count(*)` }).from(zones);
  if (!z[0]?.n) await db.insert(zones).values(DEFAULT_ZONES);
}
