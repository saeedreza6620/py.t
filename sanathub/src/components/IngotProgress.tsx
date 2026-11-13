import { fa } from "@/lib/format";

/**
 * امضای بصری صنعت‌هاب: هر کارگاه یک شمش؛ وقتی شمش‌ها پر شوند مگا-بار آماده فروش است.
 */
export function IngotProgress({
  workshops,
  min,
  kg,
  targetKg,
  compact = false,
  highlight,
}: {
  workshops: number;
  min: number;
  kg: number;
  targetKg: number;
  compact?: boolean;
  highlight?: number;
}) {
  const slots = Math.max(min, workshops);
  const kgPct = Math.min(100, Math.round((kg / targetKg) * 100));
  const w = compact ? 16 : 24;
  const h = compact ? 22 : 32;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5" aria-label={`${workshops} از ${min} کارگاه`}>
        {Array.from({ length: slots }).map((_, i) => {
          const filled = i < workshops;
          const mine = highlight != null && i === highlight;
          return (
            <svg key={i} width={w} height={h} viewBox="0 0 24 32">
              <path d="M4 4h16l2 26H2z" fill="#0a0f1e" stroke={mine ? "#19c3a6" : filled ? "#f0a050" : "#24315e"} strokeWidth="1.5" />
              {filled && (
                <path
                  className="ingot-fill"
                  style={{ animationDelay: `${i * 70}ms` }}
                  d="M5.2 6h13.6l1.8 22.5H3.4z"
                  fill={mine ? "#19c3a6" : "url(#ingot-cu)"}
                />
              )}
              <defs>
                <linearGradient id="ingot-cu" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#f6c27a" />
                  <stop offset="1" stopColor="#b9651b" />
                </linearGradient>
              </defs>
            </svg>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-mute">
        <span className="num">
          <b className="text-text">{fa(workshops)}</b> از {fa(min)} کارگاه
        </span>
        <span className="num">
          {fa(kg)} / {fa(targetKg)} کیلو
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-ink overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-l from-copper-2 to-copper" style={{ width: `${kgPct}%` }} />
      </div>
    </div>
  );
}
