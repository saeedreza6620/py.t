"use client";

import { useActionState, useState } from "react";
import { pickupAction, type FormState } from "@/app/actions";
import { DISCREPANCY, fa, OIL_LABEL, parseNum } from "@/lib/format";

export function PickupForm({
  batchId, loadId, estKg, declaredOil, price, oilLight, oilWet,
}: { batchId: number; loadId: number; estKg: number; declaredOil: "dry" | "light" | "wet"; price: number; oilLight: number; oilWet: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(pickupAction, {});
  const [kg, setKg] = useState(String(estKg));
  const [oil, setOil] = useState(declaredOil);
  const [disc, setDisc] = useState("");
  const ded = oil === "wet" ? oilWet : oil === "light" ? oilLight : 0;
  const payable = (parseNum(kg) || 0) * (1 - ded / 100) * price;

  return (
    <form action={action} className="mt-4 space-y-3 rounded-xl border border-line bg-ink/50 p-4">
      <input type="hidden" name="batchId" value={batchId} />
      <input type="hidden" name="loadId" value={loadId} />
      <input type="hidden" name="actualOil" value={oil} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">وزن باسکول (کیلو)</label>
          <input name="actualKg" value={kg} onChange={(e) => setKg(e.target.value)} inputMode="decimal" className="input num" />
        </div>
        <div>
          <label className="label">روغن واقعی</label>
          <div className="grid grid-cols-3 gap-1">
            {(["dry", "light", "wet"] as const).map((o) => (
              <button key={o} type="button" onClick={() => setOil(o)}
                className={`rounded-lg border py-2 text-[11px] ${oil === o ? "border-copper bg-copper/10" : "border-line text-mute"}`}>
                {OIL_LABEL[o]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="label">مغایرت (در صورت وجود، عکس را در گروه پایلوت بفرستید)</label>
        <select name="discrepancy" value={disc} onChange={(e) => setDisc(e.target.value)} className="input text-sm">
          <option value="">بدون مغایرت</option>
          {Object.entries(DISCREPANCY).map(([k, v]) => (
            <option key={k} value={k}>{v.label}{v.strike ? " (تخلف)" : ""}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-mute">قابل پرداخت به کارگاه:</span>
        <b className="num text-lg copper-text">{fa(payable)} تومان</b>
      </div>
      {state.error && <p className="text-xs text-rose">{state.error}</p>}
      <div className="flex gap-2">
        <button name="reject" value="0" className="btn btn-teal flex-1" disabled={pending}>ثبت تحویل و پرداخت</button>
        <button name="reject" value="1" className="btn btn-danger" disabled={pending}
          onClick={(e) => { if (!confirm("این بار رد شود؟ اگر مغایرت از نوع تخلف باشد برای کارگاه ثبت می‌شود.")) e.preventDefault(); }}>
          رد بار
        </button>
      </div>
    </form>
  );
}
