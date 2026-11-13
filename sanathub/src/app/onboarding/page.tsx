import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Logo } from "@/components/Logo";
import { getSession } from "@/lib/auth";
import { db, ensureDb } from "@/db";
import { zones } from "@/db/schema";
import { OnboardForm } from "./OnboardForm";

export const dynamic = "force-dynamic";

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.uid) redirect("/");
  await ensureDb();
  const zs = await db.select().from(zones).where(eq(zones.active, true));
  const { as } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 flex justify-center"><Logo size={40} /></div>
      <div className="card p-6">
        <h1 className="text-xl font-black">خوش آمدید</h1>
        <p className="mt-1 mb-6 text-sm text-mute">یک بار ثبت‌نام؛ از این به بعد فقط بار اعلام می‌کنید.</p>
        <OnboardForm zones={zs.map((z) => ({ id: z.id, name: z.name, lat: z.lat, lng: z.lng }))} initialRole={as === "buyer" ? "buyer" : "workshop"} />
      </div>
    </main>
  );
}
