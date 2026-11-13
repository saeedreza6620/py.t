import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { PriceTicker } from "@/components/PriceTicker";
import { PriceBoardTable } from "@/components/PriceBoardTable";
import { IngotProgress } from "@/components/IngotProgress";
import { getPriceBoard } from "@/lib/prices";
import { publicStats } from "@/lib/stats";
import { listBatches } from "@/lib/batching";
import { fa, tomanShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [board, stats, open] = await Promise.all([getPriceBoard(), publicStats(), listBatches(["filling", "ready"])]);
  const brass = board.grades.find((g) => g.id === "brass-chip") ?? board.grades[0];
  const perTon = brass ? brass.gain * 1000 : 0;

  return (
    <>
      <TopBar />
      <PriceTicker initial={board} />

      <main className="mx-auto max-w-6xl px-4">
        {/* ---------- HERO ---------- */}
        <section className="grid items-center gap-10 py-14 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <span className="chip">
              <span className="live-dot" /> پایلوت شهرک صنعتی شمس‌آباد
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.35] sm:text-5xl">
              براده‌ات را <span className="copper-text">تنها نفروش.</span>
              <br />
              ده کارگاه با هم،
              <br />
              به قیمت <span className="copper-text">عمده‌بار.</span>
            </h1>
            <p className="mt-5 max-w-xl leading-8 text-mute">
              دلال وانتی بار ۳۰۰ کیلویی شما را خرده‌بار حساب می‌کند. صنعت‌هاب بار کارگاه‌های همسایه را روی نقشه کنار هم می‌گذارد
              تا یک مگا-بار بشود؛ ریخته‌گری یک‌جا می‌خرد، راننده با یک مسیر بهینه از همه برمی‌دارد، و قیمت با دلار آزاد و مس جهانی
              لحظه‌به‌لحظه شفاف است.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login?as=workshop" className="btn btn-copper">
                تراشکارم؛ بارم را اعلام می‌کنم
              </Link>
              <Link href="/login?as=buyer" className="btn btn-ghost">
                خریدار عمده هستم
              </Link>
            </div>
            {brass && (
              <p className="mt-6 text-sm text-mute">
                همین الان برای «{brass.name}» فاصله خرده‌بار تا عمده‌بار حدود{" "}
                <b className="num text-teal">{tomanShort(perTon)} تومان در هر تن</b> است.
              </p>
            )}
          </div>

          {/* کارت نمایشی تجمیع */}
          <div className="card relative p-6">
            <div className="absolute -top-3 left-6 chip bg-ink">نمونه زنده تجمیع</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-mute">مگا-بار شمس‌آباد</div>
                <div className="mt-1 text-lg font-bold">{brass?.name ?? "براده برنج"}</div>
              </div>
              <div className="text-left">
                <div className="text-xs text-mute">قیمت عمده</div>
                <div className="num text-xl font-black copper-text">{fa(brass?.bulk)}</div>
              </div>
            </div>
            <div className="mt-6">
              <IngotProgress workshops={7} min={10} kg={2240} targetKg={3000} highlight={6} />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                ["۱", "اعلام بار", "گرید، وزن تخمینی، میزان روغن"],
                ["۲", "تجمیع", "۱۰ کارگاه یا ۳ تن ⇢ آماده"],
                ["۳", "برداشت", "یک مسیر، باسکول، تسویه"],
              ].map(([n, t, d]) => (
                <div key={n} className="rounded-xl border border-line/70 bg-ink/50 p-3">
                  <div className="num text-copper-2 font-black">{n}</div>
                  <div className="mt-1 text-sm font-bold">{t}</div>
                  <div className="mt-1 text-[11px] leading-5 text-mute">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- STATS ---------- */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["کارگاه عضو", fa(stats.workshops)],
            ["بار اعلام‌شده (۳۰ روز)", `${fa(stats.kg30)} کیلو`],
            ["مگا-بار باز", fa(stats.openBatches)],
            ["پرداخت به کارگاه‌ها", `${tomanShort(stats.paid)} تومان`],
          ].map(([l, v]) => (
            <div key={l} className="card p-4">
              <div className="text-xs text-mute">{l}</div>
              <div className="num mt-1 text-xl font-black">{v}</div>
            </div>
          ))}
        </section>

        {/* ---------- PRICE BOARD ---------- */}
        <section className="py-14" id="prices">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">تابلوی قیمت لحظه‌ای</h2>
              <p className="mt-1 text-sm text-mute">هر ۳۰ ثانیه به‌روز می‌شود؛ تغییرها سبز و قرمز چشمک می‌زنند.</p>
            </div>
            <Link href="/prices" className="text-sm text-copper-2">
              نمای کامل ←
            </Link>
          </div>
          <PriceBoardTable initial={board} />
        </section>

        {/* ---------- OPEN BATCHES ---------- */}
        {open.length > 0 && (
          <section className="pb-14">
            <h2 className="mb-5 text-2xl font-black">مگا-بارهای در حال پر شدن</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {open.slice(0, 6).map((r) => (
                <div key={r.b.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-mute">{r.z.name}</span>
                    <span className={`chip ${r.b.status === "ready" ? "!border-teal !text-teal" : ""}`}>
                      {r.b.status === "ready" ? "آماده فروش" : "در حال تجمیع"}
                    </span>
                  </div>
                  <div className="mt-2 font-bold">{r.g.name}</div>
                  <div className="mt-4">
                    <IngotProgress workshops={r.progress.workshops} min={r.b.minWorkshops} kg={r.progress.kg} targetKg={r.b.targetKg} compact />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------- TRUST ---------- */}
        <section className="grid gap-4 pb-16 md:grid-cols-3">
          {[
            ["قیمت با فرمول، نه چانه", "قیمت هر گرید = کاتد مس × ضریب گرید. کاتد از دلار آزاد و مس جهانی یا آخرین عرضه بورس کالا می‌آید و لحظه خرید قفل می‌شود."],
            ["باسکول کالیبره، کسر روغن شفاف", "وزن واقعی در حضور شما ثبت می‌شود. کسر روغن و آب‌صابون از قبل اعلام شده؛ کسی سر ناخالصی چانه نمی‌زند."],
            ["پول مستقیم به حساب خودتان", "خریدار هنگام برداشت مستقیماً به شبای کارگاه واریز می‌کند؛ صنعت‌هاب پول کسی را نگه نمی‌دارد و فقط ثبت و داوری می‌کند."],
          ].map(([t, d]) => (
            <div key={t} className="card p-6">
              <div className="h-1 w-10 rounded bg-gradient-to-l from-copper-2 to-copper" />
              <h3 className="mt-4 font-bold">{t}</h3>
              <p className="mt-2 text-sm leading-7 text-mute">{d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line/70 py-8 text-center text-xs text-mute">
        صنعت‌هاب · نسخه آزمایشی پایلوت · قیمت‌ها اطلاع‌رسانی است و قیمت قطعی همان قیمت قفل‌شده لحظه خرید است.
      </footer>
    </>
  );
}
