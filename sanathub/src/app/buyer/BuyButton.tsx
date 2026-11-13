"use client";

import { useActionState } from "react";
import { buyBatchAction, type FormState } from "@/app/actions";

export function BuyButton({ batchId, disabled, label }: { batchId: number; disabled?: boolean; label: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(buyBatchAction, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("قیمت همین لحظه برای کل مگا-بار قفل می‌شود و تعهد برداشت ثبت می‌شود. ادامه می‌دهید؟")) e.preventDefault();
      }}
    >
      <input type="hidden" name="batchId" value={batchId} />
      <button className="btn btn-copper w-full" disabled={disabled || pending}>
        {pending ? "در حال قفل قیمت…" : label}
      </button>
      {state.error && <p className="mt-2 text-xs text-rose">{state.error}</p>}
    </form>
  );
}
