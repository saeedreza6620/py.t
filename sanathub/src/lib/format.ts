const nf = new Intl.NumberFormat("fa-IR");

export const fa = (n: number | null | undefined) => (n == null || Number.isNaN(n) ? "—" : nf.format(Math.round(n)));

export const toman = (n: number | null | undefined) => `${fa(n)} تومان`;

/** مبالغ بزرگ: ۲٫۴ میلیارد / ۳۷۰ میلیون */
export function tomanShort(n: number) {
  if (Math.abs(n) >= 1e9) return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(n / 1e9)} میلیارد`;
  if (Math.abs(n) >= 1e6) return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(n / 1e6)} میلیون`;
  return fa(n);
}

export const kg = (n: number | null | undefined) => `${fa(n)} کیلو`;

export function faDate(ts: number | null | undefined) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ts));
}

export function faTime(ts: number) {
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(ts));
}

/** ورودی کاربر با ارقام فارسی/عربی → عدد */
export function parseNum(v: FormDataEntryValue | string | null | undefined) {
  const s = String(v ?? "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,٬\s]/g, "");
  return Number(s);
}

export function normalizePhone(v: string) {
  const d = String(parseNum(v.replace(/^\+98/, "0")) || "");
  const p = d.startsWith("98") ? "0" + d.slice(2) : d.startsWith("9") ? "0" + d : d;
  return /^09\d{9}$/.test(p) ? p : null;
}

export const OIL_LABEL = { dry: "خشک", light: "کمی روغنی", wet: "خیس / روغنی" } as const;

export const STATUS_LABEL: Record<string, string> = {
  filling: "در حال تجمیع",
  ready: "آماده فروش",
  sold: "فروخته شد · در مسیر جمع‌آوری",
  settled: "تسویه شد",
  cancelled: "لغو شد",
  waiting: "در انتظار جمع‌آوری",
  picked: "تحویل شد",
  rejected: "رد شد",
};

export const DISCREPANCY: Record<string, { label: string; strike: boolean }> = {
  grade: { label: "گرید با اظهار نمی‌خواند", strike: true },
  iron: { label: "آهن‌آلات قاطی بار (تست آهنربا)", strike: true },
  oil: { label: "روغن/آب بیش از اظهار", strike: false },
  short: { label: "وزن خیلی کمتر از اظهار", strike: false },
  absent: { label: "بار آماده نبود / کارگاه بسته", strike: false },
};
