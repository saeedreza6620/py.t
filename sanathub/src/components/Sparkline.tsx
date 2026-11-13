export function Sparkline({ values, w = 160, h = 40, color = "#f0a050" }: { values: number[]; w?: number; h?: number; color?: string }) {
  if (values.length < 2) return <div style={{ width: w, height: h }} className="text-[10px] text-mute flex items-center">داده کافی نیست</div>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 4 - ((v - min) / span) * (h - 8)]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" style={{ transform: "scaleX(-1)" }}>
      <path d={d + ` L${w} ${h} L0 ${h} Z`} fill={color} opacity=".12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  );
}
