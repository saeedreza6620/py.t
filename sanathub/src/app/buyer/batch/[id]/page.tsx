import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { TopBar } from "@/components/TopBar";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { optimizeRoute, ROAD_FACTOR, type Pt } from "@/lib/route";
import { db } from "@/db";
import { batches, grades, loads, users, workshops, zones } from "@/db/schema";
import { DISCREPANCY, fa, faDate, OIL_LABEL, STATUS_LABEL, toman } from "@/lib/format";
import { PickupForm } from "./PickupForm";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

function RouteMap({ depot, stops, doneIds }: { depot: Pt; stops: (Pt & { id: number })[]; doneIds: Set<number> }) {
  const pts = [depot, ...stops];
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const pad = 0.002;
  const [minLa, maxLa, minLn, maxLn] = [Math.min(...lats) - pad, Math.max(...lats) + pad, Math.min(...lngs) - pad, Math.max(...lngs) + pad];
  const W = 640;
  const H = 360;
  // RTL: شرق سمت راست بماند، نقشه همان جهت جغرافیایی
  const xy = (p: Pt) => [((p.lng - minLn) / (maxLn - minLn || 1)) * (W - 60) + 30, H - (((p.lat - minLa) / (maxLa - minLa || 1)) * (H - 60) + 30)];
  const path = [depot, ...stops, depot].map((p, i) => (i ? "L" : "M") + xy(p).map((v) => v.toFixed(1)).join(" ")).join(" ");
  const [dx, dy] = xy(depot);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl border border-line bg-ink" style={{ direction: "ltr" }}>
      <defs>
        <pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="#24315e" strokeOpacity=".5" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#g)" />
      <path d={path} fill="none" stroke="#f0a050" strokeWidth="2.5" strokeDasharray="7 6" strokeLinejoin="round" />
      <g>
        <rect x={dx - 13} y={dy - 13} width="26" height="26" rx="6" fill="#19c3a6" />
        <text x={dx} y={dy + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#03201b">انبار</text>
      </g>
      {stops.map((s, i) => {
        const [x, y] = xy(s);
        const done = doneIds.has(s.id);
        return (
          <g key={s.id}>
            <circle cx={x} cy={y} r="13" fill={done ? "#19c3a6" : "#d9822b"} stroke="#0a0f1e" strokeWidth="2" />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0a0f1e">{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole("buyer");
  if (!me.buyer) redirect("/onboarding");
  const id = Number((await params).id);
  const [row] = await db
    .select({ b: batches, g: grades, z: zones })
    .from(batches)
    .innerJoin(grades, eq(batches.gradeId, grades.id))
    .innerJoin(zones, eq(batches.zoneId, zones.id))
    .where(eq(batches.id, id));
  if (!row || row.b.buyerId !== me.buyer.id) notFound();
  const s = await getSettings();

  const stopsRaw = await db
    .select({ l: loads, w: workshops, u: users })
    .from(loads)
    .innerJoin(workshops, eq(loads.workshopId, workshops.id))
    .innerJoin(users, eq(workshops.userId, users.id))
    .where(and(eq(loads.batchId, id), ne(loads.status, "cancelled")));
  const { order, km } = optimizeRoute(
    me.buyer,
    stopsRaw.map((r) => ({ ...r, lat: r.w.lat, lng: r.w.lng, id: r.l.id })),
  );
  const done = new Set(order.filter((r) => r.l.status !== "waiting").map((r) => r.l.id));
  const picked = order.filter((r) => r.l.status === "picked");
  const totalKg = picked.reduce((a, r) => a + (r.l.actualKg ?? 0), 0);
  const totalPay = picked.reduce((a, r) => a + (r.l.payableToman ?? 0), 0);
  const fee = Math.round((totalPay * (row.b.commissionPct ?? 0)) / 100);
  const price = row.b.lockedPricePerKg ?? 0;

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/buyer" className="no-print text-sm text-mute">→ بازگشت به بازار</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs text-mute">مگا-بار #{fa(row.b.id)} · {row.z.name}</div>
            <h1 className="mt-1 text-2xl font-black">{row.g.name}</h1>
            <div className="mt-1 text-sm text-mute">{STATUS_LABEL[row.b.status]} · خرید {faDate(row.b.soldAt)}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="card px-4 py-3">
              <div className="text-[11px] text-mute">قیمت قفل‌شده</div>
              <div className="num font-black copper-text">{fa(price)}</div>
            </div>
            <div className="card px-4 py-3">
              <div className="text-[11px] text-mute">دلار در لحظه خرید</div>
              <div className="num font-black">{fa(row.b.lockedUsd)}</div>
            </div>
            <div className="card px-4 py-3">
              <div className="text-[11px] text-mute">مسیر</div>
              <div className="num font-black">{fa(km * ROAD_FACTOR)} کیلومتر</div>
            </div>
          </div>
        </div>

        {row.b.status === "sold" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="lg:sticky lg:top-24 h-fit">
              <RouteMap depot={me.buyer} stops={order.map((r) => ({ lat: r.w.lat, lng: r.w.lng, id: r.l.id }))} doneIds={done} />
              <p className="mt-2 text-xs leading-6 text-mute">
                ترتیب توقف‌ها با الگوریتم نزدیک‌ترین همسایه + بهبود 2-opt چیده شده است. تحویل‌شده‌ها سبز می‌شوند.
              </p>
            </div>
            <ol className="space-y-4">
              {order.map((r, i) => (
                <li key={r.l.id} className={`card p-5 ${r.l.status !== "waiting" ? "opacity-70" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className={`num grid h-8 w-8 shrink-0 place-items-center rounded-full font-black text-ink ${r.l.status === "waiting" ? "bg-copper" : "bg-teal"}`}>
                        {fa(i + 1)}
                      </span>
                      <div>
                        <div className="font-bold">{r.w.title}</div>
                        <div className="text-xs text-mute">{r.u.name} · {r.w.address || "بدون نشانی"}</div>
                        <div className="num mt-1 text-xs text-mute">اظهار: {fa(r.l.estKg)} کیلو · {OIL_LABEL[r.l.oilLevel]}</div>
                        {r.l.note && <div className="mt-1 text-xs text-brass">«{r.l.note}»</div>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <a href={`tel:${r.u.phone}`} className="btn btn-ghost !px-3 !py-1.5 text-xs">تماس</a>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${r.w.lat},${r.w.lng}`} target="_blank" className="text-mute hover:text-copper-2">مسیریابی</a>
                    </div>
                  </div>
                  {r.l.status === "waiting" ? (
                    <PickupForm batchId={id} loadId={r.l.id} estKg={r.l.estKg} declaredOil={r.l.oilLevel} price={price} oilLight={s.oilLight} oilWet={s.oilWet} />
                  ) : (
                    <div className="mt-3 text-sm">
                      {r.l.status === "picked" ? (
                        <span className="text-teal">تحویل شد: <b className="num">{fa(r.l.actualKg)}</b> کیلو · <b className="num">{toman(r.l.payableToman)}</b></span>
                      ) : (
                        <span className="text-rose">رد شد: {DISCREPANCY[r.l.discrepancy ?? ""]?.label}</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {row.b.status === "settled" && (
          <section className="card mt-6 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">برگه تسویه مگا-بار #{fa(row.b.id)}</h2>
              <PrintButton />
            </div>
            <p className="mt-1 text-xs text-mute">تسویه {faDate(row.b.settledAt)} · قیمت قفل‌شده {toman(price)} برای هر کیلو</p>
            <div className="mt-4 overflow-x-auto">
              <table className="grid-table min-w-[640px] text-sm">
                <thead>
                  <tr><th>#</th><th>کارگاه</th><th>شبا</th><th>وزن باسکول</th><th>روغن</th><th>مبلغ واریزی</th></tr>
                </thead>
                <tbody>
                  {order.map((r, i) => (
                    <tr key={r.l.id}>
                      <td className="num">{fa(i + 1)}</td>
                      <td>{r.w.title}<div className="text-[11px] text-mute">{r.u.name} · <span dir="ltr">{r.u.phone}</span></div></td>
                      <td className="num text-xs" dir="ltr">{r.w.sheba || "—"}</td>
                      <td className="num">{r.l.status === "picked" ? fa(r.l.actualKg) : "رد شد"}</td>
                      <td>{r.l.actualOil ? OIL_LABEL[r.l.actualOil] : "—"}</td>
                      <td className="num font-bold">{fa(r.l.payableToman)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-ink/60 p-4">
                <div className="text-xs text-mute">جمع وزن تحویلی</div>
                <div className="num mt-1 text-lg font-black">{fa(totalKg)} کیلو</div>
              </div>
              <div className="rounded-xl bg-ink/60 p-4">
                <div className="text-xs text-mute">جمع واریز به کارگاه‌ها</div>
                <div className="num mt-1 text-lg font-black">{toman(totalPay)}</div>
              </div>
              <div className="rounded-xl bg-ink/60 p-4">
                <div className="text-xs text-mute">کارمزد صنعت‌هاب ({fa(row.b.commissionPct)}٪)</div>
                <div className="num mt-1 text-lg font-black copper-text">{toman(fee)}</div>
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-mute">
              واریز به هر کارگاه مستقیماً از حساب خریدار به شبای کارگاه انجام می‌شود. صنعت‌هاب وجهی نگهداری نمی‌کند و فقط ثبت، داوری و
              صورتحساب کارمزد را انجام می‌دهد.
            </p>
          </section>
        )}
      </main>
    </>
  );
}
