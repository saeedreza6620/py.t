"use client";

import { useEffect, useRef, useState } from "react";
import type { PriceBoard } from "@/lib/prices";
import { fa, faTime } from "@/lib/format";

type Item = { key: string; label: string; value: number; unit: string };

function items(b: PriceBoard): Item[] {
  return [
    { key: "usd", label: "دلار آزاد", value: b.usd, unit: "تومان" },
    { key: "cu", label: "مس جهانی", value: b.copperUsdPerTon, unit: "$/تن" },
    { key: "cath", label: b.mode === "ime" ? "کاتد بورس کالا" : "کاتد دلاری", value: b.cathode, unit: "ت/کیلو" },
    ...b.grades.map((g) => ({ key: g.id, label: g.name, value: g.bulk, unit: "ت/کیلو" })),
  ];
}

/** نوار قیمت زنده: هر ۳۰ ثانیه از سرور می‌خواند و تغییرها را چشمک می‌زند */
export function usePriceBoard(initial: PriceBoard, everyMs = 30_000) {
  const [board, setBoard] = useState(initial);
  const [dir, setDir] = useState<Record<string, "up" | "down">>({});
  const prev = useRef(initial);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/prices", { cache: "no-store" });
        if (!r.ok) return;
        const next: PriceBoard = await r.json();
        if (!alive) return;
        const before = Object.fromEntries(items(prev.current).map((i) => [i.key, i.value]));
        const d: Record<string, "up" | "down"> = {};
        for (const i of items(next)) {
          if (before[i.key] != null && i.value !== before[i.key]) d[i.key] = i.value > before[i.key] ? "up" : "down";
        }
        prev.current = next;
        setDir(d);
        setBoard(next);
      } catch {
        /* شبکه قطع است؛ آخرین قیمت می‌ماند */
      }
    };
    const id = setInterval(tick, everyMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [everyMs]);
  return { board, dir };
}

export function PriceTicker({ initial }: { initial: PriceBoard }) {
  const { board, dir } = usePriceBoard(initial);
  const list = items(board);
  const row = (suffix: string) =>
    list.map((i) => (
      <span key={i.key + suffix} className={`inline-flex items-center gap-2 px-5 py-2 border-l border-line/60 ${dir[i.key] === "up" ? "flash-up" : dir[i.key] === "down" ? "flash-down" : ""}`}>
        <span className="text-mute text-xs">{i.label}</span>
        <span className="num font-bold text-sm">{fa(i.value)}</span>
        <span className="text-[10px] text-mute">{i.unit}</span>
        {dir[i.key] && <span className={dir[i.key] === "up" ? "text-teal text-xs" : "text-rose text-xs"}>{dir[i.key] === "up" ? "▲" : "▼"}</span>}
      </span>
    ));
  return (
    <div className="relative overflow-hidden border-y border-line bg-ink-2/80 no-print">
      <div className="absolute inset-y-0 right-0 z-10 flex items-center gap-2 bg-ink-2 px-4 text-xs font-bold">
        <span className={board.usdLive ? "live-dot" : "w-2 h-2 rounded-full bg-brass"} />
        {board.usdLive ? "زنده" : "دستی"}
        <span className="text-mute font-normal num">{faTime(board.ts)}</span>
      </div>
      <div className="flex w-max whitespace-nowrap tape-track pr-36">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
