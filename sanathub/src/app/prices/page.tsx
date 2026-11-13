import { TopBar } from "@/components/TopBar";
import { PriceTicker } from "@/components/PriceTicker";
import { PriceBoardTable } from "@/components/PriceBoardTable";
import { getPriceBoard } from "@/lib/prices";

export const dynamic = "force-dynamic";

export default async function PricesPage() {
  const board = await getPriceBoard();
  return (
    <>
      <TopBar />
      <PriceTicker initial={board} />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-black">تابلوی قیمت مس و برنج</h1>
        <p className="mt-2 text-sm text-mute leading-7">
          قیمت عمده‌بار صنعت‌هاب برای هر گرید، کنار تخمین قیمت خرده‌بار دلال‌ها. ستون آخر نشان می‌دهد تجمیع برای هر تن بار چقدر بیشتر
          به جیب کارگاه برمی‌گرداند.
        </p>
        <div className="mt-6">
          <PriceBoardTable initial={board} />
        </div>
      </main>
    </>
  );
}
