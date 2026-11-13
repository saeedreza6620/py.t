"use client";

import { useActionState, useState } from "react";
import { onboardAction, type FormState } from "@/app/actions";

type Zone = { id: number; name: string; lat: number; lng: number };

export function OnboardForm({ zones, initialRole }: { zones: Zone[]; initialRole: "workshop" | "buyer" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(onboardAction, {});
  const [role, setRole] = useState(initialRole);
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? 0);
  const z = zones.find((x) => x.id === zoneId) ?? zones[0];
  const [pos, setPos] = useState<{ lat: number; lng: number; src: string }>({ lat: z?.lat ?? 35.37, lng: z?.lng ?? 51.24, src: "مرکز منطقه" });
  const [geoErr, setGeoErr] = useState("");

  const locate = () => {
    setGeoErr("");
    if (!navigator.geolocation) return setGeoErr("مرورگر شما موقعیت‌یابی ندارد.");
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), src: "GPS گوشی" }),
      () => setGeoErr("اجازه موقعیت داده نشد؛ مرکز منطقه استفاده می‌شود."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line p-1">
        {(["workshop", "buyer"] as const).map((r) => (
          <button key={r} type="button" onClick={() => setRole(r)}
            className={`rounded-xl py-3 text-sm font-bold transition ${role === r ? "bg-gradient-to-b from-copper-2 to-copper text-ink" : "text-mute"}`}>
            {r === "workshop" ? "تراشکار / کارگاه" : "خریدار عمده"}
          </button>
        ))}
      </div>

      <div>
        <label className="label">نام و نام خانوادگی</label>
        <input name="name" className="input" required />
      </div>

      {role === "workshop" ? (
        <>
          <div>
            <label className="label">نام کارگاه</label>
            <input name="title" className="input" placeholder="مثلاً تراشکاری دقیق‌کار" required />
          </div>
          <div>
            <label className="label">منطقه صنعتی</label>
            <select name="zoneId" className="input" value={zoneId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setZoneId(id);
                const nz = zones.find((x) => x.id === id);
                if (nz && pos.src === "مرکز منطقه") setPos({ lat: nz.lat, lng: nz.lng, src: "مرکز منطقه" });
              }}>
              {zones.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">نشانی (بلوار، گلبرگ، پلاک)</label>
            <input name="address" className="input" />
          </div>
          <div>
            <label className="label">شماره شبا برای واریز مستقیم خریدار (اختیاری)</label>
            <input name="sheba" dir="ltr" className="input num text-left" placeholder="IR000000000000000000000000" />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="label">نام شرکت / ریخته‌گری</label>
            <input name="company" className="input" required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="spectro" className="accent-[#d9822b]" /> اسپکترومتر یا XRF برای آنالیز بار داریم
          </label>
          <p className="rounded-xl border border-line bg-ink/50 p-3 text-xs leading-6 text-mute">
            حساب خریدار پس از تماس و تأیید صنعت‌هاب فعال می‌شود تا کارگاه‌ها مطمئن باشند طرف معامله‌شان واقعی است.
          </p>
        </>
      )}

      <div className="rounded-xl border border-line bg-ink/50 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-mute">
            موقعیت {role === "workshop" ? "کارگاه" : "انبار تحویل"}:{" "}
            <span className="num text-text" dir="ltr">{pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}</span>
            <span className="mr-1">({pos.src})</span>
          </div>
          <button type="button" onClick={locate} className="btn btn-ghost !px-3 !py-1.5 text-xs">موقعیت فعلی من</button>
        </div>
        {geoErr && <p className="mt-2 text-xs text-brass">{geoErr}</p>}
        <p className="mt-2 text-[11px] text-mute">برای مسیر بهینه راننده، بهتر است این فرم را داخل خود کارگاه پر کنید.</p>
      </div>
      <input type="hidden" name="lat" value={pos.lat} />
      <input type="hidden" name="lng" value={pos.lng} />

      {state.error && <p className="text-sm text-rose">{state.error}</p>}
      <button className="btn btn-copper w-full" disabled={pending}>{pending ? "در حال ثبت…" : "تکمیل عضویت"}</button>
    </form>
  );
}
