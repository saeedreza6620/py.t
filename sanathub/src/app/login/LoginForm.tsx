"use client";

import { useActionState } from "react";
import { requestOtpAction, verifyOtpAction, type FormState } from "@/app/actions";

export function LoginForm({ as }: { as: "workshop" | "buyer" }) {
  const [sent, send, sending] = useActionState<FormState, FormData>(requestOtpAction, { step: "phone" });
  const [checked, check, checking] = useActionState<FormState, FormData>(verifyOtpAction, {});
  const step = sent.step === "code" ? "code" : "phone";

  if (step === "phone") {
    return (
      <form action={send} className="space-y-4">
        <div>
          <label className="label" htmlFor="phone">شماره موبایل</label>
          <input id="phone" name="phone" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="09123456789"
            defaultValue={sent.phone} className="input num text-left text-lg tracking-widest" required />
        </div>
        {sent.error && <p className="text-sm text-rose">{sent.error}</p>}
        <button className="btn btn-copper w-full" disabled={sending}>{sending ? "در حال ارسال…" : "دریافت کد ورود"}</button>
      </form>
    );
  }

  return (
    <form action={check} className="space-y-4">
      <input type="hidden" name="phone" value={sent.phone} />
      <input type="hidden" name="as" value={as} />
      <p className="text-sm text-mute">
        کد ۵ رقمی به <b className="num text-text" dir="ltr">{sent.phone}</b> پیامک شد.
      </p>
      {sent.devCode && (
        <p className="rounded-xl border border-brass/40 bg-brass/10 p-3 text-sm">
          حالت آزمایشی (پیامک تنظیم نشده): کد شما <b className="num text-brass text-lg">{sent.devCode}</b>
        </p>
      )}
      <div>
        <label className="label" htmlFor="code">کد تأیید</label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" dir="ltr" maxLength={5}
          className="input num text-center text-2xl tracking-[0.6em]" autoFocus required />
      </div>
      {checked.error && <p className="text-sm text-rose">{checked.error}</p>}
      <button className="btn btn-copper w-full" disabled={checking}>{checking ? "در حال بررسی…" : "ورود"}</button>
      <button type="button" onClick={() => location.reload()} className="w-full text-center text-xs text-mute">
        تغییر شماره
      </button>
    </form>
  );
}
