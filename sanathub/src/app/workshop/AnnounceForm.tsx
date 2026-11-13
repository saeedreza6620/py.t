"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { announceLoadAction, type FormState } from "@/app/actions";
import type { PriceBoard } from "@/lib/prices";
import { usePriceBoard } from "@/components/PriceTicker";
import { fa, OIL_LABEL, parseNum } from "@/lib/format";

export function AnnounceForm({ initial }: { initial: PriceBoard }) {
  const { board } = usePriceBoard(initial);
  const [state, action, pending] = useActionState<FormState, FormData>(announceLoadAction, {});
  const [gradeId, setGradeId] = useState(board.grades[0]?.id ?? "");
  const [kgText, setKgText] = useState("300");
  const [oil, setOil] = useState<"dry" | "light" | "wet">("light");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) setKgText("300");
  }, [state.ok]);

  const g = board.grades.find((x) => x.id === gradeId) ?? board.grades[0];
  const kg = parseNum(kgText) || 0;
  const ded = oil === "wet" ? board.oilWet : oil === "light" ? board.oilLight : 0;
  const net = kg * (1 - ded / 100);
  const bulk = g ? net * g.bulk : 0;
  const retail = g ? net * g.retail : 0;

  return (
    <form ref={formRef} action={action} className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">اعلام بار جدید</h2>
        <span className="chip">خوداظهاری مشروط</span>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {board.grades.map((x) => (
          <label key={x.id}
            className={`cursor-pointer rounded-xl border p-3 transition ${gradeId === x.id ? "border-copper bg-copper/10" : "border-line hover:border-line/40"}`}>
            <input type="radio" name="gradeId" value={x.id} checked={gradeId === x.id} onChange={() => setGradeId(x.id)} className="sr-only" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">{x.name}</span>
              <span className="num text-xs text-copper-2">{fa(x.bulk)}</span>
            </div>
            <div className="mt-1 text-[11px] leading-5 text-mute">{x.description}</div>
          </label>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">وزن تخمینی (کیلو)</label>
          <input name="estKg" value={kgText} onChange={(e) => setKgText(e.target.value)} inputMode="numeric"
            className="input num text-lg" required />
          <div className="mt-2 flex gap-1.5">
            {[100, 300, 500, 1000].map((v) => (
              <button key={v} type="button" onClick={() => setKgText(String(v))} className="chip hover:border-copper">{fa(v)}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">وضعیت روغن / آب‌صابون</label>
          <input type="hidden" name="oilLevel" value={oil} />
          <div className="grid grid-cols-3 gap-1.5">
            {(["dry", "light", "wet"] as const).map((o) => (
              <button key={o} type="button" onClick={() => setOil(o)}
                className={`rounded-xl border py-2.5 text-xs font-bold ${oil === o ? "border-copper bg-copper/10 text-text" : "border-line text-mute"}`}>
                {OIL_LABEL[o]}
                <div className="num mt-0.5 font-normal text-[10px]">−{fa(o === "wet" ? board.oilWet : o === "light" ? board.oilLight : 0)}٪</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="label">توضیح برای راننده (اختیاری)</label>
        <input name="note" className="input" placeholder="مثلاً: بار داخل گونی کنار در ورودی است" />
      </div>

      {/* برآورد زنده */}
      <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-line bg-ink/60 p-4 text-center">
        <div>
          <div className="text-[11px] text-mute">اگر به دلال بدهید</div>
          <div className="num mt-1 font-bold text-mute line-through decoration-rose/60">{fa(retail)}</div>
        </div>
        <div>
          <div className="text-[11px] text-mute">با صنعت‌هاب (تخمینی)</div>
          <div className="num mt-1 text-lg font-black copper-text">{fa(bulk)}</div>
        </div>
        <div>
          <div className="text-[11px] text-mute">سود تجمیع</div>
          <div className="num mt-1 font-black text-teal">+{fa(bulk - retail)}</div>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-mute">
        مبالغ به تومان، با قیمت همین لحظه. مبلغ قطعی با وزن باسکول و قیمتِ قفل‌شده هنگام خرید مگا-بار محاسبه می‌شود.
      </p>

      <label className="mt-4 flex items-start gap-2 text-xs leading-6 text-mute">
        <input type="checkbox" required className="mt-1 accent-[#d9822b]" />
        اصالت و گرید بار را تأیید می‌کنم. اگر در محل گرید یا آهن‌آلات مغایر باشد، معامله لغو و جریمه ثبت می‌شود.
      </label>

      {state.error && <p className="mt-3 text-sm text-rose">{state.error}</p>}
      {state.ok && <p className="mt-3 text-sm text-teal">{state.ok}</p>}
      <button className="btn btn-copper mt-4 w-full" disabled={pending}>{pending ? "در حال ثبت…" : "ثبت و ورود به صف تجمیع"}</button>
    </form>
  );
}
