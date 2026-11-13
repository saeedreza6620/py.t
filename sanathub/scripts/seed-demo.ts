/**
 * داده نمایشی پایلوت: ۱۰ تراشکار در شمس‌آباد، ۱ خریدار تأییدشده، و بارهای اعلام‌شده.
 * اجرا: npm run seed:demo
 */
import { eq } from "drizzle-orm";
import { db, ensureDb } from "../src/db";
import { buyers, users, workshops, zones } from "../src/db/schema";
import { announceLoad } from "../src/lib/batching";

const names = [
  ["تراشکاری دقیق‌کار", "حسن رضایی"], ["CNC پارس", "مهدی کریمی"], ["تراش صنعت البرز", "علی محمدی"],
  ["قطعه‌سازی نوین", "رضا احمدی"], ["تراشکاری برادران حیدری", "محمد حیدری"], ["شیرآلات کاوه", "کاوه نوری"],
  ["تراش سپهر", "سعید جعفری"], ["ماشین‌کاری آریا", "امیر قاسمی"], ["تراشکاری امید", "امید صادقی"],
  ["CNC فولاد آذین", "حمید موسوی"], ["تراش برنج ایران", "یوسف رحیمی"],
] as const;

async function main() {
  await ensureDb();
  const [z] = await db.select().from(zones).where(eq(zones.name, "شهرک صنعتی شمس‌آباد"));
  if (!z) throw new Error("zone missing");
  let i = 0;
  for (const [title, name] of names) {
    i++;
    const phone = "0912000" + String(1000 + i).slice(-4);
    const exists = await db.select().from(users).where(eq(users.phone, phone));
    if (exists.length) continue;
    const [u] = await db.insert(users).values({ phone, role: "workshop", name, createdAt: Date.now() }).returning();
    const ang = (i / names.length) * Math.PI * 2;
    const r = 0.006 + (i % 3) * 0.004;
    const [w] = await db.insert(workshops).values({
      userId: u.id, title, zoneId: z.id, address: `بلوار نارنجستان، گلبرگ ${i}، پلاک ${i * 3}`,
      lat: z.lat + Math.sin(ang) * r, lng: z.lng + Math.cos(ang) * r * 1.2,
      sheba: "IR" + ("62018" + String(1000000000000000000 + i * 7919)).slice(0, 24), createdAt: Date.now(),
    }).returning();
    // ۹ کارگاه براده برنج اعلام می‌کنند تا مگا-بار یکی مانده به حد نصاب باشد؛ آخری مس ذوبی
    if (i <= 9) await announceLoad(w, { gradeId: "brass-chip", estKg: 120 + ((i * 37) % 150), oilLevel: i % 3 === 0 ? "wet" : i % 2 ? "light" : "dry", note: i === 2 ? "گونی‌ها پشت سوله است" : "" });
    else if (i === 11) await announceLoad(w, { gradeId: "copper-melt", estKg: 220, oilLevel: "dry", note: "" });
  }
  const bphone = "09121110000";
  if (!(await db.select().from(users).where(eq(users.phone, bphone))).length) {
    const [u] = await db.insert(users).values({ phone: bphone, role: "buyer", name: "مدیر خرید", createdAt: Date.now() }).returning();
    await db.insert(buyers).values({ userId: u.id, company: "ریخته‌گری آلیاژ مس شمس", lat: z.lat - 0.012, lng: z.lng + 0.01, hasSpectrometer: true, createdAt: Date.now() });
  }
  console.log("demo data ready. workshop phones: 09120001001..09120001011 · buyer: 09121110000");
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
