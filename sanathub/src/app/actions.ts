"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, ensureDb } from "@/db";
import { batches, buyers, grades, users, workshops, zones } from "@/db/schema";
import {
  adminPhones, clearSession, currentUser, getSession, homeFor, requireRole, sendOtp, setSession, verifyOtp,
} from "@/lib/auth";
import { announceLoad, buyBatch, cancelLoad, evaluateBatch, recordPickup, UserError } from "@/lib/batching";
import { normalizePhone, parseNum } from "@/lib/format";
import { saveSettings } from "@/lib/settings";
import { invalidatePriceCache } from "@/lib/prices";

export type FormState = { error?: string; ok?: string; step?: "phone" | "code"; phone?: string; devCode?: string };

const oil = (v: FormDataEntryValue | null) => (v === "wet" || v === "light" ? v : "dry") as "dry" | "light" | "wet";

function fail(e: unknown): FormState {
  if (e instanceof UserError) return { error: e.message };
  if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
  console.error(e);
  return { error: "خطای غیرمنتظره؛ دوباره امتحان کنید." };
}

/* ---------------- ورود ---------------- */

export async function requestOtpAction(_: FormState, fd: FormData): Promise<FormState> {
  const phone = normalizePhone(String(fd.get("phone") || ""));
  if (!phone) return { step: "phone", error: "شماره موبایل را درست وارد کنید (مثل ۰۹۱۲۳۴۵۶۷۸۹)." };
  const r = await sendOtp(phone);
  if (!r.ok) return { step: "phone", phone, error: r.error };
  return { step: "code", phone, devCode: r.devCode };
}

export async function verifyOtpAction(prev: FormState, fd: FormData): Promise<FormState> {
  const phone = normalizePhone(String(fd.get("phone") || ""));
  const code = String(parseNum(String(fd.get("code") || "")) || "");
  if (!phone) return { step: "phone", error: "شماره نامعتبر است." };
  if (!(await verifyOtp(phone, code))) return { ...prev, step: "code", phone, error: "کد اشتباه یا منقضی است." };
  await ensureDb();
  let [u] = await db.select().from(users).where(eq(users.phone, phone));
  if (!u && adminPhones().includes(phone)) {
    [u] = await db.insert(users).values({ phone, role: "admin", name: "مدیر", createdAt: Date.now() }).returning();
  }
  if (u) {
    await setSession({ phone, uid: u.id });
    redirect(homeFor(u.role));
  }
  await setSession({ phone });
  redirect(fd.get("as") === "buyer" ? "/onboarding?as=buyer" : "/onboarding");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

/* ---------------- عضویت ---------------- */

export async function onboardAction(_: FormState, fd: FormData): Promise<FormState> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.uid) redirect("/");
  await ensureDb();
  const role = fd.get("role") === "buyer" ? "buyer" : "workshop";
  const name = String(fd.get("name") || "").trim();
  const lat = parseNum(fd.get("lat") as string);
  const lng = parseNum(fd.get("lng") as string);
  if (name.length < 2) return { error: "نام و نام خانوادگی را وارد کنید." };
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 24 || lat > 40 || lng < 44 || lng > 64) {
    return { error: "موقعیت روی نقشه معتبر نیست؛ دکمه «موقعیت فعلی من» را بزنید یا منطقه را انتخاب کنید." };
  }
  try {
    if (role === "workshop") {
      const title = String(fd.get("title") || "").trim();
      const zoneId = Number(fd.get("zoneId"));
      const sheba = String(fd.get("sheba") || "").replace(/\s|-/g, "").toUpperCase();
      if (title.length < 2) return { error: "نام کارگاه را وارد کنید." };
      const [z] = await db.select().from(zones).where(eq(zones.id, zoneId));
      if (!z) return { error: "منطقه را انتخاب کنید." };
      if (sheba && !/^IR\d{24}$/.test(sheba)) return { error: "شماره شبا باید با IR شروع شود و ۲۶ کاراکتر باشد." };
      const [u] = await db.insert(users).values({ phone: s.phone, role: "workshop", name, createdAt: Date.now() }).returning();
      await db.insert(workshops).values({
        userId: u.id, title, zoneId, address: String(fd.get("address") || "").slice(0, 200), lat, lng, sheba, createdAt: Date.now(),
      });
      await setSession({ phone: s.phone, uid: u.id });
    } else {
      const company = String(fd.get("company") || "").trim();
      if (company.length < 2) return { error: "نام شرکت / ریخته‌گری را وارد کنید." };
      const [u] = await db
        .insert(users)
        .values({ phone: s.phone, role: "buyer", name, status: "pending", createdAt: Date.now() })
        .returning();
      await db.insert(buyers).values({ userId: u.id, company, lat, lng, hasSpectrometer: fd.get("spectro") === "on", createdAt: Date.now() });
      await setSession({ phone: s.phone, uid: u.id });
    }
  } catch (e) {
    return fail(e);
  }
  redirect(role === "workshop" ? "/workshop" : "/buyer");
}

