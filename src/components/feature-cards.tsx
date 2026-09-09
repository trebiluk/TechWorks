import { memo, useMemo, useRef } from "react";
import type { EconomyFile } from "@/lib/economy";
import { FEATURES, featureOn, type FeatureId } from "@/lib/features";
import { luckyOf } from "@/lib/lucky";
import { printsOf } from "@/lib/prints";
import { agendaFor } from "@/lib/projects";
import { bellForPeriod, formatBell } from "@/lib/bells";
import { cn } from "@/lib/utils";

const WALL: FeatureId[] = [
  "weather",
  "berty",
  "reward",
  "prints",
  "stocks",
  "lucky",
  "studyhall",
  "club",
  "projects",
  "nytech",
  "store",
  "teach",
  "polls",
];

const SKIP = new Set<FeatureId>(["contrast", "debug", "portal", "tips", "picker", "timer"]);
const AMBIENT = "https://neal.fun/ambient-chaos/";

export const FeatureCards = memo(function FeatureCards({
  file,
  unlocked,
  period,
  onOpen,
  compact,
}: {
  file: EconomyFile;
  unlocked: boolean;
  period: number;
  onOpen?: (id: string) => void;
  compact?: boolean;
}) {
  const open = useRef(onOpen);
  open.current = onOpen;
  const list = useMemo(() => {
    const rows = FEATURES.filter((f) => !SKIP.has(f.id) && featureOn(file, f.id) && (unlocked || WALL.includes(f.id)));
    return compact ? rows.slice(0, 8) : rows;
  }, [file, unlocked, compact]);

  if (!list.length) return null;

  return (
    <section className={cn("grid shrink-0 gap-1", compact ? "grid-cols-2" : "grid-cols-3 lg:grid-cols-6")}>
      {list.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => {
            if (f.id === "ambient") {
              window.open(AMBIENT, "_blank", "noreferrer");
              return;
            }
            open.current?.(f.id);
          }}
          className="tw-tap rounded-xl bg-elevated px-2.5 py-2 text-left"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{f.label}</p>
          <p className="truncate font-display text-sm font-semibold leading-tight">{snapOf(f.id, file, period)}</p>
        </button>
      ))}
    </section>
  );
}, (a, b) => a.file === b.file && a.period === b.period && a.unlocked === b.unlocked && a.compact === b.compact);

function snapOf(id: FeatureId, file: EconomyFile, period: number): string {
  if (id === "weather") return "Sky";
  if (id === "berty") return "On duty";
  if (id === "reward") return file.meta.config?.periodRewards?.[String(period)]?.title || file.meta.config?.reward?.title || "Goal";
  if (id === "ambient") return "Noise";
  if (id === "grades") return "Book";
  if (id === "store") return `${(file.meta.shop ?? []).length || 0} items`;
  if (id === "prints") {
    const n = printsOf(file).reduce((a, p) => a + Number(p.released || 0), 0);
    return n ? `${n} out` : "Gallery";
  }
  if (id === "stocks") {
    const i = file.meta.market?.index;
    return i ? `${Math.round(i)}` : "Market";
  }
  if (id === "lucky") return `$${Math.round(luckyOf(file).pot)}`;
  if (id === "studyhall") {
    const b = bellForPeriod(6, file.meta.config?.schedule);
    return b ? formatBell(b.start) : "Hall";
  }
  if (id === "club") return "After";
  if (id === "achievements") return "Lead XP";
  if (id === "nytech") return "1–4";
  if (id === "projects") return agendaFor(file, period).title || "Build";
  if (id === "crews") return "Groups";
  if (id === "teach") return "Do this now";
  if (id === "polls") {
    const p = file.meta.polls?.live;
    return p?.open ? "Open" : "Vote";
  }
  return FEATURES.find((f) => f.id === id)?.label ?? id;
}
