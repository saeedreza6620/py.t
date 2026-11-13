"use client";

import { useActionState, useState } from "react";
import { saveSettingsAction, type FormState } from "@/app/actions";
import type { Settings } from "@/lib/settings";
import { fa, parseNum } from "@/lib/format";

const F = ({ name, label, value, hint, suffix }: { name: string; label: string; value: number; hint?: string; suffix?: string }) => (
  <div>
    <label className="label">{label}</label>
    <div className="relative">
      <input name={name} defaultValue={value} inputMode="decimal" className="input num pl-14" />
      {suffix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-mute">{suffix}</span>}
    </div>
    {hint && <p className="mt-1 text-[11px] leading-5 text-mute">{hint}</p>}
  </div>
);

export function SettingsForm({ s, liveUsd }: { s: Settings; liveUsd: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettingsAction, {});
  const [mode, setMode] = useState(s.priceMode);
  const [usd, setUsd] = useState(String(s.usdManual));
  const [cu, setCu] = useState(String(s.copperUsdPerTon));
  const [prem, setPrem] = useState(String(s.premiumPct));
  const preview = Math.round(((parseNum(cu) || 0) / 1000) * (parseNum(usd) || 0) * (1 + (parseNum(prem) || 0) / 100));

  return (
    <form action={action} className="card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-black">موتور قیمت</h2>
        <p className="mt-1 text-xs text-mute">کاتد مرجع از کجا بیاید؟ قیمت همه گریدها = کاتد × ضریب گرید.</p>
      </div>
      <input type="hidden" name="priceMode" value={mode} />
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line p-1">
        {(["dollar", "ime"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`rounded-xl py-2.5 text-sm font-bold ${mode === m ? "bg-gradient-to-b from-copper-2 to-copper text-ink" : "text-mute"}`}>
            {m === "dollar" ? "دلاری: مس جهانی × دلار آزاد" : "بورس کالا: کاتد ثبت‌شده"}
          </button>
        ))}
      </div>

      {mode === "dollar" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">دلار آزاد (پشتیبان دستی)</label>
            <input name="usdManual" value={usd} onChange={(e) => setUsd(e.target.value)} className="input num" />
            <p className="mt-1 text-[11px] text-mute">{liveUsd ? "فید زنده فعال است؛ این عدد فقط اگر فید قطع شود استفاده می‌شود." : "فید زنده تنظیم نشده؛ همین عدد استفاده می‌شود."}</p>
          </div>
          <div>
            <label className="label">مس جهانی (دلار / تن)</label>
            <input name="copperUsdPerTon" value={cu} onChange={(e) => setCu(e.target.value)} className="input num" />
          </div>
          <div>
            <label className="label">پریمیوم / تعدیل بازار داخل (٪)</label>
            <input name="premiumPct" value={prem} onChange={(e) => setPrem(e.target.value)} className="input num" />
          </div>
          <p className="sm:col-span-3 rounded-xl bg-ink/60 p-3 text-sm">
            پیش‌نمایش کاتد: <b className="num copper-text text-lg">{fa(preview)}</b> تومان / کیلو
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <F name="imeCathode" label="قیمت کاتد مس آخرین عرضه بورس کالا" value={s.imeCathode} suffix="ت/کیلو" hint="بعد از هر عرضه کاتد ملی مس به‌روز کنید." />
          <input type="hidden" name="usdManual" value={usd} />
          <input type="hidden" name="copperUsdPerTon" value={cu} />
          <input type="hidden" name="premiumPct" value={prem} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <F name="retailGapBrass" label="فاصله خرده‌بار تا عمده‌بار — برنج" value={s.retailGapBrass} suffix="٪" hint="برای نمایش «سود تجمیع» به کارگاه" />
        <F name="retailGapCopper" label="فاصله خرده‌بار تا عمده‌بار — مس" value={s.retailGapCopper} suffix="٪" />
        <F name="oilLight" label="کسر روغن: کمی روغنی" value={s.oilLight} suffix="٪" />
        <F name="oilWet" label="کسر روغن: خیس" value={s.oilWet} suffix="٪" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <F name="minWorkshops" label="حد نصاب کارگاه برای آماده شدن مگا-بار" value={s.minWorkshops} suffix="کارگاه" />
        <F name="targetKg" label="یا حد نصاب وزنی" value={s.targetKg} suffix="کیلو" hint="هر کدام زودتر برسد، مگا-بار آماده فروش می‌شود." />
        <F name="commissionPct" label="کارمزد از خریدار" value={s.commissionPct} suffix="٪" />
        <F name="penaltyToman" label="جریمه هر تخلف (ثبت در پرونده کارگاه)" value={s.penaltyToman} suffix="تومان" />
      </div>

      {state.error && <p className="text-sm text-rose">{state.error}</p>}
      {state.ok && <p className="text-sm text-teal">{state.ok}</p>}
      <button className="btn btn-copper" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره تنظیمات"}</button>
    </form>
  );
}
