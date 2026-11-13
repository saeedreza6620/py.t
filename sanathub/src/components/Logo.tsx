export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
        <defs>
          <linearGradient id="lg-cu" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f6c27a" />
            <stop offset="0.5" stopColor="#d9822b" />
            <stop offset="1" stopColor="#8f4c12" />
          </linearGradient>
        </defs>
        <path d="M20 2 36 11v18L20 38 4 29V11z" fill="url(#lg-cu)" />
        <path d="M20 2 36 11v18L20 38 4 29V11z" fill="none" stroke="#ffd9a3" strokeOpacity=".5" />
        <path d="M13 13h4v6h6v-6h4v14h-4v-5h-6v5h-4z" fill="#1a0f04" />
      </svg>
      <span className="leading-none">
        <span className="block text-lg font-black tracking-tight">صنعت‌هاب</span>
        <span className="block text-[10px] text-mute mt-0.5">بازار تجمیعی مس و برنج</span>
      </span>
    </span>
  );
}
