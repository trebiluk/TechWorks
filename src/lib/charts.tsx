export function Spark({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const w = 320;
  const h = 88;
  const max = Math.max(...values, 1);
  if (!values.length) {
    return <div className={className} />;
  }
  const pts = values
    .map((v, i) => {
      const x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * w;
      const y = h - 6 - (v / max) * (h - 12);
      return `${x},${y}`;
    })
    .join(" ");
  const last = values[values.length - 1] ?? 0;
  const lx = values.length === 1 ? w / 2 : w;
  const ly = h - 6 - (last / max) * (h - 12);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden>
      <polyline fill="none" stroke="var(--color-gold)" strokeWidth="2.5" strokeLinejoin="round" points={pts} />
      <circle cx={lx} cy={ly} r="3.5" fill="var(--color-accent)" />
    </svg>
  );
}

export function Bars({
  items,
}: {
  items: { label: string; value: number; hot?: boolean }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex h-28 items-end gap-2">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-sm"
            style={{
              height: `${Math.max(6, (item.value / max) * 100)}%`,
              background: item.hot ? "var(--color-gold)" : "var(--color-elevated)",
            }}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-subtle">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Gauge({
  pct,
  label,
}: {
  pct: number;
  label: string;
}) {
  const p = Math.max(0, Math.min(100, pct));
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;
  return (
    <div className="relative mx-auto size-36">
      <svg viewBox="0 0 120 80" className="size-full" aria-hidden>
        <path
          d="M18 70 A 42 42 0 0 1 102 70"
          fill="none"
          stroke="var(--color-elevated)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M18 70 A 42 42 0 0 1 102 70"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <span className="font-display text-3xl font-semibold tabular-nums leading-none">{Math.round(p)}%</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-subtle">{label}</span>
      </div>
    </div>
  );
}
