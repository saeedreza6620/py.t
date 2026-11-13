import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db, ensureDb } from "@/db";
import { buyers, otps, users, workshops } from "@/db/schema";

const COOKIE = "sh_session";
const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-secret-change-me-in-production!!");

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  console.warn("[auth] SESSION_SECRET is not set — set it in the hosting panel.");
}

const hash = (s: string) => crypto.createHash("sha256").update(s + String(secret.length) + (process.env.SESSION_SECRET || "")).digest("hex");

export const adminPhones = () =>
  (process.env.ADMIN_PHONES || "").split(/[,\s]+/).map((p) => p.trim()).filter(Boolean);

/** آیا کد را در صفحه نشان بدهیم؟ فقط وقتی پیامک تنظیم نشده و اجازه داده شده */
export const otpDevMode = () =>
  !(process.env.KAVENEGAR_API_KEY && process.env.KAVENEGAR_TEMPLATE) &&
  (process.env.NODE_ENV !== "production" || process.env.OTP_DEV_SHOW === "1");

export async function sendOtp(phone: string): Promise<{ ok: boolean; devCode?: string; error?: string }> {
  await ensureDb();
  const [prev] = await db.select().from(otps).where(eq(otps.phone, phone));
  if (prev && prev.expiresAt - 4 * 60_000 > Date.now()) {
    return { ok: false, error: "یک دقیقه صبر کنید و دوباره درخواست کنید." };
  }
  const code = String(crypto.randomInt(10000, 99999));
  const row = { phone, codeHash: hash(phone + code), expiresAt: Date.now() + 5 * 60_000, attempts: 0 };
  await db.insert(otps).values(row).onConflictDoUpdate({ target: otps.phone, set: row });

  if (process.env.KAVENEGAR_API_KEY && process.env.KAVENEGAR_TEMPLATE) {
    try {
      const u = `https://api.kavenegar.com/v1/${process.env.KAVENEGAR_API_KEY}/verify/lookup.json?receptor=${phone}&token=${code}&template=${encodeURIComponent(process.env.KAVENEGAR_TEMPLATE)}`;
      const r = await fetch(u, { cache: "no-store" });
      if (!r.ok) throw new Error("kavenegar " + r.status);
      return { ok: true };
    } catch (e) {
      console.error("[otp]", (e as Error).message);
      return { ok: false, error: "ارسال پیامک ناموفق بود. چند دقیقه بعد دوباره امتحان کنید." };
    }
  }
  if (otpDevMode()) return { ok: true, devCode: code };
  return { ok: false, error: "سرویس پیامک تنظیم نشده است (KAVENEGAR_API_KEY)." };
}

export async function verifyOtp(phone: string, code: string) {
  await ensureDb();
  const [row] = await db.select().from(otps).where(eq(otps.phone, phone));
  if (!row || row.expiresAt < Date.now()) return false;
  if (row.attempts >= 5) return false;
  if (row.codeHash !== hash(phone + code)) {
    await db.update(otps).set({ attempts: row.attempts + 1 }).where(eq(otps.phone, phone));
    return false;
  }
  await db.delete(otps).where(eq(otps.phone, phone));
  return true;
}

type Session = { phone: string; uid?: number };

export async function setSession(s: Session) {
  const token = await new SignJWT(s).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIE !== "1",
    path: "/",
    maxAge: 30 * 24 * 3600,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret);
    return { phone: String(payload.phone), uid: payload.uid ? Number(payload.uid) : undefined };
  } catch {
    return null;
  }
}

export async function currentUser() {
  const s = await getSession();
  if (!s?.uid) return null;
  await ensureDb();
  const [u] = await db.select().from(users).where(eq(users.id, s.uid));
  if (!u || u.status === "blocked") return null;
  if (u.role === "workshop") {
    const [w] = await db.select().from(workshops).where(eq(workshops.userId, u.id));
    return { user: u, workshop: w ?? null, buyer: null };
  }
  if (u.role === "buyer") {
    const [b] = await db.select().from(buyers).where(eq(buyers.userId, u.id));
    return { user: u, workshop: null, buyer: b ?? null };
  }
  return { user: u, workshop: null, buyer: null };
}

export async function requireRole(role: "workshop" | "buyer" | "admin") {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.user.role !== role) redirect(homeFor(me.user.role));
  return me;
}

export function homeFor(role: string) {
  return role === "workshop" ? "/workshop" : role === "buyer" ? "/buyer" : "/admin";
}
