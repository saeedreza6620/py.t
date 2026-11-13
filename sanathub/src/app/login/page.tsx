import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { currentUser, homeFor } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const { as } = await searchParams;
  const me = await currentUser();
  if (me) redirect(homeFor(me.user.role));
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo size={44} />
        </Link>
        <div className="card p-6">
          <h1 className="text-xl font-black">ورود یا عضویت</h1>
          <p className="mt-1 mb-6 text-sm text-mute">تراشکار و خریدار، هر دو با شماره موبایل وارد می‌شوند.</p>
          <LoginForm as={as === "buyer" ? "buyer" : "workshop"} />
        </div>
        <p className="mt-6 text-center text-xs leading-6 text-mute">
          با ورود، شرایط داوری الکترونیک و پروتکل مغایرت بار صنعت‌هاب را می‌پذیرید.
        </p>
      </div>
    </main>
  );
}
