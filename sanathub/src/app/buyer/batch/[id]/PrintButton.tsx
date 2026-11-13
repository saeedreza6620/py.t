"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-ghost no-print !py-2 text-sm">
      چاپ / PDF
    </button>
  );
}
