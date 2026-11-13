"use client";

import type { PriceBoard } from "@/lib/prices";
import { fa } from "@/lib/format";
import { usePriceBoard } from "./PriceTicker";
import { Sparkline } from "./Sparkline";

export function PriceBoardTable({ initial, showFormula = true }: { initial: PriceBoard; showFormula?: boolean }) {
  const { board, dir } = usePriceBoard(initial);
  return (
    <div className="card overflow-hidden">
      <div className="grid gap-px bg-line/60 sm:grid-cols-3">
        <Stat label="دلار آزاد" value={fa(board.usd)} unit="تومان" sub={board.usdLive ? `زنده · ${board.usdSource}` : "ثبت دستی مدیر"} flash={dir.usd}
          spark={board.history.map((h) => h.usd)} />
        <Stat label="مس جهانی" value={fa(board.copperUsdPerTon)} unit="دلار / تن" sub={board.copperSource} flash={dir.cu} />
        <Stat label={board.mode === "ime" ? "کاتد مس بورس کالا" : "کاتد مس (دلاری)"} value={fa(board.cathode)} unit="تومان / کیلو"
          sub={board.mode === "ime" ? "آخرین عرضه بورس کالا" : "مس جهانی × دلار آزاد"} flash={dir.cath}
          spark={board.history.map((h) => h.cathode)} />
      </div>
      <div className="overflow-x-auto">
        <table className="grid-table min-w-[620px]">
          <thead>
            <tr>
              <th>گرید</th>
              <th>ضریب کاتد</th>
              <th>خرده‌بار (دلال)</th>
              <th className="!text-copper-2">عمده‌بار صنعت‌هاب</th>
              <th>سود تجمیع / تن</th>
            </tr>
          </thead>
          <tbody>
            {board.grades.map((g) => (
              <tr key={g.id} className={dir[g.id] === "up" ? "flash-up" : dir[g.id] === "down" ? "flash-down" : ""}>
                <td>
                  <div className="font-bold">{g.name}</div>
                  <div className="text-[11px] text-mute">{g.family === "brass" ? "برنج" : "مس"}</div>
                </td>
                <td className="num text-mute">{fa(g.coef * 100)}٪</td>
                <td className="num text-mute line-through decoration-rose/60">{fa(g.retail)}</td>
                <td className="num text-lg font-black copper-text">{fa(g.bulk)}</td>
                <td className="num text-teal font-bold">+{fa((g.gain * 1000) / 1e6)} میلیون</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showFormula && (
        <p className="border-t border-line/60 px-4 py-3 text-xs leading-6 text-mute">
          قیمت‌ها به تومان برای هر کیلو است. فرمول: {board.mode === "ime" ? "قیمت کاتد بورس کالا" : "مس جهانی ÷ ۱۰۰۰ × دلار آزاد"} × ضریب گرید.
          «خرده‌بار» میانگین تخمینی پرداخت دلال‌ها برای بار زیر یک تن است. کسر روغن: کمی روغنی {fa(board.oilLight)}٪ · خیس {fa(board.oilWet)}٪.
          قیمت لحظه خرید مگا-بار برای همه کارگاه‌های آن بار قفل می‌شود.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, unit, sub, flash, spark }: { label: string; value: string; unit: string; sub: string; flash?: "up" | "down"; spark?: number[] }) {
  return (
    <div className={`bg-panel/95 p-4 ${flash === "up" ? "flash-up" : flash === "down" ? "flash-down" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs text-mute">{label}</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="num text-2xl font-black">{value}</span>
            <span className="text-[11px] text-mute">{unit}</span>
            {flash && <span className={flash === "up" ? "text-teal text-xs" : "text-rose text-xs"}>{flash === "up" ? "▲" : "▼"}</span>}
          </div>
          <div className="mt-1 text-[11px] text-mute">{sub}</div>
        </div>
        {spark && <Sparkline values={spark} w={90} h={36} />}
      </div>
    </div>
  );
}