/* ---------------- تراشکار ---------------- */

export async function announceLoadAction(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireRole("workshop");
  if (!me.workshop) redirect("/onboarding");
  try {
    await announceLoad(me.workshop, {
      gradeId: String(fd.get("gradeId") || ""),
      estKg: parseNum(fd.get("estKg") as string),
      oilLevel: oil(fd.get("oilLevel")),
      note: String(fd.get("note") || ""),
    });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/workshop");
  return { ok: "بار شما ثبت شد و به صف تجمیع منطقه اضافه شد." };
}

export async function cancelLoadAction(fd: FormData) {
  const me = await requireRole("workshop");
  if (!me.workshop) return;
  try {
    await cancelLoad(me.workshop, Number(fd.get("loadId")));
  } catch (e) {
    console.warn((e as Error).message);
  }
  revalidatePath("/workshop");
}

/* ---------------- خریدار ---------------- */

export async function buyBatchAction(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireRole("buyer");
  if (!me.buyer || me.user.status !== "active") return { error: "حساب خریدار شما هنوز توسط صنعت‌هاب تأیید نشده است." };
  const id = Number(fd.get("batchId"));
  try {
    await buyBatch(me.buyer, id);
  } catch (e) {
    return fail(e);
  }
  redirect(`/buyer/batch/${id}`);
}

export async function pickupAction(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireRole("buyer");
  if (!me.buyer) return { error: "حساب خریدار یافت نشد." };
  const batchId = Number(fd.get("batchId"));
  try {
    await recordPickup(me.buyer, Number(fd.get("loadId")), {
      actualKg: parseNum(fd.get("actualKg") as string),
      actualOil: oil(fd.get("actualOil")),
      discrepancy: (fd.get("discrepancy") as string) || null,
      reject: fd.get("reject") === "1",
    });
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/buyer/batch/${batchId}`);
  return { ok: "ثبت شد." };
}

/* ---------------- مدیر ---------------- */

async function admin() {
  return requireRole("admin");
}

export async function saveSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  await admin();
  const keys = [
    "priceMode", "usdManual", "copperUsdPerTon", "premiumPct", "imeCathode", "retailGapBrass", "retailGapCopper",
    "oilLight", "oilWet", "minWorkshops", "targetKg", "commissionPct", "penaltyToman",
  ] as const;
  const patch: Record<string, string> = {};
  for (const k of keys) {
    const v = fd.get(k);
    if (v == null) continue;
    if (k === "priceMode") patch[k] = v === "ime" ? "ime" : "dollar";
    else {
      const n = parseNum(v as string);
      if (!Number.isFinite(n) || n < 0) return { error: `مقدار «${k}» معتبر نیست.` };
      patch[k] = String(n);
    }
  }
  await saveSettings(patch);
  invalidatePriceCache();
  revalidatePath("/", "layout");
  return { ok: "تنظیمات ذخیره شد و قیمت‌ها بازمحاسبه شدند." };
}

export async function saveGradeAction(fd: FormData) {
  await admin();
  const id = String(fd.get("id"));
  const coef = parseNum(fd.get("coef") as string);
  if (!Number.isFinite(coef) || coef <= 0 || coef > 1.2) return;
  await db
    .update(grades)
    .set({ coef, name: String(fd.get("name") || "").trim() || undefined, active: fd.get("active") === "on" })
    .where(eq(grades.id, id));
  invalidatePriceCache();
  revalidatePath("/", "layout");
}

export async function setUserStatusAction(fd: FormData) {
  await admin();
  const status = String(fd.get("status"));
  if (!["active", "pending", "blocked"].includes(status)) return;
  await db.update(users).set({ status: status as "active" | "pending" | "blocked" }).where(eq(users.id, Number(fd.get("userId"))));
  revalidatePath("/admin");
}

export async function batchAdminAction(fd: FormData) {
  await admin();
  const id = Number(fd.get("batchId"));
  const op = String(fd.get("op"));
  const [b] = await db.select().from(batches).where(eq(batches.id, id));
  if (!b) return;
  if (op === "ready" && b.status === "filling") {
    await db.update(batches).set({ status: "ready", readyAt: Date.now() }).where(eq(batches.id, id));
  } else if (op === "cancel" && (b.status === "filling" || b.status === "ready")) {
    await db.update(batches).set({ status: "cancelled" }).where(eq(batches.id, id));
  } else if (op === "reopen" && b.status === "ready") {
    await db.update(batches).set({ status: "filling", readyAt: null }).where(eq(batches.id, id));
    await evaluateBatch(id);
  }
  revalidatePath("/admin");
}

export async function whoAmI() {
  return currentUser();
}
