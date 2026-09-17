import { useEffect, useState } from "react";
import { applyWallPreset, storedWallPreset, WALL_PRESET_EVENT, WALL_PRESETS, type WallPresetId } from "@/lib/wall-presets";
import { cn } from "@/lib/utils";

/** One-tap walls: color, type, scale, plates. Always dark. */
export function WallLookChips({ onPick }: { onPick?: (id: WallPresetId) => void }) {
  const [cur, setCur] = useState<WallPresetId>(() => storedWallPreset());
  useEffect(() => {
    const go = () => setCur(storedWallPreset());
    window.addEventListener(WALL_PRESET_EVENT, go);
    return () => window.removeEventListener(WALL_PRESET_EVENT, go);
  }, []);
  return (
    <div className="flex flex-wrap items-center gap-1" data-wall-looks>
      {WALL_PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          title={p.hint}
          onClick={() => {
            applyWallPreset(p.id);
            setCur(p.id);
            onPick?.(p.id);
          }}
          className={cn(
            "tw-tap inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold",
            cur === p.id ? "bg-fg text-bg" : "bg-elevated text-muted hover:text-fg",
          )}
        >
          <span
            className="size-3.5 shrink-0 rounded-full ring-1 ring-black/35"
            style={{ background: `radial-gradient(circle at 30% 30%, ${p.gold}, ${p.swatch} 70%)` }}
            aria-hidden
          />
          {p.label}
        </button>
      ))}
    </div>
  );
}
