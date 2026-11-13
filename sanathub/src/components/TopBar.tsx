import Link from "next/link";
import { Logo } from "./Logo";
import { currentUser, homeFor } from "@/lib/auth";
import { logoutAction } from "@/app/actions";

const ROLE = { workshop: "تراشکار", buyer: "خریدار عمده", admin: "مدیر" } as const;

export async function TopBar() {
  const me = await currentUser();
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/prices" className="hidden sm:inline px-3 py-2 text-mute hover:text-text">
            تابلوی قیمت
          </Link>
          {me ? (
            <>
              <Link href={homeFor(me.user.role)} className="btn btn-ghost !py-2 !px-3 text-sm">
                <span className="text-mute font-normal">{ROLE[me.user.role]}</span>
                {me.workshop?.title || me.buyer?.company || me.user.name || "پنل من"}
              </Link>
              <form action={logoutAction}>
                <button className="px-3 py-2 text-mute hover:text-rose text-sm">خروج</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn btn-copper !py-2 text-sm">
              ورود / عضویت
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
