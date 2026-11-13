import { redirect } from "next/navigation";
import { and, desc, eq, ne } from "drizzle-orm";
import { TopBar } from "@/components/TopBar";
import { PriceTicker } from "@/components/PriceTicker";
import { IngotProgress } from "@/components/IngotProgress";
import { requireRole } from "@/lib/auth";
import { getPriceBoard } from "@/lib/prices";
import { getSettings } from "@/lib/settings";
import { batchProgress } from "@/lib/batching";
import { cancelLoadAction } from "@/app/actions";
import { db } from "@/db";
import { batches, buyers, grades, loads, zones } from "@/db/schema";
import { DISCREPANCY, fa, faDate, OIL_LABEL, STATUS_LABEL, tomanShort } from "@/lib/format";
import { AnnounceForm } from "./AnnounceForm";

export const dynamic = "force-dynamic";

export default async function WorkshopHome() {
  const me = await requireRole("workshop");
  if (!me.workshop) redirect("/onboarding");
  const w = me.workshop;
  const [board, s] = await Promise.all([getPriceBoard(), getSettings()]);
  const [zone] = await db.select().from(zones).where(eq(zones.id, w.zoneId));

  const rows = await db
    .select({ l: loads, b: batches, g: grades, buyer: buyers })
    .from(loads)
    .innerJoin(batches, eq(loads.batchId, batches.id))
    .innerJoin(grades, eq(loads.gradeId, grades.id))
    .leftJoin(buyers, eq(batches.buyerId, buyers.id))
    .where(and(eq(loads.workshopId, w.id), ne(loads.status, "cancelled")))
    .orderBy(desc(loads.createdAt))
    .limit(30);

  const active = rows.filter((r) => r.l.status === "waiting");
  const done = rows.filter((r) => r.l.status !== "waiting");
  const earned = done.reduce((a, r) => a + (r.l.payableToman ?? 0), 0);

  // جایگاه این کارگاه در هر مگا-بار برای هایلایت شمش
  const progress = new Map<number, { workshops: number; kg: number; mine: number }>();
  for (const r of active) {
    const p = await batchProgress(r.b.id);
    const order = await db
      .select({ ws: loads.workshopId })
      .from(loads)
      .where(and(eq(loads.batchId, r.b.id), ne(loads.status, "cancelled")))
      .orderBy(loads.id);
    const seq = [...new Set(order.map((o) => o.ws))];
    progress.set(r.b.id, { ...p, mine: Math.max(0, seq.indexOf(w.id)) });
  }

  return (
    <>
      <TopBar />
      <PriceTicker initial={board} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs text-mute">{zone?.name}</div>
            <h1 className="mt-1 text-2xl font-black">{w.title}</h1>
          </div>
          <div className="flex gap-3">
            <div className="card px-4 py-3">
              <div className="text-[11px] text-mute">دریافتی تا امروز</div>
              <div className="num font-black text-teal">{tomanShort(earned)} تومان</div>
            </div>
            <div className="card px-4 py-3">
              <div className="text-[11px] text-mute">اعتبار کارگاه</div>
              <div className={`font-black ${w.strikes ? "text-rose" : "text-teal"}`}>
                {w.strikes ? `${fa(w.strikes)} تخلف` : "بدون تخلف"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <AnnounceForm initial={board} />

          <section className="space-y-4">
            <h2 className="text-lg font-black">بارهای در صف</h2>
            {active.length === 0 && (
              <div className="card p-6 text-sm leading-7 text-mute">
                هنوز باری در صف ندارید. بار را اعلام کنید؛ وقتی {fa(s.minWorkshops)} کارگاه همسایه هم اعلام کنند، مگا-بار برای خریدارها باز می‌شود.
              </div>
            )}
            {active.map((r) => {
              const p = progress.get(r.b.id)!;
              const est = r.l.estKg * (board.grades.find((g) => g.id === r.g.id)?.bulk ?? 0);
              return (
                <div key={r.l.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{r.g.name}</div>
                      <div className="num mt-1 text-xs text-mute">
                        {fa(r.l.estKg)} کیلو · {OIL_LABEL[r.l.oilLevel]} · {faDate(r.l.createdAt)}
                      </div>
                    </div>
                    <span className={`chip ${r.b.status === "ready" ? "!border-teal !text-teal" : r.b.status === "sold" ? "!border-copper !text-copper-2" : ""}`}>
                      {STATUS_LABEL[r.b.status]}
                    </span>
                  </div>
                  <div className="mt-4">
                    <IngotProgress workshops={p.workshops} min={r.b.minWorkshops} kg={p.kg} targetKg={r.b.targetKg} compact highlight={p.mine} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    {r.b.status === "sold" ? (
                      <span className="text-copper-2">
                        خریدار: <b>{r.buyer?.company}</b> · قیمت قفل‌شده <b className="num">{fa(r.b.lockedPricePerKg)}</b>
                      </span>
                    ) : (
                      <span className="text-mute">
                        برآورد: <b className="num text-text">{tomanShort(est)} تومان</b>
                      </span>
                    )}
                    {(r.b.status === "filling" || r.b.status === "ready") && (
                      <form action={cancelLoadAction}>
                        <input type="hidden" name="loadId" value={r.l.id} />
                        <button className="text-xs text-mute hover:text-rose">لغو این بار</button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}

            {done.length > 0 && (
              <>
                <h2 className="pt-4 text-lg font-black">سابقه</h2>
                <div className="card overflow-x-auto">
                  <table className="grid-table min-w-[480px] text-sm">
                    <thead>
                      <tr><th>گرید</th><th>وزن باسکول</th><th>وضعیت</th><th>مبلغ</th></tr>
                    </thead>
                    <tbody>
                      {done.map((r) => (
                        <tr key={r.l.id}>
                          <td>{r.g.name}</td>
                          <td className="num">{fa(r.l.actualKg)}</td>
                          <td>
                            {STATUS_LABEL[r.l.status]}
                            {r.l.discrepancy && <div className="text-[11px] text-rose">{DISCREPANCY[r.l.discrepancy]?.label}</div>}
                          </td>
                          <td className="num font-bold">{fa(r.l.payableToman)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
