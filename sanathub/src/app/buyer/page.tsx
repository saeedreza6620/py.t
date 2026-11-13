import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { TopBar } from "@/components/TopBar";
import { PriceTicker } from "@/components/PriceTicker";
import { IngotProgress } from "@/components/IngotProgress";
import { requireRole } from "@/lib/auth";
import { getPriceBoard } from "@/lib/prices";
import { listBatches } from "@/lib/batching";
import { haversineKm, optimizeRoute, ROAD_FACTOR } from "@/lib/route";
import { db } from "@/db";
import { loads, workshops } from "@/db/schema";
import { fa, faDate, STATUS_LABEL, tomanShort } from "@/lib/format";
import { BuyButton } from "./BuyButton";

export const dynamic = "force-dynamic";

export default async function BuyerHome() {
  const me = await requireRole("buyer");
  if (!me.buyer) redirect("/onboarding");
  const buyer = me.buyer;
  const board = await getPriceBoard();
  const [market, mine] = await Promise.all([listBatches(["ready", "filling"]), listBatches(["sold", "settled"], buyer.id)]);
  const ready = market.filter((r) => r.b.status === "ready");
  const filling = market.filter((r) => r.b.status === "filling");

  // مسافت مسیر هر مگا-بار آماده از انبار خریدار
  const routeKm = new Map<number, number>();
  for (const r of ready) {
    const pts = await db
      .select({ lat: workshops.lat, lng: workshops.lng })
      .from(loads)
      .innerJoin(workshops, eq(loads.workshopId, workshops.id))
      .where(and(eq(loads.batchId, r.b.id), ne(loads.status, "cancelled")));
    routeKm.set(r.b.id, optimizeRoute(buyer, pts).km * ROAD_FACTOR);
  }
  const pending = me.user.status !== "active";

  return (
    <>
      <TopBar />
      <PriceTicker initial={board} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs text-mute">بازار مگا-بار</div>
            <h1 className="mt-1 text-2xl font-black">{buyer.company}</h1>
          </div>
          {buyer.hasSpectrometer && <span className="chip !border-teal !text-teal">آنالیز با اسپکترومتر خودتان</span>}
        </div>

        {pending && (
          <div className="mt-6 rounded-2xl border border-brass/40 bg-brass/10 p-4 text-sm leading-7">
            حساب شما در انتظار تأیید صنعت‌هاب است. بارها را می‌بینید ولی خرید بعد از تأیید فعال می‌شود.
          </div>
        )}

        <h2 className="mt-8 text-lg font-black">آماده فروش ({fa(ready.length)})</h2>
        {ready.length === 0 && <div className="card mt-3 p-6 text-sm text-mute">فعلاً مگا-بار تکمیل‌شده‌ای نیست. بارهای در حال پر شدن پایین‌تر هستند.</div>}
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {ready.map((r) => {
            const price = board.grades.find((g) => g.id === r.g.id)?.bulk ?? 0;
            const value = price * r.progress.kg;
            const km = routeKm.get(r.b.id) ?? 0;
            return (
              <div key={r.b.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-mute">{r.z.name} · {fa(haversineKm(buyer, r.z) * ROAD_FACTOR)} کیلومتر تا شما</span>
                  <span className="chip !border-teal !text-teal">آماده</span>
                </div>
                <div className="mt-2 text-lg font-black">{r.g.name}</div>
                <div className="mt-4">
                  <IngotProgress workshops={r.progress.workshops} min={r.b.minWorkshops} kg={r.progress.kg} targetKg={r.b.targetKg} compact />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-ink/60 p-2">
                    <div className="text-mute">قیمت لحظه</div>
                    <div className="num mt-1 font-black copper-text text-sm">{fa(price)}</div>
                  </div>
                  <div className="rounded-xl bg-ink/60 p-2">
                    <div className="text-mute">ارزش تخمینی</div>
                    <div className="num mt-1 font-black text-sm">{tomanShort(value)}</div>
                  </div>
                  <div className="rounded-xl bg-ink/60 p-2">
                    <div className="text-mute">مسیر بهینه</div>
                    <div className="num mt-1 font-black text-sm">{fa(km)} کیلومتر</div>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-mute">کارمزد صنعت‌هاب {fa(board.commissionPct)}٪ از ارزش تسویه‌شده، از خریدار.</p>
                <div className="mt-3">
                  <BuyButton batchId={r.b.id} disabled={pending} label="خرید و قفل قیمت" />
                </div>
              </div>
            );
          })}
        </div>

        {mine.length > 0 && (
          <>
            <h2 className="mt-10 text-lg font-black">خریدهای من</h2>
            <div className="card mt-3 overflow-x-auto">
              <table className="grid-table min-w-[600px] text-sm">
                <thead>
                  <tr><th>مگا-بار</th><th>منطقه</th><th>قیمت قفل</th><th>وضعیت</th><th>تاریخ</th><th></th></tr>
                </thead>
                <tbody>
                  {mine.map((r) => (
                    <tr key={r.b.id}>
                      <td className="font-bold">#{fa(r.b.id)} · {r.g.name}</td>
                      <td>{r.z.name}</td>
                      <td className="num">{fa(r.b.lockedPricePerKg)}</td>
                      <td>{STATUS_LABEL[r.b.status]}</td>
                      <td className="num text-mute">{faDate(r.b.soldAt)}</td>
                      <td>
                        <Link className="text-copper-2" href={`/buyer/batch/${r.b.id}`}>
                          {r.b.status === "sold" ? "مسیر و توزین ←" : "برگه تسویه ←"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h2 className="mt-10 text-lg font-black">در حال پر شدن ({fa(filling.length)})</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {filling.map((r) => (
            <div key={r.b.id} className="card p-5">
              <div className="text-xs text-mute">{r.z.name}</div>
              <div className="mt-1 font-bold">{r.g.name}</div>
              <div className="mt-4">
                <IngotProgress workshops={r.progress.workshops} min={r.b.minWorkshops} kg={r.progress.kg} targetKg={r.b.targetKg} compact />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
