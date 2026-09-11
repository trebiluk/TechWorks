import { memo, useMemo, useRef } from "react";
import type { EconomyFile } from "@/lib/economy";
import { FEATURES, featureOn, type FeatureId } from "@/lib/features";
import { chromeReady } from "@/lib/wall-chrome";
import { luckyOf } from "@/lib/lucky";
import { printsOf } from "@/lib/prints";
import { agendaFor } from "@/lib/projects";
import { bellForPeriod, formatBell } from "@/lib/bells";

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
  unlocked: _unlocked,
  period,
  onOpen,
  compact,
}: {
  file: EconomyFile;
  unlocked: boolean;
  period: number;
  onOpen?: (id: string) => void;
  onToggle?: (id: FeatureId, on: boolean) => void;
  compact?: boolean;
  showOff?: boolean;
}) {
  const open = useRef(onOpen);
  open.current = onOpen;
  const list = useMemo(() => {
    const rows = FEATURES.filter((f) => {
      if (SKIP.has(f.id)) return false;
      if (!WALL.includes(f.id)) return false;
      if (!featureOn(file, f.id)) return false;
      if (!chromeReady(f.id, file)) return false;
      return true;
    });
    return compact ? rows.slice(0, 8) : rows;
  }, [file, compact]);

  if (!list.length) return null;

  return (
    <section data-mod-grid data-compact={compact ? "on" : undefined} className="shrink-0">
      {list.map((f) => (
        <div key={f.id} className="tw-gadget flex min-h-[4.25rem] flex-col justify-center px-2.5 py-2">
          <button
            type="button"
            onClick={() => {
              if (f.id === "ambient") {
                window.open(AMBIENT, "_blank", "noreferrer");
                return;
              }
              open.current?.(f.id);
            }}
            className="tw-tap min-w-0 text-left"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{f.label}</p>
            <p className="truncate font-display text-sm font-semibold leading-tight">{snapOf(f.id, file, period)}</p>
          </button>
        </div>
      ))}
    </section>
  );
}, (a, b) => a.file === b.file && a.period === b.period && a.compact === b.compact);

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
