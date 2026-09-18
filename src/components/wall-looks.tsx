import { useEffect, useState } from "react";
import { applyWallPreset, storedWallPreset, WALL_PRESET_EVENT, WALL_PRESETS, type WallPreset, type WallPresetId } from "@/lib/wall-presets";
import { cn } from "@/lib/utils";

function MiniWall({ look }: { look: WallPreset }) {
  return (
    <span className="tw-look-mini" style={{ background: look.swatch }} aria-hidden>
      <span style={{ background: `color-mix(in oklab, ${look.gold} 42%, ${look.swatch})` }} />
      <span style={{ background: `color-mix(in oklab, #fff 16%, ${look.swatch})` }} />
      <i style={{ background: look.gold }} />
    </span>
  );
}

/** One-tap walls: color, type, scale, plates. Always dark. Mini wall is paint-only. */
export function WallLookChips({ onPick }: { onPick?: (id: WallPresetId) => void }) {
  const [cur, setCur] = useState<WallPresetId>(() => storedWallPreset());
  useEffect(() => {
    const go = () => setCur(storedWallPreset());
    window.addEventListener(WALL_PRESET_EVENT, go);
    return () => window.removeEventListener(WALL_PRESET_EVENT, go);
  }, []);
  return (
    <div className="tw-look-grid" data-wall-looks>
      {WALL_PRESETS.map((p) => {
        const on = cur === p.id;
        return (
          <button
            key={p.id}
            type="button"
            title={p.hint}
            aria-pressed={on}
            data-look-id={p.id}
            onClick={() => {
              applyWallPreset(p.id);
              setCur(p.id);
              onPick?.(p.id);
            }}
            className={cn("tw-tap tw-look-card", on && "tw-look-card-on")}
          >
            <MiniWall look={p} />
            <span className="tw-look-copy">
              <span className="tw-look-name">{p.label}</span>
              <span className="tw-look-hint">{on ? "On now" : p.hint}</span>
            </span>
            {on ? <span className="tw-look-on">ON</span> : null}
          </button>
        );
      })}
    </div>
  );
}
