import { asc, desc, eq } from "drizzle-orm";
import { TopBar } from "@/components/TopBar";
import { PriceTicker } from "@/components/PriceTicker";
import { requireRole } from "@/lib/auth";
import { getPriceBoard } from "@/lib/prices";
import { getSettings } from "@/lib/settings";
import { listBatches } from "@/lib/batching";
import { publicStats } from "@/lib/stats";
import { batchAdminAction, saveGradeAction, setUserStatusAction } from "@/app/actions";
import { db } from "@/db";
import { buyers, grades, users, workshops } from "@/db/schema";
import { fa, faDate, STATUS_LABEL, tomanShort } from "@/lib/format";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireRole("admin");
  const [board, s, stats, all, gs] = await Promise.all([
    getPriceBoard(),
    getSettings(),
    publicStats(),
    listBatches(["filling", "ready", "sold", "settled"]),
    db.select().from(grades).orderBy(asc(grades.sort)),
  ]);
  const people = await db
    .select({ u: users, w: workshops, b: buyers })
    .from(users)
    .leftJoin(workshops, eq(workshops.userId, users.id))
    .leftJoin(buyers, eq(buyers.userId, users.id))
    .orderBy(desc(users.createdAt))
    .limit(200);
  const pendingBuyers = people.filter((p) => p.u.role === "buyer" && p.u.status === "pending");

  return (
    <>
      <TopBar />
      <PriceTicker initial={board} />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-black">پنل مدیریت صنعت‌هاب</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="chip">کارگاه: <b className="num text-text">{fa(stats.workshops)}</b></span>
            <span className="chip">بار ۳۰ روز: <b className="num text-text">{fa(stats.kg30)}</b> کیلو</span>
            <span className="chip">پرداخت‌شده: <b className="num text-text">{tomanShort(stats.paid)}</b></span>
            <span className="chip">{board.usdLive ? `دلار زنده از ${board.usdSource}` : "دلار دستی"}</span>
          </div>
        </div>

        {pendingBuyers.length > 0 && (
          <section className="card border-brass/50 p-5">
            <h2 className="font-black">خریدارهای منتظر تأیید</h2>
            <div className="mt-3 space-y-2">
              {pendingBuyers.map((p) => (
                <div key={p.u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ink/60 p-3 text-sm">
                  <span>
                    <b>{p.b?.company}</b> · {p.u.name} · <span dir="ltr" className="num">{p.u.phone}</span>
                    {p.b?.hasSpectrometer && <span className="chip mr-2">اسپکترومتر دارد</span>}
                  </span>
                  <form action={setUserStatusAction}>
                    <input type="hidden" name="userId" value={p.u.id} />
                    <input type="hidden" name="status" value="active" />
                    <button className="btn btn-teal !py-1.5 text-xs">تأیید</button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <SettingsForm s={s} liveUsd={board.usdLive} />

          <section className="card p-6">
            <h2 className="text-lg font-black">گریدها و ضرایب</h2>
            <p className="mt-1 text-xs leading-6 text-mute">
              ضریب = قیمت عمده‌بار گرید ÷ قیمت کاتد. با اولین خریدهای واقعی و آنالیز اسپکترومتر خریدار کالیبره کنید.
            </p>
            <div className="mt-4 space-y-2">
              {gs.map((g) => {
                const p = board.grades.find((x) => x.id === g.id);
                return (
                  <form key={g.id} action={saveGradeAction} className="grid grid-cols-[1fr_80px_auto_auto] items-center gap-2 rounded-xl bg-ink/60 p-2">
                    <input type="hidden" name="id" value={g.id} />
                    <input name="name" defaultValue={g.name} className="input !py-1.5 text-sm" />
                    <input name="coef" defaultValue={g.coef} className="input num !py-1.5 text-sm" title="ضریب" />
                    <label className="flex items-center gap-1 text-[11px] text-mute">
                      <input type="checkbox" name="active" defaultChecked={g.active} className="accent-[#d9822b]" /> فعال
                    </label>
                    <button className="btn btn-ghost !px-2 !py-1.5 text-xs">ذخیره</button>
                    <div className="col-span-4 num px-1 text-[11px] text-mute">
                      اکنون: {p ? `${fa(p.bulk)} تومان/کیلو` : "غیرفعال"}
                    </div>
                  </form>
                );
              })}
            </div>
          </section>
        </div>

        <section className="card overflow-x-auto p-0">
          <h2 className="p-5 pb-0 text-lg font-black">مگا-بارها</h2>
          <table className="grid-table mt-3 min-w-[760px] text-sm">
            <thead>
              <tr><th>#</th><th>منطقه / گرید</th><th>کارگاه</th><th>کیلو</th><th>وضعیت</th><th>خریدار</th><th>ایجاد</th><th></th></tr>
            </thead>
            <tbody>
              {all.map((r) => (
                <tr key={r.b.id}>
                  <td className="num">{fa(r.b.id)}</td>
                  <td>{r.z.name}<div className="text-[11px] text-mute">{r.g.name}</div></td>
                  <td className="num">{fa(r.progress.workshops)} / {fa(r.b.minWorkshops)}</td>
                  <td className="num">{fa(r.progress.kg)}</td>
                  <td>{STATUS_LABEL[r.b.status]}</td>
                  <td>{r.buyer?.company ?? "—"}</td>
                  <td className="num text-xs text-mute">{faDate(r.b.createdAt)}</td>
                  <td>
                    {(r.b.status === "filling" || r.b.status === "ready") && (
                      <div className="flex gap-3">
                        {r.b.status === "filling" && (
                          <form action={batchAdminAction}>
                            <input type="hidden" name="batchId" value={r.b.id} />
                            <button name="op" value="ready" className="text-xs text-teal">آماده کن</button>
                          </form>
                        )}
                        <form action={batchAdminAction}>
                          <input type="hidden" name="batchId" value={r.b.id} />
                          <button name="op" value="cancel" className="text-xs text-rose">لغو</button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card overflow-x-auto p-0">
          <h2 className="p-5 pb-0 text-lg font-black">کاربران</h2>
          <table className="grid-table mt-3 min-w-[720px] text-sm">
            <thead>
              <tr><th>نام</th><th>نقش</th><th>موبایل</th><th>تخلف / جریمه</th><th>وضعیت</th><th></th></tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.u.id}>
                  <td>{p.w?.title || p.b?.company || p.u.name}<div className="text-[11px] text-mute">{p.u.name}</div></td>
                  <td>{p.u.role === "workshop" ? "تراشکار" : p.u.role === "buyer" ? "خریدار" : "مدیر"}</td>
                  <td className="num" dir="ltr">{p.u.phone}</td>
                  <td className="num">{p.w ? `${fa(p.w.strikes)} / ${tomanShort(p.w.penaltyToman)}` : "—"}</td>
                  <td>{p.u.status === "active" ? "فعال" : p.u.status === "pending" ? "منتظر تأیید" : "مسدود"}</td>
                  <td>
                    {p.u.role !== "admin" && (
                      <form action={setUserStatusAction}>
                        <input type="hidden" name="userId" value={p.u.id} />
                        <button name="status" value={p.u.status === "blocked" ? "active" : "blocked"} className="text-xs text-mute hover:text-rose">
                          {p.u.status === "blocked" ? "رفع مسدودی" : "مسدود"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}
